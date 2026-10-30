<script lang="ts">
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { arrayAdd, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isInnerColumnKey, isLastLeftFixed } from '@fibrae/semi-foundation/table/utils';
    import { getTableContext } from '../context.js';
    import type { ColumnProps } from '../interface.js';
    import TableCell from '../table-cell.svelte';
    import { joinStyles } from '../utils.js';

    type AnyRecord = Record<string, any>;
    type RowMouseEvent = MouseEvent & { currentTarget: EventTarget & HTMLElement };

    interface BaseRowProps {
        record: AnyRecord;
        /** The index among its siblings, or of the row in a virtualized body */
        index: number;
        rowKey: BaseRowKeyType;
        /** The tree level, given when the row or its table has expand buttons */
        level?: number;
        expanded?: boolean;
        /** The row has an expand button */
        expandableRow?: boolean;
        /** A click on the row toggles its expansion */
        clickToExpand?: boolean;
        selected?: boolean;
        disabled?: boolean;
        hovered?: boolean;
        /** Highlighted with a hovered row its rowSpan cell covers */
        highlighted?: boolean;
        displayNone?: boolean;
        cellWidths: number[];
        style?: string;
        onHoverChange: (hovered: boolean, rowKey: BaseRowKeyType) => void;
    }

    let { record, index, rowKey, level, expanded = false, expandableRow = false, clickToExpand = false, selected = false, disabled = false, hovered = false, highlighted = false, displayNone = false, cellWidths, style, onHoverChange }: BaseRowProps = $props();

    const table = getTableContext('Table row');

    const EMPTY_COLUMN: ColumnProps = {};

    const cells = $derived.by(() => {
        const columns = table.flattenedColumns;
        const expandable = table.rowExpandable(record);
        // the first data column gets the indent and the expand button; the built-in columns may sit anywhere
        const firstIndex = Math.max(
            0,
            columns.findIndex((column) => column.key == null || !isInnerColumnKey(column.key))
        );
        return columns.map((column, columnIndex) => {
            const first = columnIndex === firstIndex;
            let indent: number | undefined;
            if (level != null && first) {
                indent = !expandableRow && table.hideExpandedColumn && table.showExpandIcon ? level + 1 : level;
            }
            const empty = isExpandedColumn(column) && !expandable;
            return {
                column: empty ? EMPTY_COLUMN : column,
                empty,
                indent: empty ? undefined : indent,
                showExpandIcon: expandableRow && first && table.hideExpandedColumn && table.showExpandIcon,
                expandIcon: expandableRow && first,
                fixedLeft: !empty && isFixedLeft(column) && arrayAdd(cellWidths, 0, columnIndex),
                fixedRight: !empty && isFixedRight(column) && arrayAdd(cellWidths, columnIndex + 1),
                lastFixedLeft: !empty && isLastLeftFixed(columns, column),
                firstFixedRight: !empty && isFirstFixedRight(columns, column),
                columnsToEnd: columns.length - columnIndex,
                width: table.virtualized && !empty ? cellWidths[columnIndex] : undefined,
            };
        });
    });

    const custom = $derived({ ...table.parts.onRow?.(record, index, { disabled, selected }) });

    const attrs = $derived.by(() => {
        const { onclick: _click, onmouseenter: _enter, onmouseleave: _leave, ondblclick: _dbl, oncontextmenu: _menu, class: customClass, style: customStyle, ...rest } = custom;
        return { rest, customClass, customStyle };
    });

    const handleMouseEnter = (event: RowMouseEvent) => {
        onHoverChange(true, rowKey);
        table.emitRowEvent('onRowMouseEnter', record, event);
        custom.onmouseenter?.(event);
    };

    const handleMouseLeave = (event: RowMouseEvent) => {
        onHoverChange(false, rowKey);
        table.emitRowEvent('onRowMouseLeave', record, event);
        custom.onmouseleave?.(event);
    };

    const handleDoubleClick = (event: RowMouseEvent) => {
        table.emitRowEvent('onRowDoubleClick', record, event);
        custom.ondblclick?.(event);
    };

    const handleContextMenu = (event: RowMouseEvent) => {
        table.emitRowEvent('onRowContextMenu', record, event);
        custom.oncontextmenu?.(event);
    };

    // The onRow click runs between expanding and selecting
    const handleClick = (event: RowMouseEvent) => {
        if (clickToExpand) {
            table.foundation.handleRowExpanded(!expanded, rowKey, event);
        }
        custom.onclick?.(event);
        if (!disabled) {
            table.foundation.handleRowClickSelection(rowKey, !selected, event);
        }
    };
</script>

<!-- the row-span hover finds rows by data-row-key; a click only adds pointer shortcuts, the cells hold the controls -->
<svelte:element
    this={table.components.body.row}
    {...attrs.rest}
    aria-rowindex={table.virtualized ? table.headerRowCount + index + 1 : undefined}
    class={[
        `${table.prefixCls}-row`,
        attrs.customClass,
        {
            [`${table.prefixCls}-row-selected`]: selected,
            [`${table.prefixCls}-row-expanded`]: expanded,
            [`${table.prefixCls}-row-hovered`]: hovered || highlighted,
            [`${table.prefixCls}-row-hidden`]: displayNone,
        },
    ]}
    data-row-key={rowKey}
    role="row"
    style={joinStyles(style, attrs.customStyle as string | undefined)}
    onclick={handleClick}
    oncontextmenu={handleContextMenu}
    ondblclick={handleDoubleClick}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
>
    {#each cells as cell, columnIndex (columnIndex)}
        {#if cell.empty}
            <TableCell column={cell.column} tag={table.components.body.cell} />
        {:else}
            <TableCell
                column={cell.column}
                columnsToEnd={cell.columnsToEnd}
                expandIconArgs={cell.expandIcon ? { isNested: true } : undefined}
                firstFixedRight={cell.firstFixedRight}
                fixedLeft={cell.fixedLeft}
                fixedRight={cell.fixedRight}
                {hovered}
                indent={cell.indent}
                {index}
                lastFixedLeft={cell.lastFixedLeft}
                {record}
                showExpandIcon={cell.showExpandIcon}
                tag={table.components.body.cell}
                width={cell.width}
            />
        {/if}
    {/each}
</svelte:element>
