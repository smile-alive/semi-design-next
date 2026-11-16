<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Checkbox from '../..';
    import type { CheckboxHandle } from '../../interface';

    const props = defineProps<{ preventScroll?: boolean }>();
    const emit = defineEmits<{ ready: [handle: CheckboxHandle] }>();
    const checkbox = useTemplateRef<CheckboxHandle>('checkbox');
    onMounted(() => emit('ready', checkbox.value!));
</script>

<template>
    <Checkbox ref="checkbox" :preventScroll="props.preventScroll">label</Checkbox>
</template>
