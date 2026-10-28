import { describe, expect, it, vi } from 'vite-plus/test';
import {
    type BodyRow,
    buildRecordsByKey,
    flattenBodyRows,
    flattenData,
    getCellWidths,
    getChangedRowKeys,
    getDefaultVirtualizedRowConfig,
    getHeaderRowCount,
    getHeaderStickyOffset,
    getNextSortOrder,
    getRowSpanHoverKeys,
    mergeColumns,
    mergedRowExpandable,
    parseHeaderRows,
    placeInnerColumns,
    resolveVirtualizedItemSize,
    toggleFilteredValue,
} from '../utils';

describe('flattenData', () => {
    const tree = [{ key: 'a', children: [{ key: 'a1' }, { key: 'a2', children: [{ key: 'a21' }] }] }, { key: 'b' }];

    it('树形数据按展开状态依次展开子行，并记录层级', () => {
        const rows = flattenData({ expandedRowKeys: ['a', 'a2'] }, tree);
        expect(rows.map((row) => [row.key, row.level])).toEqual([
            ['a', 0],
            ['a1', 1],
            ['a2', 1],
            ['a21', 2],
            ['b', 0],
        ]);
    });

    it('展开行紧跟在记录之后，并标记为展开', () => {
        const rows = flattenData({ expandedRowKeys: ['b'], expandedRowRender: () => null }, tree);
        expect(rows.map((row) => row.key)).toEqual(['a', 'b', 'b__expanded_row']);
        expect(rows[2]).toMatchObject({ expandedRow: true, expanded: true, level: 0 });
    });

    it('有子行的展开记录依次展平为记录、展开行、子行', () => {
        const rows = flattenData({ expandedRowKeys: ['a'], expandedRowRender: () => null }, tree);
        expect(rows.map((row) => row.key)).toEqual(['a', 'a__expanded_row', 'a1', 'a2', 'b']);
    });

    it('rowExpandable 为假的记录没有展开行', () => {
        const rows = flattenData({ expandedRowKeys: ['b'], expandedRowRender: () => null, rowExpandable: (record) => record.key !== 'b' }, tree);
        expect(rows.map((row) => row.key)).toEqual(['a', 'b']);
    });

    it('分组行下的记录按分组展开，与分组行同层，未展开的分组只留分组行', () => {
        const dataSource = [{ key: '1' }, { key: '2' }, { key: '3' }];
        const groups = new Map([
            ['g1', new Set(['1', '2'])],
            ['g2', new Set(['3'])],
        ]);
        const rows = flattenData({ expandedRowKeys: ['g1'], groups }, dataSource);
        expect(rows.map((row) => [row.key, row.level, row.sectionRow ?? false])).toEqual([
            ['g1', 0, true],
            ['1', 0, false],
            ['2', 0, false],
            ['g2', 0, true],
        ]);
    });

    it('输出的行不携带递归过程中累积的 key 数组', () => {
        const rows = flattenData({ expandedRowKeys: ['a', 'a2'] }, tree);
        rows.forEach((row) => {
            expect(row).not.toHaveProperty('childrenKeys');
            expect(row).not.toHaveProperty('parentKeys');
        });
    });
});

describe('getChangedRowKeys', () => {
    it('返回选中状态变化的 key', () => {
        expect(getChangedRowKeys(['1', '2'], ['2', '3'])).toEqual(['1', '3']);
        expect(getChangedRowKeys([], [])).toEqual([]);
    });

    it('重复的 key 只返回一次，before 独有的在前', () => {
        expect(getChangedRowKeys(['1', '1', '2'], ['2', '3', '3'])).toEqual(['1', '3']);
    });
});

