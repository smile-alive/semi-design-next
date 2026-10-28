<script setup lang="ts">
    import LocaleConsumer from '../../locale-consumer.vue';
</script>

<template>
    <LocaleConsumer componentName="Table">
        <template #default="{ locale, currency, localeCode, dateFnsLocale }">
            <span>{{ locale.emptyText }} {{ currency }} {{ localeCode }} {{ dateFnsLocale.code }}</span>
        </template>
    </LocaleConsumer>
</template>
