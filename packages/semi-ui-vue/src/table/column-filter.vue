<script setup lang="ts">
    import { shallowRef, watch } from 'vue';
    import { isEqual, omit } from 'es-toolkit';
    import { IconFilter } from '@fibrae/semi-icons-vue';
    import Dropdown from '../dropdown';
    import useLocale from '../locale/use-locale';
    import ColumnFilterMenu, { type FilterMenuState } from './column-filter-menu.vue';
    import { useTableContext } from './context';
    import type { ColumnProps, TableFilterDropdownSlotProps } from './interface';
    import { slotOutput } from './utils';

    /** The filter button of a column header and its Dropdown: the filter menu or the `#filterDropdown` panel */
    defineOptions({ inheritAttrs: false });

    const props = defineProps<{
        /** The header column, whose `Table.Column` slots apply */
        column: ColumnProps;
        /** The filter options: the column's query, or the column itself when it has no dataIndex */
        query: ColumnProps;
        /** The applied value */
        filteredValue: any[] | undefined;
    }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    const pending = shallowRef<any[] | undefined>(undefined);
    const localVisible = shallowRef(false);

    const dataIndex = () => props.column.dataIndex as string;

    const controlled = () => props.query.filterDropdownVisible !== undefined;

    const confirmMode = () => props.query.filterConfirmMode === 'confirm';

    const selfManaged = () => !controlled() && (props.column.filterDropdown === true || confirmMode());

    const visible = () => (controlled() ? props.query.filterDropdownVisible : selfManaged() ? localVisible.value : undefined);

    const tempFilteredValue = () => pending.value ?? props.filteredValue;

    // The menu's open state is reported through onFilterDropdownVisibleChange only, as in React where the internal
    // handler replaces the caller's; bound beside it, Vue would call both, and a submenu would report its own opening
    const dropdownProps = () => omit(props.query.filterDropdownProps ?? {}, ['onVisibleChange', 'onUpdate:visible']);

    const select = (filteredValue: any[]) => table.foundation.handleFilterSelect(dataIndex(), { filteredValue });

    const requestClose = () => {
        if (controlled()) {
            table.foundation.toggleShowFilter(dataIndex(), false);
        } else {
            // the Dropdown does not report a close its owner applies
            handleVisibleChange(false);
        }
    };

    const confirm = (options: { closeDropdown?: boolean; filteredValue?: any[] } = {}) => {
        const next = options.filteredValue || tempFilteredValue();
        if (!isEqual(next, props.filteredValue)) {
            select(next as any[]);
        }
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const clear = (options: { closeDropdown?: boolean } = {}) => {
        pending.value = [];
        select([]);
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const reset = () => {
        pending.value = undefined;
    };

    const handleVisibleChange = (next: boolean) => {
        if (selfManaged()) {
            localVisible.value = next;
        }
        // Discarded on close, not on open: the open is reported only after the popup is measured, and items checked
        // before that would be wiped
        if (!next && confirmMode()) {
            pending.value = undefined;
        }
        // The Dropdown asks before it opens; a menu this component controls reports the opening from open, once
        // the panel is shown, so the callback can reach the panel's elements as with an uncontrolled menu
        if (next && selfManaged()) {
            return;
        }
        table.foundation.toggleShowFilter(dataIndex(), next);
    };

    const handleOpen = () => {
        if (selfManaged()) {
            table.foundation.toggleShowFilter(dataIndex(), true);
        }
    };

    const filtered = () => Array.isArray(props.filteredValue) && props.filteredValue.length > 0;

    const icon = () => slotOutput(table.resolveColumnSlot('filterIcon', props.column), { filtered: filtered(), column: props.column });

    const panel = () => {
        if (props.column.filterDropdown !== true) {
            return null;
        }
        const slotProps: TableFilterDropdownSlotProps = {
            column: props.column,
            filters: props.query.filters,
            tempFilteredValue: tempFilteredValue(),
            onTempFilteredValueChange: (value) => {
                pending.value = value;
            },
            onConfirm: confirm,
            onClear: clear,
            onClose: requestClose,
            onReset: reset,
        };
        return slotOutput(table.resolveColumnSlot('filterDropdown', props.column), slotProps);
    };

    const menuState = (): FilterMenuState => ({
        column: props.column,
        filterMultiple: props.query.filterMultiple ?? true,
        confirmMode: confirmMode(),
        filteredValue: props.filteredValue ?? [],
        tempFilteredValue: tempFilteredValue(),
        filterDropdownProps: dropdownProps(),
        setTemp: (value) => {
            pending.value = value;
        },
        select,
        reset,
        confirm: () => confirm({ closeDropdown: true }),
    });

    watch(
        () => props.filteredValue,
        () => {
            pending.value = undefined;
        }
    );
</script>

<template>
    <Dropdown v-bind="dropdownProps()" :class="`${table.view.value.prefixCls}-column-filter-dropdown`" trigger="click" :visible="visible()" @open="handleOpen" @visibleChange="handleVisibleChange">
        <!-- the name carries the filtered state, which the on class shows only by colour -->
        <button :aria-label="filtered() ? locale.locale.filterColumnActive : locale.locale.filterColumn" :class="[`${table.view.value.prefixCls}-column-filter`, { on: filtered() }]" type="button">
            <template v-for="(nodes, nodesIndex) in [icon()]" :key="nodesIndex">
                <template v-if="nodes">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </template>
                <!-- the zero-width space gives the button a text line box for the icon to align to -->
                <template v-else>&#8203;<IconFilter size="default" /></template>
            </template>
        </button>
        <template #content>
            <template v-for="(nodes, nodesIndex) in [panel()]" :key="nodesIndex">
                <template v-if="nodes">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </template>
                <ColumnFilterMenu v-else-if="props.query.filters?.length" :filters="props.query.filters" :level="0" :state="menuState()" />
            </template>
        </template>
    </Dropdown>
</template>
