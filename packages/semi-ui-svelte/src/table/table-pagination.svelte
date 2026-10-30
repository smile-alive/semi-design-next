<script lang="ts">
    import { omit } from 'es-toolkit';
    import TableFoundation from '@fibrae/semi-foundation/table/foundation';
    import useLocale from '../locale/use-locale.svelte.js';
    import Pagination from '../pagination/pagination.svelte';
    import { getTableContext } from './context.js';
    import type { FormatPageText, TablePaginationProps } from './interface.js';

    type FoundationPageText = Parameters<typeof TableFoundation.formatPaginationInfo>[2];

    /** Pagination info and Pagination, or the `paginationContent` snippet */
    interface TablePaginationPartProps {
        /** The pagination state with the page change handler */
        pagination: TablePaginationProps;
        formatPageText?: FormatPageText;
    }

    let { pagination, formatPageText }: TablePaginationPartProps = $props();

    const table = getTableContext('Table pagination');
    const locale = useLocale('Table');

    // Table-only keys: Pagination would put them on its root element
    const paginationProps = $derived(omit(pagination, ['position', 'formatPageText', 'currentPage', 'pageSize']));
    const info = $derived(TableFoundation.formatPaginationInfo(pagination, locale().locale.pageText, formatPageText as FoundationPageText));
</script>

<div class="{table.prefixCls}-pagination-outer">
    {#if table.parts.paginationContent}
        {@render table.parts.paginationContent({ pagination: omit(pagination, ['position', 'formatPageText']) })}
    {:else}
        <span class="{table.prefixCls}-pagination-info">{info}</span>
        <span class="{table.prefixCls}-pagination-wrapper">
            {#if (pagination.total ?? 0) > 0}
                <!-- The table's state is the page: the Pagination only reports a change, which onChange applies -->
                <Pagination {...paginationProps} bind:currentPage={() => pagination.currentPage, () => {}} bind:pageSize={() => pagination.pageSize, () => {}} />
            {/if}
        </span>
    {/if}
</div>
