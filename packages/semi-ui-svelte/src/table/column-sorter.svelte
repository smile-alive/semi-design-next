<script lang="ts">
    import type { Snippet } from 'svelte';
    import { strings } from '@fibrae/semi-foundation/table/constants';
    import { getNextSortOrder } from '@fibrae/semi-foundation/table/utils';
    import { IconCaretdown, IconCaretup } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import { getTableContext } from './context.js';
    import type { ColumnProps, SortOrder } from './interface.js';

    /**
     * The sort button of a column header: named by the column title, with the sort state as aria-sort on the header cell.
     * When the whole header cell sorts, the click handler sits on the cell and the button's click reaches it by bubbling.
     */
    interface ColumnSorterProps {
        column: ColumnProps;
        sortOrder: SortOrder;
        showTooltip: boolean;
        /** The button sorts on click itself, since the header cell does not */
        sortsOnClick: boolean;
        /** The title the button wraps */
        children?: Snippet;
    }

    let { column, sortOrder, showTooltip, sortsOnClick, children }: ColumnSorterProps = $props();

    const table = getTableContext('Table sorter');
    const locale = useLocale('Table');

    // a title snippet names the button itself; only a plain string title can stand in as its label
    const buttonLabel = $derived(table.parts.headerCell || typeof column.title !== 'string' ? undefined : column.title);

    const handleClick = () => {
        if (sortsOnClick) {
            table.foundation.handleSort(column);
        }
    };
</script>

{#snippet button(extra: Partial<TooltipTriggerProps>)}
    <button {...extra} aria-label={buttonLabel} class="{table.prefixCls}-column-sorter-wrapper" type="button" onclick={handleClick}>
        {@render children?.()}
        {#if table.parts.sortIcon}
            {@render table.parts.sortIcon({ sortOrder, column })}
        {:else}
            <span aria-hidden="true" class="{table.prefixCls}-column-sorter">
                <span class={[`${table.prefixCls}-column-sorter-up`, { on: sortOrder === strings.SORT_DIRECTIONS[0] }]}>
                    <IconCaretup size="default" />
                </span>
                <span class={[`${table.prefixCls}-column-sorter-down`, { on: sortOrder === strings.SORT_DIRECTIONS[1] }]}>
                    <IconCaretdown size="default" />
                </span>
            </span>
        {/if}
    </button>
{/snippet}

{#if showTooltip}
    <Tooltip>
        {#snippet child({ props })}{@render button(props)}{/snippet}
        {#snippet content()}{locale().locale[getNextSortOrder(sortOrder)]}{/snippet}
    </Tooltip>
{:else}
    {@render button({})}
{/if}
