<script setup lang="ts">
    import MarkdownRender from '../..';
    import type { MarkdownRenderComponents } from '../../interface';

    // `tick` re-renders this parent, which builds a new plugin array literal each time
    const props = defineProps<{ plugin: () => undefined; tick: number; components?: MarkdownRenderComponents }>();
</script>

<template>
    <div :data-tick="props.tick">
        <MarkdownRender :components="props.components" raw="same" :remarkPlugins="[props.plugin]" />
    </div>
</template>
