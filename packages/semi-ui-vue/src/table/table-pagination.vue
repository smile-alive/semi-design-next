<script setup lang="ts">
    import { omit } from 'es-toolkit';
    import TableFoundation from '@fibrae/semi-foundation/table/foundation';
    import useLocale from '../locale/use-locale';
    import Pagination from '../pagination';
    import { useTableContext } from './context';
    import type { FormatPageText, TablePaginationProps, TablePaginationSlotProps } from './interface';
    import { slotOutput } from './utils';

    type FoundationPageText = Parameters<typeof TableFoundation.formatPaginationInfo>[2];

    /** Pagination info and Pagination, or the `#pagination` slot */
    defineOptions({ inheritAttrs: false });

    const props = defineProps<{
        /** The pagination state with the page change handler */
        pagination: TablePaginationProps;
        formatPageText: FormatPageText | undefined;
    }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    // Table-only keys: Pagination would put them on its root element
    const paginationProps = () => omit(props.pagination, ['position', 'formatPageText']);

    const custom = () => slotOutput(table.slots.pagination, { pagination: paginationProps() } satisfies TablePaginationSlotProps);

    const info = () => TableFoundation.formatPaginationInfo(props.pagination, locale.value.locale.pageText, props.formatPageText as FoundationPageText);
</script>

<template>
    <div :class="`${table.view.value.prefixCls}-pagination-outer`">
        <template v-for="(nodes, nodesIndex) in [custom()]" :key="nodesIndex">
            <template v-if="nodes">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </template>
            <template v-else>
                <span :class="`${table.view.value.prefixCls}-pagination-info`">{{ info() }}</span>
                <span :class="`${table.view.value.prefixCls}-pagination-wrapper`">
                    <Pagination v-if="(props.pagination.total ?? 0) > 0" v-bind="paginationProps()" />
                </span>
            </template>
        </template>
    </div>
</template>
