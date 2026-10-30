<script lang="ts">
    import Card from '../card.svelte';
    import type { CardProps } from '../interface';
    import CardMeta from '../meta.svelte';
    import type { Parts } from './fixture-parts';

    let { store }: { store: { props: CardProps; parts: Parts } } = $props();
</script>

{#snippet titleNode()}<em>node title</em>{/snippet}
{#snippet extraNode()}<span>more</span>{/snippet}
{#snippet headerNode()}<h3>custom header</h3>{/snippet}
{#snippet coverNode()}<img alt="cover" src="data:," />{/snippet}
{#snippet footerNode()}<span>foot</span>{/snippet}
{#snippet actionNode(index: number)}<button type="button">action {index}</button>{/snippet}
{#snippet action0()}{@render actionNode(0)}{/snippet}
{#snippet action1()}{@render actionNode(1)}{/snippet}
{#snippet bodyNode()}<p>body</p>{/snippet}
{#snippet metaDescription()}<span>description</span>{/snippet}

<Card
    {...store.props}
    actions={store.parts.actions === 2 ? [action0, action1] : store.parts.actions === 1 ? [action0] : undefined}
    cover={store.parts.cover ? coverNode : undefined}
    footer={store.parts.footer ? footerNode : undefined}
    header={store.parts.header ? headerNode : undefined}
    headerExtraContent={store.parts.extra ? extraNode : undefined}
    title={store.parts.titleSnippet ? titleNode : store.props.title}
>
    {#if store.parts.body}
        {@render bodyNode()}
    {/if}
    {#if store.parts.meta}
        <CardMeta description={metaDescription} title="meta title" />
    {/if}
</Card>
