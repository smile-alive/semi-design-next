<script lang="ts">
    import { flattenColumns, getColumnsMinWidth } from '@fibrae/semi-foundation/components/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import ColGroup from '../col-group.svelte';
    import { getTableContext } from '../context.js';
    import type { ColumnProps } from '../interface.js';
    import { joinStyles } from '../utils.js';
    import TableHeader from './table-header.svelte';

    interface HeadTableProps {
        columns: ColumnProps[];
        element?: HTMLDivElement;
    }

    let { columns, element = $bindable() }: HeadTableProps = $props();

    const table = getTableContext('Table head');

    const top = $derived(typeof table.sticky === 'object' ? (table.sticky.top ?? 0) : 0);
    const minWidth = $derived(getColumnsMinWidth(flattenColumns(columns)));
</script>

<div
    bind:this={element}
    class={[`${table.prefixCls}-header`, { [`${table.prefixCls}-header-sticky`]: Boolean(table.sticky), [`${table.prefixCls}-header-hidden`]: !table.showHeader }]}
    inert={!table.showHeader}
    style={joinStyles(table.bodyHasScrollbar && 'overflow-y: scroll', `top: ${toCssLength(top)}`)}
    onscroll={table.handleBodyScroll}
>
    <svelte:element this={table.components.header.outer} class={[table.prefixCls, { [`${table.prefixCls}-fixed`]: table.tableLayout === 'fixed' }]} role="none" style={joinStyles(table.scroll?.x != null && `width: ${toCssLength(table.scroll.x)}`, minWidth !== undefined && `min-width: ${toCssLength(minWidth)}`)}>
        <ColGroup {columns} prefixCls={table.prefixCls} />
        <TableHeader {columns} />
    </svelte:element>
</div>
