<script setup lang="ts">
    import { onMounted, useTemplateRef, watch, type StyleValue } from 'vue';
    import { strings } from '@fibrae/semi-foundation/table/constants';
    import { getColumnsByLevel, getHeaderStickyOffset, getNextSortOrder, getRTLAlign, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isLastLeftFixed, isSelectionColumn, sliceColumnsByLevel, type TableHeaderCell } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import SlotFragment from '../_base/slot-fragment';
    import type { KeyedNode } from '../_base/slot-nodes';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import ColumnSelection from './column-selection.vue';
    import ColumnTitle from './column-title.vue';
    import { useTableContext } from './context';
    import type { ColumnProps, TableRowAttrs } from './interface';
    import { columnFlags } from './use-table-features';
    import { toElement } from './utils';

    interface HeaderCellView {
        key: string | number;
        column: ColumnProps;
        attrs: Record<string, unknown>;
        sortTip: string | undefined;
        /** Sorting, filtering or full render: ColumnTitle composes the title */
        needsTitle: boolean;
        title: KeyedNode[] | string | undefined;
    }

    const props = defineProps<{
        row: TableHeaderCell<ColumnProps>[];
        /** The header row index, the level of its columns */
        index: number;
        /** The column tree */
        columns: ColumnProps[];
    }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    // <component :is> renders the configured header row, a component or a tag, so vue-tsc cannot infer the ref.
    const rowRef = useTemplateRef<unknown>('row');

    const ARIA_SORT: Record<string, 'ascending' | 'descending'> = {
        [strings.SORT_DIRECTIONS[0]]: 'ascending',
        [strings.SORT_DIRECTIONS[1]]: 'descending',
    };

    const spanOf = (attrs: Record<string, unknown>, name: 'col' | 'row') => (attrs[`${name}Span`] ?? attrs[`${name}span`]) as number | undefined;

    const headerCells = (): HeaderCellView[] => {
        const { direction, headerStyle, prefixCls, splitTable, components, queries } = table.view.value;
        const isRTL = direction === 'rtl';
        const slicedColumns = sliceColumnsByLevel(props.columns, props.index) as ColumnProps[];
        const headWidths = table.getCellWidths(slicedColumns);
        const HeaderCell = components.header.cell;

        return props.row.flatMap(({ column, ...cell }, cellIndex): HeaderCellView[] => {
            const custom = { ...column.onHeaderCell?.(column, cellIndex, props.index) };
            const { class: customClass, style: customStyle, onClick, ...customAttrs } = custom;
            const flags = columnFlags(column, queries);
            const textAlign = column.align ? getRTLAlign(column.align, direction) : undefined;

            const [fixedLeft, fixedRight, fixedLeftLast, fixedRightFirst] = isRTL
                ? [isFixedRight(column), isFixedLeft(column), isFirstFixedRight(slicedColumns, column), isLastLeftFixed(slicedColumns, column)]
                : [isFixedLeft(column), isFixedRight(column), isLastLeftFixed(slicedColumns, column), isFirstFixedRight(slicedColumns, column)];
            const stickyOffset = getHeaderStickyOffset(column, slicedColumns, headWidths, isRTL);
            const sticky: Record<string, string | undefined> = stickyOffset ? { position: 'sticky', [stickyOffset.side]: toCssLength(stickyOffset.offset) } : {};

            const attrs: Record<string, unknown> = {
                title: flags.needsTitle ? undefined : cell.title,
                colSpan: cell.colSpan,
                rowSpan: cell.rowSpan,
                // only a header cell component reads `resize`; on a plain th it would land on the DOM
                ...(typeof HeaderCell === 'string' ? {} : { resize: column.resize }),
                ...customAttrs,
            };
            const colSpan = spanOf(attrs, 'col');
            const rowSpan = spanOf(attrs, 'row');
            if (colSpan === 0 || rowSpan === 0) {
                return [];
            }

            const showSortTip = flags.clickToSort && flags.showSortTip;
            return [
                {
                    key: column.key ?? column.dataIndex ?? cellIndex,
                    column,
                    attrs: {
                        ...attrs,
                        class: [
                            `${prefixCls}-row-head`,
                            column.class,
                            customClass,
                            {
                                [`${prefixCls}-align-${textAlign}`]: Boolean(textAlign),
                                [`${prefixCls}-cell-fixed-left`]: fixedLeft,
                                [`${prefixCls}-cell-fixed-left-last`]: fixedLeftLast,
                                [`${prefixCls}-cell-fixed-right`]: fixedRight,
                                [`${prefixCls}-cell-fixed-right-first`]: fixedRightFirst,
                                [`${prefixCls}-cell-last`]: Boolean(cell.last),
                                [`${prefixCls}-row-head-ellipsis`]: Boolean(column.ellipsis),
                                [`${prefixCls}-row-head-clickSort`]: flags.clickToSort,
                            },
                        ],
                        style: [headerStyle, customStyle as StyleValue, { textAlign }, sticky],

                        // a role="none" table no longer gives colspan and rowspan their table meaning
                        'aria-colspan': splitTable && colSpan && colSpan > 1 ? colSpan : undefined,
                        'aria-rowspan': splitTable && rowSpan && rowSpan > 1 ? rowSpan : undefined,
                        'aria-sort': column.sorter && typeof flags.sortOrder === 'string' ? ARIA_SORT[flags.sortOrder] : undefined,
                        role: 'columnheader',
                        // the sorter inside is the Tab stop; the sort Tooltip would add 0 here
                        tabindex: showSortTip ? -1 : undefined,
                        onClick:
                            flags.clickToSort || onClick
                                ? (event: MouseEvent) => {
                                      (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
                                      if (flags.clickToSort) {
                                          table.foundation.handleSort(column);
                                      }
                                  }
                                : undefined,
                    },

                    sortTip: showSortTip ? locale.value.locale[getNextSortOrder(flags.sortOrder)] : undefined,
                    needsTitle: flags.needsTitle,
                    title:
                        isSelectionColumn(column) || isExpandedColumn(column) || flags.needsTitle
                            ? undefined
                            : table.renderTitle(column, {
                                  column,
                                  title: column.title,
                                  sorter: null,
                                  filter: null,
                                  selection: null,
                              }),
                },
            ];
        });
    };

    const rowAttrs = () => {
        const { style: _style, ...custom }: TableRowAttrs = {
            ...table.view.value.onHeaderRow?.(props.columns, props.index),
        };
        return { ...custom, class: [custom.class, `${table.view.value.prefixCls}-row`] };
    };

    // The measured widths give the sticky offsets of fixed columns. Measured when the columns change, not on every
    // render, since reading layout after a DOM update forces a reflow; the cells of this row are the columns at its level
    const measure = () => {
        const node = toElement(rowRef.value);
        if (!node) {
            return;
        }
        const levelColumns = getColumnsByLevel(props.columns, props.index) as ColumnProps[];
        const heads = node.querySelectorAll(`.${table.view.value.prefixCls}-row-head`);
        table.setHeadWidths(
            Array.from(heads, (head, headIndex) => {
                const configWidth = levelColumns[headIndex]?.width;
                return {
                    width: typeof configWidth === 'number' ? configWidth : head.getBoundingClientRect().width || 0,
                    key: levelColumns[headIndex]?.key as string,
                };
            }),
            props.index
        );
    };

    onMounted(() => {
        measure();
        watch([() => props.columns, () => table.view.value.bodyHasScrollbar], measure, { flush: 'post' });
    });
</script>

<template>
    <component :is="table.view.value.components.header.row" ref="row" role="row" v-bind="rowAttrs()">
        <component :is="cell.sortTip === undefined ? SlotFragment : Tooltip" v-for="cell in headerCells()" :key="cell.key">
            <template #content>{{ cell.sortTip }}</template>
            <component :is="table.view.value.components.header.cell" v-bind="cell.attrs">
                <ColumnSelection v-if="isSelectionColumn(cell.column)" inHeader />
                <span v-else-if="isExpandedColumn(cell.column)" :class="`${table.view.value.prefixCls}-column-expand-title`">{{ locale.locale.expandColumn }}</span>
                <ColumnTitle v-else-if="cell.needsTitle" :column="cell.column" />
                <template v-else-if="typeof cell.title === 'string'">{{ cell.title }}</template>
                <template v-else>
                    <component :is="node" v-for="[node, key] in cell.title" :key="key" />
                </template>
            </component>
        </component>
    </component>
</template>
