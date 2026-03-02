import TranslateModal from './components/translate_modal.jsx';

export default class Plugin {
    // eslint-disable-next-line no-unused-vars
    initialize(registry, store) {
        // Register TranslateModal as a Root Component so it always exists in the DOM
        registry.registerRootComponent(TranslateModal);

        // 1. Register "Translate Message (AI)" action
        registry.registerPostDropdownMenuAction(
            '🌍 Translate Message (AI)',
            (postId) => {
                const preferredLang = localStorage.getItem('mm_translate_preferred_lang');
                
                const event = new CustomEvent('open-translate-modal', {
                    detail: {
                        postId, 
                        autoTranslate: !!preferredLang // Auto-translate if lang is remembered
                    },
                });
                window.dispatchEvent(event);
            }
        );

        // 2. Register "Translation Settings (AI)" action to change preferences
        registry.registerPostDropdownMenuAction(
            '⚙️ Translation Settings (AI)',
            (postId) => {
                const event = new CustomEvent('open-translate-modal', {
                    detail: {postId, forceOpen: true},
                });
                window.dispatchEvent(event);
            }
        );
    }
}

window.registerPlugin('com.mattermost.message-translate', new Plugin());
