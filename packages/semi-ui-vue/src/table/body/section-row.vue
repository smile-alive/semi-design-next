<script setup lang="ts">
    import { mergeProps, type CSSProperties } from 'vue';
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { isFixedLeft, isFixedRight } from '@fibrae/semi-foundation/table/utils';
    import { useTableContext } from '../context';
    import type { ColumnProps } from '../interface';
    import TableCell from '../table-cell.vue';
    import { slotOutput } from '../utils';

    type AnyRecord = Record<string, any>;

    const props = defineProps<{
        groupKey: BaseRowKeyType;
        group: Set<BaseRowKeyType>;
        /** The records of the group in the current page */
        records: AnyRecord[];
        /** The index among the groups, or of the row in a virtualized body */
        index: number;
        expanded: boolean;
        style?: CSSProperties;
    }>();

    const table = useTableContext();

    // mergeProps runs the internal click before the one returned by onGroupedRow
    const rowAttrs = () =>
        mergeProps(
            {
                class: [`${table.view.value.prefixCls}-row-section`, { on: props.expanded }],
                style: props.style,
                onClick: handleClick,
            },
            // spread: the HTMLAttributes interface has no index signature, a spread copy does
            { ...table.view.value.onGroupedRow?.({ groupKey: props.groupKey, records: props.records }, props.index) }
        );

    const ariaRowIndex = () => (table.view.value.virtualized ? table.view.value.headerRowCount + props.index + 1 : undefined);

    const sectionColumn = (): ColumnProps => ({
        ...table.view.value.groupSectionColumn?.(props.groupKey, [...props.group]),
    });

    const handleClick = (event: MouseEvent) => {
        if (table.view.value.clickGroupedRowToExpand) {
            table.handleRowExpanded(!props.expanded, props.groupKey, event);
        }
    };
</script>

<template>
    <template v-for="(row, rowIndex) in [rowAttrs()]" :key="rowIndex">
        <component :is="table.view.value.components.body.row" :aria-rowindex="ariaRowIndex()" v-bind="row" :data-row-key="props.groupKey" role="row">
            <template v-for="(column, columnIndex) in [sectionColumn()]" :key="columnIndex">
                <TableCell
                    :cellAttrs="{ colSpan: table.view.value.flattenedColumns.length }"
                    :column="column"
                    :component="table.view.value.components.body.cell"
                    :expandIconArgs="{ isNested: false, groupKey: props.groupKey }"
                    :fixedLeft="isFixedLeft(column) && 0"
                    :fixedRight="isFixedRight(column) && 0"
                    :index="props.index"
                    isSection
                    :record="{ groupKey: props.groupKey, records: props.records }"
                    showExpandIcon
                >
                    <component
                        :is="node"
                        v-for="[node, key] in slotOutput(table.slots.groupSection, {
                            groupKey: props.groupKey,
                            group: [...props.group],
                        }) ?? []"
                        :key="key"
                    />
                </TableCell>
            </template>
        </component>
    </template>
</template>
