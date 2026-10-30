<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/table/constants';
    import TableFoundation from '@fibrae/semi-foundation/table/foundation';
    import { IconChevronRight, IconTreeTriangleRight } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getTableContext } from './context.js';

    type AnyRecord = Record<string, any>;

    /** The expand button of a record row, a tree row or a group section */
    interface CustomExpandIconProps {
        record?: AnyRecord;
        /** A tree row: the tree icon */
        isNested?: boolean;
        groupKey?: string | number;
    }

    let { record, isNested = false, groupKey }: CustomExpandIconProps = $props();

    const table = getTableContext('Table expand button');
    const locale = useLocale('Table');

    const rowKey = $derived(typeof groupKey === 'string' || typeof groupKey === 'number' ? groupKey : TableFoundation.getRecordKey({ rowKey: table.rowKey }, record as AnyRecord));
    const expanded = $derived(table.expandedRowKeys.includes(rowKey));

    // the classes turn the arrow, without an animationend to remove them
    const motionClass = $derived(`${cssClasses.PREFIX}-expandedIcon-${expanded ? 'show' : 'hide'}`);
</script>

<button aria-expanded={expanded} aria-label={locale().locale.expandRow} class="{table.prefixCls}-expand-icon" type="button" onclick={(event) => table.foundation.handleRowExpanded(!expanded, rowKey, event)}>
    {#if table.parts.expandIcon}
        {@render table.parts.expandIcon({ expanded })}
    {:else if isNested}
        <IconTreeTriangleRight class={motionClass} size="small" />
    {:else}
        <IconChevronRight class={motionClass} />
    {/if}
</button>
