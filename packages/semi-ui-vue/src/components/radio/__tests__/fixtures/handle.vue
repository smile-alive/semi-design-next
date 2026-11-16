<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Radio from '../..';
    import type { RadioHandle } from '../../interface';

    const props = defineProps<{ preventScroll?: boolean }>();
    const emit = defineEmits<{ ready: [handle: RadioHandle] }>();
    const radio = useTemplateRef<RadioHandle>('radio');
    onMounted(() => emit('ready', radio.value!));
</script>

<template>
    <Radio ref="radio" mode="advanced" :preventScroll="props.preventScroll">Test Radio</Radio>
</template>
