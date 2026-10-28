<script setup lang="ts">
    import { ref } from 'vue';
    import { HotKeys, TextArea } from '@fibrae/semi-ui-vue';

    const text = ref('');

    // Enter alone is swallowed; Shift+Enter keeps the native line break
    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };
</script>

<template>
    <div id="input-shift-enter-hint" style="display: flex">
        使用
        <HotKeys :hotKeys="['shift', 'enter']" style="margin: 0 4px 12px" />
        换行的 TextArea
    </div>
    <TextArea v-model="text" aria-labelledby="input-shift-enter-hint" @keydown="onKeydown" />
</template>
