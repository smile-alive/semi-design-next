<script lang="ts">
    import { untrack } from 'svelte';
    import { numbers, strings } from '@fibrae/semi-foundation/table/constants';
    import type { BaseEllipsis } from '@fibrae/semi-foundation/table/foundation';
    import { getColumnsByLevel, getHeaderStickyOffset, getNextSortOrder, getRTLAlign, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isLastLeftFixed, isSelectionColumn, shouldShowEllipsisTitle, sliceColumnsByLevel, type TableHeaderCell } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import ColumnFilter from './column-filter.svelte';
    import ColumnSelection from './column-selection.svelte';
    import ColumnSorter from './column-sorter.svelte';
    import { getTableContext } from './context.js';
    import type { ColumnProps } from './interface.js';
    import { columnFlags, joinStyles } from './utils.js';

    interface TableHeaderRowProps {
        row: TableHeaderCell<ColumnProps>[];
        /** The header row index, the level of its columns */
        index: number;
        /** The column tree */
        columns: ColumnProps[];
    }

    let { row, index, columns }: TableHeaderRowProps = $props();

    const table = getTableContext('Table header row');
    const locale = useLocale('Table');

    let rowElement = $state<HTMLElement>();
    let press: { x: number; width: number; sign: number } | null = null;

    const ARIA_SORT: Record<string, 'ascending' | 'descending'> = {
        [strings.SORT_DIRECTIONS[0]]: 'ascending',
        [strings.SORT_DIRECTIONS[1]]: 'descending',
    };

    const cells = $derived.by(() => {
        const isRTL = table.direction === 'rtl';
        const slicedColumns = sliceColumnsByLevel(columns, index) as ColumnProps[];
        const headWidths = table.getCellWidths(slicedColumns);
        return row.flatMap(({ column, ...cell }, cellIndex) => {
            const { class: customClass, style: customStyle, onclick, ...customAttrs } = { ...column.onHeaderCell?.(column, cellIndex, index) };
            const colspan = customAttrs.colspan ?? cell.colSpan;
            const rowspan = customAttrs.rowspan ?? cell.rowSpan;
            if (colspan === 0 || rowspan === 0) {
                return [];
            }
            const flags = columnFlags(column, table.queries);
            const textAlign = column.align ? getRTLAlign(column.align, table.direction) : undefined;
            const [fixedLeft, fixedRight, fixedLeftLast, fixedRightFirst] = isRTL
                ? [isFixedRight(column), isFixedLeft(column), isFirstFixedRight(slicedColumns, column), isLastLeftFixed(slicedColumns, column)]
                : [isFixedLeft(column), isFixedRight(column), isLastLeftFixed(slicedColumns, column), isFirstFixedRight(slicedColumns, column)];
            const stickyOffset = getHeaderStickyOffset(column, slicedColumns, headWidths, isRTL);
            const showSortTip = flags.clickToSort && flags.showSortTip;
            return [
                {
                    key: column.key ?? column.dataIndex ?? cellIndex,
                    column,
                    flags,
                    resizable: table.resizable && typeof column.width === 'number' && column.resize !== false,
                    attrs: {
                        title: flags.needsTitle ? undefined : cell.title,
                        ...customAttrs,
                        colspan,
                        rowspan,
                        class: [
                            `${table.prefixCls}-row-head`,
                            column.class,
                            customClass,
                            {
                                [`${table.prefixCls}-align-${textAlign}`]: Boolean(textAlign),
                                [`${table.prefixCls}-cell-fixed-left`]: fixedLeft,
                                [`${table.prefixCls}-cell-fixed-left-last`]: fixedLeftLast,
                                [`${table.prefixCls}-cell-fixed-right`]: fixedRight,
                                [`${table.prefixCls}-cell-fixed-right-first`]: fixedRightFirst,
                                [`${table.prefixCls}-cell-last`]: Boolean(cell.last),
                                [`${table.prefixCls}-row-head-ellipsis`]: Boolean(column.ellipsis),
                                [`${table.prefixCls}-row-head-clickSort`]: flags.clickToSort,
                            },
                        ],
                        style: joinStyles(table.headerStyle, customStyle as string | undefined, textAlign && `text-align: ${textAlign}`, stickyOffset && `position: sticky; ${stickyOffset.side}: ${toCssLength(stickyOffset.offset)}`),
                        // a role="none" table no longer gives colspan and rowspan their table meaning
                        'aria-colspan': table.splitTable && colspan && colspan > 1 ? colspan : undefined,
                        'aria-rowspan': table.splitTable && rowspan && rowspan > 1 ? rowspan : undefined,
                        'aria-sort': column.sorter && typeof flags.sortOrder === 'string' ? ARIA_SORT[flags.sortOrder] : undefined,
                        role: 'columnheader',
                        // the sorter inside is the Tab stop; the sort Tooltip would add 0 here
                        tabindex: showSortTip ? -1 : undefined,
                        onclick:
                            flags.clickToSort || onclick
                                ? (event: MouseEvent & { currentTarget: EventTarget & HTMLTableCellElement }) => {
                                      onclick?.(event);
                                      if (flags.clickToSort) {
                                          table.foundation.handleSort(column);
                                      }
                                  }
                                : undefined,
                    },
                    sortTip: showSortTip ? locale().locale[getNextSortOrder(flags.sortOrder) as 'ascend'] : undefined,
                    titleAttr: typeof column.title === 'string' && shouldShowEllipsisTitle(column.ellipsis as BaseEllipsis) && !table.parts.headerCell ? column.title : undefined,
                },
            ];
        });
    });

    const rowAttrs = $derived.by(() => {
        const { class: customClass, ...custom } = { ...table.parts.onHeaderRow?.(columns, index) };
        return { ...custom, class: [customClass, `${table.prefixCls}-row`] };
    });

    // The measured widths give the sticky offsets of fixed columns; measured when the columns change, not on every
    // render, since reading layout after a DOM update forces a reflow
    const measure = (node: HTMLElement) => {
        const levelColumns = getColumnsByLevel(columns, index) as ColumnProps[];
        const heads = node.querySelectorAll(`.${table.prefixCls}-row-head`);
        table.setHeadWidths(
            Array.from(heads, (head, headIndex) => {
                const configWidth = levelColumns[headIndex]?.width;
                return {
                    width: typeof configWidth === 'number' ? configWidth : head.getBoundingClientRect().width || 0,
                    key: levelColumns[headIndex]?.key as string,
                };
            }),
            index
        );
    };

    const handlePointerDown = (event: PointerEvent & { currentTarget: HTMLElement }, column: ColumnProps) => {
        if (isSecondaryPress(event) || typeof column.width !== 'number') {
            return;
        }
        // keeps the press from starting a text selection, which would break the drag
        event.preventDefault();
        const handle = event.currentTarget;
        handle.setPointerCapture(event.pointerId);
        const rtl = handle.parentElement ? getComputedStyle(handle.parentElement).direction === 'rtl' : false;
        press = { x: event.clientX, width: column.width, sign: rtl ? -1 : 1 };
        table.resizeColumn(column, 'start');
    };

    const handlePointerMove = (event: PointerEvent, column: ColumnProps) => {
        if (press) {
            const dragged = press.width + (event.clientX - press.x) * press.sign;
            table.resizeColumn(column, 'move', Math.max(numbers.MIN_RESIZE_WIDTH, dragged));
        }
    };

    // the browser releases the capture on pointerup and pointercancel, so lostpointercapture ends every drag
    const handlePointerEnd = (column: ColumnProps) => {
        if (press) {
            press = null;
            table.resizeColumn(column, 'stop');
        }
    };

    $effect(() => {
        void columns;
        void table.bodyHasScrollbar;
        const row = rowElement;
        if (row) {
            untrack(() => measure(row));
        }
    });
