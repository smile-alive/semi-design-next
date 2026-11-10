<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };
    const suggestionTemplate = ['天气如何', '空气质量', '工作进程', '日程安排'];

    const suggestion = ref<string[]>([]);

    const onChange = (content: Content[]) => {
        const value = content.length && content[0].text ? content[0].text : undefined;
        if (value === undefined || value.includes('\n') || value.length >= 4) {
            if (suggestion.value.length) {
                suggestion.value = [];
            }
            return;
        }
        suggestion.value = value.length ? suggestionTemplate.map((item) => `${value}，${item}`) : [];
    };
</script>

<template>
    <AIChatInput placeholder="输入内容，当内容长度小于 4个字符可以看到建议，使用上下按键可切换侯选项" style="margin: 12px" :suggestions="suggestion" :uploadProps="uploadProps" @contentChange="onChange" />
</template>