describe('parseHeaderRows', () => {
    const spans = (rows: ReturnType<typeof parseHeaderRows>) => rows.map((row) => row.map((cell) => [cell.key, cell.colStart, cell.colSpan, cell.rowSpan]));

    it('多级表头：父列横跨子列，叶子列纵跨余下的行', () => {
        const columns = [
            { key: 'a', title: 'A' },
            {
                key: 'b',
                title: 'B',
                children: [{ key: 'b1' }, { key: 'b2', children: [{ key: 'b21' }, { key: 'b22' }] }],
            },
        ];
        expect(spans(parseHeaderRows(columns))).toEqual([
            [
                ['a', 0, 1, 3],
                ['b', 1, 3, undefined],
            ],
            [
                ['b1', 1, 1, 2],
                ['b2', 2, 2, undefined],
            ],
            [
                ['b21', 2, 1, 1],
                ['b22', 3, 1, 1],
            ],
        ]);
    });

    it('last 只标记延伸到表格末端的单元格，末列纵跨时下一行的最后一格不算', () => {
        const lastKeys = (columns: Record<string, any>[]) => parseHeaderRows(columns).map((row) => row.filter((cell) => cell.last).map((cell) => cell.key));
        expect(lastKeys([{ key: 'a' }, { key: 'b', children: [{ key: 'b1' }, { key: 'b2', children: [{ key: 'b21' }, { key: 'b22' }] }] }])).toEqual([['b'], ['b2'], ['b22']]);
        expect(lastKeys([{ key: 'a', children: [{ key: 'a1' }, { key: 'a2' }] }, { key: 'b' }])).toEqual([['b'], []]);
    });

    it('列上显式的 colSpan 优先', () => {
        const columns = [
            { key: 'a', colSpan: 2 },
            { key: 'b', colSpan: 0 },
            { key: 'c', children: [{ key: 'c1' }] },
        ];
        expect(spans(parseHeaderRows(columns))).toEqual([
            [
                ['a', 0, 2, 2],
                ['b', 2, 0, 2],
                ['c', 2, 1, undefined],
            ],
            [['c1', 2, 1, 1]],
        ]);
    });

    it('列配置里未声明的 rowSpan 不影响表头的行合并', () => {
        const columns = [
            { key: 'a', rowSpan: 5 },
            { key: 'b', rowSpan: 1, children: [{ key: 'b1' }] },
        ];
        expect(spans(parseHeaderRows(columns))).toEqual([
            [
                ['a', 0, 1, 2],
                ['b', 1, 1, undefined],
            ],
            [['b1', 1, 1, 1]],
        ]);
    });

    it('函数标题取其返回值，省略显示的字符串标题带 title', () => {
        const [[fnCell, textCell, noTitleCell]] = parseHeaderRows([
            { key: 'a', title: () => 'from fn' },
            { key: 'b', title: 'B', ellipsis: true },
            { key: 'c', title: 'C', ellipsis: { showTitle: false } },
        ]);
        expect(fnCell.children).toBe('from fn');
        expect(textCell.title).toBe('B');
        expect(noTitleCell.title).toBeUndefined();
    });
});

describe('getHeaderRowCount', () => {
    it('等于列树的深度', () => {
        expect(getHeaderRowCount([])).toBe(0);
        expect(getHeaderRowCount([{ key: 'a' }, { key: 'b', children: [{ key: 'b1', children: [{}] }] }])).toBe(3);
    });
});

describe('getNextSortOrder', () => {
    it.each([
        [false, 'ascend'],
        ['ascend', 'descend'],
        ['descend', 'cancelSort'],
    ] as const)('当前为 %s 时下一次点击为 %s', (sortOrder, next) => {
        expect(getNextSortOrder(sortOrder)).toBe(next);
    });
});

describe('toggleFilteredValue', () => {
    it.each([
        { current: ['a'], value: 'b', filterMultiple: true, next: ['a', 'b'] },
        { current: ['a'], value: 'b', filterMultiple: false, next: ['b'] },
        { current: ['a', 'b'], value: 'a', filterMultiple: true, next: ['b'] },
        { current: ['a'], value: 'a', filterMultiple: false, next: [] },
    ])('$current 点击 $value（多选 $filterMultiple）得到 $next', ({ current, value, filterMultiple, next }) => {
        expect(toggleFilteredValue(current, value, filterMultiple)).toEqual(next);
    });

    it('不修改传入的数组', () => {
        const current = ['a'];
        toggleFilteredValue(current, 'a', true);
        expect(current).toEqual(['a']);
    });
});

describe('mergeColumns', () => {
    it('按 key 或 dataIndex 找到旧列，只沿用非受控的排序与筛选值，其余字段取新列', () => {
        const sorter = () => 0;
        const merged = mergeColumns<Record<string, unknown>>(
            [
                { dataIndex: 'a', sorter, sortOrder: 'ascend', title: 'old' },
                { key: 'k', width: 120, filters: [], filteredValue: ['x'] },
                { dataIndex: 'b', sorter, sortOrder: 'ascend' },
                { dataIndex: 'c', sorter, sortOrder: 'ascend' },
            ],
            [{ dataIndex: 'a', sorter, title: 'new' }, { key: 'k', filters: [] }, { dataIndex: 'b' }, { dataIndex: 'c', sorter, sortOrder: 'descend' }, { dataIndex: 'd' }]
        );
        expect(merged).toEqual([{ dataIndex: 'a', sorter, sortOrder: 'ascend', title: 'new' }, { key: 'k', filters: [], filteredValue: ['x'] }, { dataIndex: 'b' }, { dataIndex: 'c', sorter, sortOrder: 'descend' }, { dataIndex: 'd' }]);
    });

    it('返回新的列对象', () => {
        const column = { dataIndex: 'a' };
        expect(mergeColumns([], [column])[0]).not.toBe(column);
    });
});

