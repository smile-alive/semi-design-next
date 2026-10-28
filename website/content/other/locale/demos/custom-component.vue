<script lang="ts">
    // Custom component text joins the Locale type through declaration merging
    declare module '@fibrae/semi-foundation/locale/interface' {
        export interface Locale {
            ComponentA: { customKey: string };
        }
    }
</script>

<script setup lang="ts">
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
    import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
    import { LocaleConsumer, LocaleProvider } from '@fibrae/semi-ui-vue';

    const locales = [
        { ...zh_CN, ComponentA: { customKey: 'semi' } },
        { ...ko_KR, ComponentA: { customKey: 'design' } },
        { ...en_GB, ComponentA: { customKey: 'dsm' } },
    ];
</script>

<template>
    <LocaleProvider v-for="locale in locales" :key="`semi-${locale.code}`" :locale="locale">
        <LocaleConsumer componentName="TimePicker">
            <template #default="{ locale: timePicker, localeCode }">
                <div>{{ localeCode }} : {{ timePicker.begin }}</div>
            </template>
        </LocaleConsumer>
    </LocaleProvider>
    <LocaleProvider v-for="locale in locales" :key="`custom-${locale.code}`" :locale="locale">
        <LocaleConsumer componentName="ComponentA">
            <template #default="{ locale: componentA }">
                <div>{{ componentA.customKey }}</div>
            </template>
        </LocaleConsumer>
    </LocaleProvider>
</template>
