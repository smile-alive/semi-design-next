<script setup lang="ts">
    import { toRaw, watch } from 'vue';
    import type { Extensions, Content as TiptapContent } from '@tiptap/core';
    import type { EditorView } from '@tiptap/pm/view';
    import { EditorContent, useEditor, type Editor } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { createEditorHandlers, getBaseExtensions, getEditorAttributes } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/editor-config';
    import { handleZeroWidthCharLogic } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/plugins';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import useEditorAppContext from '../_base/editor-app-context';
    import { InputSlot, SelectSlot, SkillSlot } from './extension';
    import type { PlaceholderProps } from './interface';

    type PlaceholderArgs = Parameters<Extract<PlaceholderProps, (...args: any[]) => string>>[0];

    const props = defineProps<{
        id: string;
        /** The list the editor drives while its panel is open, and the option the keyboard is on */
        controls?: string;
        activeDescendant?: string;
        placeholder?: PlaceholderProps;
        defaultContent?: TiptapContent;
        extensions?: Extensions;
        showPlaceholderWhenSkillOnly: boolean;
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => boolean;
    }>();

    const emit = defineEmits<{
        /** The editor exists; emitted before its content is normalized */
        ready: [editor: Editor];
        /** The content is normalized */
        create: [];
        change: [text: string];
        pasteFiles: [files: File[]];
        paste: [event: ClipboardEvent];
        focus: [event: FocusEvent];
        blur: [event: FocusEvent];
        keydown: [event: KeyboardEvent];
    }>();

    const i18n = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;

    const readPlaceholder = (args: PlaceholderArgs) => (typeof props.placeholder === 'function' ? props.placeholder(args) : (props.placeholder as string));

    const editorProps = () => ({
        attributes: getEditorAttributes({ id: props.id, label: i18n.value.locale.input, placeholder: props.placeholder, controls: props.controls, activeDescendant: props.activeDescendant }),
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => props.handleKeyDown(view, event),
        ...createEditorHandlers((files) => emit('pasteFiles', files)),
    });

    // the editor reads extensions, content and placeholder mode once, when useEditor creates it
    const editor = useEditor({
        // tiptap extensions break when proxied
        extensions: getBaseExtensions({ slotExtensions: [InputSlot, SelectSlot, SkillSlot], readPlaceholder, showPlaceholderWhenSkillOnly: props.showPlaceholderWhenSkillOnly, extensions: toRaw(props.extensions ?? []) }),
        content: props.defaultContent ?? '',
        editorProps: editorProps(),
        // tiptap's injected CSS is unlayered and would override `@layer semi`
        injectCSS: false,
        onUpdate: ({ editor: current }) => emit('change', current.getText()),
    });

    useEditorAppContext(editor);

    watch([() => props.id, () => props.controls, () => props.activeDescendant, () => props.placeholder, () => i18n.value.locale.input], () => editor.value?.setOptions({ editorProps: editorProps() }));

    watch(
        () => props.placeholder,
        () => {
            const current = editor.value;
            if (current && !current.isDestroyed) {
                // an empty transaction makes the placeholder plugin recompute its decorations
                current.view.dispatch(current.state.tr);
            }
        }
    );

    watch(
        editor,
        (current) => {
            if (!current) {
                return;
            }
            // first: the dispatch below runs onUpdate synchronously and the parent reads the editor there
            emit('ready', current);
            const tr = handleZeroWidthCharLogic(current.state);
            if (tr) {
                current.view.dispatch(tr);
            }
            emit('create');
        },
        { flush: 'post' }
    );
</script>

<template>
    <EditorContent :class="`${prefix}-editor-content`" :editor="editor" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)" @keydown="emit('keydown', $event)" @paste="emit('paste', $event)" />
</template>
