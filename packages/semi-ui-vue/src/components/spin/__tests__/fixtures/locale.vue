<script setup lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import Spin from '../..';
    import ConfigProvider from '../../../config-provider';

    defineProps<{ locale?: Locale }>();
</script>

<template>
    <ConfigProvider :locale="locale"><Spin /></ConfigProvider>
</template>
