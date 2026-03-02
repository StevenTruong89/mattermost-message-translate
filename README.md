# Mattermost Message Translate Plugin

A Mattermost plugin that translates messages using AI-powered LLM services directly, without requiring the Agents plugin.

<img width="303" height="421" alt="image" src="https://github.com/user-attachments/assets/fb8f2853-f332-4e7f-8786-bf4cdaf2d8e2" />
<img width="344" height="262" alt="image" src="https://github.com/user-attachments/assets/8613c8d7-ddec-4474-8440-a367f663d267" />
<img width="353" height="274" alt="image" src="https://github.com/user-attachments/assets/c33857b3-ced3-4b25-b4c5-7163d9f1f212" />
![2026-03-02_15-33-54](https://github.com/user-attachments/assets/163a9000-125a-4e8d-b10c-52d3070eb848)


## Features

- **Translate Messages**: Right-click on any message and select "🌍 Translate Message (AI)" to translate it
- **One-Click Translate**: If you've previously selected a language, the plugin will auto-translate on the first click
- **Customizable Settings**: Configure your preferred target language in the settings
- **Direct LLM Integration**: Works with any OpenAI-compatible API (OpenAI, Ollama, Anthropic, etc.)
- **Non-Blocking UI**: Modal opens without blocking interaction with the rest of the chat interface
- **Persistent Preferences**: Remembers your language preference using localStorage

## Requirements

- Mattermost Server v9.11.0 or later
- LLM service with OpenAI-compatible API (OpenAI, Ollama, LM Studio, etc.)

## Installation

### Method 1: Upload via Mattermost UI

1. Download the latest release (`.tar.gz` file) from the releases page
2. In Mattermost, go to **System Console > Plugins > Plugin Management**
3. Click **Upload Plugin** and select the `.tar.gz` file
4. Enable the plugin

### Method 2: Manual Installation

1. Extract the `.tar.gz` file to your Mattermost server's plugins directory
2. Ensure the directory is named `com.mattermost.message-translate`
3. Restart the Mattermost server

## Configuration

After enabling the plugin, configure it in **System Console > Plugins > Message Translate**:

| Setting | Description | Default |
|---------|-------------|---------|
| **LLM API URL** | Full URL of the chat completions API. Must include `/v1/chat/completions` | `https://api.openai.com/v1/chat/completions` |
| **LLM API Key** | API key for authentication | (empty) |
| **LLM Model** | Model name to use (e.g., `gpt-4o`, `gpt-4o-mini`, `llama3`) | `gpt-4o` |
| **Default Target Language** | Default language code to translate to (e.g., `vi`, `en`, `ja`) | `vi` |

### Supported LLM Services

#### OpenAI
- API URL: `https://api.openai.com/v1/chat/completions`
- Model: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, etc.

#### Ollama (Local)
- API URL: `http://localhost:11434/v1/chat/completions`
- Model: `llama3`, `mistral`, `phi3`, etc.

#### LM Studio (Local)
- API URL: `http://localhost:1234/v1/chat/completions`
- Model: Any model loaded in LM Studio

#### Anthropic
- API URL: `https://api.anthropic.com/v1/messages` (requires custom client)
- Note: Current implementation is OpenAI-compatible only

## Usage

### Translating a Message

1. Hover over any message in a channel
2. Click the **⋮** (three dots) menu on the right side
3. Select **🌍 Translate Message (AI)**
4. Choose your target language from the dropdown
5. Click **Translate** to see the translation

### One-Click Translate

If you've previously used the plugin:
- The first click will auto-translate to your last used language
- To change language, use the dropdown before translating

### Changing Settings

1. Click the **⋮** menu on any message
2. Select **⚙️ Translation Settings (AI)**
3. Change your preferred target language
4. Your preference will be saved for future translations

## Development

### Prerequisites

- Go 1.21+
- Node.js 18+
- Make
- Mattermost Server v9.11+ for testing

### Building from Source

```bash
# Clone the repository
git clone https://github.com/mattermost/mattermost-plugin-message-translate.git
cd mattermost-plugin-message-translate

# Build the plugin
make build

# This will create:
# - server/dist/plugin-linux-amd64 (Linux binary)
# - server/dist/plugin-windows-amd64.exe (Windows binary)
# - webapp/dist/main.js (Webapp bundle)

# Create the distribution package
make dist

# Output: dist/com.mattermost.message-translate.tar.gz
```

### Project Structure

```
mattermost-message-translate/
├── assets/              # Static assets (icons)
│   └── icon.svg         # Plugin icon
├── build/
│   └── package/         # Build scripts for packaging
│       └── main.go      # Go script to create tar.gz
├── server/              # Server-side code (Go)
│   ├── go.mod           # Go dependencies
│   ├── go.sum           # Go checksums
│   └── main/
│       └── main.go      # Main plugin entry point
├── webapp/              # Client-side code (React)
│   ├── package.json     # Node dependencies
│   ├── webpack.config.js # Webpack configuration
│   └── src/
│       ├── index.js     # Plugin registration
│       └── components/
│           └── translate_modal.jsx # Translation UI
├── plugin.json          # Plugin manifest
├── Makefile            # Build automation
└── README.md           # This file
```

### Running Tests

```bash
# Run Go tests
cd server && go test ./...

# Run webapp tests
cd webapp && npm test
```

## Architecture

### Server (Go)

The server handles:
- **Bot Management**: Ensures the AI Translator bot is created
- **API Endpoint**: `/translate` - accepts POST requests with `post_id` and `target_lang`
- **LLM Integration**: Calls the configured LLM API with translation prompts
- **Permission Checking**: Verifies user has access to the channel/message

### Webapp (React)

The webapp provides:
- **Post Menu Actions**: Adds "Translate Message (AI)" and "Translation Settings" to message menus
- **Translate Modal**: UI for selecting target language and viewing translations
- **localStorage Integration**: Persists user's language preference

### Translation Flow

1. User clicks "Translate Message (AI)" on a message
2. Webapp opens modal (or auto-translates if preference exists)
3. User selects target language and clicks "Translate"
4. Webapp calls `/translate` API endpoint with `post_id` and `target_lang`
5. Server retrieves the original message, constructs a translation prompt
6. Server calls LLM API with the prompt
7. LLM returns the translation
8. Server responds with translation JSON
9. Webapp displays the translation in the modal

## Security Considerations

- **API Key Storage**: API keys are stored in Mattermost's plugin configuration database
- **Authentication**: Users must be logged in to Mattermost to use the plugin
- **Permission Checks**: Server verifies user has permission to read the channel before translating
- **Input Validation**: Server validates all input parameters

## Troubleshooting

### Plugin not appearing

1. Ensure the plugin is enabled in System Console
2. Check Mattermost logs for errors: **System Console > Logs**
3. Verify the plugin file is in the correct plugins directory

### Translation not working

1. Verify LLM API URL is correct and accessible
2. Check API key is valid
3. Ensure model name is correct for your LLM service
4. Check Mattermost logs for LLM API errors

### Permission errors

1. Ensure the user has access to the channel
2. Verify the bot user was created successfully

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

See LICENSE file for details.

## Support

For issues and feature requests, please create an issue on GitHub.
