import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type {
    ColumnProps,
    // @ts-expect-error the merged components are internal to Table, not exported
    MergedTableComponents,
    TableCellAttrs,
    TableCellSlotProps,
    TableEmits,
    TableHeaderCellAttrs,
    TableHeaderCellSlotProps,
    TableRowAttrs,
    TableRowKey,
    TableVirtualizedProps,
} from '..';

interface Row {
    id: number;
    name: string;
}

// The assertions are checked by vue-tsc; the runtime body only keeps the file a valid test.
describe('Table 类型', () => {
    it('onHeaderCell 的首参是列配置', () => {
        type OnHeaderCell = NonNullable<ColumnProps<Row>['onHeaderCell']>;
        expectTypeOf<Parameters<OnHeaderCell>[0]>().toEqualTypeOf<ColumnProps<Row>>();
        const onHeaderCell: OnHeaderCell = (column) => ({ style: { width: `${column.width}px` } });
        expectTypeOf(onHeaderCell).toBeFunction();
        expect(true).toBe(true);
    });

    it('rowKey 函数可以返回数字', () => {
        expectTypeOf<(record: Row) => number>().toExtend<TableRowKey<Row>>();
        expect(true).toBe(true);
    });

    it('单元格与表头插槽参数、虚拟化与 scroll 事件的类型不接受拼错的属性名', () => {
        type ScrollArgs = TableEmits<Row>['scroll'][0];
        expectTypeOf<TableCellSlotProps<Row>['record']>().toEqualTypeOf<Row>();
        expectTypeOf<'recrod' extends keyof TableCellSlotProps<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<TableCellSlotProps<Row>>().toHaveProperty('indentText');
        expectTypeOf<'sortr' extends keyof TableHeaderCellSlotProps<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<TableHeaderCellSlotProps<Row>>().toHaveProperty('sorter');
        expectTypeOf<'itemSzie' extends keyof TableVirtualizedProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<TableVirtualizedProps>().toHaveProperty('overscanCount');
        expectTypeOf<'scrollTpo' extends keyof ScrollArgs ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<ScrollArgs>().toHaveProperty('scrollOffset');
        expect(true).toBe(true);
    });

    it('列配置与单元格、行回调的返回对象不接受拼错的属性名', () => {
        expectTypeOf<'widht' extends keyof ColumnProps<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'calss' extends keyof TableRowAttrs ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'colSapn' extends keyof TableCellAttrs ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'calss' extends keyof TableHeaderCellAttrs ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<TableCellAttrs>().toHaveProperty('rowSpan');
        expectTypeOf<{ 'data-id': string; class: string; onClick: () => void }>().toExtend<TableRowAttrs>();
        const column: ColumnProps<Row> & { tooltip: string } = { title: '名称', dataIndex: 'name', tooltip: '提示' };
        expectTypeOf(column).toExtend<ColumnProps<Row>>();
        expect(true).toBe(true);
    });

    it('内部的 MergedTableComponents 不从入口导出', () => {
        expectTypeOf<MergedTableComponents>().toBeAny();
        expect(true).toBe(true);
    });
});
