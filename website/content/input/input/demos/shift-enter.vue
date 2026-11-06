<script setup lang="ts">
    import { ref } from 'vue';
    import { HotKeys, TextArea } from '@fibrae/semi-ui-vue';

    const text = ref('');

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };
</script>

<template>
    <div id="input-shift-enter-hint" style="display: flex">
        使用
        <HotKeys :hotKeys="['shift', 'enter']" style="margin-block-end: 12px; margin-inline: 4px" />
        换行的 TextArea
    </div>
    <TextArea v-model="text" aria-labelledby="input-shift-enter-hint" @keydown="handleKeyDown" />
</template>
