<script setup lang="ts">
    import { provide, useId } from 'vue';
    import Document from '@tiptap/extension-document';
    import Paragraph from '@tiptap/extension-paragraph';
    import Text from '@tiptap/extension-text';
    import { EditorContent, useEditor } from '@tiptap/vue-3';
    import useEditorAppContext from '../../editor-app-context';
    import ProbeNode from './probe-node';

    const props = defineProps<{ isolate: boolean }>();

    provide('probe', 'from host');
    const hostId = useId();
    const options = {
        extensions: [Document, Paragraph, Text, ProbeNode],
        content: '<p><probe-node></probe-node><probe-node></probe-node></p>',
    };
    const first = useEditor(options);
    const second = useEditor(options);
    if (props.isolate) {
        useEditorAppContext(first);
        useEditorAppContext(second);
    }
</script>

<template>
    <span :id="hostId" data-probe="" />
    <EditorContent :editor="first" />
    <EditorContent :editor="second" />
</template>
