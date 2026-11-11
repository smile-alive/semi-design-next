<script setup lang="ts">
    import { shouldShowEllipsisTitle } from '@fibrae/semi-foundation/components/table/utils';
    import { SlotFragment } from '../../../base/index';
    import type { KeyedNode } from '../../../utils/index';
    import useLocale from '../../locale/use-locale';
    import ColumnFilter from '../column-filter.vue';
    import ColumnSorter from '../column-sorter.vue';
    import { useTableContext } from '../context';
    import type { ColumnProps } from '../interface';
    import { columnFlags, filterProps, renderFilterNode, renderSelectionNode, renderSorterNode, sorterProps, type ColumnFlags } from '../use-table-features';
    import { slotOutput } from '../utils';

    interface TitleView {
        full: KeyedNode[] | null;
        flags: ColumnFlags;
        title?: KeyedNode[] | string;
        titleAttr?: string;
        untitled: boolean;
    }

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ column: ColumnProps }>();

    const table = useTableContext();
    const locale = useLocale('Table');

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
                return { full, flags, title: undefined, titleAttr: undefined, untitled: false };
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
            titleAttr: typeof title === 'string' && shouldShowEllipsisTitle(column.ellipsis!) ? title : undefined,
            untitled: title == null || title === '',
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
                <span v-if="!view.untitled" :class="`${table.view.value.prefixCls}-row-head-title`" :title="view.titleAttr">
                    <template v-if="typeof view.title === 'string'">{{ view.title }}</template>
                    <template v-else>
                        <component :is="node" v-for="[node, key] in view.title" :key="key" />
                    </template>
                </span>
            </component>
            <ColumnFilter v-if="view.flags.hasFilter" v-bind="filterProps(props.column, view.flags)" />
        </component>
        <!-- a header cell needs text of its own (axe empty-table-header), even when the column has no title -->
        <span v-if="view.untitled" :class="`${table.view.value.prefixCls}-column-untitled`">{{ locale.locale.untitledColumn }}</span>
    </template>
</template>
