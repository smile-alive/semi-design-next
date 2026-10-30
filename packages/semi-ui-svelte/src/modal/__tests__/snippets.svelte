<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { IconSend } from '@fibrae/semi-icons-svelte';

    interface Snippets {
        bold: Snippet;
        footer: Snippet;
        closeIcon: Snippet;
        icon: Snippet;
        plainIcon: Snippet;
        counter: Snippet;
    }

    let { store, onSnippets }: { store: { count: number }; onSnippets: (snippets: Snippets) => void } = $props();

    untrack(() => onSnippets({ bold, footer, closeIcon, icon, plainIcon, counter }));
</script>

{#snippet bold()}<b>bold</b>{/snippet}
{#snippet footer()}<button type="button">Own</button>{/snippet}
{#snippet closeIcon()}<span class="my-close"></span>{/snippet}
{#snippet icon()}<IconSend class="mine" size="small" />{/snippet}
{#snippet plainIcon()}<i class="plain-icon"></i>{/snippet}
{#snippet counter()}count {store.count}{/snippet}
