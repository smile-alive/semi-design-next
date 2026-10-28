<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/table/constants';
    import TableFoundation, { type BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
    import { IconChevronRight, IconTreeTriangleRight } from '@fibrae/semi-icons-vue';
    import useLocale from '../locale/use-locale';
    import { useTableContext } from './context';
    import { slotOutput } from './utils';

    type AnyRecord = Record<string, any>;

    /** The expand button of a record row, a tree row or a group section */
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(
        defineProps<{
            record?: AnyRecord;
            /** A tree row: the tree icon */
            isNested?: boolean;
            groupKey?: string | number;
        }>(),
        { record: undefined, isNested: false, groupKey: undefined }
    );

    const table = useTableContext();
    const locale = useLocale('Table');

    const rowKey = computed<BaseRowKeyType>(() => (typeof props.groupKey === 'string' || typeof props.groupKey === 'number' ? props.groupKey : TableFoundation.getRecordKey({ rowKey: table.rowState.value.rowKey }, props.record as AnyRecord)));
    const expanded = computed(() => table.rowState.value.expandedRowKeys.includes(rowKey.value));
    const prefixCls = computed(() => table.view.value.prefixCls);

    const icon = () => slotOutput(table.slots.expandIcon, { expanded: expanded.value });

    // the classes turn the arrow, without an animationend to remove them
    const motionClass = () => `${cssClasses.PREFIX}-expandedIcon-${expanded.value ? 'show' : 'hide'}`;
</script>

<template>
    <button :aria-expanded="expanded" :aria-label="locale.locale.expandRow" :class="`${prefixCls}-expand-icon`" type="button" @click="table.foundation.handleRowExpanded(!expanded, rowKey, $event)">
        <template v-for="(nodes, nodesIndex) in [icon()]" :key="nodesIndex">
            <template v-if="nodes">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </template>
            <IconTreeTriangleRight v-else-if="props.isNested" :class="motionClass()" size="small" />
            <IconChevronRight v-else :class="motionClass()" />
        </template>
    </button>
</template>
