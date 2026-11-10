<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import type { Locale } from '@fibrae/semi-ui-vue/locale';
    import Spin from '../..';

    defineProps<{ locale?: Locale }>();
</script>

<template>
    <ConfigProvider :locale="locale"><Spin /></ConfigProvider>
</template>
