<script lang="ts">
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { isFixedLeft, isFixedRight } from '@fibrae/semi-foundation/table/utils';
    import { getTableContext } from '../context.js';
    import type { ColumnProps } from '../interface.js';
    import TableCell from '../table-cell.svelte';
    import { joinStyles } from '../utils.js';

    type AnyRecord = Record<string, any>;

    interface SectionRowProps {
        groupKey: BaseRowKeyType;
        group: Set<BaseRowKeyType>;
        /** The records of the group in the current page */
        records: AnyRecord[];
        /** The index among the groups, or of the row in a virtualized body */
        index: number;
        expanded: boolean;
        style?: string;
    }

    let { groupKey, group, records, index, expanded, style }: SectionRowProps = $props();

    const table = getTableContext('Table section row');

    const custom = $derived({ ...table.parts.onGroupedRow?.({ groupKey, records }, index) });
    const column = $derived<ColumnProps>({ ...table.parts.groupSectionColumn?.(groupKey, [...group]) });

    const attrs = $derived.by(() => {
        const { onclick: _click, class: customClass, style: customStyle, ...rest } = custom;
        return { rest, customClass, customStyle };
    });

    // the internal click runs before the one returned by onGroupedRow
    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLElement }) => {
        if (table.clickGroupedRowToExpand) {
            table.foundation.handleRowExpanded(!expanded, groupKey, event);
        }
        custom.onclick?.(event);
    };
</script>

<svelte:element
    this={table.components.body.row}
    {...attrs.rest}
    aria-rowindex={table.virtualized ? table.headerRowCount + index + 1 : undefined}
    class={[`${table.prefixCls}-row-section`, attrs.customClass, { on: expanded }]}
    data-row-key={groupKey}
    role="row"
    style={joinStyles(style, attrs.customStyle as string | undefined)}
    onclick={handleClick}
>
    <TableCell cellAttrs={{ colspan: table.flattenedColumns.length }} {column} expandIconArgs={{ isNested: false, groupKey }} fixedLeft={isFixedLeft(column) && 0} fixedRight={isFixedRight(column) && 0} {index} isSection record={{ groupKey, records }} showExpandIcon tag={table.components.body.cell}>
        {@render table.parts.groupSection?.({ groupKey, group: [...group] })}
    </TableCell>
</svelte:element>
