<script lang="ts">
    import { type Snippet, untrack } from 'svelte';
    import { numbers } from '@fibrae/semi-foundation/table/constants';
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { arrayAdd, buildRecordsByKey, expandBtnShouldInRow, flattenBodyRows, getRecordKey, getRowSpanHoverKeys, isDisabled, isExpanded, isSelected, resolveVirtualizedItemSize, type ExpandBtnShouldInRowProps, type FlattenData, type GroupFlattenData } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import VirtualList, { type VirtualListAlign } from '../../_base/virtual-list.svelte';
    import ColGroup from '../col-group.svelte';
    import { getTableContext } from '../context.js';
    import type { ColumnProps, TableVirtualizedScrollArgs } from '../interface.js';
    import TableHeader from '../table-header.svelte';
    import BaseRow from './base-row.svelte';
    import ExpandedRow from './expanded-row.svelte';
    import SectionRow from './section-row.svelte';

    type AnyRecord = Record<string, any>;

    interface BodyProps {
        /** The column tree */
        columns: ColumnProps[];
        /** The records of the current page */
        dataSource: AnyRecord[];
        groups?: Map<BaseRowKeyType, Set<BaseRowKeyType>> | null;
        expandedRowKeys: BaseRowKeyType[];
        pageDisabledRowKeysSet: Set<BaseRowKeyType>;
        /** The rows of a virtualized body */
        virtualizedData: (FlattenData | GroupFlattenData)[];
        /** The header renders inside the body table, since it is not fixed */
        includeHeader: boolean;
        /** The accessible name of the body table, when it is the table */
        tableAttrs?: Record<string, unknown>;
        emptyContent: Snippet;
        onScroll?: (args: TableVirtualizedScrollArgs) => void;
    }

    let { columns, dataSource, groups, expandedRowKeys, pageDisabledRowKeysSet, virtualizedData, includeHeader, tableAttrs, emptyContent, onScroll }: BodyProps = $props();

    const table = getTableContext('Table body');

    let bodyElement = $state<HTMLDivElement>();
    let listElement = $state<HTMLElement>();
    let list = $state<ReturnType<typeof VirtualList>>();
    let hoveredRowKey = $state<BaseRowKeyType | null>(null);
    let highlighted = $state<Set<string>>(new Set());
    let lastScrollTop = 0;
    let frame = 0;

    const expandBtnInRow = $derived(
        expandBtnShouldInRow({
            // the foundation only tests whether it is a function; the content comes from the expandedRow snippet
            expandedRowRender: (table.hasExpandedRow ? () => null : undefined) as ExpandBtnShouldInRowProps['expandedRowRender'],
            dataSource,
            hideExpandedColumn: table.hideExpandedColumn,
            childrenRecordName: table.childrenRecordName,
            rowExpandable: (record) => table.rowExpandable(record ?? {}),
        })
    );

    const recordsByKey = $derived(groups instanceof Map ? buildRecordsByKey(dataSource, table.rowKey) : new Map<BaseRowKeyType, AnyRecord>());

    const bodyRows = $derived(
        flattenBodyRows(
            {
                rowKey: table.rowKey,
                childrenRecordName: table.childrenRecordName,
                expandedRowKeys,
                hasExpandedRow: table.hasExpandedRow,
                keepDOM: table.keepDOM,
                rowExpandable: table.rowExpandable,
            },
            dataSource,
            groups,
            recordsByKey
        )
    );

    // One array for all rows, so a hover does not hand every row new widths
    const rowCellWidths = $derived(table.getCellWidths(table.flattenedColumns));

    const virtualBody = $derived.by(() => {
        if (!table.virtualized) {
            return null;
        }
        const cellWidths = table.getCellWidths(columns);
        if (!cellWidths.length) {
            return null;
        }
        const y = typeof table.scroll?.y === 'number' ? table.scroll.y : numbers.DEFAULT_VIRTUALIZED_BODY_HEIGHT;
        const rowWidth = arrayAdd(cellWidths, 0, columns.length);
        return { rowWidth, height: virtualizedData.length ? y : 0 };
    });

    const groupRecords = (group: Set<BaseRowKeyType>) => [...group].flatMap((key) => recordsByKey.get(key) ?? []);

    /** The props of a record row that depend on the table state */
    const baseRowState = (record: AnyRecord, rowKey: BaseRowKeyType, level: number) => {
        const expandable = table.rowExpandable(record);
        const inRow = expandable || expandBtnInRow;
        const selectedSet = table.rowSelection?.selectedRowKeysSet;
        return {
            rowKey,
            expanded: isExpanded(expandedRowKeys, rowKey),
            expandableRow: inRow ? expandable : undefined,
            level: inRow ? level : undefined,
            clickToExpand: expandable && table.expandRowByClick,
            selected: selectedSet ? isSelected(selectedSet, rowKey) : false,
            disabled: isDisabled(pageDisabledRowKeysSet, rowKey),
            hovered: hoveredRowKey === rowKey,
            highlighted: highlighted.has(String(rowKey)),
            cellWidths: rowCellWidths,
        };
    };

    const recordKey = (record: AnyRecord, index: number) => getRecordKey(record, table.rowKey) ?? index;

    const scrollElement = () => (table.virtualized ? listElement : bodyElement);

    const handleRowHover = (hovered: boolean, rowKey: BaseRowKeyType) => {
        hoveredRowKey = hovered ? rowKey : null;
        if (table.rowSpanHover) {
            highlighted = hovered ? getRowSpanHoverKeys(scrollElement(), String(rowKey)) : new Set();
        }
    };

    const itemSize = (index: number) => {
        const item = virtualizedData[index] as Partial<FlattenData & GroupFlattenData> | undefined;
        return resolveVirtualizedItemSize(table.virtualizedProps?.itemSize, table.size, index, { expandedRow: Boolean(item?.expandedRow), sectionRow: Boolean(item?.sectionRow) }).size;
    };

    const virtualItem = (index: number) => virtualizedData[index] as FlattenData & Partial<GroupFlattenData>;

    const virtualKey = (index: number) => {
        const item = virtualItem(index);
        return item ? `${item.sectionRow ? 'section' : item.expandedRow ? 'expanded' : 'base'}:${item.key}` : index;
    };

    const handleListScroll = (event: Event & { currentTarget: HTMLElement }) => {
        table.handleBodyScroll(event);
        const { scrollTop } = event.currentTarget;
        if (scrollTop !== lastScrollTop) {
            lastScrollTop = scrollTop;
            onScroll?.({ scrollOffset: scrollTop });
        }
    };

    const attachList = (node: HTMLElement) => {
        listElement = node;
        return () => {
            listElement = undefined;
        };
    };

    // the list rebuilds its offsets only when the row count changes; a sort can move a section or expanded row to another index
    $effect(() => {
        void virtualizedData;
        void table.virtualizedProps?.itemSize;
        void table.size;
        untrack(() => list?.measure());
    });

    // with scroll.y the header is a separate table that reserves the width of a vertical scrollbar the body shows
    $effect(() => {
        const node = scrollElement();
        if (!table.scroll?.y || !node) {
            return;
        }
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => table.setBodyHasScrollbar(node.clientWidth < node.offsetWidth));
        });
        observer.observe(node);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    });

    /** The scrolling body element, whose horizontal offset the separate header follows */
    export function element() {
        return scrollElement();
    }

    export function scrollTo(offset: number) {
        if (listElement) {
            listElement.scrollTop = offset;
        }
    }

    export function scrollToItem(index: number, align?: VirtualListAlign) {
        list?.scrollToItem(index, align);
    }

    export function hasList() {
        return list != null;
    }
