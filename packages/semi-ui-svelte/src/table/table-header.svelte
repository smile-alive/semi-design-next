<script lang="ts">
    import { parseHeaderRows } from '@fibrae/semi-foundation/table/utils';
    import { getTableContext } from './context.js';
    import type { ColumnProps } from './interface.js';
    import TableHeaderRow from './table-header-row.svelte';

    interface TableHeaderProps {
        columns: ColumnProps[];
        /** Rendered only to measure the column widths of fixed columns: no height, and inert */
        hidden?: boolean;
    }

    let { columns, hidden = false }: TableHeaderProps = $props();

    const table = getTableContext('Table header');

    const rows = $derived(parseHeaderRows(columns));
</script>

<svelte:element this={table.components.header.wrapper} class={[`${table.prefixCls}-thead`, { [`${table.prefixCls}-thead-hidden`]: hidden }]} inert={hidden || undefined} role={table.splitTable ? 'rowgroup' : undefined}>
    {#each rows as row, index (index)}
        <TableHeaderRow {columns} {index} {row} />
    {/each}
</svelte:element>
