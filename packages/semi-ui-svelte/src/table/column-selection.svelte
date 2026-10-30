<script lang="ts">
    import TableFoundation from '@fibrae/semi-foundation/table/foundation';
    import Checkbox from '../checkbox/checkbox.svelte';
    import type { CheckboxEvent } from '../checkbox/interface.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getTableContext } from './context.js';
    import type { RowSelectionProps } from './interface.js';

    type AnyRecord = Record<string, any>;

    /** The checkbox of a selection cell: select all in the header, select the row in the body */
    interface ColumnSelectionProps {
        record?: AnyRecord;
        index?: number;
        inHeader?: boolean;
    }

    let { record, index, inHeader = false }: ColumnSelectionProps = $props();

    const table = getTableContext('Table selection');
    const locale = useLocale('Table');

    const selection = $derived(table.rowSelection && typeof table.rowSelection === 'object' ? (table.rowSelection as RowSelectionProps & { selectedRowKeysSet?: Set<string | number> }) : null);
    const recordKey = $derived(TableFoundation.getRecordKey({ rowKey: table.rowKey }, record as AnyRecord));

    const selected = $derived.by(() => {
        const selectedSet = selection?.selectedRowKeysSet ?? new Set<string | number>();
        if (!inHeader) {
            return selectedSet.has(recordKey);
        }
        return TableFoundation.allIsSelected(selectedSet, table.filteredDisabledRowKeysSet, table.filteredSortedRowKeys);
    });

    const indeterminate = $derived(inHeader ? TableFoundation.hasRowSelected(selection?.selectedRowKeys ?? [], table.filteredSortedRowKeysSet) && !selected : selection?.checkRelation === 'related' && table.halfCheckedRowKeysSet.has(recordKey));
    const disabled = $derived(inHeader ? Boolean(selection?.disabled) : false);
    const checkboxProps = $derived(inHeader ? {} : (selection?.getCheckboxProps?.(record as AnyRecord) ?? {}));

    const selectAll = (checked: boolean, event: Pick<Event, 'stopPropagation'>) => table.foundation.handleSelectAllRow(checked, event);

    const selectRow = (checked: boolean, event: Pick<Event, 'stopPropagation'>) => table.foundation.handleSelectRow(recordKey, checked, event);

    const handleChange = (event: CheckboxEvent) => (inHeader ? selectAll : selectRow)(event.target.checked, event);
</script>

<!-- The checkbox is fully controlled: the table state decides, so a rejected change shows the old value -->
{#snippet originNode()}
    <span class={[`${table.prefixCls}-selection-wrap`, { [`${table.prefixCls}-selection-disabled`]: disabled }]}>
        <Checkbox aria-label={inHeader ? locale().locale.selectAllRows : locale().locale.selectRow} {disabled} {...checkboxProps} bind:checked={() => selected, () => {}} {indeterminate} onChange={handleChange} />
    </span>
{/snippet}

{#if selection}
    {#if table.parts.selectionCell}
        {@render table.parts.selectionCell({
            selected,
            record: inHeader ? undefined : record,
            index,
            inHeader,
            disabled: selection.disabled,
            indeterminate,
            originNode,
            ...(inHeader ? { onSelectAll: selectAll } : { onSelectRow: selectRow }),
        })}
    {:else}
        {@render originNode()}
    {/if}
{/if}
