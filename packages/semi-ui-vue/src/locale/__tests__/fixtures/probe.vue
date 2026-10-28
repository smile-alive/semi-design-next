<script setup lang="ts">
    import { watchEffect } from 'vue';
    import { format } from 'date-fns';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { LocaleComponentName, LocaleResult } from '../../interface';
    import LocaleConsumer from '../../locale-consumer.vue';
    import useLocale from '../../use-locale';

    const props = withDefaults(
        defineProps<{
            componentName?: LocaleComponentName;
            onSeen?: (value: LocaleResult<Locale[LocaleComponentName]>) => void;
        }>(),
        { componentName: 'Modal', onSeen: undefined }
    );
    const result = useLocale(() => props.componentName);
    watchEffect(() => props.onSeen?.(result.value));
</script>

<template>
    <span data-testid="hook">{{ JSON.stringify({ ...result, dateFnsLocale: result.dateFnsLocale?.code }) }}</span>
    <span data-testid="date">{{ format(new Date(2026, 9, 13), 'EEEE', { locale: result.dateFnsLocale }) }}</span>
    <LocaleConsumer :componentName="componentName">
        <template #default="value">
            <span data-testid="consumer">{{ JSON.stringify({ ...value, dateFnsLocale: value.dateFnsLocale?.code }) }}</span>
        </template>
    </LocaleConsumer>
</template>
