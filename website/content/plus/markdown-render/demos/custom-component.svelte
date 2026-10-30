<script lang="ts">
    import { MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-svelte';
    import MyButton from './parts/my-button.svelte';

    // The MDX source refers to the component by name
    const components: MarkdownRenderComponents = { ...MarkdownRender.defaultComponents, MyButton };

    const raw = `
#### 下面是一个渲染在 Markdown 中的按钮
<MyButton onClick={()=>alert("点击了 MyButton")}>MyButton 点我</MyButton>

直接在 Markdown 中书写 JSX 即可
        `;
</script>

<MarkdownRender {components} {raw} />
