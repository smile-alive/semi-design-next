<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import Badge from '../../badge.vue';

    defineProps<{ direction?: 'ltr' | 'rtl' }>();
</script>

<template>
    <ConfigProvider :direction="direction">
        <Badge :count="5">Semi</Badge>
    </ConfigProvider>
</template>
