<script setup lang="ts">
    import { ref } from 'vue';
    import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const suggestionTemplate = ['天气如何', '空气质量', '工作进程', '日程安排'];

    const suggestions = ref<string[]>([]);

    const onChange = (content: Content[]) => {
        const value: string | undefined = content.length && content[0].text ? content[0].text : undefined;
        if (value === undefined || value.includes('\n') || value.length >= 4) {
            if (suggestions.value.length) {
                suggestions.value = [];
            }
            return;
        }
        suggestions.value = value.length ? suggestionTemplate.map((item) => `${value}，${item}`) : [];
    };
</script>

<template>
    <AIChatInput placeholder="输入内容，当内容长度小于 4个字符可以看到建议，使用上下按键可切换侯选项" style="margin: 12px" :suggestions="suggestions" :uploadProps="uploadProps" @contentChange="onChange" />
</template>
