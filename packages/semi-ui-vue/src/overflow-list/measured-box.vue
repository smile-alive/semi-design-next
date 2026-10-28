<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import useResizeObserver from '../_base/use-resize-observer';

    // Reports its own size. A component, not a v-for function ref: an inline ref is new each render, so the observer would
    // re-observe, report the initial size again, and the measurement would re-render forever.
    defineOptions({ name: 'OverflowListMeasuredBox' });
    const emit = defineEmits<{ resize: [entry: ResizeObserverEntry] }>();

    const box = useTemplateRef('box');

    useResizeObserver(box, ([entry]) => emit('resize', entry));
</script>

<template>
    <div ref="box">
        <slot />
    </div>
</template>