describe('placeInnerColumns', () => {
    const expand = { key: 'expand', title: 'expand' };
    const selection = { key: 'selection', title: 'selection' };

    it('同 key 的用户列覆盖内置列的字段', () => {
        const placed = placeInnerColumns<Record<string, unknown>>([{ key: 'a' }, { key: 'selection', width: 40 }], [null, selection]);
        expect(placed).toEqual([{ key: 'a' }, { key: 'selection', title: 'selection', width: 40 }]);
    });

    it('没有 fixed 的内置列放在最前，fixed 为 right 的放在最后，null 跳过', () => {
        expect(placeInnerColumns<Record<string, unknown>>([{ key: 'a' }], [null, { key: 'selection', fixed: 'right' }]).map((column) => column.key)).toEqual(['a', 'selection']);
        expect(placeInnerColumns<Record<string, unknown>>([{ key: 'a' }], [expand, null]).map((column) => column.key)).toEqual(['expand', 'a']);
    });

    it('两个内置列都放在最前时，选择列在展开列之前', () => {
        expect(placeInnerColumns<Record<string, unknown>>([{ key: 'a' }], [expand, selection]).map((column) => column.key)).toEqual(['selection', 'expand', 'a']);
    });
});

describe('getCellWidths', () => {
    const headWidths = [
        [
            { key: 'a', width: 100 },
            { key: 'b', width: 200 },
        ],
        [{ key: 'c', width: 50 }],
    ];

    it('按列的顺序取各层表头量得的宽度，没有量过的列跳过', () => {
        expect(getCellWidths(headWidths, [{ key: 'c' }, { key: 'x' }, { key: 'a' }])).toEqual([50, 100]);
    });

    it('columns 为空或 undefined 时返回空数组', () => {
        expect(getCellWidths(headWidths, undefined)).toEqual([]);
        expect(getCellWidths([], [{ key: 'a' }])).toEqual([]);
    });
});

describe('mergedRowExpandable', () => {
    const options = { childrenRecordName: 'children', hasExpandedRow: false };

    it('有展开行或子行时可展开，除非 rowExpandable 返回假', () => {
        expect(mergedRowExpandable({}, { ...options, hasExpandedRow: true })).toBe(true);
        expect(mergedRowExpandable({ children: [{}] }, options)).toBe(true);
        expect(mergedRowExpandable({ children: [{}] }, { ...options, rowExpandable: () => false })).toBe(false);
    });

    it('没有展开行和子行时只看 rowExpandable，结果为布尔值', () => {
        expect(mergedRowExpandable({}, options)).toBe(false);
        expect(mergedRowExpandable({}, { ...options, rowExpandable: () => 1 })).toBe(true);
    });
});

describe('getHeaderStickyOffset', () => {
    const columns = [{ key: 'a', fixed: 'left' }, { key: 'b', fixed: true }, { key: 'c' }, { key: 'd', fixed: 'right' }, { key: 'e', fixed: 'right' }];
    const widths = [10, 20, 30, 40, 50];

    it('左固定列贴左，偏移为前面各列宽度之和；右固定列贴右，偏移为后面各列宽度之和', () => {
        expect(getHeaderStickyOffset(columns[1], columns, widths, false)).toEqual({ side: 'left', offset: 10 });
        expect(getHeaderStickyOffset(columns[3], columns, widths, false)).toEqual({ side: 'right', offset: 50 });
    });

    it('RTL 下贴靠的一侧互换', () => {
        expect(getHeaderStickyOffset(columns[0], columns, widths, true)).toEqual({ side: 'right', offset: 0 });
        expect(getHeaderStickyOffset(columns[4], columns, widths, true)).toEqual({ side: 'left', offset: 0 });
    });

    it('不固定、未量宽或不在本层的列没有偏移', () => {
        expect(getHeaderStickyOffset(columns[2], columns, widths, false)).toBeUndefined();
        expect(getHeaderStickyOffset(columns[0], columns, [], false)).toBeUndefined();
        expect(getHeaderStickyOffset({ key: 'x', fixed: 'left' }, columns, widths, false)).toBeUndefined();
    });
});

