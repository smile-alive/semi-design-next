import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type { Content as TiptapContent } from '@tiptap/core';
import { type Editor, type Extensions, EditorContent, useEditor } from '@tiptap/react';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { createEditorHandlers, getBaseExtensions, getEditorAttributes } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/editor-config';
import { handleZeroWidthCharLogic } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/plugins';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import InputSlot from './extension/input-slot';
import SelectSlot from './extension/select-slot';
import SkillSlot from './extension/skill-slot';
import type { PlaceholderProps } from './interface';

const prefix = cssClasses.PREFIX;

// A stable default: a new array per render would make every rerender look like an options change to the editor
const noExtensions: Extensions = [];

const slotExtensions: Extensions = [InputSlot, SelectSlot, SkillSlot];

class PlaceholderHolder {
    #value: PlaceholderProps;

    constructor(value: PlaceholderProps) {
        this.#value = value;
    }

    /** Returns whether the value changed */
    update(value: PlaceholderProps) {
        if (this.#value === value) {
            return false;
        }
        this.#value = value;
        return true;
    }

    read = (p: Parameters<Extract<PlaceholderProps, (...args: any[]) => any>>[0]) => (typeof this.#value === 'function' ? this.#value(p) : this.#value);
}

export default function RichTextInput({
    id,
    controls,
    activeDescendant,
    setEditor,
    onKeyDown,
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
    handleCreate,
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
    setEditor?: (editor: Editor) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onChange?: (content: string) => void;
    extensions?: Extensions;
    handleKeyDown?: (view: any, event: KeyboardEvent) => boolean;
    /** File paste upload */
    onPaste?: (files: File[]) => void;
    /** Paste event on the editor content DOM */
    onPasteEvent?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
    handleCreate?: () => void;
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

    const editorProps = useMemo(
        () => ({
            attributes: getEditorAttributes({ id, label: locale.input, placeholder: ariaPlaceholder, controls, activeDescendant }),
            handleKeyDown,
            ...createEditorHandlers(onPaste),
        }),
        [id, locale.input, ariaPlaceholder, controls, activeDescendant, handleKeyDown, onPaste]
    );

    const onUpdate = useCallback(
        ({ editor }) => {
            const content = editor.getText();
            onChange(content);
        },
        [onChange]
    );

    const editor = useEditor({
        extensions: allExtensions as Extensions,
        content: defaultContent ?? ``,
        editorProps: editorProps,
        immediatelyRender,
        // tiptap's injected CSS is unlayered and would override `@layer semi`
        injectCSS: false,
        onUpdate,
    });

    useLayoutEffect(() => {
        if (!placeholderHolder.update(placeholder)) {
            return;
        }
        if (editor && !editor.isDestroyed) {
            // an empty transaction makes the placeholder plugin recompute its decorations
            editor.view.dispatch(editor.state.tr);
        }
    }, [editor, placeholder, placeholderHolder]);

    // Hand over on commit, not on tiptap's create event: that fires on a timer, so an editor from a discarded render
    // (StrictMode, suspended sibling) would replace the live one
    useLayoutEffect(() => {
        if (!editor) {
            return;
        }
        // set first: the dispatch below runs onUpdate synchronously and the parent reads the editor there
        setEditor(editor);
        const tr = handleZeroWidthCharLogic(editor.state);
        if (tr) {
            editor.view.dispatch(tr);
        }
        handleCreate();
    }, [editor, setEditor, handleCreate]);

    if (!editor) {
        return null;
    }

    return <EditorContent ref={innerRef} className={`${prefix}-editor-content`} editor={editor} onBlur={onBlur} onFocus={onFocus} onKeyDown={onKeyDown} onPaste={onPasteEvent} />;
}
