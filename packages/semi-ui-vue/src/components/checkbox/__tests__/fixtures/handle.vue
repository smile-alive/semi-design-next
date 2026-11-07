<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Checkbox from '../..';
    import type { CheckboxHandle } from '../../interface';

    defineProps<{ preventScroll?: boolean }>();
    const emit = defineEmits<{ ready: [handle: CheckboxHandle] }>();
    const checkbox = useTemplateRef<CheckboxHandle>('checkbox');
    onMounted(() => emit('ready', checkbox.value as CheckboxHandle));
</script>

<template>
    <Checkbox ref="checkbox" :preventScroll="preventScroll">label</Checkbox>
</template>
