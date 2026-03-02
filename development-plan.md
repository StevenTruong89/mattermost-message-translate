# Mattermost Message Translate Plugin - Development Plan

## 1. Overview
This plugin allows users to translate messages directly on Mattermost using AI models (LLM) through the **Agents Plugin**.

## 2. Key Features
- **Translate Menu**: Appears when clicking the "..." on a message.
- **Language Selection**: Modal displays list of target languages (Vietnamese, English, Japanese, etc.).
- **Agents Bridge Integration**: Use the `Bridge Client` library from Agents Plugin to send translation requests to LLM.
- **Elegant Display**: Translation shown as ephemeral message (only translator can see) or attached directly below the original message.

## 3. Technical Architecture
- **Frontend (Webapp)**:
    - Register action via `registerPostAction`.
    - Components: `TranslateModal` (language selection), `TranslationResult` (display result).
- **Backend (Server)**:
    - API Endpoint: `POST /translate`.
    - Communication: Use `mattermost-plugin-agents/server/bridge` to call LLM.
    - Logic: Create translation prompt (System Prompt: "You are a professional translator...") and send to Agent.

## 4. Implementation Details

### Step 1: Project Initialization (Skeletal)
- [x] Create `plugin.json` (ID: `com.mattermost.message-translate`).
- [x] Configure `webapp/` and `server/` directories.
- [x] Setup `Makefile` for build and deploy.

### Step 2: Webapp - Menu & UI Registration
- [x] Register "Translate Message" menu in `webapp/src/index.js`.
- [x] Build language selection Modal using Mattermost UI components.
- [x] Send request to Server Plugin when user confirms.

### Step 3: Server - Translation Handling
- [x] Configure direct LLM API settings (URL, Key, Model).
- [x] Write `HandleTranslate` function to receive `post_id` and `target_lang`.
- [x] Call LLM API directly (OpenAI-compatible) to perform translation.
- [x] Return result to Webapp as Ephemeral Post.

### Step 4: Additional Features (Advanced)
- [x] **Auto-detect**: Integrated via LLM prompt.
- [x] **Error Handling**: Improved detailed error messages for users (handling 401, 404, 500 errors).
- [x] **Multi-platform**: Support compilation and packaging for both Linux and Windows.
- [x] **User Preferences**: Save user's default target language to localStorage (1-click translation).
- [ ] **Quick Translate Icon**: Fast translate icon for non-system language messages.

### Phase 4: Testing & Packaging (Week 4)
- [x] Test compilation on Windows/Go/NPM environment.
- [x] Package `.tar.gz` file for installation.
- [ ] Write user and configuration guide.

## 5. System Requirements
- Mattermost Server v10.0+ (recommended).
- **Agents Plugin** installed and configured with LLM (OpenAI, Ollama...).
- Go 1.24+ and Node.js 20.11+.
