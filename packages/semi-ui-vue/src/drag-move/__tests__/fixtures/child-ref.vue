<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import DragMove from '../..';

    const emit = defineEmits<{ ready: [child: HTMLElement | null] }>();
    const child = useTemplateRef<HTMLElement>('child');
    onMounted(() => emit('ready', child.value));
</script>

<template>
    <DragMove>
        <div ref="child">Drag me</div>
    </DragMove>
</template>
