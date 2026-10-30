<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import type { OverflowListItem, OverflowListProps } from '../interface';
    import OverflowList from '../overflow-list.svelte';

    type ItemKind = 'span' | 'div' | 'indexed' | 'id' | 'skip-camera' | 'none';
    type OverflowKind = 'plus' | 'sides' | 'direction' | 'text' | 'list' | 'none';

    interface Hooks {
        /** Called while an overflow snippet renders, to record what it received */
        overflow?: (position: string, items: OverflowListItem[]) => void;
        item?: (item: OverflowListItem) => void;
        onOverflow?: OverflowListProps<OverflowListItem>['onOverflow'];
        onIntersect?: OverflowListProps<OverflowListItem>['onIntersect'];
        onVisibleStateChange?: OverflowListProps<OverflowListItem>['onVisibleStateChange'];
    }

    interface Props {
        store: Omit<OverflowListProps<OverflowListItem>, 'item' | 'overflow' | 'onOverflow' | 'onIntersect' | 'onVisibleStateChange'> & { attrs?: HTMLAttributes<HTMLDivElement> };
        itemKind?: ItemKind;
        overflowKind?: OverflowKind;
        hooks?: Hooks;
    }

    let { store, itemKind = 'span', overflowKind = 'none', hooks = {} }: Props = $props();
</script>

{#snippet itemSnippet({ item, index }: { item: OverflowListItem; index: number })}
    {void hooks.item?.(item)}
    {#if itemKind === 'span'}
        <span>{item.key}</span>
    {:else if itemKind === 'div'}
        <div>{item.key}</div>
    {:else if itemKind === 'indexed'}
        <span>{index}:{item.name}</span>
    {:else if itemKind === 'id'}
        <div>{item.id}</div>
    {:else if itemKind === 'skip-camera'}
        {#if item.key !== 'camera'}<div>{item.key}</div>{/if}
    {/if}
{/snippet}

{#snippet overflowSnippet({ items: rest, position }: { items: OverflowListItem[]; position: 'start' | 'end' })}
    {void hooks.overflow?.(position, rest)}
    {#if overflowKind === 'plus'}
        {#if rest.length}<span>{`+${rest.length}`}</span>{/if}
    {:else if overflowKind === 'sides'}
        <span>{`overflow-${position === 'start' ? 0 : 1}:${rest.length}`}</span>
    {:else if overflowKind === 'direction'}
        <span>{`overflow-${position === 'start' ? 0 : 1}`}</span>
    {:else if overflowKind === 'text'}
        {`more ${rest.length}`}
    {:else if overflowKind === 'list'}
        {#each rest as entry (entry.key)}<i>{entry.key}</i>{/each}
    {/if}
{/snippet}

<OverflowList
    collapseFrom={store.collapseFrom}
    itemKey={store.itemKey}
    items={store.items}
    minVisibleItems={store.minVisibleItems}
    overflowRenderDirection={store.overflowRenderDirection}
    renderMode={store.renderMode}
    threshold={store.threshold}
    wrapperClassName={store.wrapperClassName}
    wrapperProps={store.wrapperProps}
    wrapperStyle={store.wrapperStyle}
    {...store.attrs}
    item={itemKind === 'none' ? undefined : itemSnippet}
    onIntersect={hooks.onIntersect}
    onOverflow={hooks.onOverflow}
    onVisibleStateChange={hooks.onVisibleStateChange}
    overflow={overflowKind === 'none' ? undefined : overflowSnippet}
/>
