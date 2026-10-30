<script lang="ts">
    import type { Snippet } from 'svelte';
    import { get } from 'es-toolkit/compat';
    import type { BaseEllipsis } from '@fibrae/semi-foundation/table/foundation';
    import { getRTLAlign, getRTLFlexAlign, isExpandedColumn, isSelectionColumn, shouldShowEllipsisTitle } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import ColumnSelection from './column-selection.svelte';
    import { getTableContext } from './context.js';
    import CustomExpandIcon from './custom-expand-icon.svelte';
    import type { ColumnProps, TableCellAttrs } from './interface.js';
    import { joinStyles } from './utils.js';

    type AnyRecord = Record<string, any>;

    interface TableCellProps {
        column: ColumnProps;
        record?: AnyRecord;
        /** The index of the record among its siblings, or of the row in a virtualized body */
        index?: number;
        /** The sticky offset of a left fixed column */
        fixedLeft?: number | false;
        fixedRight?: number | false;
        lastFixedLeft?: boolean;
        firstFixedRight?: boolean;
        /** The columns from this one to the table's end, itself included */
        columnsToEnd?: number;
        /** The tree level the cell content is indented by */
        indent?: number;
        /** The cell shows the expand button of its row before the content */
        showExpandIcon?: boolean;
        /** The expand button of the row, for the first data cell of an expandable row */
        expandIconArgs?: { isNested: boolean; groupKey?: string | number };
        hovered?: boolean;
        isSection?: boolean;
        width?: number;
        tag?: string;
        /** Extra cell attributes of an expanded or section row */
        cellAttrs?: TableCellAttrs;
        /** The content of an expanded or section row's cell */
        children?: Snippet;
    }

    let { column, record, index, fixedLeft, fixedRight, lastFixedLeft = false, firstFixedRight = false, columnsToEnd, indent, showExpandIcon = false, expandIconArgs, hovered = false, isSection = false, width, tag = 'td', cellAttrs, children }: TableCellProps = $props();

    const table = getTableContext('Table cell');

    const custom = $derived({ ...column.onCell?.(record as AnyRecord, index as number), ...cellAttrs });
    const colSpan = $derived(custom.colspan);
    const rowSpan = $derived(custom.rowspan);
    const isRTL = $derived(table.direction === 'rtl');
    const isFixedLeft = $derived(typeof fixedLeft === 'number');
    const isFixedRight = $derived(typeof fixedRight === 'number');
    const value = $derived(column.dataIndex ? get(record, column.dataIndex) : record);
    const indentLevel = $derived(indent && table.indentSize ? indent : 0);
    const fullRender = $derived(Boolean(column.useFullRender));
    const inner = $derived(isSelectionColumn(column) ? 'selection' : isExpandedColumn(column) ? 'expand' : children ? 'children' : 'default');
    const text = $derived(typeof value === 'string' || typeof value === 'number' ? value : undefined);

    const position = $derived.by(() => {
        if (isFixedLeft) {
            return `${isRTL ? 'right' : 'left'}: ${toCssLength(fixedLeft as number)}`;
        }
        return isFixedRight ? `${isRTL ? 'left' : 'right'}: ${toCssLength(fixedRight as number)}` : undefined;
    });

    const align = $derived(column.align ? `text-align: ${getRTLAlign(column.align, table.direction)}; justify-content: ${getRTLFlexAlign(column.align, table.direction)}` : undefined);

    const attrs = $derived.by(() => {
        const { class: customClass, style: customStyle, colspan, rowspan, ...rest } = custom;
        const [left, leftLast, right, rightFirst] = isRTL ? [isFixedRight, firstFixedRight, isFixedLeft, lastFixedLeft] : [isFixedLeft, lastFixedLeft, isFixedRight, firstFixedRight];
        return {
            ...rest,
            colspan,
            rowspan,
            class: [
                column.class,
                `${table.prefixCls}-row-cell`,
                customClass,
                {
                    [`${table.prefixCls}-cell-fixed-left`]: left,
                    [`${table.prefixCls}-cell-fixed-left-last`]: leftLast,
                    [`${table.prefixCls}-cell-fixed-right`]: right,
                    [`${table.prefixCls}-cell-fixed-right-first`]: rightFirst,
                    [`${table.prefixCls}-cell-last`]: columnsToEnd != null && (colspan ?? 1) >= columnsToEnd,
                    [`${table.prefixCls}-row-cell-ellipsis`]: Boolean(column.ellipsis),
                },
            ],
            // a role="none" table no longer gives colspan and rowspan their table meaning
            'aria-colspan': table.splitTable && colspan && colspan > 1 ? colspan : undefined,
            'aria-rowspan': table.splitTable && rowspan && rowspan > 1 ? rowspan : undefined,
            // a table, not a grid: the cells have no arrow-key navigation; the role also covers the div cells of a
            // virtualized body
            role: 'cell',
            title: shouldShowEllipsisTitle(column.ellipsis as BaseEllipsis) && inner === 'default' && !table.parts.cell && typeof text === 'string' ? text : undefined,
            style: joinStyles(position, width != null && `width: ${toCssLength(width)}`, customStyle as string | undefined, align),
        };
    });
</script>

{#snippet indentNode()}
    {#if indentLevel}
        <span class={[`${table.prefixCls}-row-indent`, `indent-level-${indentLevel}`]} style="padding-inline-start: {table.indentSize * indentLevel}px"></span>
    {/if}
{/snippet}

{#snippet expandIconNode()}
    {#if expandIconArgs}
        <CustomExpandIcon groupKey={expandIconArgs.groupKey} isNested={expandIconArgs.isNested} {record} />
    {/if}
{/snippet}

{#snippet selectionNode()}
    <ColumnSelection {index} {record} />
{/snippet}

{#snippet content()}
    {#if !fullRender}
        {@render indentNode()}
        {#if showExpandIcon}{@render expandIconNode()}{/if}
    {/if}
    {#if inner === 'selection'}
        <ColumnSelection {index} {record} />
    {:else if inner === 'expand'}
        {#if table.showExpandIcon && table.rowExpandable(record ?? {})}
            <CustomExpandIcon {record} />
        {/if}
    {:else if inner === 'children'}
        {@render children?.()}
    {:else if table.parts.cell}
        {@render table.parts.cell({
            text: value,
            record: record as AnyRecord,
            index: index as number,
            column,
            expandIcon: expandIconArgs ? expandIconNode : undefined,
            isHovering: hovered,
            selection: fullRender ? selectionNode : undefined,
            indentText: fullRender && indentLevel ? indentNode : undefined,
        })}
    {:else}
        {text ?? ''}
    {/if}
{/snippet}

{#if colSpan !== 0 && rowSpan !== 0}
    <svelte:element this={tag} {...attrs}>
        {#if isSection}
            <div class="{table.prefixCls}-section-inner" style={table.anyColumnFixed ? 'width: var(--semi-table-section-width)' : undefined}>
                {@render content()}
            </div>
        {:else}
            {@render content()}
        {/if}
    </svelte:element>
{/if}
