<script setup lang="ts">
    import { onMounted, onUpdated, useTemplateRef } from 'vue';
    import Progress, { type ProgressType } from '../../index';

    defineProps<{ type?: ProgressType }>();
    const emit = defineEmits<{ el: [el: Element] }>();
    const progress = useTemplateRef('progress');
    const report = () => emit('el', progress.value?.$el);
    onMounted(report);
    onUpdated(report);
</script>

<template>
    <Progress ref="progress" aria-label="upload" :type="type" />
</template>
