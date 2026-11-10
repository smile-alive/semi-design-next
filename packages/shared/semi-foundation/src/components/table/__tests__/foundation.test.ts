import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import TableFoundation, { type BaseChangeInfoSorter, type BaseColumnProps, type BaseEntity, type BaseOnCellReturnObject, type BaseSorterInfo, type TableBaseState } from '../foundation';

const dataSource = [
    { key: '1', name: 'a' },
    { key: '2', name: 'b' },
    { key: '3', name: 'c' },
];
type Row = (typeof dataSource)[number];
const columns = [{ dataIndex: 'name', sorter: true }];

function initialState(props: Record<string, any> = {}) {
    const flattenColumns = props.columns ?? columns;
    const queries = TableFoundation.initColumnsFilteredValueAndSorterOrder<(typeof dataSource)[number]>(flattenColumns.map((column: Record<string, any>) => ({ ...column })));
    return TableFoundation.getInitialState({ dataSource, rowKey: 'key', ...props }, flattenColumns, queries);
}

describe('TableFoundation.getInitialState', () => {
    it('按初始分页切出当前页，查询带默认排序与筛选值', () => {
        const state = initialState({ pagination: { pageSize: 2, defaultCurrentPage: 2 } });
        expect(state.dataSource.map((record) => record.key)).toEqual(['3']);
        expect(state.pagination).toMatchObject({ currentPage: 2, pageSize: 2, total: 3 });
        expect(state.queries).toEqual([{ dataIndex: 'name', sorter: true, sortOrder: false, filteredValue: [] }]);
    });

    it('展开 key：默认键、全部展开与受控键', () => {
        expect(initialState({ defaultExpandedRowKeys: ['2', '2'] }).expandedRowKeys).toEqual(['2']);
        expect(initialState({ expandedRowKeys: ['1'] }).expandedRowKeys).toEqual(['1']);
        expect(initialState({}).expandedRowKeys).toEqual([]);

        const tree = [{ key: 'p', children: [{ key: 'c1' }, { key: 'c2' }] }, { key: 'q' }];
        expect(initialState({ dataSource: tree, defaultExpandAllRows: true, childrenRecordName: 'children' }).expandedRowKeys).toEqual(['p', 'c1', 'c2', 'q']);
        expect(initialState({ dataSource: tree, expandAllRows: true, childrenRecordName: 'children' }).expandedRowKeys).toEqual(['p', 'c1', 'c2', 'q']);
    });

    it('展开 key：分组行按 defaultExpandAllGroupRows、expandAllGroupRows 展开，defaultExpandAllRows 不覆盖受控键', () => {
        const grouped = [
            { key: '1', name: 'a' },
            { key: '2', name: 'a' },
            { key: '3', name: 'b' },
        ];
        const props = { groupBy: 'name', dataSource: grouped, pagination: false };
        expect(initialState({ ...props, defaultExpandAllGroupRows: true }).expandedRowKeys).toEqual(['a', 'b']);
        expect(initialState({ ...props, expandAllGroupRows: true, expandedRowKeys: ['1'] }).expandedRowKeys).toEqual(['1', 'a', 'b']);
        expect(initialState({ ...props, defaultExpandAllRows: true }).expandedRowKeys).toEqual(['1', '2', '3', 'a', 'b']);
        expect(initialState({ ...props, defaultExpandAllRows: true, expandedRowKeys: ['1'] }).expandedRowKeys).toEqual(['1']);
    });

    it('选中 key：默认键写入 rowSelection 与对应 Set，受控时取受控键', () => {
        const uncontrolled = initialState({ rowSelection: { defaultSelectedRowKeys: ['1', '1', '3'] } });
        expect(uncontrolled.rowSelection.selectedRowKeys).toEqual(['1', '3']);
        expect(uncontrolled.rowSelection.selectedRowKeysSet).toEqual(new Set(['1', '3']));

        const bare = initialState({ rowSelection: true });
        expect(bare.rowSelection.selectedRowKeys).toEqual([]);

        const controlled = initialState({ rowSelection: { selectedRowKeys: ['2'], defaultSelectedRowKeys: ['1'] } });
        expect(controlled.rowSelection.selectedRowKeys).toEqual(['2']);
        expect(controlled.rowSelection.selectedRowKeysSet).toEqual(new Set(['2']));

        expect(initialState({}).rowSelection).toBeNull();
    });

    it('选中 key：checkRelation 为 related 时默认键推出子孙、父级与半选', () => {
        const tree = [
            { key: 'p', children: [{ key: 'c1' }, { key: 'c2' }] },
            { key: 'q', children: [{ key: 'd1' }, { key: 'd2' }] },
        ];
        const props = { dataSource: tree, childrenRecordName: 'children', pagination: false };
        const state = initialState({ ...props, rowSelection: { checkRelation: 'related', defaultSelectedRowKeys: ['p', 'd1'] } });
        expect(new Set(state.rowSelection.selectedRowKeys)).toEqual(new Set(['p', 'c1', 'c2', 'd1']));
        expect(state.rowSelection.selectedRowKeysSet).toEqual(new Set(state.rowSelection.selectedRowKeys));
        expect(state.halfCheckedRowKeys).toEqual(['q']);
        expect(state.halfCheckedRowKeysSet).toEqual(new Set(['q']));

        const unrelated = initialState({ ...props, rowSelection: { defaultSelectedRowKeys: ['p'] } });
        expect(unrelated.rowSelection.selectedRowKeys).toEqual(['p']);
        expect(unrelated.halfCheckedRowKeys).toEqual([]);
    });

    it('传 groupBy 时首帧状态已有分组', () => {
        const state = initialState({
            groupBy: 'name',
            dataSource: [
                { key: '1', name: 'a' },
                { key: '2', name: 'a' },
                { key: '3', name: 'b' },
            ],
        });
        expect(state.groups).toEqual(
            new Map([
                ['a', new Set(['1', '2'])],
                ['b', new Set(['3'])],
            ])
        );
    });

    it('已按当前 props 派生，同一份 props 再派生没有变化', () => {
        const props = { dataSource, rowKey: 'key', rowSelection: { selectedRowKeys: ['1'] }, pagination: {} };
        const state = TableFoundation.getInitialState(props, columns, [...columns]);
        expect(state.rowSelection.selectedRowKeysSet).toEqual(new Set(['1']));
        expect(TableFoundation.deriveState(props, state, columns)).toBeNull();
    });
});

