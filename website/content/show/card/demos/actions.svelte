<script lang="ts">
    import { Card, CardMeta, Rating } from '@fibrae/semi-ui-svelte';
</script>

{#snippet cover()}
    <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
{/snippet}
{#snippet rating()}
    <Rating size="small" value={4} />
{/snippet}

<Card actions={[rating]} {cover} headerLine={false} style="max-width: 300px">
    <CardMeta title="Semi Doc">
        {#snippet description()}全面、易用、优质{/snippet}
    </CardMeta>
</Card>
