package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

type Plugin struct {
	plugin.MattermostPlugin
	botID  string
	config *Configuration
}

type Configuration struct {
	LLMAPIURL   string
	LLMAPIKey   string
	LLMModel    string
	DisplayMode string
}

type OpenAIRequest struct {
	Model    string          `json:"model"`
	Messages []OpenAIMessage `json:"messages"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type TranslateRequest struct {
	PostID     string `json:"post_id"`
	TargetLang string `json:"target_lang"`
}

func (p *Plugin) OnActivate() error {
	botID, err := p.API.EnsureBotUser(&model.Bot{
		Username:    "ai-translator",
		DisplayName: "AI Translator",
		Description: "Bot for translating messages via AI.",
	})
	if err != nil {
		return err
	}
	p.botID = botID

	// Load configuration initially
	return p.OnConfigurationChange()
}

func (p *Plugin) OnConfigurationChange() error {
	var config Configuration
	if err := p.API.LoadPluginConfiguration(&config); err != nil {
		return err
	}
	p.config = &config

	return nil
}

func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/translate":
		p.handleTranslate(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (p *Plugin) handleTranslate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("Mattermost-User-ID")
	if userID == "" {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	var req TranslateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Get original message info
	post, appErr := p.API.GetPost(req.PostID)
	if appErr != nil {
		http.Error(w, "Message not found", http.StatusNotFound)
		return
	}

	// Check user permission to view this message
	if !p.API.HasPermissionToChannel(userID, post.ChannelId, model.PermissionReadChannel) {
		http.Error(w, "You don't have permission to access this message", http.StatusForbidden)
		return
	}

	if p.config.LLMAPIURL == "" {
		http.Error(w, "LLM API URL is not configured. Please contact the administrator.", http.StatusInternalServerError)
		return
	}

	// Prepare prompt for LLM
	prompt := fmt.Sprintf("Please translate the following message to: %s. Keep the Markdown format. Only return the translated content, without any additional explanations.\n\nContent to translate: %s", req.TargetLang, post.Message)

	// Call LLM API directly
	translatedText, err := p.callLLM(prompt)
	if err != nil {
		p.API.LogError("Error calling LLM API", "error", err)
		http.Error(w, fmt.Sprintf("LLM service error: %v", err), http.StatusInternalServerError)
		return
	}

	if translatedText == "" {
		p.API.LogError("LLM returned empty result")
		http.Error(w, "AI did not return translation result", http.StatusInternalServerError)
		return
	}

	// Return translation directly via JSON to Webapp instead of creating new message
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":      "success",
		"translation": translatedText,
	})
}

func (p *Plugin) callLLM(prompt string) (string, error) {
	reqBody := OpenAIRequest{
		Model: p.config.LLMModel,
		Messages: []OpenAIMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", p.config.LLMAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	p.API.LogDebug("Calling LLM API", "url", p.config.LLMAPIURL, "model", p.config.LLMModel)

	req.Header.Set("Content-Type", "application/json")
	if p.config.LLMAPIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.config.LLMAPIKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned error code %d: %s", resp.StatusCode, string(body))
	}

	var openAIResp OpenAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return "", err
	}

	if openAIResp.Error != nil {
		return "", fmt.Errorf("API error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) > 0 {
		return strings.TrimSpace(openAIResp.Choices[0].Message.Content), nil
	}

	return "", fmt.Errorf("no result returned from LLM")
}

func main() {
	plugin.ClientMain(&Plugin{})
}
func (p *Plugin) OnDeactivate() error {
	return nil
}
