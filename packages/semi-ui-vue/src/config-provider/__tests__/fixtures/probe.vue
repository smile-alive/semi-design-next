<script setup lang="ts">
    import { watchEffect } from 'vue';
    import type { ContextValue } from '../../interface';
    import useConfig from '../../use-config';

    const props = withDefaults(defineProps<{ onSeen?: (value: ContextValue) => void }>(), { onSeen: undefined });
    const config = useConfig();
    watchEffect(() => props.onSeen?.(config.value));
</script>

<template>
    <span data-testid="config">{{ JSON.stringify({ ...config, getPopupContainer: undefined, onBreakpoint: undefined }) }}</span>
</template>
