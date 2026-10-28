<script setup lang="ts">
    import { h, type FunctionalComponent } from 'vue';
    import { MarkdownRender, TypographyTitle, type MarkdownRenderComponents } from '@fibrae/semi-ui-vue';

    // `components` takes component objects, which a template cannot define inline.
    const PrimaryTitle: FunctionalComponent = (_, { slots }) => h(TypographyTitle, { heading: 2, style: { color: 'var(--semi-color-primary)' } }, () => slots.default?.());

    const components: MarkdownRenderComponents = { h2: PrimaryTitle };
</script>

<template>
    <MarkdownRender :components="components" raw="## 从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中" />
</template>
