<script setup lang="ts">
    import LocaleConsumer from '../../locale-consumer.vue';
</script>

<template>
    <LocaleConsumer componentName="Table">
        <template #default="{ locale, currency, localeCode }">
            <span>{{ locale.emptyText }} {{ currency }} {{ localeCode }}</span>
        </template>
    </LocaleConsumer>
</template>
