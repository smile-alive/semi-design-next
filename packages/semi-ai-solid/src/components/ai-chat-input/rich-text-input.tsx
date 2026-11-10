import { createEffect, createMemo, getOwner, on, onCleanup, onMount, untrack } from 'solid-js';
import { Editor, type Extensions, type Content as TiptapContent } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-input/constants';
import { createEditorProps, getBaseExtensions, getEditorAttributes, getEditorOptions } from '@fibrae/semi-ai-foundation/components/ai-chat-input/extension/editor-config';
import { useLocale } from '@fibrae/semi-ui-solid/primitives';
import slotExtensions from './extension';
import type { PlaceholderProps } from './interface';

const prefix = cssClasses.PREFIX;

interface RichTextInputProps {
    id: string;
    /** The list the editor drives while its panel is open, and the option the keyboard is on */
    controls?: string;
    activeDescendant?: string;
    placeholder?: PlaceholderProps;
    /** Read when the editor is created */
    defaultContent?: TiptapContent;
    /** Read when the editor is created */
    extensions?: Extensions;
    /** Read when the editor is created */
    showPlaceholderWhenSkillOnly?: boolean;
    ref: (element: HTMLDivElement) => void;
    /** Called with the editor right after it is created, before its first transaction */
    onCreate: (editor: Editor) => void;
    onChange: (text: string) => void;
    handleKeyDown: (view: EditorView, event: KeyboardEvent) => boolean;
    onPasteFiles: (files: File[]) => void;
    onPaste?: (event: ClipboardEvent) => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
}

export default function RichTextInput(props: RichTextInputProps) {
    const locale = useLocale('AIChatInput');

    let host!: HTMLDivElement;
    let editor: Editor | undefined;

    // the slot views render under this owner, so they read the same locale and config
    const owner = getOwner();

    // compared deeply, or every such notification would call setOptions
    const attributes = createMemo(() => getEditorAttributes({ id: props.id, label: locale().locale.input, placeholder: props.placeholder, controls: props.controls, activeDescendant: props.activeDescendant }), undefined, { equals: isEqual });

    const readPlaceholder = (p: Parameters<Extract<PlaceholderProps, (...args: any[]) => any>>[0]) => {
        const value = untrack(() => props.placeholder);
        return typeof value === 'function' ? value(p) : (value ?? '');
    };

    const editorProps = (attributes: ReturnType<typeof getEditorAttributes>) => createEditorProps({ attributes, handleKeyDown: (view: EditorView, event: KeyboardEvent) => props.handleKeyDown(view, event), onPasteFiles: (files) => props.onPasteFiles(files) });

    onMount(() => {
        const instance = new Editor({
            element: host,
            ...getEditorOptions({
                extensions: getBaseExtensions({ slotExtensions: slotExtensions(owner), readPlaceholder, showPlaceholderWhenSkillOnly: props.showPlaceholderWhenSkillOnly, extensions: props.extensions }),
                defaultContent: props.defaultContent,
                editorProps: editorProps(untrack(attributes)),
                onChange: (text) => props.onChange(text),
            }),
        });
        editor = instance;
        onCleanup(() => instance.destroy());
        props.onCreate(instance);
    });

    createEffect(on(attributes, (attrs) => editor?.setOptions({ editorProps: editorProps(attrs) }), { defer: true }));

    return (
        <div
            ref={(element) => {
                host = element;
                props.ref(element);
            }}
            class={`${prefix}-editor-content`}
            onFocusIn={(e) => props.onFocus(e)}
            onFocusOut={(e) => props.onBlur(e)}
            onPaste={(e) => props.onPaste?.(e)}
        />
    );
}
