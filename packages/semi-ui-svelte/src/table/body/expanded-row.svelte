<script lang="ts">
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { arrayAdd } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { getTableContext } from '../context.js';
    import type { ColumnProps, TableCellAttrs } from '../interface.js';
    import TableCell from '../table-cell.svelte';

    type AnyRecord = Record<string, any>;

    interface ExpandedRowProps {
        record: AnyRecord;
        index: number;
        rowKey: BaseRowKeyType;
        expanded: boolean;
        displayNone?: boolean;
        /** The index of the row in a virtualized body */
        virtualIndex?: number;
        style?: string;
    }

    let { record, index, rowKey, expanded, displayNone = false, virtualIndex, style }: ExpandedRowProps = $props();

    const table = getTableContext('Table expanded row');

    const EXPANDED_COLUMN: ColumnProps = {};

    // a custom cell element cannot span columns, so it takes the row's width
    const cellAttrs = $derived<TableCellAttrs>(
        table.components.body.cell === 'td'
            ? { colspan: table.flattenedColumns.length }
            : {
                  style: `${table.virtualized ? 'height: 100%;' : ''}display: block; width: ${toCssLength(arrayAdd(table.getCellWidths(table.flattenedColumns), 0, table.flattenedColumns.length))}`,
              }
    );
</script>

{#if table.parts.expandedRow}
    <svelte:element
        this={table.components.body.row}
        aria-rowindex={virtualIndex === undefined ? undefined : table.headerRowCount + virtualIndex + 1}
        class={[`${table.prefixCls}-row-expand`, `${table.prefixCls}-row`, { [`${table.prefixCls}-row-hidden`]: displayNone }]}
        data-row-key="{rowKey}-expanded-row"
        role="row"
        {style}
    >
        <TableCell {cellAttrs} column={EXPANDED_COLUMN} tag={table.components.body.cell}>
            <div class="{table.prefixCls}-expand-inner" style={table.anyColumnFixed ? 'width: var(--semi-table-section-width)' : undefined}>
                {@render table.parts.expandedRow({ record, index, expanded })}
            </div>
        </TableCell>
    </svelte:element>
{/if}
