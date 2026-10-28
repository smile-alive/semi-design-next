<script setup lang="ts">
    import { computed, h, type VNode } from 'vue';
    import TableFoundation, { type BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import type { KeyedNode } from '../_base/slot-nodes';
    import Checkbox, { type CheckboxEvent } from '../checkbox';
    import useLocale from '../locale/use-locale';
    import { useTableContext } from './context';
    import type { RowSelectionProps, TableSelectionCellSlotProps } from './interface';
    import { slotOutput } from './utils';

    type AnyRecord = Record<string, any>;
    type StateRowSelection = RowSelectionProps & { selectedRowKeysSet?: Set<BaseRowKeyType> };

    /** The checkbox of a selection cell: select all in the header, select the row in the body */
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<{ record?: AnyRecord; index?: number; inHeader?: boolean }>(), {
        record: undefined,
        index: undefined,
        inHeader: false,
    });

    const table = useTableContext();
    const locale = useLocale('Table');

    const EMPTY_KEYS = new Set<BaseRowKeyType>();

    const rowSelection = computed(() => {
        const selection = table.rowState.value.rowSelection;
        return selection && typeof selection === 'object' ? (selection as StateRowSelection) : null;
    });

    const prefixCls = computed(() => table.view.value.prefixCls);
    const recordKey = computed(() => TableFoundation.getRecordKey({ rowKey: table.rowState.value.rowKey }, props.record as AnyRecord));

    const selected = computed(() => {
        const selectedSet = rowSelection.value?.selectedRowKeysSet ?? EMPTY_KEYS;
        if (!props.inHeader) {
            return selectedSet.has(recordKey.value);
        }
        const { filteredDisabledRowKeysSet, filteredSortedRowKeys } = table.rowState.value;
        return TableFoundation.allIsSelected(selectedSet, filteredDisabledRowKeysSet, filteredSortedRowKeys);
    });

    const indeterminate = computed(() => {
        const { filteredSortedRowKeysSet, halfCheckedRowKeysSet } = table.rowState.value;
        if (props.inHeader) {
            const selectedKeys = rowSelection.value?.selectedRowKeys ?? [];
            return TableFoundation.hasRowSelected(selectedKeys, filteredSortedRowKeysSet) && !selected.value;
        }
        return rowSelection.value?.checkRelation === 'related' && halfCheckedRowKeysSet.has(recordKey.value);
    });

    const selectAll = (checked: boolean, event: Event) => table.foundation.handleSelectAllRow(checked, event);

    const selectRow = (checked: boolean, event: Event) => table.foundation.handleSelectRow(recordKey.value, checked, event);

    /** The default checkbox, built once: the `#selectionCell` slot gets it as originNode and it is the fallback */
    const cellView = (selection: StateRowSelection): { originNode: VNode; output: KeyedNode[] | null } => {
        const prefix = prefixCls.value;
        const disabled = props.inHeader ? Boolean(selection.disabled) : false;
        const originNode = h('span', { class: [`${prefix}-selection-wrap`, { [`${prefix}-selection-disabled`]: disabled }] }, [
            h(Checkbox, {
                'aria-label': props.inHeader ? locale.value.locale.selectAllRows : locale.value.locale.selectRow,
                disabled,
                indeterminate: indeterminate.value,
                modelValue: selected.value,
                onChange: (event: CheckboxEvent) => (props.inHeader ? selectAll : selectRow)(event.target.checked, event as unknown as Event),
                ...(props.inHeader ? {} : selection.getCheckboxProps?.(props.record as AnyRecord)),
            }),
        ]);
        const slotProps: TableSelectionCellSlotProps = {
            selected: selected.value,
            record: props.inHeader ? undefined : props.record,
            index: props.index,
            inHeader: props.inHeader,
            disabled: selection.disabled,
            indeterminate: indeterminate.value,
            originNode,
            ...(props.inHeader ? { onSelectAll: selectAll } : { onSelectRow: selectRow }),
        };
        return { originNode, output: slotOutput(table.slots.selectionCell, slotProps) };
    };
</script>

<template>
    <template v-if="rowSelection">
        <template v-for="(cell, cellIndex) in [cellView(rowSelection)]" :key="cellIndex">
            <template v-if="cell.output">
                <component :is="node" v-for="[node, key] in cell.output" :key="key" />
            </template>
            <component :is="cell.originNode" v-else />
        </template>
    </template>
</template>
