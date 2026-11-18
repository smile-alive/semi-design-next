<script setup lang="ts">
    import { Space, Tag } from '@fibrae/semi-ui-vue';
    import { useBreakpoint } from '@fibrae/semi-ui-vue/composables';

    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
    const screens = useBreakpoint();
</script>

<template>
    <Space>
        <Tag v-for="breakpoint in breakpoints" :key="breakpoint" :color="screens[breakpoint] ? 'green' : 'grey'">
            {{ breakpoint }}
        </Tag>
    </Space>
</template>
