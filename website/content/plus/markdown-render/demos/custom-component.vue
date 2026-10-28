<script setup lang="ts">
    import { h, type FunctionalComponent } from 'vue';
    import { Button, MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-vue';

    // `components` takes component objects, which a template cannot define inline. The MDX source refers to it by name;
    // the onClick it passes falls through to the Button.
    const MyButton: FunctionalComponent = (_, { slots }) => h(Button, { type: 'primary', style: { marginBottom: '12px' } }, () => slots.default?.());

    const components: MarkdownRenderComponents = { ...MarkdownRender.defaultComponents, MyButton };

    const raw = `
#### 下面是一个渲染在 Markdown 中的按钮
<MyButton onClick={()=>alert("点击了 MyButton")}>MyButton 点我</MyButton>

直接在 Markdown 中书写 JSX 即可
        `;
</script>

<template>
    <MarkdownRender :components="components" :raw="raw" />
</template>
