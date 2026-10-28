<script setup lang="ts">
    import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
    import ConfigProvider from '../../index';
    import type { ConfigProviderProps, ContextValue } from '../../interface';
    import Probe from './probe.vue';
    import Subscriber from './subscriber.vue';

    withDefaults(
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
    <ConfigProvider v-bind="outer">
        <ConfigProvider v-if="nested" v-bind="inner">
            <Probe :onSeen="onSeen" />
            <Subscriber v-for="(args, index) in subscribers" :key="index" :args="args" />
        </ConfigProvider>
        <template v-else>
            <Probe :onSeen="onSeen" />
            <Subscriber v-for="(args, index) in subscribers" :key="index" :args="args" />
        </template>
    </ConfigProvider>
</template>
