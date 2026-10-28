import type { Extensions } from '@tiptap/core';
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

/** The `editorProps` handlers shared by every framework; the editor keeps the ones it was last given */
export function createEditorHandlers(onPasteFiles?: (files: File[]) => void) {
    return {
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
export function getEditorAttributes({
    id,
    label,
    placeholder,
    controls,
    activeDescendant,
}: {
    id?: string;
    label: string;
    placeholder?: unknown;
    /** The list the editor drives while its panel is open */
    controls?: string;
    activeDescendant?: string;
}) {
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
