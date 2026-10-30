<script lang="ts">
    import { isEqual } from 'es-toolkit';
    import { IconFilter } from '@fibrae/semi-icons-svelte';
    import watch from '../_base/watch.svelte.js';
    import Dropdown from '../dropdown/dropdown.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import ColumnFilterMenu, { type FilterMenuState } from './column-filter-menu.svelte';
    import { getTableContext } from './context.js';
    import type { ColumnProps } from './interface.js';

    /** The filter button of a column header and its Dropdown: the filter menu or the `filterDropdown` panel */
    interface ColumnFilterProps {
        column: ColumnProps;
        /** The filter options: the column's query, or the column itself when it has no dataIndex */
        query: ColumnProps;
        /** The applied value */
        filteredValue?: any[];
    }

    let { column, query, filteredValue }: ColumnFilterProps = $props();

    const table = getTableContext('Table filter');
    const locale = useLocale('Table');

    let pending = $state<any[] | undefined>(undefined);
    let localVisible = $state(false);

    const dataIndex = $derived(column.dataIndex as string);
    const controlled = $derived(query.filterDropdownVisible !== undefined);
    const confirmMode = $derived(query.filterConfirmMode === 'confirm');
    const selfManaged = $derived(!controlled && (column.filterDropdown === true || confirmMode));
    const visible = $derived(controlled ? query.filterDropdownVisible : selfManaged ? localVisible : undefined);
    const tempFilteredValue = $derived(pending ?? filteredValue);
    const filtered = $derived(Array.isArray(filteredValue) && filteredValue.length > 0);

    const select = (next?: any[]) => table.foundation.handleFilterSelect(dataIndex, { filteredValue: next });

    const requestClose = () => {
        if (controlled) {
            table.foundation.toggleShowFilter(dataIndex, false);
        } else {
            // the Dropdown does not report a close its owner applies
            handleVisibleChange(false);
        }
    };

    const confirm = (options: { closeDropdown?: boolean; filteredValue?: any[] } = {}) => {
        const next = options.filteredValue || tempFilteredValue;
        if (!isEqual(next, filteredValue)) {
            select(next);
        }
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const clear = (options: { closeDropdown?: boolean } = {}) => {
        pending = [];
        select([]);
        if (options.closeDropdown) {
            requestClose();
        }
    };

    const reset = () => {
        pending = undefined;
    };

    const handleVisibleChange = (next: boolean) => {
        if (selfManaged) {
            localVisible = next;
        }
        // Discarded on close, not on open: the open is reported only after the popup is measured, and items checked
        // before that would be wiped
        if (!next && confirmMode) {
            pending = undefined;
        }
        // a menu this component controls reports the opening from onOpen, once the panel is shown
        if (next && selfManaged) {
            return;
        }
        table.foundation.toggleShowFilter(dataIndex, next);
    };

    const menuState = $derived<FilterMenuState>({
        column,
        filterMultiple: query.filterMultiple ?? true,
        confirmMode,
        filteredValue: filteredValue ?? [],
        tempFilteredValue,
        filterDropdownProps: query.filterDropdownProps,
        setTemp: (value) => {
            pending = value;
        },
        select,
        reset,
        confirm: () => confirm({ closeDropdown: true }),
    });

    const handleOpen = () => {
        if (selfManaged) {
            table.foundation.toggleShowFilter(dataIndex, true);
        }
    };

    watch(
        () => filteredValue,
        () => {
            pending = undefined;
        }
    );
</script>

<Dropdown {...query.filterDropdownProps} bind:visible={() => visible, () => {}} class="{table.prefixCls}-column-filter-dropdown" onOpen={handleOpen} onVisibleChange={handleVisibleChange} trigger="click">
    {#snippet child({ props })}
        <!-- the name carries the filtered state, which the on class shows only by colour -->
        <button {...props} aria-label={filtered ? locale().locale.filterColumnActive : locale().locale.filterColumn} class={[props.class, `${table.prefixCls}-column-filter`, { on: filtered }]} type="button">
            {#if table.parts.filterIcon}
                {@render table.parts.filterIcon({ filtered, column })}
            {:else}
                <!-- the zero-width space gives the button a text line box for the icon to align to -->
                &#8203;<IconFilter size="default" />
            {/if}
        </button>
    {/snippet}
    {#snippet content()}
        {#if column.filterDropdown === true && table.parts.filterDropdown}
            {@render table.parts.filterDropdown({
                column,
                filters: query.filters,
                tempFilteredValue,
                onTempFilteredValueChange: (value) => {
                    pending = value;
                },
                onConfirm: confirm,
                onClear: clear,
                onClose: requestClose,
                onReset: reset,
            })}
        {:else if query.filters?.length}
            <ColumnFilterMenu filters={query.filters} level={0} state={menuState} />
        {/if}
    {/snippet}
</Dropdown>
