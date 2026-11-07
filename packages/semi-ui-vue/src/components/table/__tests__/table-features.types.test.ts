import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { CheckboxAttrs, ColumnProps, GetCheckboxProps, GroupByFunction, ResizableProps, RowSelectionOnChange, RowSelectionOnSelect, RowSelectionOnSelectAll, RowSelectionProps, TableGroupBy, TableFilterDropdownItemSlotProps, TablePaginationSlotProps, TableResizeFn, TableSelectionCellSlotProps } from '..';
import type ResizableHeaderCell from '../resizable-header-cell.vue';

interface Row {
    id: number;
    name: string;
}

type HeaderCellProps = InstanceType<typeof ResizableHeaderCell>['$props'];

// The assertions are checked by vue-tsc; the runtime body only keeps the file a valid test.
describe('Table 列功能类型', () => {
    it('resizable 回调的首参是列配置，返回的字段并入列配置', () => {
        expectTypeOf<Parameters<TableResizeFn<Row>>[0]>().toEqualTypeOf<ColumnProps<Row>>();
        expectTypeOf<ReturnType<TableResizeFn<Row>>>().toEqualTypeOf<Partial<ColumnProps<Row>> | void>();
        const onResize: TableResizeFn<Row> = (column) => ({ width: column.width });
        expectTypeOf(onResize).toExtend<NonNullable<ResizableProps<Row>['onResize']>>();
        expect(true).toBe(true);
    });

    it('rowSelection 不声明不生效的 title，单元格回调带行类型', () => {
        expectTypeOf<RowSelectionProps<Row>>().not.toHaveProperty('title');
        expectTypeOf<NonNullable<RowSelectionProps<Row>['onCell']>>().parameter(0).toEqualTypeOf<Row>();
        expectTypeOf<ResizableProps<Row>>().toHaveProperty('handlerClassName');
        expectTypeOf<RowSelectionProps<Row>['defaultSelectedRowKeys']>().toEqualTypeOf<(string | number)[] | undefined>();
        expect(true).toBe(true);
    });

    it('rowSelection 回调、getCheckboxProps 与 groupBy 函数有与 React 同名的类型', () => {
        expectTypeOf<RowSelectionOnChange<Row>>().toEqualTypeOf<NonNullable<RowSelectionProps<Row>['onChange']>>();
        expectTypeOf<RowSelectionOnSelect<Row>>().toEqualTypeOf<NonNullable<RowSelectionProps<Row>['onSelect']>>();
        expectTypeOf<RowSelectionOnSelectAll<Row>>().toEqualTypeOf<NonNullable<RowSelectionProps<Row>['onSelectAll']>>();
        expectTypeOf<GetCheckboxProps<Row>>().toEqualTypeOf<NonNullable<RowSelectionProps<Row>['getCheckboxProps']>>();
        expectTypeOf<ReturnType<GetCheckboxProps<Row>>>().toEqualTypeOf<CheckboxAttrs>();
        expectTypeOf<RowSelectionOnSelect<Row>>().parameter(0).toEqualTypeOf<Row>();
        expectTypeOf<GroupByFunction<Row>>().toExtend<TableGroupBy<Row>>();
        expectTypeOf<Exclude<TableGroupBy<Row>, string | number>>().toEqualTypeOf<GroupByFunction<Row>>();
        expect(true).toBe(true);
    });

    it('列配置不接受 filterIcon、sortIcon、renderFilterDropdownItem，它们由插槽提供', () => {
        expectTypeOf<ColumnProps<Row>>().not.toHaveProperty('filterIcon');
        expectTypeOf<ColumnProps<Row>>().not.toHaveProperty('sortIcon');
        expectTypeOf<ColumnProps<Row>>().not.toHaveProperty('renderFilterDropdownItem');
        expectTypeOf<ColumnProps<Row>>().not.toHaveProperty('renderFilterDropdown');
        expectTypeOf<ColumnProps<Row>['filterDropdown']>().toEqualTypeOf<boolean | undefined>();
        expect(true).toBe(true);
    });

    it('插槽参数不接受拼错的属性名', () => {
        expectTypeOf<'levle' extends keyof TableFilterDropdownItemSlotProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<TableFilterDropdownItemSlotProps>().toHaveProperty('filteredValue');
        expectTypeOf<TableSelectionCellSlotProps<Row>>().toHaveProperty('originNode');
        expectTypeOf<'position' extends keyof TablePaginationSlotProps['pagination'] ? true : false>().toEqualTypeOf<false>();
        expect(true).toBe(true);
    });

    it('可调整列宽的表头单元格只接受宽度、开关与调整监听', () => {
        expectTypeOf<'widht' extends keyof HeaderCellProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<HeaderCellProps>().toHaveProperty('width');
        expectTypeOf<HeaderCellProps>().toHaveProperty('resize');
        expectTypeOf<HeaderCellProps>().toHaveProperty('onResizeStop');
        expect(true).toBe(true);
    });
});
