<script lang="ts">
    import { MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-svelte';
    import PrimaryTitle from './parts/primary-title.svelte';

    const components: MarkdownRenderComponents = { h2: PrimaryTitle };
</script>

<MarkdownRender {components} raw="## 从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中" />
