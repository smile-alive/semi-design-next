import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        SemiAIChatInput: {
            /** Sets whether the send hotkey may fire. Does nothing under editor.can(), which only checks without applying */
            setAllowHotKeySendForSemiAIChatInput: (allow: boolean) => ReturnType;
        };
    }

    interface Storage {
        SemiAIChatInput: {
            allowHotKeySend: boolean;
        };
    }
}

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
            setAllowHotKeySendForSemiAIChatInput:
                (allow) =>
                // command props carry the editor, not the extension storage
                ({ editor, dispatch }) => {
                    if (dispatch) {
                        editor.storage.SemiAIChatInput.allowHotKeySend = allow;
                    }
                    return true;
                },
        };
    },
});
