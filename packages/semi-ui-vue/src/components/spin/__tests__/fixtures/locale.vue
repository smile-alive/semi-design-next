<script setup lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import Spin from '../..';

    defineProps<{ locale?: Locale }>();
</script>

<template>
    <ConfigProvider :locale="locale"><Spin /></ConfigProvider>
</template>
