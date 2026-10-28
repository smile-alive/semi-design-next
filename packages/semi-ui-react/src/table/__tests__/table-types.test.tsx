import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type {
    BodyScrollEvent,
    ColumnProps,
    Data,
    FilterDropdownItem,
    FilterIcon,
    OnCellReturnObject,
    OnGroupedRow,
    OnGroupedRowReturnObject,
    OnHeaderCell,
    OnHeaderCellReturnObject,
    OnRowReturnObject,
    RenderGroupSection,
    RenderReturnObject,
    ResizableProps,
    ResizeFn,
    RowKey,
    RowSelectionProps,
    TableComponents,
    VirtualizedProps,
} from '../interface';
import type { ResizableHeaderCellProps } from '../resizable-header-cell';

interface Row {
    id: number;
    name: string;
}

// The assertions are checked by typecheck; the runtime body only keeps the file a valid test.
describe('Table 回调类型', () => {
    it('onHeaderCell 与 resizable 回调的首参是列配置', () => {
        expectTypeOf<Parameters<OnHeaderCell<Row>>[0]>().toEqualTypeOf<ColumnProps<Row> | undefined>();
        expectTypeOf<Parameters<ResizeFn<Row>>[0]>().toEqualTypeOf<ColumnProps<Row>>();
        expectTypeOf<ReturnType<ResizeFn<Row>>>().toEqualTypeOf<ColumnProps<Row> | void>();
        const onHeaderCell: OnHeaderCell<Row> = (column) => ({ style: { width: column?.width } });
        const onResize: ResizeFn<Row> = (column) => ({ width: column.width });
        expectTypeOf(onHeaderCell).toBeFunction();
        expectTypeOf(onResize).toBeFunction();
        expect(true).toBe(true);
    });

    it('rowKey 函数可以返回数字', () => {
        expectTypeOf<(record?: Row) => number>().toExtend<RowKey<Row>>();
        expect(true).toBe(true);
    });

    it('rowSelection 不声明不生效的 title，单元格回调带行类型', () => {
        expectTypeOf<RowSelectionProps<Row>>().not.toHaveProperty('title');
        expectTypeOf<NonNullable<RowSelectionProps<Row>['onCell']>>().parameter(0).toEqualTypeOf<Row | undefined>();
        expectTypeOf<ResizableProps<Row>>().toHaveProperty('handlerClassName');
        expectTypeOf<RowSelectionProps<Row>['defaultSelectedRowKeys']>().toEqualTypeOf<(string | number)[] | undefined>();
        expect(true).toBe(true);
    });

    it('render、筛选项、分组标题、虚拟化与滚动事件的类型不接受拼错的属性名', () => {
        type GroupSectionObject = Exclude<ReturnType<RenderGroupSection>, React.ReactNode>;
        expectTypeOf<'classNmae' extends keyof RenderReturnObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'colSapn' extends keyof RenderReturnObject['props'] ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<RenderReturnObject['props']>().toHaveProperty('rowSpan');
        expectTypeOf<'levle' extends keyof FilterDropdownItem ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<FilterDropdownItem>().toHaveProperty('filteredValue');
        expectTypeOf<'nmae' extends keyof Data ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'classNmae' extends keyof GroupSectionObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<GroupSectionObject>().toHaveProperty('children');
        expectTypeOf<'itemSzie' extends keyof VirtualizedProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<VirtualizedProps>().toHaveProperty('overscanCount');
        expectTypeOf<'scrollTpo' extends keyof BodyScrollEvent ? true : false>().toEqualTypeOf<false>();
        expect(true).toBe(true);
    });

    it('列配置与单元格、行回调的返回对象不接受拼错的属性名', () => {
        expectTypeOf<'widht' extends keyof ColumnProps<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'classNmae' extends keyof OnCellReturnObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'classNmae' extends keyof OnHeaderCellReturnObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'classNmae' extends keyof OnRowReturnObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'classNmae' extends keyof OnGroupedRowReturnObject ? true : false>().toEqualTypeOf<false>();
        const column: ColumnProps<Row> & { tooltip: string } = { title: '名称', dataIndex: 'name', tooltip: '提示' };
        expectTypeOf(column).toExtend<ColumnProps<Row>>();
        expect(true).toBe(true);
    });

    it('onGroupedRow 收到分组对象和序号，不收到第三个参数', () => {
        expectTypeOf<OnGroupedRow<Row>>().parameters.toEqualTypeOf<[record: { groupKey: string | number; records: Row[] }, index: number]>();
        expectTypeOf<OnGroupedRow<Row>>().returns.toEqualTypeOf<OnGroupedRowReturnObject>();
        expect(true).toBe(true);
    });

    it('filterIcon 只接受 React 元素或渲染函数', () => {
        expectTypeOf<React.ReactElement>().toExtend<FilterIcon>();
        expectTypeOf<(filtered: boolean) => React.ReactNode>().toExtend<FilterIcon>();
        expectTypeOf<boolean>().not.toExtend<FilterIcon>();
        expectTypeOf<string>().not.toExtend<FilterIcon>();
        expect(true).toBe(true);
    });

    it('可调整列宽的表头单元格只接受 th 属性与调整回调', () => {
        expectTypeOf<'widht' extends keyof ResizableHeaderCellProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<ResizableHeaderCellProps>().toHaveProperty('colSpan');
        expectTypeOf<ResizableHeaderCellProps>().toHaveProperty('onResizeStop');
        expect(true).toBe(true);
    });

    it('components 没有 footer，页脚不经 components 渲染', () => {
        expectTypeOf<'footer' extends keyof TableComponents ? true : false>().toEqualTypeOf<false>();
        expect(true).toBe(true);
    });
});
