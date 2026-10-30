<script lang="ts">
    import { type Snippet, untrack } from 'svelte';

    let { store, onSnippets }: { store: { count: number }; onSnippets: (snippets: { bold: Snippet; counter: Snippet }) => void } = $props();

    untrack(() => onSnippets({ bold, counter }));
</script>

{#snippet bold()}<b>bold</b>{/snippet}
{#snippet counter()}count {store.count}{/snippet}