describe('TableFoundation.getColumnFlags', () => {
    it('按 dataIndex 取列的查询，排序值无效时用 defaultSortOrder，筛选值缺省时用 defaultFilteredValue', () => {
        const query = { dataIndex: 'name', sortOrder: 'invalid', defaultSortOrder: 'descend', defaultFilteredValue: ['a'] };
        expect(TableFoundation.getColumnFlags({ dataIndex: 'name' }, [query], false)).toMatchObject({ query, sortOrder: 'descend', filteredValue: ['a'] });
    });

    it('没有 dataIndex 的列没有查询，不排序也没有筛选值', () => {
        expect(TableFoundation.getColumnFlags({}, [{ dataIndex: 'name', sortOrder: 'ascend' }], false)).toMatchObject({ query: undefined, sortOrder: false, filteredValue: undefined });
    });

    it('只有排序的列点整个表头排序；非受控排序才显示提示', () => {
        expect(TableFoundation.getColumnFlags({ sorter: true, showSortTip: true }, [], false)).toMatchObject({ hasSorter: true, hasFilter: false, needsTitle: true, clickToSort: true, showSortTip: true });
        expect(TableFoundation.getColumnFlags({ sorter: true, showSortTip: true, sortOrder: 'ascend' }, [], false)).toMatchObject({ clickToSort: true, showSortTip: false });
        expect(TableFoundation.getColumnFlags({ sorter: true, useFullRender: true }, [], false)).toMatchObject({ clickToSort: false });
    });

    it('filters 非空、自带下拉或 renderFilterDropdown 才有筛选，有筛选时排序器自己接点击', () => {
        expect(TableFoundation.getColumnFlags({ filters: [] }, [], false)).toMatchObject({ hasFilter: false, needsTitle: true });
        expect(TableFoundation.getColumnFlags({ sorter: true }, [], true)).toMatchObject({ hasFilter: true, clickToSort: false });
        expect(TableFoundation.getColumnFlags({ renderFilterDropdown: () => null }, [], false)).toMatchObject({ hasFilter: true, needsTitle: true });
        expect(TableFoundation.getColumnFlags({ dataIndex: 'name' }, [], false)).toMatchObject({ hasSorter: false, hasFilter: false, needsTitle: false });
    });
});

