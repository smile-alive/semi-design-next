<script setup lang="ts">
    import { computed } from 'vue';
    import { provideLocaleContext, useLocaleContext } from './context';
    import type { LocaleProviderProps, LocaleProviderSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<LocaleProviderProps>();
    defineSlots<LocaleProviderSlots>();

    const inherited = useLocaleContext();

    provideLocaleContext(computed(() => props.locale ?? inherited?.value ?? null));
</script>

<template>
    <slot />
</template>
