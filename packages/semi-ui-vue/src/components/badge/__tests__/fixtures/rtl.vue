<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import Badge from '../../badge.vue';

    const props = defineProps<{ direction?: 'ltr' | 'rtl' }>();
</script>

<template>
    <ConfigProvider :direction="props.direction">
        <Badge :count="5">Semi</Badge>
    </ConfigProvider>
</template>