describe('TableFoundation.handlePageChange', () => {
    const scrollAdapter = (props: Record<string, any>) => {
        const body = document.createElement('div');
        body.scrollTop = 50;
        const adapter = {
            getProp: (key: string) => props[key],
            getProps: () => props,
            getState: () => undefined,
            getWrapper: () => document.createElement('div'),
            getBodyWrapper: () => body,
            notifyPageChange: vi.fn<(currentPage: number, pageSize: number) => void>(),
        };
        return { adapter, body, foundation: new TableFoundation<Row>(adapter as never) };
    };

    it('使用方的 pagination.onChange 接管翻页，scrollToFirstRowOnChange 时先复位滚动', () => {
        const { adapter, body, foundation } = scrollAdapter({ pagination: { onChange: () => {} }, scroll: { y: 200, scrollToFirstRowOnChange: true } });
        const setPage = vi.spyOn(foundation, 'setPage');
        foundation.handlePageChange(2, 10);
        expect(adapter.notifyPageChange).toHaveBeenCalledWith(2, 10);
        expect(setPage).not.toHaveBeenCalled();
        expect(body.scrollTop).toBe(0);
    });

    it('没有 scrollToFirstRowOnChange 时不复位滚动', () => {
        const { adapter, body, foundation } = scrollAdapter({ pagination: { onChange: () => {} }, scroll: { y: 200 } });
        foundation.handlePageChange(2, 10);
        expect(adapter.notifyPageChange).toHaveBeenCalledWith(2, 10);
        expect(body.scrollTop).toBe(50);
    });
});

describe('TableFoundation.normalizePagination', () => {
    it('分页 prop 的 total、defaultCurrentPage 为 null 时取数据条数与第 1 页', () => {
        const props = { dataSource, pagination: { total: null, defaultCurrentPage: null } };
        expect(TableFoundation.normalizePagination(props, {}, dataSource)).toMatchObject({ total: 3, currentPage: 1 });
    });
});

describe('TableFoundation.deriveState', () => {
    const base: TableBaseState<any> = {
        flattenColumns: columns,
        queries: [{ dataIndex: 'name', sorter: true, sortOrder: 'ascend', filteredValue: ['a'] }],
        rowSelection: { selectedRowKeys: ['2'], selectedRowKeysSet: new Set(['2']) },
        prePropRowSelection: undefined,
        pagination: { currentPage: 2, pageSize: 10, total: 30 },
        prePagination: undefined,
        expandedRowKeys: ['1'],
        preExpandedRowKeys: undefined,
    };

    it('新的列合并进 queries，保留排序与筛选状态', () => {
        const filters = [{ text: 'A', value: 'a' }];
        const nextColumns = [{ dataIndex: 'name', sorter: true, filters, title: 'Name' }];
        const changes = TableFoundation.deriveState({}, base, nextColumns);
        expect(changes).toEqual({
            flattenColumns: nextColumns,
            queries: [{ dataIndex: 'name', sorter: true, filters, sortOrder: 'ascend', filteredValue: ['a'], title: 'Name' }],
        });
    });

    it('非受控的 rowSelection 换新对象时沿用已选的 key，去掉 prop 不再有的选项', () => {
        const rowSelection = { disabled: true };
        const changes = TableFoundation.deriveState({ rowSelection }, { ...base, rowSelection: { ...base.rowSelection, clickRow: true } }, columns);
        expect(changes.rowSelection).toEqual({
            disabled: true,
            selectedRowKeys: ['2'],
            selectedRowKeysSet: new Set(['2']),
        });
        expect(changes.prePropRowSelection).toBe(rowSelection);
    });

    it('受控的 selectedRowKeys 生成 Set，getCheckboxProps 决定禁用的 key', () => {
        const rowSelection = {
            selectedRowKeys: ['1'],
            getCheckboxProps: (record: { key: string }) => ({ disabled: record.key === '3' }),
        };
        const changes = TableFoundation.deriveState({ rowSelection, dataSource, rowKey: 'key' }, base, columns);
        expect(changes.rowSelection.selectedRowKeysSet).toEqual(new Set(['1']));
        expect(changes.pageDisabledRowKeys).toEqual(['3']);
        expect(changes.filteredDisabledRowKeysSet).toEqual(new Set(['3']));
    });

    it('rowSelection 为 true 时得到空对象，为 false 时为 null', () => {
        expect(TableFoundation.deriveState({ rowSelection: true }, { ...base, rowSelection: null }, columns).rowSelection).toEqual({});
        expect(TableFoundation.deriveState({ rowSelection: false }, base, columns).rowSelection).toBeNull();
    });

    it('分页 prop 合并到当前分页上', () => {
        const pagination = { pageSize: 20 };
        const changes = TableFoundation.deriveState({ pagination }, base, columns);
        expect(changes.pagination).toEqual({ currentPage: 2, pageSize: 20, total: 30 });
        expect(changes.prePagination).toBe(pagination);
    });

    it('受控的 expandedRowKeys 写入状态，撤销受控值后清空展开', () => {
        const expandedRowKeys = ['3'];
        expect(TableFoundation.deriveState({ expandedRowKeys }, base, columns)).toEqual({
            expandedRowKeys,
            preExpandedRowKeys: expandedRowKeys,
        });
        expect(TableFoundation.deriveState({ expandedRowKeys: undefined }, { ...base, preExpandedRowKeys: ['3'] }, columns)).toEqual({ expandedRowKeys: [], preExpandedRowKeys: undefined });
    });

    it('没有变化时返回 null', () => {
        expect(TableFoundation.deriveState({}, base, columns)).toBeNull();
    });
});

