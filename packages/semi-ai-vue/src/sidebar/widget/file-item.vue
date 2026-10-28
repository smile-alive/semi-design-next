<script setup lang="ts">
    import { watch } from 'vue';
    import { EditorContent, useEditor } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { canUploadImage, getEditorAttributes, getFileEditorExtensions } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import useEditorAppContext from '../../_base/editor-app-context';
    import { ImageUploadNode } from './image-slot';
    import type { FileItemEmits, FileItemProps } from './interface';
    import MenuBar from './menu-bar.vue';

    const props = withDefaults(defineProps<FileItemProps & /* @vue-ignore */ ElementProps<'div', keyof FileItemProps | EmitHandlers<FileItemEmits>>>(), {
        name: undefined,
        content: undefined,
        editable: true,
        extensions: () => [],
        imgUploadProps: undefined,
    });

    const emit = defineEmits<FileItemEmits>();

    // shortcut: extensions and imgUploadProps are read once, when the editor is created (tiptap does not swap the
    // extensions of a live editor); remount the item with a new key to apply new ones
    const editor = useEditor({
        extensions: [...getFileEditorExtensions(), ImageUploadNode.configure(props.imgUploadProps), ...props.extensions],
        editable: props.editable,
        editorProps: { attributes: getEditorAttributes(props.name) },
        content: props.content,
        onUpdate: ({ editor: current, transaction }) => {
            // TrailingNode appends an empty paragraph on the first transaction, which is not an edit
            if (transaction.docChanged) emit('contentChange', current.getHTML());
        },
    });

    useEditorAppContext(editor);

    // The image button follows the same snapshot as the upload node, so it never offers an upload without a target
    const canUpload = canUploadImage(props.imgUploadProps);
    const prefix = cssClasses.FILE;

    // The equality check keeps the document and cursor when the owner only echoes back what contentChange reported.
    watch(
        () => props.content,
        (next) => {
            if (editor.value && next !== editor.value.getHTML()) {
                // not reported through onContentChange: the owner already knows what it passed
                editor.value.commands.setContent(next ?? '', { emitUpdate: false });
            }
        },
        { flush: 'post' }
    );

    watch(
        () => props.editable,
        (next) => editor.value?.setEditable(next, false),
        { flush: 'post' }
    );

    watch(
        () => props.name,
        (name) => editor.value?.setOptions({ editorProps: { attributes: getEditorAttributes(name) } }),
        { flush: 'post' }
    );
</script>

<template>
    <div :class="prefix">
        <MenuBar v-if="props.editable && editor" :canUpload="canUpload" :editor="editor" />
        <EditorContent :class="`${prefix}-editor`" :editor="editor" />
    </div>
</template>
