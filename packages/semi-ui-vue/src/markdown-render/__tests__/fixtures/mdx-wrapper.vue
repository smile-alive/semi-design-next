<script setup lang="ts">
    import type { MarkdownRenderComponents } from '../../interface';

    // MDX passes its components to the wrapper; declaring the prop keeps them off the root element
    defineProps<{ components?: MarkdownRenderComponents }>();
</script>

<template>
    <section class="wrap">
        <slot />
    </section>
</template>