describe('resolveVirtualizedItemSize', () => {
    const row = { expandedRow: false, sectionRow: false };
    const defaults = getDefaultVirtualizedRowConfig('small', false);

    it('itemSize 为数字或函数时取其结果，函数收到下标与行类型', () => {
        expect(resolveVirtualizedItemSize(30, 'small', 0, row)).toEqual({ size: 30, minHeight: defaults.minHeight });
        const itemSize = vi.fn<(index: number, kind: typeof row) => number>(() => 80);
        expect(resolveVirtualizedItemSize(itemSize, 'small', 3, { expandedRow: true, sectionRow: false }).size).toBe(80);
        expect(itemSize).toHaveBeenCalledWith(3, { expandedRow: true, sectionRow: false });
    });

    it('没有 itemSize，或它给出 null、undefined 时取尺寸预设的默认行高', () => {
        expect(resolveVirtualizedItemSize(undefined, 'small', 0, row).size).toBe(defaults.height);
        // null and undefined break the declared number type: they stand for a user option that gives nothing
        expect(resolveVirtualizedItemSize(null as unknown as number, 'small', 0, row).size).toBe(defaults.height);
        expect(resolveVirtualizedItemSize((() => undefined) as unknown as () => number, 'small', 0, row).size).toBe(defaults.height);
    });
});

describe('flattenBodyRows', () => {
    const tree = [{ key: 'a', children: [{ key: 'a1' }] }, { key: 'b' }];
    const options = { hasExpandedRow: true, rowExpandable: () => true };
    const summary = (rows: BodyRow[]) => rows.map((row) => [row.kind, row.key, 'displayNone' in row ? row.displayNone : undefined]);

    it('展开的记录后依次是展开行和子行', () => {
        expect(summary(flattenBodyRows({ ...options, expandedRowKeys: ['a'] }, tree, null, new Map()))).toEqual([
            ['base', 'a', false],
            ['expanded', 'a', false],
            ['base', 'a1', false],
            ['base', 'b', false],
        ]);
    });

    it('keepDOM 保留折叠的展开行和子行，并标记为隐藏', () => {
        expect(summary(flattenBodyRows({ ...options, keepDOM: true }, tree, null, new Map()))).toEqual([
            ['base', 'a', false],
            ['expanded', 'a', true],
            ['base', 'a1', true],
            ['expanded', 'a1', true],
            ['base', 'b', false],
            ['expanded', 'b', true],
        ]);
    });

    it('记录没有 key 时以下标代替', () => {
        expect(flattenBodyRows({ hasExpandedRow: false }, [{ name: 'x' }, { name: 'y' }], null, new Map()).map((row) => row.key)).toEqual([0, 1]);
    });

    it('分组按首个记录出现的顺序排列，只有展开的分组带出记录', () => {
        const dataSource = [{ key: '1' }, { key: '2' }, { key: '3' }];
        const groups = new Map([
            ['g2', new Set(['2', '3'])],
            ['g1', new Set(['1'])],
        ]);
        const rows = flattenBodyRows({ hasExpandedRow: false, expandedRowKeys: ['g2'] }, dataSource, groups, buildRecordsByKey(dataSource, 'key'));
        expect(rows.map((row) => [row.kind, row.key])).toEqual([
            ['section', 'g1'],
            ['section', 'g2'],
            ['base', '2'],
            ['base', '3'],
        ]);
    });
});

describe('buildRecordsByKey', () => {
    it('每个 key 只保留第一条记录，空 key 不收录', () => {
        const first = { key: 'a', n: 1 };
        const map = buildRecordsByKey([first, { key: 'a', n: 2 }, { key: '' }, { name: 'none' }], 'key');
        expect([...map]).toEqual([['a', first]]);
    });
});

describe('getRowSpanHoverKeys', () => {
    const tableWith = (html: string) => {
        const root = document.createElement('div');
        root.innerHTML = `<table><tbody>${html}</tbody></table>`;
        return root;
    };

    it('收集覆盖当前行的 rowspan 单元格所跨的各行', () => {
        const root = tableWith('<tr data-row-key="a"><td rowspan="2"></td></tr><tr data-row-key="b"></tr><tr data-row-key="c"></tr>');
        expect([...getRowSpanHoverKeys(root, 'b')]).toEqual(['b', 'a']);
        expect([...getRowSpanHoverKeys(root, 'c')]).toEqual(['c']);
    });

    it('key 含选择器特殊字符时照常匹配', () => {
        const root = tableWith('<tr data-row-key="a&quot;]"><td rowspan="2"></td></tr><tr data-row-key="b.c"></tr>');
        expect([...getRowSpanHoverKeys(root, 'b.c')]).toEqual(['b.c', 'a"]']);
    });

    it('找不到当前行时只返回它自己', () => {
        expect([...getRowSpanHoverKeys(null, 'x')]).toEqual(['x']);
    });
});
