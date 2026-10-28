<script setup lang="ts">
    import type { BaseEllipsis } from '@fibrae/semi-foundation/table/foundation';
    import { shouldShowEllipsisTitle } from '@fibrae/semi-foundation/table/utils';
    import SlotFragment from '../_base/slot-fragment';
    import type { KeyedNode } from '../_base/slot-nodes';
    import ColumnFilter from './column-filter.vue';
    import ColumnSorter from './column-sorter.vue';
    import { useTableContext } from './context';
    import type { ColumnProps } from './interface';
    import { columnFlags, filterProps, renderFilterNode, renderSelectionNode, renderSorterNode, sorterProps, type ColumnFlags } from './use-table-features';
    import { slotOutput } from './utils';

    interface TitleView {
        /** The output of a full render title, which replaces the whole composition */
        full: KeyedNode[] | null;
        flags: ColumnFlags;
        title: KeyedNode[] | string | undefined;
        titleAttr: string | undefined;
    }

    /** The title of a sortable, filterable or full render column header: the title, the sort button, the filter button */
    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ column: ColumnProps }>();

    const table = useTableContext();

    const titleView = (): TitleView => {
        const { column } = props;
        const flags = columnFlags(column, table.view.value.queries);
        if (column.useFullRender) {
            const full = slotOutput(table.resolveColumnSlot('title', column), {
                column,
                title: column.title,
                sorter: flags.hasSorter ? renderSorterNode(column, flags) : null,
                filter: flags.hasFilter ? renderFilterNode(column, flags) : null,
                selection: renderSelectionNode(undefined, true),
            });
            if (full) {
                return { full, flags, title: undefined, titleAttr: undefined };
            }
        }
        const title = table.renderTitle(column, {
            column,
            title: column.title,
            sorter: null,
            filter: null,
            selection: null,
        });
        return {
            full: null,
            flags,
            title,
            titleAttr: typeof title === 'string' && shouldShowEllipsisTitle(column.ellipsis as BaseEllipsis) ? title : undefined,
        };
    };

    const operateWrapperAttrs = (flags: ColumnFlags) => (flags.hasSorter || flags.hasFilter ? { class: `${table.view.value.prefixCls}-operate-wrapper` } : {});
</script>

<template>
    <template v-for="(view, viewIndex) in [titleView()]" :key="viewIndex">
        <template v-if="view.full">
            <component :is="node" v-for="[node, key] in view.full" :key="key" />
        </template>
        <component :is="view.flags.hasSorter || view.flags.hasFilter ? 'div' : SlotFragment" v-else v-bind="operateWrapperAttrs(view.flags)">
            <component :is="view.flags.hasSorter ? ColumnSorter : SlotFragment" v-bind="view.flags.hasSorter ? sorterProps(props.column, view.flags) : {}">
                <span :class="`${table.view.value.prefixCls}-row-head-title`" :title="view.titleAttr">
                    <template v-if="typeof view.title === 'string'">{{ view.title }}</template>
                    <template v-else>
                        <component :is="node" v-for="[node, key] in view.title" :key="key" />
                    </template>
                </span>
            </component>
            <ColumnFilter v-if="view.flags.hasFilter" v-bind="filterProps(props.column, view.flags)" />
        </component>
    </template>
</template>