</script>

{#if table.virtualized}
    {#if virtualBody}
        {@const rowStyle = `width: ${toCssLength(virtualBody.rowWidth)}`}
        <!-- the wrapper's .semi-table class carries the row styles; role none, since its display: table would make Chrome expose a layout table -->
        <VirtualList
            {@attach attachList}
            after={dataSource.length ? undefined : emptyContent}
            bind:this={list}
            class="{table.prefixCls}-body"
            height={virtualBody.height}
            innerAttrs={{ class: `${table.prefixCls}-tbody`, role: 'rowgroup' }}
            itemCount={virtualizedData.length}
            itemKey={virtualKey}
            {itemSize}
            overscan={table.virtualizedProps?.overscanCount}
            style="direction: {table.direction}{virtualizedData.length ? '' : '; height: auto'}"
            tabindex={0}
            wrapperAttrs={{ class: [table.prefixCls, `${table.prefixCls}-fixed`], role: 'none', style: rowStyle }}
            onscroll={handleListScroll}
        >
            {#snippet children({ index, style })}
                {@const item = virtualItem(index)}
                {#if item.sectionRow}
                    <SectionRow expanded={Boolean(item.expanded)} group={item.group as Set<BaseRowKeyType>} groupKey={item.groupKey as BaseRowKeyType} {index} records={groupRecords(item.group as Set<BaseRowKeyType>)} style="{style}; {rowStyle}" />
                {:else if item.expandedRow}
                    <ExpandedRow expanded {index} record={item.record} rowKey={recordKey(item.record, index)} style="{style}; {rowStyle}" virtualIndex={index} />
                {:else}
                    <BaseRow {...baseRowState(item.record, recordKey(item.record, index), item.level)} {index} onHoverChange={handleRowHover} record={item.record} style="{style}; {rowStyle}" />
                {/if}
            {/snippet}
        </VirtualList>
    {/if}
{:else}
    <!-- overflow is auto rather than scroll: with only scroll.y no horizontal scrollbar shows; a focusable scroller lets the keyboard scroll it -->
    <div bind:this={bodyElement} class="{table.prefixCls}-body" style:max-height={toCssLength(table.scroll?.y)} style:overflow={table.anyColumnFixed && dataSource.length ? 'auto' : undefined} tabindex={table.scroll?.y ? 0 : undefined} onmouseleave={() => (highlighted = new Set())} onscroll={table.handleBodyScroll}>
        <!-- a table, not a grid: the cells have no arrow-key navigation; with a separate header the container is the table -->
        <svelte:element this={table.components.body.outer} {...tableAttrs} class={[table.prefixCls, { [`${table.prefixCls}-fixed`]: table.tableLayout === 'fixed' }]} role={table.splitTable ? 'none' : 'table'} style={table.scroll?.x != null ? `width: ${toCssLength(table.scroll.x)}` : undefined}>
            <ColGroup col={table.components.body.colgroup.col} {columns} prefixCls={table.prefixCls} wrapper={table.components.body.colgroup.wrapper} />
            <!-- without a header the fixed columns still need its measured widths for their offsets -->
            {#if includeHeader && (table.showHeader || table.anyColumnFixed)}
                <TableHeader {columns} hidden={!table.showHeader} />
            {/if}
            <!-- under a role="none" table a tbody would be presentational too -->
            <svelte:element this={table.components.body.wrapper} class="{table.prefixCls}-tbody" role={table.splitTable ? 'rowgroup' : undefined}>
                {#each bodyRows as row (`${row.kind}:${row.key}`)}
                    {#if row.kind === 'section'}
                        <SectionRow expanded={row.expanded} group={row.group} groupKey={row.key} index={row.index} records={groupRecords(row.group)} />
                    {:else if row.kind === 'expanded'}
                        <ExpandedRow displayNone={row.displayNone} expanded={row.expanded} index={row.index} record={row.record} rowKey={row.key} />
                    {:else}
                        <BaseRow {...baseRowState(row.record, row.key, row.level)} displayNone={row.displayNone} index={row.index} onHoverChange={handleRowHover} record={row.record} />
                    {/if}
                {/each}
            </svelte:element>
        </svelte:element>
        {#if !dataSource.length}
            {@render emptyContent()}
        {/if}
    </div>
{/if}
