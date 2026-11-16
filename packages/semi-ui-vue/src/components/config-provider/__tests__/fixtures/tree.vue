<script setup lang="ts">
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
    import ConfigProvider from '../../index';
    import type { ConfigProviderProps, ContextValue } from '../../interface';
    import Probe from './probe.vue';
    import Subscriber from './subscriber.vue';

    const props = withDefaults(
        defineProps<{
            outer?: ConfigProviderProps;
            inner?: ConfigProviderProps;
            nested?: boolean;
            subscribers?: Array<[OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback]>;
            onSeen?: (value: ContextValue) => void;
        }>(),
        { nested: false, onSeen: undefined }
    );
</script>

<template>
    <ConfigProvider v-bind="props.outer">
        <ConfigProvider v-if="props.nested" v-bind="props.inner">
            <Probe :onSeen="props.onSeen" />
            <Subscriber v-for="(args, index) in props.subscribers" :key="index" :args="args" />
        </ConfigProvider>
        <template v-else>
            <Probe :onSeen="props.onSeen" />
            <Subscriber v-for="(args, index) in props.subscribers" :key="index" :args="args" />
        </template>
    </ConfigProvider>
</template>
