<script lang="ts">
    import { Card, Rating } from '@fibrae/semi-ui-svelte';
</script>

{#snippet cover()}
    <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
{/snippet}
{#snippet rating()}
    <Rating size="small" value={4} />
{/snippet}

<Card actions={[rating]} {cover} headerLine={false} style="max-width: 300px">
    <Card.Meta title="Semi Doc">
        {#snippet description()}全面、易用、优质{/snippet}
    </Card.Meta>
</Card>
