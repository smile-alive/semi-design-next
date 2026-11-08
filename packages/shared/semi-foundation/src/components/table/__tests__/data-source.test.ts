import { describe, expect, it } from 'vite-plus/test';
import TableFoundation from '../foundation';

type Row = { key: string; name: string; type?: string; children?: Row[] };

const props = { rowKey: 'key', childrenRecordName: 'children' } as Parameters<typeof TableFoundation.groupDataSource<Row>>[0];
const keys = (rows: Row[]) => rows.map((row) => row.key);

describe('TableFoundation.filterDataSource', () => {
    const rows: Row[] = [
        { key: '1', name: 'a' },
        { key: '2', name: 'b' },
        { key: '3', name: 'ab' },
    ];
    const onFilter = (value: string, record: Row) => record.name.includes(value);

    it.each([
        ['filteredValue 为空数组', { filteredValue: [] }],
        ['没有 onFilter', { filteredValue: ['a'], onFilter: undefined }],
        ['filteredValue 与 defaultFilteredValue 都缺失', {}],
    ])('%s 时不筛选，原样返回', (_, filter) => {
        const result = TableFoundation.filterDataSource(props, rows, [{ onFilter, ...filter } as never]);
        expect(result).toBe(rows);
    });

    it('同一列的多个值取并集，保持原始行顺序', () => {
        const result = TableFoundation.filterDataSource(props, rows, [{ onFilter, filteredValue: ['b', 'a'] } as never]);
        expect(keys(result)).toEqual(['1', '2', '3']);
    });

    it('多列筛选取交集', () => {
        const other = (value: string, record: Row) => record.key === value;
        const result = TableFoundation.filterDataSource(props, rows, [
            { onFilter, filteredValue: ['a'] },
            { onFilter: other, filteredValue: ['3'] },
        ] as never);
        expect(keys(result)).toEqual(['3']);
    });

    it('未受控时使用 defaultFilteredValue', () => {
        const result = TableFoundation.filterDataSource(props, rows, [{ onFilter, defaultFilteredValue: ['ab'] }] as never);
        expect(keys(result)).toEqual(['3']);
    });

    it('filterChildrenRecord 时保留父记录并只留下命中的子记录', () => {
        const tree: Row[] = [
            {
                key: 'p',
                name: 'parent',
                children: [
                    { key: 'c1', name: 'x' },
                    { key: 'c2', name: 'y' },
                ],
            },
            { key: 'q', name: 'x' },
        ];
        const result = TableFoundation.filterDataSource(props, tree, [{ onFilter, filteredValue: ['x'], filterChildrenRecord: true }] as never);
        expect(keys(result)).toEqual(['p', 'q']);
        expect(keys(result[0].children)).toEqual(['c1']);
    });
});

describe('TableFoundation.sortDataSource', () => {
    const rows: Row[] = [
        { key: '1', name: 'c' },
        { key: '2', name: 'a' },
        { key: '3', name: 'b' },
    ];
    const sorter = (a: Row, b: Row) => a.name.localeCompare(b.name);

    it.each([
        ['ascend', ['2', '3', '1']],
        ['descend', ['1', '3', '2']],
    ])('%s 排序，不修改传入的数组', (sortOrder, expected) => {
        const copy = [...rows];
        const result = TableFoundation.sortDataSource(props, rows, [{ sorter, sortOrder }] as never);
        expect(keys(result)).toEqual(expected);
        expect(rows).toEqual(copy);
    });

    it.each([
        ['sortOrder 为 false', { sortOrder: false }],
        ['sorter 不是函数', { sorter: true, sortOrder: 'ascend' }],
        ['sortOrder 不合法', { sortOrder: 'sideways' }],
    ])('%s 时保持原顺序', (_, sorterInfo) => {
        const result = TableFoundation.sortDataSource(props, rows, [{ sorter, ...sorterInfo }] as never);
        expect(keys(result)).toEqual(['1', '2', '3']);
    });

    it('sortOrder 未设置时使用 defaultSortOrder', () => {
        const result = TableFoundation.sortDataSource(props, rows, [{ sorter, defaultSortOrder: 'ascend' }] as never);
        expect(keys(result)).toEqual(['2', '3', '1']);
    });

    it('只应用第一个生效的排序器', () => {
        const byKeyDesc = (a: Row, b: Row) => a.key.localeCompare(b.key);
        const result = TableFoundation.sortDataSource(props, rows, [
            { sorter, sortOrder: false },
            { sorter: byKeyDesc, sortOrder: 'descend' },
            { sorter, sortOrder: 'ascend' },
        ] as never);
        expect(keys(result)).toEqual(['3', '2', '1']);
    });

    it('sortChildrenRecord 时同时排序子记录', () => {
        const tree: Row[] = [
            {
                key: 'p',
                name: 'p',
                children: [
                    { key: 'c1', name: 'z' },
                    { key: 'c2', name: 'y' },
                ],
            },
        ];
        const result = TableFoundation.sortDataSource(props, tree, [{ sorter, sortOrder: 'ascend', sortChildrenRecord: true }] as never);
        expect(keys(result[0].children)).toEqual(['c2', 'c1']);
        expect(keys(tree[0].children)).toEqual(['c1', 'c2']);
    });
});

describe('TableFoundation.groupDataSource', () => {
    const rows: Row[] = [
        { key: '1', name: 'a', type: 'x' },
        { key: '2', name: 'b', type: 'y' },
        { key: '3', name: 'c', type: 'x' },
        { key: '4', name: 'd' },
    ];

    it('按字段分组，同组记录相邻，没有分组值的记录被丢弃', () => {
        const { groups, dataSource } = TableFoundation.groupDataSource({ ...props, groupBy: 'type', dataSource: rows }, rows);
        expect([...groups.keys()]).toEqual(['x', 'y']);
        expect(keys(dataSource)).toEqual(['1', '3', '2']);
    });

    it('groupBy 可以是函数', () => {
        const { groups } = TableFoundation.groupDataSource({ ...props, groupBy: (record: Row) => (record.name === 'a' ? 'first' : 'rest'), dataSource: rows }, rows);
        expect([...groups.keys()]).toEqual(['first', 'rest']);
    });

    it('没有 groupBy 时原样返回', () => {
        const { groups, dataSource } = TableFoundation.groupDataSource({ ...props, dataSource: rows }, rows);
        expect(groups.size).toBe(0);
        expect(dataSource).toEqual(rows);
    });
});

describe('TableFoundation.limitPageDataSource', () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({ key: String(index) }));
    const limit = (currentPage: number) =>
        TableFoundation.limitPageDataSource({ ...props, pagination: {} } as never, rows, {
            currentPage,
            pageSize: 2,
        });

    it('按页切出记录', () => {
        expect(limit(1)).toHaveLength(2);
        expect(limit(3)).toHaveLength(1);
    });

    it('currentPage 超出范围时得到空页，而不是抛错', () => {
        expect(limit(9)).toEqual([]);
    });
});
