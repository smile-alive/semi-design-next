<script setup lang="ts">
    import { onBeforeUnmount, onMounted } from 'vue';
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
    import useConfig from '../../use-config';

    const props = defineProps<{ args: [OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback] }>();
    const config = useConfig();
    let unsubscribe: (() => void) | undefined;
    onMounted(() => {
        const subscribe = config.value.onBreakpoint;
        const { args } = props;
        unsubscribe = args.length === 1 ? subscribe?.(args[0]) : subscribe?.(args[0], args[1]);
    });
    onBeforeUnmount(() => unsubscribe?.());
</script>

<template>
    <slot />
</template>
