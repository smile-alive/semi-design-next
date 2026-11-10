<script setup lang="ts">
    import { watchEffect } from 'vue';
    import type { Locale } from '@fibrae/semi-ui-vue/locale';
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
    <span data-testid="hook">{{ JSON.stringify(result) }}</span>
    <LocaleConsumer :componentName="componentName">
        <template #default="value">
            <span data-testid="consumer">{{ JSON.stringify(value) }}</span>
        </template>
    </LocaleConsumer>
</template>
