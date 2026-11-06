import type { Editor, Extensions, Content as TiptapContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Placeholder, UndoRedo, type PlaceholderOptions } from '@tiptap/extensions';
import type { EditorView } from '@tiptap/pm/view';
import { getPastedFiles } from '../utils';
import CustomPlaceholder from './custom-placeholder';
import { handleCompositionEndLogic, handlePasteLogic, handleTextInputLogic } from './plugins';
import SemiStatusExtension from './status-extension';

/** The `editorProps` of the editor, at creation and on every `setOptions`; the editor keeps the ones it was last given */
export function createEditorProps({ attributes, handleKeyDown, onPasteFiles }: { attributes?: ReturnType<typeof getEditorAttributes>; handleKeyDown?: (view: EditorView, event: KeyboardEvent) => boolean; onPasteFiles?: (files: File[]) => void }) {
    return {
        attributes,
        handleKeyDown,
        // Not tiptap's onPaste: it cannot stop ProseMirror from still inserting the clipboard content
        handlePaste(view: EditorView, event: ClipboardEvent) {
            const files = getPastedFiles(event.clipboardData);
            if (!files.length) {
                return handlePasteLogic(view, event);
            }
            event.preventDefault();
            onPasteFiles?.(files);
            return true;
        },
        handleTextInput(view: EditorView, from: number, to: number, text: string) {
            return view.composing ? false : handleTextInputLogic(view, from, to, text);
        },
        handleDOMEvents: {
            compositionend(view: EditorView) {
                // Wait for ProseMirror to flush composition mutations before cleaning zero-width placeholders,
                // otherwise the slot content can be lost.
                setTimeout(() => {
                    if (!view.isDestroyed) {
                        handleCompositionEndLogic(view);
                    }
                }, 60);
                return false;
            },
        },
    };
}

/** The attributes of the editable element; only a string `placeholder` is exposed, a function one is not static text */
export function getEditorAttributes({ id, label, placeholder, controls, activeDescendant }: { id?: string; label: string; placeholder?: unknown; controls?: string; activeDescendant?: string }) {
    return {
        id,
        'aria-label': label,
        // the placeholder is a CSS pseudo element, which assistive technology does not read
        ...(typeof placeholder === 'string' && { 'aria-placeholder': placeholder }),
        ...(controls && {
            'aria-autocomplete': 'list',
            'aria-controls': controls,
            ...(activeDescendant && { 'aria-activedescendant': activeDescendant }),
        }),
    };
}

/**
 * The editor's extensions: the document schema, the framework's own slot views, the placeholder and the user's
 * extensions. `readPlaceholder` must read the latest prop, since the editor keeps the extensions it was created with.
 */
export function getBaseExtensions({ slotExtensions, readPlaceholder, showPlaceholderWhenSkillOnly, extensions = [] }: { slotExtensions: Extensions; readPlaceholder: PlaceholderOptions['placeholder']; showPlaceholderWhenSkillOnly?: boolean; extensions?: Extensions }): Extensions {
    const placeholderExtension = showPlaceholderWhenSkillOnly ? CustomPlaceholder.configure({ placeholder: readPlaceholder, showPlaceholderWhenSkillOnly: true }) : Placeholder.configure({ placeholder: readPlaceholder });
    return [Document, Paragraph, Text, UndoRedo, HardBreak, ...slotExtensions, placeholderExtension, SemiStatusExtension, ...extensions];
}

/**
 * The options every framework creates the editor with, besides its mount element. `extensions` comes from
 * `getBaseExtensions`; a new array with a new placeholder extension would be an options change to React's `useEditor`.
 * Hand the editor to `AIChatInputFoundation.handleCreate` once it exists.
 */
export function getEditorOptions({ extensions, defaultContent, editorProps, onChange }: { extensions: Extensions; defaultContent?: TiptapContent; editorProps: ReturnType<typeof createEditorProps>; onChange: (text: string) => void }) {
    return {
        extensions,
        content: defaultContent ?? '',
        editorProps,
        // tiptap's injected CSS is unlayered and would override `@layer semi`
        injectCSS: false,
        onUpdate: ({ editor }: { editor: Editor }) => onChange(editor.getText()),
    };
}
