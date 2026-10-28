<script setup lang="ts">
    import { TextArea } from '@fibrae/semi-ui-vue';

    const defaultValue = 'Line 1\nLine 2\n这是一行较长的文本，用来演示软换行时的行号对齐效果。\nLine 4\nLine 5';
</script>

<template>
    <TextArea aria-label="带行号的文本" :defaultValue="defaultValue" :lineNumberStart="1" :lineNumberStyle="{ color: 'var(--semi-color-text-2)' }" :rows="12" showLineNumber style="width: 420px" />
</template>
