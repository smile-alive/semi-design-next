<script lang="ts">
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import type { ScrollAlign } from '@fibrae/semi-foundation/tree/foundation';
    import { getTransitionNodes, sameKeys } from '@fibrae/semi-foundation/tree/shared';
    import VirtualList from '../_base/virtual-list.svelte';
    import { useConfig } from '../config-provider/index.js';
    import AutoSizer from './auto-sizer.svelte';
    import type { FlattenNode, NodeListProps } from './interface.js';
    import NodeCollapsible from './node-collapsible.svelte';

    /**
     * The rows of Tree and TreeSelect. A virtualized list renders the rows in view; otherwise every row renders, with the
     * ones that appear or disappear (motionKeys) grouped into one animated NodeCollapsible.
     */
    let { flattenNodes, flattenList, motionKeys, motionType = null, motion, virtualize, itemKey, searchTargetIsDeep = false, children: renderRow }: NodeListProps = $props();

    const config = useConfig();

    const NO_KEYS: Set<string> = new Set();
    let list = $state<ReturnType<typeof VirtualList>>();
    let finished = $state.raw<{ keys: Set<string>; nodes: FlattenNode[] } | null>(null);

    const virtualized = $derived(Boolean(virtualize && Object.keys(virtualize).length));

    const transitionNodes = $derived.by(() => {
        const keys = motion ? motionKeys : NO_KEYS;
        if (!keys.size || searchTargetIsDeep) {
            return null;
        }
        if (finished && isEqual(finished.keys, keys) && sameKeys(finished.nodes, flattenNodes)) {
            return null;
        }
        return getTransitionNodes(flattenNodes, keys, motionType, flattenList);
    });

    const handleMotionEnd = () => {
        finished = { keys: motionKeys, nodes: flattenNodes };
    };

    const groupKey = (group: FlattenNode[]) => `motion-${String(group[0]?.key)}`;

    const rowKey = (node: FlattenNode) => (itemKey ? itemKey(node) : (node.key as string));

    const itemKeyAt = (index: number) => rowKey(flattenNodes[index]);

    /** Scrolls a virtualized list to the row; false for a plain list, whose caller scrolls the row element itself */
    export function scrollToItem(index: number, align?: ScrollAlign) {
        if (!list) {
            return false;
        }
        list.scrollToItem(index, align);
        return true;
    }
</script>

{#if virtualized && virtualize}
    <AutoSizer defaultHeight={virtualize.height ?? '100%'} defaultWidth={virtualize.width}>
        {#snippet children({ height, width })}
            <VirtualList bind:this={list} class="{cssClasses.PREFIX}-virtual-list" {height} innerAttrs={{ role: 'none' }} itemCount={flattenNodes.length} itemKey={itemKeyAt} itemSize={virtualize.itemSize} style="direction: {config.direction ?? 'ltr'}" tabindex={-1} {width}>
                {#snippet children({ index, style })}
                    {@render renderRow({ node: flattenNodes[index], style })}
                {/snippet}
            </VirtualList>
        {/snippet}
    </AutoSizer>
{:else}
    <!-- one each for both, so rows outside the moving group stay mounted when the motion ends -->
    {#each transitionNodes ?? flattenNodes as item (Array.isArray(item) ? groupKey(item) : rowKey(item))}
        {#if Array.isArray(item)}
            {#if item.length}
                <NodeCollapsible duration={200} motion={Boolean(motionType)} onMotionEnd={handleMotionEnd} open={motionType === 'hide'}>
                    {#each item as node (rowKey(node))}
                        {@render renderRow({ node, style: undefined })}
                    {/each}
                </NodeCollapsible>
            {/if}
        {:else}
            {@render renderRow({ node: item, style: undefined })}
        {/if}
    {/each}
{/if}
