<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { TreeDraggingNodeSnippetProps } from './interface.js';

    // Mounted on its own into a detached element, so the drag image renders synchronously inside dragstart
    let { snippet, args }: { snippet: Snippet<[TreeDraggingNodeSnippetProps]>; args: TreeDraggingNodeSnippetProps } = $props();
</script>

{@render snippet(args)}
