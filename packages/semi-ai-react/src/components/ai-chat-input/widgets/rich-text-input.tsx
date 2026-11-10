import React, { useLayoutEffect, useMemo, useState } from 'react';
import type { Content as TiptapContent } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { type Editor, type Extensions, EditorContent, useEditor } from '@tiptap/react';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-input/constants';
import { createEditorProps, getBaseExtensions, getEditorAttributes, getEditorOptions } from '@fibrae/semi-ai-foundation/components/ai-chat-input/extension/editor-config';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import InputSlot from '../extension/input-slot';
import SelectSlot from '../extension/select-slot';
import SkillSlot from '../extension/skill-slot';
import type { PlaceholderProps } from '../interface';

const prefix = cssClasses.PREFIX;

// A stable default: a new array per render would make every rerender look like an options change to the editor
const noExtensions: Extensions = [];

const slotExtensions: Extensions = [InputSlot, SelectSlot, SkillSlot];

class PlaceholderHolder {
    #value: PlaceholderProps;

    constructor(value: PlaceholderProps) {
        this.#value = value;
    }

    update(value: PlaceholderProps) {
        this.#value = value;
    }

    read = (p: Parameters<Extract<PlaceholderProps, (...args: any[]) => any>>[0]) => (typeof this.#value === 'function' ? this.#value(p) : this.#value);
}

export default function RichTextInput({
    id,
    controls,
    activeDescendant,
    onCreate,
    onChange,
    placeholder,
    extensions = noExtensions,
    defaultContent,
    onPaste,
    onPasteEvent,
    innerRef,
    handleKeyDown,
    onFocus,
    onBlur,
    immediatelyRender,
    showPlaceholderWhenSkillOnly,
}: {
    id?: string;
    /** The list the editor drives while its panel is open, and the option the keyboard is on */
    controls?: string;
    activeDescendant?: string;
    innerRef?: React.Ref<HTMLDivElement>;
    defaultContent?: TiptapContent;
    placeholder?: PlaceholderProps;
    immediatelyRender?: boolean;
    /** Called once per editor, on the commit that shows it */
    onCreate: (editor: Editor) => void;
    onChange: (content: string) => void;
    extensions?: Extensions;
    handleKeyDown?: (view: EditorView, event: KeyboardEvent) => boolean;
    /** File paste upload */
    onPaste?: (files: File[]) => void;
    /** Paste event on the editor content DOM */
    onPasteEvent?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
    showPlaceholderWhenSkillOnly?: boolean;
}) {
    const { locale } = useLocale('AIChatInput');

    // The editor keeps its creation-time extensions, so the placeholder extension reads the latest value through this
    // function. A class instance, not a ref: the Compiler rejects passing a ref-reading function during render.
    const [placeholderHolder] = useState(() => new PlaceholderHolder(placeholder));

    const readPlaceholder = placeholderHolder.read;
    const allExtensions = useMemo(() => getBaseExtensions({ slotExtensions, readPlaceholder, showPlaceholderWhenSkillOnly, extensions }), [extensions, readPlaceholder, showPlaceholderWhenSkillOnly]);

    // only the string form reaches editorProps: an inline function placeholder would otherwise change editorProps
    // every render, and useEditor compares it by reference and calls setOptions
    const ariaPlaceholder = typeof placeholder === 'string' ? placeholder : undefined;
    const editorProps = useMemo(() => createEditorProps({ attributes: getEditorAttributes({ id, label: locale.input, placeholder: ariaPlaceholder, controls, activeDescendant }), handleKeyDown, onPasteFiles: onPaste }), [id, locale.input, ariaPlaceholder, controls, activeDescendant, handleKeyDown, onPaste]);

    const editor = useEditor({ ...getEditorOptions({ extensions: allExtensions, defaultContent, editorProps, onChange }), immediatelyRender });

    // Runs before the parent's layout effect, where the foundation redraws the placeholder on a change
    useLayoutEffect(() => {
        placeholderHolder.update(placeholder);
    }, [placeholder, placeholderHolder]);

    // Hand over on commit, not on tiptap's create event: that fires on a timer, so an editor from a discarded render
    // (StrictMode, suspended sibling) would replace the live one
    useLayoutEffect(() => {
        if (editor) {
            onCreate(editor);
        }
    }, [editor, onCreate]);

    if (!editor) {
        return null;
    }

    return <EditorContent ref={innerRef} className={`${prefix}-editor-content`} editor={editor} onBlur={onBlur} onFocus={onFocus} onPaste={onPasteEvent} />;
}
