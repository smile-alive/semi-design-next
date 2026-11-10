<script setup lang="ts">
    import { watchEffect } from 'vue';
    import type { LocaleInput } from '@fibrae/semi-ui-vue/locale';
    import { useLocaleContext } from '../../context';

    const props = defineProps<{ onSeen: (locale: LocaleInput | null) => void }>();
    const locale = useLocaleContext();
    watchEffect(() => props.onSeen(locale?.value ?? null));
</script>

<template>
    <span />
</template>
