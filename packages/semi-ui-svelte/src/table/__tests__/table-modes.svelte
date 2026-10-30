<script lang="ts">
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import Table from '../table.svelte';
    import { getColumns, getData } from './helpers';

    type Keys = BaseRowKeyType[] | undefined;

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { keys: Keys; accept: boolean; log: string[] } } = $props();

    const columns = getColumns();
    const dataSource = getData();
    const onExpandedRowsChange = (rows: Record<string, any>[]) => store.log.push(`change ${rows.map((row) => row.key).join()}`);
</script>

{#snippet expandedRow({ record }: { record: Record<string, any> })}
    <p class="detail">{record.name}</p>
{/snippet}

{#if mode === 'bind'}
    <Table bind:expandedRowKeys={store.keys} {columns} {dataSource} {expandedRow} {onExpandedRowsChange} pagination={false} />
{:else if mode === 'function'}
    <Table
        bind:expandedRowKeys={
            () => store.keys,
            (keys) => {
                store.log.push(`set ${keys?.join()}`);
                if (store.accept) store.keys = keys;
            }
        }
        {columns}
        {dataSource}
        {expandedRow}
        {onExpandedRowsChange}
        pagination={false}
    />
{:else if mode === 'one-way'}
    <Table {columns} {dataSource} {expandedRow} expandedRowKeys={store.keys} {onExpandedRowsChange} pagination={false} />
{:else}
    <Table {columns} {dataSource} {expandedRow} {onExpandedRowsChange} pagination={false} />
{/if}
