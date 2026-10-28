<script setup lang="ts">
    import type { CSSProperties } from 'vue';
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { arrayAdd } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { useTableContext } from '../context';
    import type { ColumnProps } from '../interface';
    import TableCell from '../table-cell.vue';
    import { slotOutput } from '../utils';

    type AnyRecord = Record<string, any>;

    const props = defineProps<{
        record: AnyRecord;
        index: number;
        rowKey: BaseRowKeyType;
        expanded: boolean;
        displayNone?: boolean;
        /** The index of the row in a virtualized body */
        virtualIndex?: number;
        style?: CSSProperties;
    }>();

    const table = useTableContext();

    const EXPANDED_COLUMN: ColumnProps = {};

    const cellAttrs = (): Record<string, unknown> => {
        const { components, flattenedColumns, virtualized } = table.view.value;
        // a custom cell element cannot span columns, so it takes the row's width
        return components.body.cell === 'td'
            ? { colSpan: flattenedColumns.length }
            : {
                  style: {
                      height: virtualized ? '100%' : undefined,
                      display: 'block',
                      width: toCssLength(arrayAdd(table.getCellWidths(flattenedColumns), 0, flattenedColumns.length)),
                  },
              };
    };

    const ariaRowIndex = () => (props.virtualIndex === undefined ? undefined : table.view.value.headerRowCount + props.virtualIndex + 1);

    const rowClass = () => {
        const { prefixCls } = table.view.value;
        return [`${prefixCls}-row-expand`, `${prefixCls}-row`, { [`${prefixCls}-row-hidden`]: props.displayNone }];
    };
</script>

<template>
    <template v-for="(nodes, nodesIndex) in [slotOutput(table.slots.expandedRow, { record: props.record, index: props.index, expanded: props.expanded })]" :key="nodesIndex">
        <component :is="table.view.value.components.body.row" v-if="nodes" :aria-rowindex="ariaRowIndex()" :class="rowClass()" :data-row-key="`${props.rowKey}-expanded-row`" role="row" :style="props.style">
            <TableCell :cellAttrs="cellAttrs()" :column="EXPANDED_COLUMN" :component="table.view.value.components.body.cell">
                <div :class="`${table.view.value.prefixCls}-expand-inner`" :style="{ width: table.view.value.anyColumnFixed ? 'var(--semi-table-section-width)' : undefined }">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </div>
            </TableCell>
        </component>
    </template>
</template>
