<script setup lang="ts">
    import { computed } from 'vue';
    import { provideStepItemContext } from './context';

    const props = defineProps<{ index: number; total: number }>();

    provideStepItemContext(computed(() => ({ index: props.index, total: props.total })));
</script>

<template>
    <slot />
</template>
