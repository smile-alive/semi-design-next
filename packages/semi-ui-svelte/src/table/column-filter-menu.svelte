<script lang="ts" module>
    import type { ColumnProps } from './interface.js';

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
</script>

<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/table/constants';
    import { toggleFilteredValue } from '@fibrae/semi-foundation/table/utils';
    import Button from '../button/button.svelte';
    import Checkbox from '../checkbox/checkbox.svelte';
    import DropdownItem from '../dropdown/dropdown-item.svelte';
    import DropdownMenu from '../dropdown/dropdown-menu.svelte';
    import Dropdown from '../dropdown/dropdown.svelte';
    import type { DropdownTriggerProps } from '../dropdown/interface.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import Radio from '../radio/radio.svelte';
    import Space from '../space/space.svelte';
    import Self from './column-filter-menu.svelte';
    import { getTableContext } from './context.js';
    import type { TableFilter } from './interface.js';

    interface ColumnFilterMenuProps {
        filters: TableFilter[];
        /** The depth of the menu, 0 for the top menu */
        level: number;
        state: FilterMenuState;
    }

    let { filters, level, state: menu }: ColumnFilterMenuProps = $props();

    const table = getTableContext('Table filter menu');
    const locale = useLocale('Table');

    const displayValue = $derived(menu.confirmMode ? (menu.tempFilteredValue ?? []) : menu.filteredValue);

    const toggle = (filter: TableFilter, event?: MouseEvent) => {
        if (event) {
            // keeps the filter dropdown open
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }
        if (menu.confirmMode) {
            menu.setTemp(toggleFilteredValue(menu.tempFilteredValue ?? menu.filteredValue, filter.value, menu.filterMultiple));
        } else {
            menu.select(toggleFilteredValue(menu.filteredValue, filter.value, menu.filterMultiple));
        }
    };

    const hasChildren = (filter: TableFilter) => Array.isArray(filter.children) && filter.children.length > 0;
</script>

<DropdownMenu>
    {#each filters as filter, index (`${level}_${index}`)}
        {#snippet item(extra: Partial<DropdownTriggerProps>)}
            {#if table.parts.filterDropdownItem}
                {@render table.parts.filterDropdownItem({
                    column: menu.column,
                    value: filter.value,
                    text: filter.text,
                    checked: displayValue.includes(filter.value),
                    filteredValue: displayValue,
                    filterMultiple: menu.filterMultiple,
                    level,
                    onChange: (event: MouseEvent) => toggle(filter, event),
                })}
            {:else}
                <DropdownItem {...extra} onclick={(event: MouseEvent) => toggle(filter, event)}>
                    {#if menu.filterMultiple}
                        <Checkbox bind:checked={() => displayValue.includes(filter.value), () => {}}>{filter.text}</Checkbox>
                    {:else}
                        <Radio bind:checked={() => displayValue.includes(filter.value), () => {}}>{filter.text}</Radio>
                    {/if}
                </DropdownItem>
            {/if}
        {/snippet}
        {#if hasChildren(filter)}
            <Dropdown {...menu.filterDropdownProps} class="{cssClasses.PREFIX}-column-filter-dropdown" position="right" trigger="hover">
                {#snippet child({ props })}{@render item(props)}{/snippet}
                {#snippet content()}
                    <Self filters={filter.children ?? []} level={level + 1} state={menu} />
                {/snippet}
            </Dropdown>
        {:else}
            {@render item({})}
        {/if}
    {/each}
    {#if menu.confirmMode && level === 0}
        <div class="{cssClasses.PREFIX}-column-filter-footer">
            <Space>
                <Button size="small" onclick={() => menu.reset()}>{locale().locale.resetFilter}</Button>
                <Button size="small" theme="solid" onclick={() => menu.confirm()}>{locale().locale.confirmFilter}</Button>
            </Space>
        </div>
    {/if}
</DropdownMenu>
