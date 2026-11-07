<script setup lang="ts">
    import { toRaw, watch } from 'vue';
    import type { Extensions, Content as TiptapContent } from '@tiptap/core';
    import type { EditorView } from '@tiptap/pm/view';
    import { EditorContent, useEditor, type Editor } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-input/constants';
    import { createEditorProps, getBaseExtensions, getEditorAttributes, getEditorOptions } from '@fibrae/semi-ai-foundation/components/ai-chat-input/extension/editor-config';
    import { useLocale } from '@fibrae/semi-ui-vue/composables';
    import useEditorAppContext from '../../base/editor-app-context';
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
        create: [editor: Editor];
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

    const editorProps = () =>
        createEditorProps({
            attributes: getEditorAttributes({ id: props.id, label: i18n.value.locale.input, placeholder: props.placeholder, controls: props.controls, activeDescendant: props.activeDescendant }),
            handleKeyDown: (view: EditorView, event: KeyboardEvent) => props.handleKeyDown(view, event),
            onPasteFiles: (files) => emit('pasteFiles', files),
        });

    // the editor reads extensions, content and placeholder mode once, when useEditor creates it
    const editor = useEditor(
        getEditorOptions({
            // tiptap extensions break when proxied
            extensions: getBaseExtensions({ slotExtensions: [InputSlot, SelectSlot, SkillSlot], readPlaceholder, showPlaceholderWhenSkillOnly: props.showPlaceholderWhenSkillOnly, extensions: toRaw(props.extensions ?? []) }),
            defaultContent: props.defaultContent,
            editorProps: editorProps(),
            onChange: (text) => emit('change', text),
        })
    );

    useEditorAppContext(editor);

    watch([() => props.id, () => props.controls, () => props.activeDescendant, () => props.placeholder, () => i18n.value.locale.input], () => editor.value?.setOptions({ editorProps: editorProps() }));

    watch(
        editor,
        (current) => {
            if (current) {
                emit('create', current);
            }
        },
        { flush: 'post' }
    );
</script>

<template>
    <EditorContent :class="`${prefix}-editor-content`" :editor="editor" @focusin="emit('focus', $event)" @focusout="emit('blur', $event)" @keydown="emit('keydown', $event)" @paste="emit('paste', $event)" />
</template>
