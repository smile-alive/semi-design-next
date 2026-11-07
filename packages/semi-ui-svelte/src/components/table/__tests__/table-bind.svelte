<script lang="ts">
    import type { TableProps } from '../interface';
    import Table from '../table.svelte';

    let { store }: { store: { props: TableProps; selectedRowKeys?: (string | number)[]; currentPage?: number } } = $props();
</script>

<Table {...store.props} bind:currentPage={store.currentPage} bind:selectedRowKeys={store.selectedRowKeys} />