</script>

<svelte:element this={table.components.header.row} bind:this={rowElement} {...rowAttrs} role="row">
    {#each cells as cell (cell.key)}
        {#snippet titleText()}
            {#if table.parts.headerCell}
                {@render table.parts.headerCell({ column: cell.column, title: cell.column.title, sorter: undefined, filter: undefined, selection: undefined })}
            {:else}
                {cell.column.title ?? ''}
            {/if}
        {/snippet}
        {#snippet sorterNode()}
            <ColumnSorter column={cell.column} showTooltip={!cell.flags.clickToSort && cell.flags.showSortTip} sortOrder={cell.flags.sortOrder} sortsOnClick={Boolean(cell.column.useFullRender) || cell.flags.hasFilter} />
        {/snippet}
        {#snippet filterNode()}
            <ColumnFilter column={cell.column} filteredValue={cell.flags.filteredValue} query={cell.flags.query ?? cell.column} />
        {/snippet}
        {#snippet selectionNode()}
            <ColumnSelection inHeader />
        {/snippet}
        {#snippet title()}
            <span class="{table.prefixCls}-row-head-title" title={cell.titleAttr}>{@render titleText()}</span>
        {/snippet}
        {#snippet th(extra: Partial<TooltipTriggerProps>)}
            <svelte:element this={table.components.header.cell} {...cell.attrs} {...extra}>
                {#if isSelectionColumn(cell.column)}
                    <ColumnSelection inHeader />
                {:else if isExpandedColumn(cell.column)}
                    <span class="{table.prefixCls}-column-expand-title">{locale().locale.expandColumn}</span>
                {:else if !cell.flags.needsTitle}
                    {@render titleText()}
                {:else if cell.column.useFullRender && table.parts.headerCell}
                    {@render table.parts.headerCell({
                        column: cell.column,
                        title: cell.column.title,
                        sorter: cell.flags.hasSorter ? sorterNode : undefined,
                        filter: cell.flags.hasFilter ? filterNode : undefined,
                        selection: selectionNode,
                    })}
                {:else if cell.flags.hasSorter || cell.flags.hasFilter}
                    <div class="{table.prefixCls}-operate-wrapper">
                        {#if cell.flags.hasSorter}
                            <ColumnSorter children={title} column={cell.column} showTooltip={!cell.flags.clickToSort && cell.flags.showSortTip} sortOrder={cell.flags.sortOrder} sortsOnClick={Boolean(cell.column.useFullRender) || cell.flags.hasFilter} />
                        {:else}
                            {@render title()}
                        {/if}
                        {#if cell.flags.hasFilter}
                            {@render filterNode()}
                        {/if}
                    </div>
                {:else}
                    {@render title()}
                {/if}
                {#if cell.resizable}
                    <!-- pointer only (no keyboard column resize); the click stop keeps a drag's final click from sorting -->
                    <span class="{table.prefixCls}-resize-handle" onclick={(event) => event.stopPropagation()} onlostpointercapture={() => handlePointerEnd(cell.column)} onpointerdown={(event) => handlePointerDown(event, cell.column)} onpointermove={(event) => handlePointerMove(event, cell.column)}></span>
                {/if}
            </svelte:element>
        {/snippet}
        {#if cell.sortTip !== undefined}
            <Tooltip>
                {#snippet child({ props })}{@render th(props)}{/snippet}
                {#snippet content()}{cell.sortTip}{/snippet}
            </Tooltip>
        {:else}
            {@render th({})}
        {/if}
    {/each}
</svelte:element>
