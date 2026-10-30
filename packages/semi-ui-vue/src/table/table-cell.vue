<script setup lang="ts">
    import { h, Text, type StyleValue, type VNode } from 'vue';
    import { get } from 'es-toolkit/compat';
    import type { BaseEllipsis } from '@fibrae/semi-foundation/table/foundation';
    import { getRTLAlign, getRTLFlexAlign, isExpandedColumn, isSelectionColumn, shouldShowEllipsisTitle } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import SlotFragment from '../_base/slot-fragment';
    import type { KeyedNode } from '../_base/slot-nodes';
    import ColumnSelection from './column-selection.vue';
    import { useTableContext } from './context';
    import CustomExpandIcon from './custom-expand-icon.vue';
    import type { ColumnProps, TableCellSlotProps, TableComponent } from './interface';
    import { renderExpandIconNode, renderSelectionNode } from './use-table-features';
    import { slotOutput } from './utils';

    type AnyRecord = Record<string, any>;

    interface CellView {
        attrs: Record<string, unknown>;
        indentWidth: number;
        expandIcon: VNode | null;
        /** The output of a #cell slot */
        output: KeyedNode[] | null;
        /** The value shown without a slot */
        text?: string | number;
        inner: 'default' | 'selection' | 'expand' | 'slot';
    }

    const props = defineProps<{
        column: ColumnProps;
        record?: AnyRecord;
        /** The index of the record among its siblings, or of the row in a virtualized body */
        index?: number;
        /** The sticky offset of a left fixed column */
        fixedLeft?: number | false;
        fixedRight?: number | false;
        lastFixedLeft?: boolean;
        firstFixedRight?: boolean;
        /** The columns from this one to the table's end, itself included */
        columnsToEnd?: number;
        /** The tree level the cell content is indented by */
        indent?: number;
        /** The cell shows the expand button of its row before the content */
        showExpandIcon?: boolean;
        /** The expand button of the row, for the first data cell of an expandable row */
        expandIconArgs?: { isNested: boolean; groupKey?: string | number };
        hovered?: boolean;
        isSection?: boolean;
        width?: number;
        height?: number | string;
        component?: TableComponent;
        /** Extra cell attributes of an expanded or section row */
        cellAttrs?: Record<string, unknown>;
    }>();

    const slots = defineSlots<{ default?(): VNode[] }>();

    const table = useTableContext();

    const spanOf = (attrs: Record<string, unknown>, name: 'col' | 'row') => (attrs[`${name}Span`] ?? attrs[`${name}span`]) as number | undefined;

    const textOf = (nodes: KeyedNode[]) => (nodes.every(([node]) => node.type === Text) ? nodes.map(([node]) => String(node.children)).join('') : undefined);

    const cellView = (): CellView | null => {
        const { column, record, index } = props;
        const { direction, prefixCls, splitTable, indentSize } = table.view.value;
        const isRTL = direction === 'rtl';
        const fixedLeft = typeof props.fixedLeft === 'number';
        const fixedRight = typeof props.fixedRight === 'number';

        const position: Record<string, string | undefined> = {};
        if (fixedLeft) {
            position[isRTL ? 'right' : 'left'] = toCssLength(props.fixedLeft as number);
        } else if (fixedRight) {
            position[isRTL ? 'left' : 'right'] = toCssLength(props.fixedRight as number);
        }
        const custom = { ...column.onCell?.(record as AnyRecord, index as number) };
        const { class: customClass, style: customStyle, onClick, ...customAttrs } = custom;
        const { style: extraStyle, ...extraAttrs } = props.cellAttrs ?? {};
        const merged = { ...customAttrs, ...extraAttrs };
        const colSpan = spanOf(merged, 'col');
        const rowSpan = spanOf(merged, 'row');
        if (colSpan === 0 || rowSpan === 0) {
            return null;
        }
        const align = column.align ? { textAlign: getRTLAlign(column.align, direction), justifyContent: getRTLFlexAlign(column.align, direction) } : {};

        const value = column.dataIndex ? get(record, column.dataIndex) : record;
        const indent = props.indent && indentSize ? props.indent : 0;
        const fullRender = Boolean(column.useFullRender);
        const indentNode = indent
            ? h('span', {
                  class: [`${prefixCls}-row-indent`, `indent-level-${indent}`],
                  style: { paddingInlineStart: toCssLength(indentSize * indent) },
              })
            : null;
        const expandIcon = props.expandIconArgs ? renderExpandIconNode(record as AnyRecord, props.expandIconArgs.isNested, props.expandIconArgs.groupKey) : null;
        const inner = isSelectionColumn(column) ? 'selection' : isExpandedColumn(column) ? 'expand' : slots.default ? 'slot' : 'default';
        const slotProps: TableCellSlotProps = {
            text: value,
            record: record as AnyRecord,
            index: index as number,
            column,
            expandIcon,
            isHovering: props.hovered,
            selection: fullRender ? renderSelectionNode(record, false, index) : null,
            indentText: fullRender ? indentNode : null,
        };
        const output = inner === 'default' ? slotOutput(table.resolveColumnSlot('cell', column), slotProps) : null;
        const text = typeof value === 'string' || typeof value === 'number' ? value : undefined;
        const shownText = output ? textOf(output) : text;

        const [isFixedLeft, isFixedLeftLast, isFixedRight, isFixedRightFirst] = isRTL ? [fixedRight, props.firstFixedRight, fixedLeft, props.lastFixedLeft] : [fixedLeft, props.lastFixedLeft, fixedRight, props.firstFixedRight];
        return {
            attrs: {
                class: [
                    column.class,
                    `${prefixCls}-row-cell`,
                    customClass,
                    {
                        [`${prefixCls}-cell-fixed-left`]: isFixedLeft,
                        [`${prefixCls}-cell-fixed-left-last`]: isFixedLeftLast,
                        [`${prefixCls}-cell-fixed-right`]: isFixedRight,
                        [`${prefixCls}-cell-fixed-right-first`]: isFixedRightFirst,
                        [`${prefixCls}-cell-last`]: props.columnsToEnd != null && (colSpan ?? 1) >= props.columnsToEnd,
                        [`${prefixCls}-row-cell-ellipsis`]: Boolean(column.ellipsis),
                    },
                ],
                // a role="none" table no longer gives colspan and rowspan their table meaning
                'aria-colspan': splitTable && colSpan && colSpan > 1 ? colSpan : undefined,
                'aria-rowspan': splitTable && rowSpan && rowSpan > 1 ? rowSpan : undefined,
                // a table, not a grid: the cells have no arrow-key navigation; the role also covers the div cells of a
                // virtualized body
                role: 'cell',
                title: shouldShowEllipsisTitle(column.ellipsis as BaseEllipsis) && typeof shownText === 'string' ? shownText : undefined,
                onClick,
                ...merged,
                style: [position, { width: toCssLength(props.width), height: toCssLength(props.height) }, customStyle as StyleValue, extraStyle as StyleValue, align],
            },
            indentWidth: fullRender ? 0 : indent,
            expandIcon: !fullRender && props.showExpandIcon ? expandIcon : null,
            output,
            text,
            inner,
        };
    };
