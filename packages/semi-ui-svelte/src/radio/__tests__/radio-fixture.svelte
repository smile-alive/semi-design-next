<script lang="ts">
    import type { RadioProps } from '../interface';
    import Radio from '../radio.svelte';

    let { store }: { store: { props: RadioProps; label?: string; extra?: string } } = $props();
</script>

<Radio {...store.props} extra={store.extra ? extraContent : undefined}>
    {#if store.label}{store.label}{/if}
</Radio>

{#snippet extraContent()}{store.extra}{/snippet}
