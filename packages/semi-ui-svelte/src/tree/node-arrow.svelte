<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import { isTreeNodeLeaf } from '@fibrae/semi-foundation/tree/shared';
    import { IconTreeTriangleDown } from '@fibrae/semi-icons-svelte';
    import Spin from '../spin/spin.svelte';
    import { getTreeContext } from './context.js';
    import type { TreeExpandIconSnippetProps, TreeRowProps } from './interface.js';

    interface NodeArrowProps {
        row: TreeRowProps;
        showLine: boolean;
        onExpand: (event: MouseEvent) => void;
        expandIcon?: Snippet<[TreeExpandIconSnippetProps]>;
    }

    let { row, showLine, onExpand, expandIcon }: NodeArrowProps = $props();

    const context = getTreeContext('A tree row');

    const prefix = cssClasses.PREFIX_OPTION;
    const iconClass = `${prefix}-expand-icon`;
    const isLeaf = $derived(isTreeNodeLeaf(row, context.hasLoadData));
</script>

<!-- the row carries aria-busy; the spinner's own name would join the row's name -->
{#if row.loading}
    <Spin aria-hidden="true" wrapperClassName="{prefix}-spin-icon" />
{:else if !isLeaf}
    {#if expandIcon}
        {@render expandIcon({ onClick: onExpand, class: iconClass, expanded: Boolean(row.expanded) })}
    {:else}
        <IconTreeTriangleDown class={iconClass} size="small" onclick={onExpand} />
    {/if}
{:else if showLine}
    <span class="{prefix}-switcher">
        <span class="{prefix}-switcher-leaf-line"></span>
    </span>
{:else}
    <span class="{prefix}-empty-icon"></span>
{/if}
