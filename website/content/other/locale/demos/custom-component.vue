<script lang="ts">
    // Custom component text joins the Locale type through declaration merging
    declare module '@fibrae/semi-foundation/locale/interface' {
        export interface Locale {
            ComponentA: { customKey: string };
        }
    }
</script>

<script setup lang="ts">
    import { LocaleConsumer, LocaleProvider } from '@fibrae/semi-ui-vue';
    import { en_US, zh_CN } from '@fibrae/semi-ui-vue/locale';

    const locales = [
        { ...zh_CN, ComponentA: { customKey: 'semi' } },
        { ...en_US, ComponentA: { customKey: 'design' } },
    ];
</script>

<template>
    <LocaleProvider v-for="locale in locales" :key="`semi-${locale.code}`" :locale="locale">
        <LocaleConsumer componentName="TimePicker">
            <template #default="consumer">
                <div>{{ consumer.localeCode }} : {{ consumer.locale.begin }}</div>
            </template>
        </LocaleConsumer>
    </LocaleProvider>
    <LocaleProvider v-for="locale in locales" :key="`custom-${locale.code}`" :locale="locale">
        <LocaleConsumer componentName="ComponentA">
            <template #default="consumer">
                <div>{{ consumer.locale.customKey }}</div>
            </template>
        </LocaleConsumer>
    </LocaleProvider>
</template>
