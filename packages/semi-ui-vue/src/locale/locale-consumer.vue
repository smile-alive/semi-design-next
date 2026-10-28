<script setup lang="ts" generic="K extends LocaleComponentName">
    import type { LocaleComponentName, LocaleConsumerProps, LocaleConsumerSlots } from './interface';
    import useLocale from './use-locale';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<LocaleConsumerProps<K>>();
    defineSlots<LocaleConsumerSlots<K>>();

    const result = useLocale(() => props.componentName);
</script>

<template>
    <slot v-bind="result" />
</template>
