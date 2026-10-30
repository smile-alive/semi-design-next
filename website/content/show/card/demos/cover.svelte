<script lang="ts">
    import { Card, CardMeta } from '@fibrae/semi-ui-svelte';
</script>

{#snippet cover()}
    <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo2.jpeg" />
{/snippet}

<Card {cover} style="max-width: 300px">
    <CardMeta title="卡片封面" />
</Card>
