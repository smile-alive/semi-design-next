<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import { AIChatInput, type AIChatInputHandle } from '@fibrae/semi-ai-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    const temp = {
        'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
        'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
        'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
    };
    const names = Object.keys(temp);
    const contents = Object.values(temp);

    const activeIndex = ref(0);
    const input = useTemplateRef<AIChatInputHandle>('input');

    const setTemplate = (index: number) => {
        activeIndex.value = index;
        input.value?.setContent(contents[index]);
        input.value?.focusEditor();
    };
</script>

<template>
    <div class="aiChatInput-radio" role="tablist">
        <div v-for="(item, index) in names" :key="item" :aria-selected="index === activeIndex" :class="['aiChatInput-radio-item', { 'aiChatInput-radio-item-selected': index === activeIndex }]" role="tab" tabindex="0" @click="setTemplate(index)" @keydown.enter="setTemplate(index)">
            {{ item }}
        </div>
    </div>
    <AIChatInput ref="input" :defaultContent="temp['input-slot']" placeholder="输入内容或者上传内容" style="margin: 12px" :uploadProps="uploadProps" />
</template>
