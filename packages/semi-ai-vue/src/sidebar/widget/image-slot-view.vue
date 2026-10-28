<script setup lang="ts">
    import { computed, shallowRef } from 'vue';
    import type { NodeViewProps } from '@tiptap/core';
    import { NodeViewWrapper } from '@tiptap/vue-3';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { insertUploadedImage } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Upload from '@fibrae/semi-ui-vue/upload/index';
    import type { CustomFile, FileItemStatus, UploadOnChangeProps } from '@fibrae/semi-ui-vue/upload/interface';
    import type { ImageUploadNodeOptions } from './interface';

    const props = defineProps<NodeViewProps>();

    const locale = useLocale('Sidebar');

    const status = shallowRef<FileItemStatus>();

    const prefix = `${cssClasses.FILE}-image-slot`;
    const options = computed(() => props.extension.options as ImageUploadNodeOptions & { type: string });

    const uploadProps = computed(() => {
        const { HTMLAttributes: _attributes, type: _type, getUploadImageSrc: _src, class: _class, ...rest } = options.value;
        return { ...rest, action: rest.action ?? '', draggable: true };
    });

    const dragMainText = computed(() => {
        if (status.value === 'validateFail') return locale.value.locale.validateFailInfo;
        if (status.value === 'uploadFail') return locale.value.locale.uploadFailInfo;
        return locale.value.locale.uploadImgInfo;
    });

    const handleChange = ({ fileList }: UploadOnChangeProps) => {
        const file = fileList[0];
        if (file) {
            status.value = file.status;
        }
    };

    const handleSuccess = (responseBody: any, file: CustomFile) => {
        const { getUploadImageSrc, type } = options.value;
        insertUploadedImage({ editor: props.editor, pos: props.getPos(), nodeSize: props.node.nodeSize, type, response: responseBody, name: file.name, getUploadImageSrc });
    };
</script>

<template>
    <!-- not focusable itself: the Upload drag area is the slot's Tab stop -->
    <NodeViewWrapper :class="['tiptap-image-slot', options.class]">
        <Upload v-bind="uploadProps" :class="status && `${prefix}-${status}`" @change="handleChange" @success="handleSuccess">
            <template #dragMainText>{{ dragMainText }}</template>
        </Upload>
    </NodeViewWrapper>
</template>
