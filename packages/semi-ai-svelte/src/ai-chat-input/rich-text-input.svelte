<script lang="ts">
    import { getAllContexts, untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { on } from 'svelte/events';
    import { Editor, type Extensions, type Content as TiptapContent } from '@tiptap/core';
    import type { EditorView } from '@tiptap/pm/view';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { createEditorHandlers, getBaseExtensions, getEditorAttributes } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/editor-config';
    import { handleZeroWidthCharLogic } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/plugins';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import slotExtensions from './extension/index.js';
    import type { PlaceholderProps } from './interface.js';

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
        /** Called with the editor right after it is created, before its first transaction */
        onReady: (editor: Editor) => void;
        /** The content is normalized */
        onCreate: () => void;
        onChange: (text: string) => void;
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => boolean;
        onPasteFiles: (files: File[]) => void;
        onPaste?: (event: ClipboardEvent) => void;
        onFocus: (event: FocusEvent) => void;
        onBlur: (event: FocusEvent) => void;
        onKeyDown: (event: KeyboardEvent) => void;
    }

    let { id, controls, activeDescendant, placeholder, defaultContent, extensions, showPlaceholderWhenSkillOnly = false, onReady, onCreate, onChange, handleKeyDown, onPasteFiles, onPaste, onFocus, onBlur, onKeyDown }: RichTextInputProps = $props();

    const locale = useLocale('AIChatInput');

    let editor: Editor | undefined;

    // the slot views mount as separate roots; with these they read the same locale and config as this component
    const contexts = getAllContexts();
    const attributes = $derived(getEditorAttributes({ id, label: locale().locale.input, placeholder, controls, activeDescendant }));

    // the editor keeps the extensions it was created with, so the placeholder plugin reads the latest prop through this
    const readPlaceholder = (args: Parameters<Extract<PlaceholderProps, (...args: never[]) => string>>[0]) => (typeof placeholder === 'function' ? placeholder(args) : (placeholder ?? ''));

    const editorProps = (attrs: ReturnType<typeof getEditorAttributes>) => ({
        attributes: attrs,
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => handleKeyDown(view, event),
        ...createEditorHandlers((files) => onPasteFiles(files)),
    });

    // Untracked: a prop read here would make Svelte rerun the attachment, destroying the editor and its content
    const mountEditor: Attachment<HTMLDivElement> = (element) =>
        untrack(() => {
            const instance = new Editor({
                element,
                extensions: getBaseExtensions({ slotExtensions: slotExtensions(contexts), readPlaceholder, showPlaceholderWhenSkillOnly, extensions }),
                content: defaultContent ?? '',
                editorProps: editorProps(attributes),
                // tiptap's injected CSS is unlayered and would override `@layer semi`
                injectCSS: false,
                onUpdate: ({ editor: updated }) => onChange(updated.getText()),
            });
            editor = instance;
            // first: the dispatch below runs onUpdate synchronously and the parent reads the editor there
            onReady(instance);
            const tr = handleZeroWidthCharLogic(instance.state);
            if (tr) {
                instance.view.dispatch(tr);
            }
            onCreate();
            // Listened here, not in the template: the wrapper only relays what bubbles from the editable element, which
            // carries the textbox semantics, so it takes no role of its own
            const off = [on(element, 'focusin', (event) => onFocus(event)), on(element, 'focusout', (event) => onBlur(event)), on(element, 'keydown', (event) => onKeyDown(event)), on(element, 'paste', (event) => onPaste?.(event))];
            return () => {
                off.forEach((remove) => remove());
                editor = undefined;
                instance.destroy();
            };
        });

    // Both run once after the editor is created too, which changes nothing
    $effect(() => {
        const attrs = attributes;
        untrack(() => editor?.setOptions({ editorProps: editorProps(attrs) }));
    });

    $effect(() => {
        void placeholder;
        untrack(() => {
            if (editor && !editor.isDestroyed) {
                // an empty transaction makes the placeholder plugin recompute its decorations
                editor.view.dispatch(editor.state.tr);
            }
        });
    });
</script>

<div {@attach mountEditor} class="{cssClasses.PREFIX}-editor-content"></div>
