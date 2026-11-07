<script lang="ts">
    import CodeHighlight from '../code-highlight.svelte';
    import type { CodeHighlightProps } from '../interface';

    const { store }: { store: CodeHighlightProps } = $props();
</script>

<CodeHighlight {...store} />
