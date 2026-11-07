<script setup lang="ts">
    import MarkdownRender from '../../index';

    const { h2, img, p } = MarkdownRender.defaultComponents;
</script>

<template>
    <div>
        <component :is="h2" class="x">t</component>
        <component :is="p" class="y">before <component :is="img" alt="cat" src="a.png" /> after</component>
    </div>
</template>
