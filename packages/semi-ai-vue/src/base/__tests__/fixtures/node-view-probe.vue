<script setup lang="ts">
    import { inject, useId } from 'vue';
    import type { NodeViewProps } from '@tiptap/core';
    import { NodeViewWrapper } from '@tiptap/vue-3';

    defineProps<NodeViewProps>();
    const id = useId();
    const provided = inject<string>('probe', 'missing');
</script>

<template>
    <NodeViewWrapper :id="id" as="span" data-probe="">{{ provided }}</NodeViewWrapper>
</template>
