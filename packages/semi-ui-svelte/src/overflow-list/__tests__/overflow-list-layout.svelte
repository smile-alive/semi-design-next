<script lang="ts">
    import type { OverflowListItem } from '../interface';
    import OverflowList from '../overflow-list.svelte';

    interface Props {
        variant: 'wide-first' | 'scroll-new' | 'flex' | 'fractional' | 'intersect';
        store: { list: OverflowListItem[]; width: number };
        onOverflow?: (items: OverflowListItem[]) => void;
    }

    let { variant, store, onOverflow }: Props = $props();
</script>

{#snippet plusOverflow({ items: rest }: { items: OverflowListItem[] })}
    {#if rest.length}<span style="flex: 0 0 auto; display: block">{`+${rest.length}`}</span>{/if}
{/snippet}

{#snippet countOverflow({ items: rest }: { items: OverflowListItem[]; position: 'start' | 'end' })}
    <span style="flex: 0 0 auto">{rest.length}</span>
{/snippet}

{#snippet sidesOverflow({ items: rest, position }: { items: OverflowListItem[]; position: 'start' | 'end' })}
    <span>{`overflow-${position === 'start' ? 0 : 1}:${rest.length}`}</span>
{/snippet}

{#if variant === 'wide-first'}
    <div style="width: 200px">
        <OverflowList items={store.list} {onOverflow} overflow={plusOverflow}>
            {#snippet item({ item })}
                <span style={`flex: 0 0 auto; display: block; width: ${item.key === 'alarm' ? 400 : 60}px`}>{item.key}</span>
            {/snippet}
        </OverflowList>
    </div>
{:else if variant === 'scroll-new'}
    <div style="width: 500px">
        <OverflowList items={store.list} overflow={sidesOverflow} renderMode="scroll">
            {#snippet item({ item })}
                <div style={`flex: 0 0 auto; width: ${store.width}px`}>{item.key}</div>
            {/snippet}
        </OverflowList>
    </div>
{:else if variant === 'flex'}
    <div style={`width: ${store.width}px; display: flex`}>
        <OverflowList items={store.list} minVisibleItems={3} overflow={plusOverflow} style="width: 100%">
            {#snippet item({ item })}
                <span style="flex: 0 0 auto; display: block; width: 70px; margin-inline-end: 8px">{item.key}</span>
            {/snippet}
        </OverflowList>
    </div>
{:else if variant === 'fractional'}
    <div style="width: 101.25px">
        <OverflowList items={store.list} overflow={plusOverflow}>
            {#snippet item({ item })}
                <div style="flex: 0 0 auto; width: 33.75px">{item.key}</div>
            {/snippet}
        </OverflowList>
    </div>
{:else}
    <div style="width: 200px">
        <OverflowList items={store.list} overflow={countOverflow} renderMode="scroll">
            {#snippet item({ item })}
                <div style="margin-inline-end: 8px">{item.key}</div>
            {/snippet}
        </OverflowList>
    </div>
{/if}