</script>

<template>
    <template v-for="(cell, cellIndex) in [cellView()]" :key="cellIndex">
        <component :is="props.component ?? 'td'" v-if="cell" v-bind="cell.attrs">
            <component
                :is="props.isSection ? 'div' : SlotFragment"
                v-bind="
                    props.isSection
                        ? {
                              class: `${table.view.value.prefixCls}-section-inner`,
                              style: {
                                  width: table.view.value.anyColumnFixed ? 'var(--semi-table-section-width)' : undefined,
                              },
                          }
                        : {}
                "
            >
                <span v-if="cell.indentWidth" :class="[`${table.view.value.prefixCls}-row-indent`, `indent-level-${cell.indentWidth}`]" :style="{ paddingInlineStart: `${table.view.value.indentSize * cell.indentWidth}px` }" />
                <component :is="cell.expandIcon" v-if="cell.expandIcon" />
                <ColumnSelection v-if="cell.inner === 'selection'" :index="props.index" :record="props.record" />
                <CustomExpandIcon v-else-if="cell.inner === 'expand' && table.view.value.expandIcon !== false && table.rowExpandable(props.record ?? {})" :record="props.record" />
                <slot v-else-if="cell.inner === 'slot'" />
                <template v-else-if="cell.output">
                    <component :is="node" v-for="[node, key] in cell.output" :key="key" />
                </template>
                <template v-else>{{ cell.text }}</template>
            </component>
        </component>
    </template>
</template>
