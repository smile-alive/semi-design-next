<script setup lang="ts">
    import { watchEffect } from 'vue';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { useLocaleContext } from '../../context';

    const props = defineProps<{ onSeen: (locale: Locale | null) => void }>();
    const locale = useLocaleContext();
    watchEffect(() => props.onSeen(locale?.value ?? null));
</script>

<template>
    <span />
</template>
