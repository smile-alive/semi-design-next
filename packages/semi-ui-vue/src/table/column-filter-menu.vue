<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/table/constants';
    import { toggleFilteredValue } from '@fibrae/semi-foundation/table/utils';
    import SlotFragment from '../_base/slot-fragment';
    import Button from '../button';
    import Checkbox from '../checkbox';
    import Dropdown, { DropdownItem, DropdownMenu } from '../dropdown';
    import useLocale from '../locale/use-locale';
    import Radio from '../radio';
    import Space from '../space';
    import { useTableContext } from './context';
    import type { ColumnProps, TableFilter, TableFilterDropdownItemSlotProps } from './interface';
    import { slotOutput } from './utils';

    /** What every level of one column's filter menu shares */
    export interface FilterMenuState {
        column: ColumnProps;
        filterMultiple: boolean;
        confirmMode: boolean;
        filteredValue: any[];
        /** The value picked and not applied yet, in confirm mode */
        tempFilteredValue?: any[];
        filterDropdownProps: ColumnProps['filterDropdownProps'];
        setTemp: (value: any[]) => void;
        select: (value: any[]) => void;
        reset: () => void;
        confirm: () => void;
    }

    defineOptions({ name: 'ColumnFilterMenu', inheritAttrs: false });

    const props = defineProps<{
        filters: TableFilter[];
        /** The depth of the menu, 0 for the top menu */
        level: number;
        state: FilterMenuState;
    }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    const displayValue = () => (props.state.confirmMode ? (props.state.tempFilteredValue ?? []) : props.state.filteredValue);

    const toggle = (filter: TableFilter, event?: MouseEvent) => {
        if (event) {
            // keeps the filter dropdown open
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }
        const { state } = props;
        if (state.confirmMode) {
            state.setTemp(toggleFilteredValue(state.tempFilteredValue ?? state.filteredValue, filter.value, state.filterMultiple));
        } else {
            state.select(toggleFilteredValue(state.filteredValue, filter.value, state.filterMultiple));
        }
    };

    const itemOutput = (filter: TableFilter) => {
        const filteredValue = displayValue();
        const slotProps: TableFilterDropdownItemSlotProps = {
            column: props.state.column,
            value: filter.value,
            text: filter.text,
            checked: filteredValue.includes(filter.value),
            filteredValue,
            filterMultiple: props.state.filterMultiple,
            level: props.level,
            onChange: (event: MouseEvent) => toggle(filter, event),
        };
        return slotOutput(table.resolveColumnSlot('filterDropdownItem', props.state.column), slotProps);
    };

    const hasChildren = (filter: TableFilter) => Array.isArray(filter.children) && filter.children.length > 0;
</script>

<template>
    <DropdownMenu>
        <component
            :is="hasChildren(filter) ? Dropdown : SlotFragment"
            v-for="(filter, index) in props.filters"
            :key="`${props.level}_${index}`"
            v-bind="
                hasChildren(filter)
                    ? {
                          ...props.state.filterDropdownProps,
                          class: `${cssClasses.PREFIX}-column-filter-dropdown`,
                          position: 'right',
                          trigger: 'hover',
                      }
                    : {}
            "
        >
            <template v-for="(nodes, nodesIndex) in [itemOutput(filter)]" :key="nodesIndex">
                <template v-if="nodes">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </template>
                <DropdownItem v-else @click="toggle(filter, $event)">
                    <Checkbox v-if="props.state.filterMultiple" :modelValue="displayValue().includes(filter.value)">
                        {{ filter.text }}
                    </Checkbox>
                    <Radio v-else :modelValue="displayValue().includes(filter.value)">{{ filter.text }}</Radio>
                </DropdownItem>
            </template>
            <template #content>
                <ColumnFilterMenu :filters="filter.children ?? []" :level="props.level + 1" :state="props.state" />
            </template>
        </component>
        <div v-if="props.state.confirmMode && props.level === 0" :class="`${cssClasses.PREFIX}-column-filter-footer`">
            <Space>
                <Button size="small" @click="props.state.reset()">{{ locale.locale.resetFilter }}</Button>
                <Button size="small" theme="solid" @click="props.state.confirm()">
                    {{ locale.locale.confirmFilter }}
                </Button>
            </Space>
        </div>
    </DropdownMenu>
</template>
