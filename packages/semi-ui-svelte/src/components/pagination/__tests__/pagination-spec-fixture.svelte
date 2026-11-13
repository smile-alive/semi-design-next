<script lang="ts">
    import type { PaginationSpecProps } from '@test/specs/pagination';
    import { Pagination } from '../index';

    let { store }: { store: PaginationSpecProps } = $props();

    // Svelte has no `defaultCurrentPage`: the spec's default is the binding's initial value and its controlled value
    // goes through a function binding whose setter keeps the page for the uncontrolled case
    // svelte-ignore state_referenced_locally
    let chosen = $state<number | undefined>(store.defaultCurrentPage);
</script>

<Pagination
    {...store.attrs}
    bind:currentPage={
        () => (store.currentPage === undefined ? chosen : store.currentPage),
        (page) => {
            chosen = page;
        }
    }
    disabled={store.disabled}
    hideOnSinglePage={store.hideOnSinglePage}
    hoverShowPageSelect={store.hoverShowPageSelect}
    onChange={store.onChange}
    onPageChange={store.onPageChange}
    onPageSizeChange={store.onPageSizeChange}
    pageSize={store.pageSize}
    pageSizeOpts={store.pageSizeOpts}
    preventPageChangeOnPageSizeChange={store.preventPageChangeOnPageSizeChange}
    showQuickJumper={store.showQuickJumper}
    showSizeChanger={store.showSizeChanger}
    showTotal={store.showTotal}
    size={store.size}
    total={store.total}
/>
