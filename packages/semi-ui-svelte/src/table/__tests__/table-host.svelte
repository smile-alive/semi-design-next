<script lang="ts">
    import type { TableProps } from '../interface';
    import Table from '../table.svelte';

    type SnippetName = 'cell' | 'headerCell' | 'title' | 'footer' | 'empty' | 'expandedRow' | 'groupSection' | 'filterDropdown' | 'selectionCell' | 'sortIcon' | 'filterIcon' | 'expandIcon' | 'paginationContent';

    let { store }: { store: { props: TableProps; snippets?: SnippetName[]; wrapperStyle?: string } } = $props();

    let table = $state<ReturnType<typeof Table>>();

    // a listed name picks the fixture snippet below; otherwise the prop passes through, e.g. one from createRawSnippet
    const pick = <K extends SnippetName>(name: K, fixture: TableProps[K]) => (store.snippets?.includes(name) ? fixture : store.props[name]);

    export function handle() {
        return table;
    }
</script>

{#snippet cell({ text, column, record }: Parameters<NonNullable<TableProps['cell']>>[0])}
    {#if column.dataIndex === 'name'}<b class="custom-cell">{record.name}!</b>{:else}{text}{/if}
{/snippet}

{#snippet headerCell({ column, title }: Parameters<NonNullable<TableProps['headerCell']>>[0])}
    {#if column.dataIndex === 'age'}<i class="custom-head">{title} (years)</i>{:else}{title}{/if}
{/snippet}

{#snippet title({ pageData }: { pageData: Record<string, any>[] })}
    <span class="custom-title">Title {pageData.length}</span>
{/snippet}

{#snippet footer({ pageData }: { pageData: Record<string, any>[] })}
    <span class="custom-footer">Footer {pageData.length}</span>
{/snippet}

{#snippet empty()}
    <span class="custom-empty">Nothing here</span>
{/snippet}

{#snippet expandedRow({ record }: Parameters<NonNullable<TableProps['expandedRow']>>[0])}
    <p class="custom-expanded">Detail {record.name}</p>
{/snippet}

{#snippet groupSection({ groupKey, group }: Parameters<NonNullable<TableProps['groupSection']>>[0])}
    <strong class="custom-group">{groupKey}: {group.length}</strong>
{/snippet}

{#snippet filterDropdown({ onConfirm, onClear }: Parameters<NonNullable<TableProps['filterDropdown']>>[0])}
    <div class="custom-filter">
        <button class="custom-filter-apply" type="button" onclick={() => onConfirm({ filteredValue: ['Lisa'], closeDropdown: true })}>apply</button>
        <button class="custom-filter-clear" type="button" onclick={() => onClear({ closeDropdown: true })}>clear</button>
    </div>
{/snippet}

{#snippet selectionCell({ selected, inHeader, originNode }: Parameters<NonNullable<TableProps['selectionCell']>>[0])}
    <span class="custom-selection" data-header={String(inHeader)} data-selected={String(selected)}>{@render originNode()}</span>
{/snippet}

{#snippet sortIcon({ sortOrder }: Parameters<NonNullable<TableProps['sortIcon']>>[0])}
    <span class="custom-sort-icon">{String(sortOrder)}</span>
{/snippet}

{#snippet filterIcon({ filtered }: Parameters<NonNullable<TableProps['filterIcon']>>[0])}
    <span class="custom-filter-icon">{filtered ? 'on' : 'off'}</span>
{/snippet}

{#snippet expandIcon({ expanded }: { expanded: boolean })}
    <span class="custom-expand-icon">{expanded ? '-' : '+'}</span>
{/snippet}

{#snippet paginationContent({ pagination }: Parameters<NonNullable<TableProps['paginationContent']>>[0])}
    <span class="custom-pagination">page {pagination.currentPage} of {pagination.total}</span>
{/snippet}

{#snippet tableNode()}
    <Table
        bind:this={table}
        {...store.props}
        cell={pick('cell', cell)}
        empty={pick('empty', empty)}
        expandIcon={pick('expandIcon', expandIcon)}
        expandedRow={pick('expandedRow', expandedRow)}
        filterDropdown={pick('filterDropdown', filterDropdown)}
        filterIcon={pick('filterIcon', filterIcon)}
        footer={pick('footer', footer)}
        groupSection={pick('groupSection', groupSection)}
        headerCell={pick('headerCell', headerCell)}
        paginationContent={pick('paginationContent', paginationContent)}
        selectionCell={pick('selectionCell', selectionCell)}
        sortIcon={pick('sortIcon', sortIcon)}
        title={pick('title', title)}
    />
{/snippet}

{#if store.wrapperStyle}
    <div style={store.wrapperStyle}>{@render tableNode()}</div>
{:else}
    {@render tableNode()}
{/if}
