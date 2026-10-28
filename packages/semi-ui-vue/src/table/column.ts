import { defineComponent, type SetupContext, type SlotsType } from 'vue';
import type { ColumnProps, TableColumnSlots } from './interface';

// Every column field is a runtime prop except `key`, which Vue reserves for the vnode key that names the column. Table
// collects the raw vnode props, which the declaration does not change; the Record type fails the type check when
// ColumnProps gains or loses a field.
const columnFields: Record<Exclude<keyof ColumnProps, 'key'>, true> = {
    align: true,
    children: true,
    class: true,
    colSpan: true,
    dataIndex: true,
    defaultFilteredValue: true,
    defaultSortOrder: true,
    ellipsis: true,
    filterChildrenRecord: true,
    filterConfirmMode: true,
    filterDropdown: true,
    filterDropdownProps: true,
    filterDropdownVisible: true,
    filterMultiple: true,
    filteredValue: true,
    filters: true,
    fixed: true,
    onCell: true,
    onFilter: true,
    onFilterDropdownVisibleChange: true,
    onHeaderCell: true,
    resize: true,
    showSortTip: true,
    sortChildrenRecord: true,
    sortOrder: true,
    sorter: true,
    title: true,
    useFullRender: true,
    width: true,
};

/**
 * A column given as a child of Table: its props are the column data and its slots render the column's cells and
 * title. Table reads it and it renders nothing, like the React Column.
 */
const Column = defineComponent(
    <R extends Record<string, any> = Record<string, any>>(_props: ColumnProps<R>, _context: SetupContext<Record<string, never>, SlotsType<TableColumnSlots<R>>>) =>
        () =>
            null,
    { name: 'TableColumn', props: Object.keys(columnFields) as (keyof ColumnProps)[] }
);

Object.assign(Column, { elementType: 'Table.Column' });

export default Column;
