<script setup lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import ConfigProvider from '../../../config-provider';
    import Spin from '../../../spin';
    import LocaleProvider from '../../locale-provider.vue';

    defineProps<{
        locale?: Locale;
        configLocale?: Locale | null;
    }>();
</script>

<template>
    <LocaleProvider :locale="locale">
        <ConfigProvider :locale="configLocale">
            <Spin />
        </ConfigProvider>
    </LocaleProvider>
</template>
