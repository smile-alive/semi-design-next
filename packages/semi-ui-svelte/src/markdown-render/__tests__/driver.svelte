<script lang="ts">
    import type { MarkdownRenderProps } from '../interface';
    import MarkdownRender from '../markdown-render.svelte';

    let { store }: { store: MarkdownRenderProps } = $props();
</script>

<MarkdownRender {...store} />
