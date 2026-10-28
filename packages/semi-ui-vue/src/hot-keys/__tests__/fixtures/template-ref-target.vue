<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import HotKeys from '../../index';

    const input = useTemplateRef('input');
    const count = ref(0);
</script>

<template>
    <div>
        <input ref="input" aria-label="target" />
        <HotKeys :getListenerTarget="() => input" :hotKeys="['k']" @hotKey="count++" />
        <span data-testid="count">{{ count }}</span>
    </div>
</template>
