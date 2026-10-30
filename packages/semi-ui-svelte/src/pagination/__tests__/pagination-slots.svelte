<script lang="ts">
    import { IconChevronLeft } from '@fibrae/semi-icons-svelte';
    import Pagination from '../pagination.svelte';

    let { store }: { store: { prev: 'text' | 'icon' | 'none'; next: string } } = $props();
</script>

{#snippet prevIcon()}<IconChevronLeft />{/snippet}
{#snippet prevPlain()}Earlier{/snippet}
{#snippet nextLabel()}{store.next}{/snippet}

<Pagination nextText={store.next ? nextLabel : undefined} prevText={store.prev === 'text' ? prevPlain : store.prev === 'icon' ? prevIcon : undefined} total={200} />
