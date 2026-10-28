import { Extension, type RawCommands } from '@tiptap/core';

/**
 * Holds SemiAIChatInput state in the editor storage so other extensions can avoid conflicts with it. For example, a
 * custom extension that handles Enter clears allowHotKeySend so the send hotkey does not also fire.
 */
export default Extension.create({
    name: 'SemiAIChatInput',
    addStorage() {
        return {
            allowHotKeySend: true,
        };
    },

    addCommands() {
        return {
            setAllowHotKeySendForSemiAIChatInput(allow: boolean) {
                // command props carry the editor, not the extension storage
                return ({ editor }) => {
                    editor.storage.SemiAIChatInput.allowHotKeySend = allow;
                    return true;
                };
            },
        } as Partial<RawCommands>;
    },
});
