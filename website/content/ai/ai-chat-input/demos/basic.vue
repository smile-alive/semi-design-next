<script setup lang="ts">
    import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-vue';
    import type { UploadOnChangeProps as OnChangeProps } from '@fibrae/semi-ui-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const onUploadChange = (fileList: OnChangeProps) => {
        console.log('onUploadChange', fileList);
    };
</script>

<template>
    <AIChatInput placeholder="输入内容或者上传内容..." style="margin: 12px" :uploadProps="uploadProps" @contentChange="onContentChange" @uploadChange="onUploadChange" />
</template>
