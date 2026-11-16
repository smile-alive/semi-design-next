<script setup lang="ts">
    import ConfigProvider from '@fibrae/semi-ui-vue/config-provider/index';
    import type { Locale } from '@fibrae/semi-ui-vue/locale';
    import Spin from '@fibrae/semi-ui-vue/spin/index';
    import LocaleProvider from '../../locale-provider.vue';

    const props = defineProps<{
        locale?: Locale;
        configLocale?: Locale | null;
    }>();
</script>

<template>
    <LocaleProvider :locale="props.locale">
        <ConfigProvider :locale="props.configLocale">
            <Spin />
        </ConfigProvider>
    </LocaleProvider>
</template>
