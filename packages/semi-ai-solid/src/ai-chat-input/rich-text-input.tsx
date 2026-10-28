import { createEffect, createMemo, getOwner, on, onCleanup, onMount, untrack } from 'solid-js';
import { Editor, type Extensions, type Content as TiptapContent } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { createEditorHandlers, getBaseExtensions, getEditorAttributes } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/editor-config';
import { handleZeroWidthCharLogic } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/plugins';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
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
    onReady: (editor: Editor) => void;
    onCreate: () => void;
    onChange: (text: string) => void;
    handleKeyDown: (view: EditorView, event: KeyboardEvent) => boolean;
    onPasteFiles: (files: File[]) => void;
    onPaste?: (event: ClipboardEvent) => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
    onKeyDown: (event: KeyboardEvent) => void;
}

export default function RichTextInput(props: RichTextInputProps) {
    const locale = useLocale('AIChatInput');

    let host!: HTMLDivElement;
    let editor: Editor | undefined;

    // the slot views render under this owner, so they read the same locale and config
    const owner = getOwner();

    // A consumer spreading a signal object notifies every prop on any change, which would otherwise dispatch a transaction
    const placeholder = createMemo(() => props.placeholder);

    // compared deeply, or every such notification would call setOptions
    const attributes = createMemo(() => getEditorAttributes({ id: props.id, label: locale().locale.input, placeholder: props.placeholder, controls: props.controls, activeDescendant: props.activeDescendant }), undefined, { equals: isEqual });

    const readPlaceholder = (p: Parameters<Extract<PlaceholderProps, (...args: any[]) => any>>[0]) => {
        const value = untrack(() => props.placeholder);
        return typeof value === 'function' ? value(p) : (value ?? '');
    };

    const editorProps = (attrs: ReturnType<typeof getEditorAttributes>) => ({
        attributes: attrs,
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => props.handleKeyDown(view, event),
        ...createEditorHandlers((files) => props.onPasteFiles(files)),
    });

    onMount(() => {
        const instance = new Editor({
            element: host,
            extensions: getBaseExtensions({ slotExtensions: slotExtensions(owner), readPlaceholder, showPlaceholderWhenSkillOnly: props.showPlaceholderWhenSkillOnly, extensions: props.extensions }),
            content: props.defaultContent ?? '',
            editorProps: editorProps(untrack(attributes)),
            // tiptap's injected CSS is unlayered and would override `@layer semi`
            injectCSS: false,
            onUpdate: ({ editor: updated }) => props.onChange(updated.getText()),
        });
        editor = instance;
        onCleanup(() => instance.destroy());
        // set first: the dispatch below runs onUpdate synchronously and the parent reads the editor there
        props.onReady(instance);
        const tr = handleZeroWidthCharLogic(instance.state);
        if (tr) {
            instance.view.dispatch(tr);
        }
        props.onCreate();
    });

    createEffect(on(attributes, (attrs) => editor?.setOptions({ editorProps: editorProps(attrs) }), { defer: true }));

    createEffect(
        on(
            placeholder,
            () => {
                if (editor && !editor.isDestroyed) {
                    // an empty transaction makes the placeholder plugin recompute its decorations
                    editor.view.dispatch(editor.state.tr);
                }
            },
            { defer: true }
        )
    );

    return (
        <div
            ref={(element) => {
                host = element;
                props.ref(element);
            }}
            class={`${prefix}-editor-content`}
            onFocusIn={(e) => props.onFocus(e)}
            onFocusOut={(e) => props.onBlur(e)}
            onKeyDown={(e) => props.onKeyDown(e)}
            onPaste={(e) => props.onPaste?.(e)}
        />
    );
}