describe('TableFoundation 横向滚动边缘', () => {
    const metrics = { scrollWidth: 1000, clientWidth: 400, rtl: false };

    it.each([
        ['LTR 最左', { ...metrics, scrollLeft: 0 }, { left: false, right: true }],
        ['LTR 中间', { ...metrics, scrollLeft: 300 }, { left: true, right: true }],
        ['LTR 最右', { ...metrics, scrollLeft: 600 }, { left: true, right: false }],
        ['LTR 小数位置视为到边', { ...metrics, scrollLeft: 599.6 }, { left: true, right: false }],
        ['RTL 起点在右侧', { ...metrics, rtl: true, scrollLeft: 0 }, { left: true, right: false }],
        ['RTL 中间', { ...metrics, rtl: true, scrollLeft: -300 }, { left: true, right: true }],
        ['RTL 滚到最左', { ...metrics, rtl: true, scrollLeft: -600 }, { left: false, right: true }],
        ['内容不超出容器', { scrollWidth: 400, clientWidth: 400, rtl: false, scrollLeft: 0 }, { left: false, right: false }],
    ])('%s', (_name, input, expected) => {
        expect(TableFoundation.getScrollableEdges(input)).toEqual(expected);
    });

    it('不支持 scroll-state 时 syncScrollEdges 按滚动位置写到容器上，支持时不测量', () => {
        const supports = vi.spyOn(CSS, 'supports');
        const container = document.createElement('div');
        const body = container.appendChild(document.createElement('div'));
        Object.defineProperties(body, { scrollWidth: { value: metrics.scrollWidth }, clientWidth: { value: metrics.clientWidth } });
        const adapter = { getBodyWrapper: vi.fn<() => HTMLElement>(() => body) };

        supports.mockReturnValue(false);
        new TableFoundation<Row>(adapter as never).syncScrollEdges();
        expect(container.hasAttribute('data-scrollable-left')).toBe(false);
        expect(container.hasAttribute('data-scrollable-right')).toBe(true);

        adapter.getBodyWrapper.mockClear();
        supports.mockReturnValue(true);
        new TableFoundation<Row>(adapter as never).syncScrollEdges();
        expect(adapter.getBodyWrapper).not.toHaveBeenCalled();
        supports.mockRestore();
    });
});

describe('BaseColumnProps 类型', () => {
    it('filterIcon 由框架决定形状，foundation 侧是 unknown', () => {
        expectTypeOf<BaseColumnProps<unknown>['filterIcon']>().toEqualTypeOf<unknown>();
        expect(true).toBe(true);
    });
});

describe('foundation 公开类型不带索引签名', () => {
    it('拼错的属性名不在类型里，读取的字段显式声明', () => {
        expectTypeOf<'sortOrdre' extends keyof BaseSorterInfo<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<BaseSorterInfo<Row>>().toHaveProperty('defaultSortOrder');
        expectTypeOf<BaseSorterInfo<Row>>().toHaveProperty('sortChildrenRecord');
        expectTypeOf<'classNmae' extends keyof BaseOnCellReturnObject ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'sortOrdre' extends keyof BaseChangeInfoSorter<Row> ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<'levle' extends keyof BaseEntity ? true : false>().toEqualTypeOf<false>();
        expect(true).toBe(true);
    });
});
