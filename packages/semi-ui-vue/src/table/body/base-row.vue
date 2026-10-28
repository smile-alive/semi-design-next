<script setup lang="ts">
    import { mergeProps, type CSSProperties } from 'vue';
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { arrayAdd, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isInnerColumnKey, isLastLeftFixed } from '@fibrae/semi-foundation/table/utils';
    import { useTableContext } from '../context';
    import type { ColumnProps } from '../interface';
    import TableCell from '../table-cell.vue';

    type AnyRecord = Record<string, any>;

    interface RowCell {
        column: ColumnProps;
        /** The column is the expand column and this row has no button: an empty cell keeps the layout */
        empty: boolean;
        indent?: number;
        showExpandIcon: boolean;
        expandIcon: boolean;
        fixedLeft: number | false;
        fixedRight: number | false;
        lastFixedLeft: boolean;
        firstFixedRight: boolean;
        columnsToEnd: number;
        width?: number;
    }

    const props = defineProps<{
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
        style?: CSSProperties;
    }>();

    const emit = defineEmits<{ hoverChange: [hovered: boolean, rowKey: BaseRowKeyType] }>();

    const table = useTableContext();

    const EMPTY_COLUMN: ColumnProps = {};

    const cells = (): RowCell[] => {
        const { flattenedColumns: columns, hideExpandedColumn, expandIcon, virtualized } = table.view.value;
        const expandable = table.rowExpandable(props.record);
        // the first data column gets the indent and the expand button; the built-in columns may sit anywhere
        const firstIndex = Math.max(
            0,
            columns.findIndex((column) => column.key == null || !isInnerColumnKey(column.key))
        );
        return columns.flatMap((column, columnIndex): RowCell[] => {
            const first = columnIndex === firstIndex;
            let indent: number | undefined;
            if (props.level != null && first) {
                indent = !props.expandableRow && hideExpandedColumn && expandIcon !== false ? props.level + 1 : props.level;
            }
            const empty = isExpandedColumn(column) && !expandable;
            return [
                {
                    column: empty ? EMPTY_COLUMN : column,
                    empty,
                    indent: empty ? undefined : indent,
                    showExpandIcon: Boolean(props.expandableRow && first && hideExpandedColumn && expandIcon !== false),
                    expandIcon: Boolean(props.expandableRow && first),
                    fixedLeft: !empty && isFixedLeft(column) && arrayAdd(props.cellWidths, 0, columnIndex),
                    fixedRight: !empty && isFixedRight(column) && arrayAdd(props.cellWidths, columnIndex + 1),
                    lastFixedLeft: !empty && isLastLeftFixed(columns, column),
                    firstFixedRight: !empty && isFirstFixedRight(columns, column),
                    columnsToEnd: columns.length - columnIndex,
                    width: virtualized && !empty ? props.cellWidths[columnIndex] : undefined,
                },
            ];
        });
    };

    const handleMouseEnter = (event: MouseEvent) => {
        emit('hoverChange', true, props.rowKey);
        table.emitRowEvent('rowMouseEnter', props.record, event);
    };

    const handleMouseLeave = (event: MouseEvent) => {
        emit('hoverChange', false, props.rowKey);
        table.emitRowEvent('rowMouseLeave', props.record, event);
    };

    const handleDoubleClick = (event: MouseEvent) => {
        table.emitRowEvent('rowDoubleClick', props.record, event);
    };

    const handleContextMenu = (event: MouseEvent) => {
        table.emitRowEvent('rowContextMenu', props.record, event);
    };

    // The onRow click runs between expanding and selecting, so it cannot be merged after the internal handler.
    const handleClick = (event: PointerEvent, listener?: (event: PointerEvent) => void) => {
        if (props.clickToExpand) {
            table.handleRowExpanded(!props.expanded, props.rowKey, event);
        }
        listener?.(event);
        if (!props.disabled) {
            table.handleRowSelection(props.rowKey, !props.selected, event);
        }
    };

    // mergeProps runs the internal listeners before the ones returned by onRow
    const rowAttrs = () => {
        const { onClick, ...rest } = {
            ...table.view.value.onRow?.(props.record, props.index, {
                disabled: Boolean(props.disabled),
                selected: Boolean(props.selected),
            }),
        };
        const { prefixCls, virtualized, headerRowCount } = table.view.value;
        return mergeProps(
            {
                class: [
                    `${prefixCls}-row`,
                    {
                        [`${prefixCls}-row-selected`]: props.selected,
                        [`${prefixCls}-row-expanded`]: props.expanded,
                        [`${prefixCls}-row-hovered`]: props.hovered || props.highlighted,
                        [`${prefixCls}-row-hidden`]: props.displayNone,
                    },
                ],
                style: props.style,
                // only a virtualized body leaves rows out of the DOM; its rows count after the header rows of the same table
                'aria-rowindex': virtualized ? headerRowCount + props.index + 1 : undefined,
                onClick: (event: PointerEvent) => handleClick(event, onClick),
                onMouseenter: handleMouseEnter,
                onMouseleave: handleMouseLeave,
                onDblclick: handleDoubleClick,
                onContextmenu: handleContextMenu,
            },
            rest,
            // the row-span hover finds rows by data-row-key, and the grid semantics need the row role
            { 'data-row-key': props.rowKey, role: 'row' }
        );
    };
</script>

<template>
    <template v-for="(row, rowIndex) in [rowAttrs()]" :key="rowIndex">
        <component :is="table.view.value.components.body.row" v-bind="row">
            <template v-for="(cell, columnIndex) in cells()" :key="columnIndex">
                <TableCell v-if="cell.empty" :column="cell.column" />
                <TableCell
                    v-else
                    :column="cell.column"
                    :columnsToEnd="cell.columnsToEnd"
                    :component="table.view.value.components.body.cell"
                    :expandIconArgs="cell.expandIcon ? { isNested: true } : undefined"
                    :firstFixedRight="cell.firstFixedRight"
                    :fixedLeft="cell.fixedLeft"
                    :fixedRight="cell.fixedRight"
                    :hovered="props.hovered"
                    :indent="cell.indent"
                    :index="props.index"
                    :lastFixedLeft="cell.lastFixedLeft"
                    :record="props.record"
                    :showExpandIcon="cell.showExpandIcon"
                    :width="cell.width"
                />
            </template>
        </component>
    </template>
</template>
