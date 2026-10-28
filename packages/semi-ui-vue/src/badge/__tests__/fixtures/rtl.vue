<script setup lang="ts">
    import ConfigProvider from '../../../config-provider';
    import Badge from '../../badge.vue';

    defineProps<{ direction?: 'ltr' | 'rtl' }>();
</script>

<template>
    <ConfigProvider :direction="direction">
        <Badge :count="5">Semi</Badge>
    </ConfigProvider>
</template>
