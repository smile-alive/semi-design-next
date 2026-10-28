<script setup lang="ts">
    import type { VNode } from 'vue';
    import { strings } from '@fibrae/semi-foundation/table/constants';
    import { getNextSortOrder } from '@fibrae/semi-foundation/table/utils';
    import { IconCaretdown, IconCaretup } from '@fibrae/semi-icons-vue';
    import SlotFragment from '../_base/slot-fragment';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip';
    import { useTableContext } from './context';
    import type { ColumnProps, SortOrder } from './interface';
    import { slotOutput } from './utils';

    /**
     * The sort button of a column header: named by the column title, with the sort state as aria-sort on the header cell.
     * When the whole header cell sorts, the click handler sits on the cell and the button's click reaches it by bubbling.
     */
    defineOptions({ inheritAttrs: false });

    const props = defineProps<{
        column: ColumnProps;
        sortOrder: SortOrder;
        showTooltip: boolean;
        /** The button sorts on click itself, since the header cell does not */
        sortsOnClick: boolean;
    }>();

    const slots = defineSlots<{ default?(): VNode[] }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    // slotted content names the button itself; only a plain string title can stand in as its label
    const buttonLabel = () => (slots.default || typeof props.column.title !== 'string' ? undefined : props.column.title);

    const icon = () =>
        slotOutput(table.resolveColumnSlot('sortIcon', props.column), {
            sortOrder: props.sortOrder,
            column: props.column,
        });

    const handleClick = () => {
        if (props.sortsOnClick) {
            table.foundation.handleSort(props.column);
        }
    };
</script>

<template>
    <component :is="props.showTooltip ? Tooltip : SlotFragment">
        <template #content>{{ locale.locale[getNextSortOrder(props.sortOrder)] }}</template>
        <button :aria-label="buttonLabel()" :class="`${table.view.value.prefixCls}-column-sorter-wrapper`" type="button" @click="handleClick">
            <slot />
            <template v-for="(nodes, nodesIndex) in [icon()]" :key="nodesIndex">
                <template v-if="nodes">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </template>
                <span v-else aria-hidden="true" :class="`${table.view.value.prefixCls}-column-sorter`">
                    <span :class="[`${table.view.value.prefixCls}-column-sorter-up`, { on: props.sortOrder === strings.SORT_DIRECTIONS[0] }]">
                        <IconCaretup size="default" />
                    </span>
                    <span :class="[`${table.view.value.prefixCls}-column-sorter-down`, { on: props.sortOrder === strings.SORT_DIRECTIONS[1] }]">
                        <IconCaretdown size="default" />
                    </span>
                </span>
            </template>
        </button>
    </component>
</template>
