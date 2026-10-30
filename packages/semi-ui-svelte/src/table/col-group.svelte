<script lang="ts">
    import { flattenColumns } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import type { ColumnProps } from './interface.js';

    interface ColGroupProps {
        columns: ColumnProps[];
        prefixCls: string;
        wrapper?: string;
        col?: string;
    }

    let { columns, prefixCls, wrapper = 'colgroup', col = 'col' }: ColGroupProps = $props();

    const leafColumns = $derived(flattenColumns(columns) as ColumnProps[]);
</script>

<svelte:element this={wrapper} class="{prefixCls}-colgroup">
    {#each leafColumns as column, index (column.key ?? column.dataIndex ?? index)}
        <svelte:element this={col} class={[`${prefixCls}-col`, column.class]} style={column.width ? `width: ${toCssLength(column.width)}; min-width: ${toCssLength(column.width)}` : undefined}></svelte:element>
    {/each}
</svelte:element>
