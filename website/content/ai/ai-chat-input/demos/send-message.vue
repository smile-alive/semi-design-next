<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput, type AIChatInputContent as Content, type AIChatInputReference as Reference, type AIChatInputUploadProps } from '@fibrae/semi-ai-vue';
    import type { UploadOnChangeProps } from '@fibrae/semi-ui-vue';

    const uploadProps: AIChatInputUploadProps = {
        action: 'https://api.semi.design/upload',
        defaultFileList: [
            {
                uid: '1',
                name: 'dy.jpeg',
                status: 'success',
                size: '130kb',
                url: '/assets/placeholder/avatar-a.svg',
            },
            {
                uid: '5',
                name: 'resso.jpeg',
                status: 'uploading',
                percent: 50,
                size: '222kb',
                url: '/assets/placeholder/avatar-b.svg',
            },
        ],
    };

    const references = ref<Reference[]>([
        {
            id: '1',
            type: 'text',
            content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
        },
    ]);
    const generating = ref(false);

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const onUploadChange = (fileList: UploadOnChangeProps) => {
        console.log('onUploadChange', fileList);
    };

    const toggleGenerate = () => {
        generating.value = !generating.value;
    };

    const onMessageSend = () => {
        toggleGenerate();
        references.value = [];
    };

    const handleReferenceDelete = (item: Reference) => {
        references.value = references.value.filter((ref) => ref.id !== item.id);
    };
</script>

<template>
    <AIChatInput
        defaultContent="点击发送按钮，观察上传内容、引用内容、输入框内容变化"
        :generating="generating"
        :references="references"
        style="margin: 12px"
        :uploadProps="uploadProps"
        @contentChange="onContentChange"
        @messageSend="onMessageSend"
        @referenceDelete="handleReferenceDelete"
        @stopGenerate="toggleGenerate"
        @uploadChange="onUploadChange"
    />
</template>
