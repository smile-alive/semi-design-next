<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput, type AIChatInputReference as Reference } from '@fibrae/semi-ai-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };
    const referenceTemp: Reference[] = [
        {
            id: '1',
            type: 'text',
            content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
        },
        {
            id: '2',
            name: '办公文档.docx',
        },
        {
            id: '3',
            name: '办公文档.pdf',
        },
        {
            id: '4',
            name: 'Music.mp4',
        },
        {
            id: '5',
            name: 'Image.jpeg',
            url: '/assets/placeholder/avatar-b.svg',
        },
        {
            id: '6',
            name: 'code.json',
        },
    ];

    const references = ref(referenceTemp);

    const handleReferenceDelete = (item: Reference) => {
        references.value = references.value.filter((ref) => ref.id !== item.id);
    };

    const handleReferenceClick = (item: Reference) => {
        console.log('点击了引用', item);
    };
</script>

<template>
    <AIChatInput placeholder="用于查看引用内容的用例" :references="references" style="margin: 12px" :uploadProps="uploadProps" @referenceClick="handleReferenceClick" @referenceDelete="handleReferenceDelete" />
</template>
