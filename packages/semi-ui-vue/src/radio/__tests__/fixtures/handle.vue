<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Radio from '../..';
    import type { RadioHandle } from '../../interface';

    defineProps<{ preventScroll?: boolean }>();
    const emit = defineEmits<{ ready: [handle: RadioHandle] }>();
    const radio = useTemplateRef<RadioHandle>('radio');
    onMounted(() => emit('ready', radio.value as RadioHandle));
</script>

<template>
    <Radio ref="radio" mode="advanced" :preventScroll="preventScroll">Test Radio</Radio>
</template>
