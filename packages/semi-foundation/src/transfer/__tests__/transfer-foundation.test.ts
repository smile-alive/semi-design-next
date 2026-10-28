import { describe, expect, it } from 'vite-plus/test';
import TransferFoundation from '../foundation';
import { _generateTreeData } from '../transfer-utils';

const { getData, getSelectedItems, getSearchResult, getValuesAndItemsFromMap, generatePath } = TransferFoundation;

const tree = () => [
    { label: 'Asia', value: 'asia', key: '0', children: [{ label: 'Japan', value: 'jp', key: '0-0' }] },
    { label: 'Europe', value: 'eu', key: '1' },
];

describe('_generateTreeData', () => {
    it('以先序展开并生成路径，且不修改输入', () => {
        const input = tree();
        const snapshot = structuredClone(input);
        const data = _generateTreeData(input);
        expect(input).toEqual(snapshot);
        expect(data.map((item) => item.key)).toEqual(['0', '0-0', '1']);
        expect(data.map((item) => Boolean(item._isLeaf))).toEqual([false, true, true]);
        expect(generatePath(data[1])).toBe('Asia > Japan');
    });

    it('children 为空数组的节点是叶子', () => {
        const data = _generateTreeData([{ label: 'Asia', value: 'asia', key: '0', children: [] }]);
        expect(data[0]._isLeaf).toBe(true);
    });
});

describe('treeList 内部字段与使用方字段', () => {
    const treeWithPath = () => [
        {
            label: 'Asia',
            value: 'asia',
            key: '0',
            path: '/asia',
            isLeaf: false,
            children: [{ label: 'Japan', value: 'jp', key: '0-0', path: '/jp' }],
        },
    ];

    it('节点自带 path 字段时路径仍从根节点算起', () => {
        const data = _generateTreeData(treeWithPath());
        expect(generatePath(data[1])).toBe('Asia > Japan');
        expect(TransferFoundation.getFullPath(data[1], 'treeList', true).map((node) => node.label)).toEqual(['Asia', 'Japan']);
    });

    it('输出给 onChange 的条目保留使用方的 path，且没有内部字段', () => {
        const [, japan] = _generateTreeData(treeWithPath());
        const { items } = getValuesAndItemsFromMap(new Map([[japan.key, japan]]), 'treeList', false);
        expect(items[0]).toEqual({ label: 'Japan', value: 'jp', key: '0-0', path: '/jp' });
    });
});

describe('左侧列表视图派生', () => {
    const data = _generateTreeData(tree());
    data.push({ label: 'Off', value: 'off', key: '2', disabled: true, _isLeaf: true });

    it('getFilterData 无搜索结果时返回全部，有则按键过滤', () => {
        expect(TransferFoundation.getFilterData(data, null)).toBe(data);
        expect(TransferFoundation.getFilterData(data, new Set(['1'])).map((item) => item.key)).toEqual(['1']);
    });

    it('getEnabledItems 排除禁用项，treeList 只取叶子', () => {
        expect(TransferFoundation.getEnabledItems(data, 'list').map((item) => item.key)).toEqual(['0', '0-0', '1']);
        expect(TransferFoundation.getEnabledItems(data, 'treeList').map((item) => item.key)).toEqual(['0-0', '1']);
    });

    it('getLeafCount 仅 treeList 有值', () => {
        expect(TransferFoundation.getLeafCount(data, 'treeList')).toBe(3);
        expect(TransferFoundation.getLeafCount(data, 'list')).toBeUndefined();
    });

    it('getCurrentPage 优先受控页并夹取到页数内，getPageSize 取默认值', () => {
        expect(TransferFoundation.getPageSize(undefined)).toBe(10);
        expect(TransferFoundation.getTotalPage({ pageSize: 2 }, 5)).toBe(3);
        expect(TransferFoundation.getCurrentPage({ pageSize: 2 }, 5, 3)).toBe(2);
        expect(TransferFoundation.getCurrentPage({ pageSize: 2, currentPage: 1 }, 5, 3)).toBe(1);
        expect(TransferFoundation.getCurrentPage(undefined, 3, 0)).toBe(1);
    });
});

describe('TransferFoundation 静态辅助函数', () => {
    const items = [
        { label: 'apple', value: 'a', key: 1 },
        { label: 'banana', value: 'b', key: 2 },
    ];

    it('getData 把缺失的 dataSource 视为空，并展平分组', () => {
        expect(getData(undefined, 'list')).toEqual([]);
        expect(getData([{ title: 'G', children: items }], 'groupList')).toEqual(items.map((item) => ({ ...item, _parent: { title: 'G' } })));
    });

    it('getData 把未写 children 的分组视为空分组，同组的项共享同一个 _parent', () => {
        const data = getData([{ title: 'Empty' }, { title: 'G', children: items }], 'groupList');
        expect(data.map((item) => item.key)).toEqual([1, 2]);
        expect(data[0]._parent).toBe(data[1]._parent);
    });

    it('getSelectedItems 按当前数据解析受控值或非受控值，保持值的顺序并忽略不存在的值', () => {
        expect([...getSelectedItems(['b', 'x'], items, ['a']).keys()]).toEqual([2]);
        expect(getSelectedItems(undefined, items, ['b', 'a'])).toEqual(
            new Map([
                [2, items[1]],
                [1, items[0]],
            ])
        );
    });

    it('getSelectedItems 在多个条目的 value 相同时取第一个，缺失的 value 跳过，顺序跟随 value', () => {
        const data = [
            { label: 'first', value: 'x', key: 1 },
            { label: 'second', value: 'x', key: 2 },
            { label: 'other', value: 'y', key: 3 },
        ];
        expect([...getSelectedItems(['y', 'missing', 'x'], data, []).values()]).toEqual([data[2], data[0]]);
    });

    it('getSearchResult 使用自定义过滤器、默认不区分大小写的匹配，或 treeList 下的全部节点', () => {
        expect(getSearchResult(items, 'an', undefined, 'list')).toEqual(new Set([2]));
        expect(getSearchResult(items, 'AN', undefined, 'list')).toEqual(new Set([2]));
        expect(getSearchResult(items, 'A', (input, item) => item.value === input.toLowerCase(), 'list')).toEqual(new Set([1]));
        expect(getSearchResult(items, 'zzz', undefined, 'treeList')).toEqual(new Set([1, 2]));
    });

    it('toPublicItem 按类型去掉内部字段，showPath 时添加 fullPath', () => {
        expect(TransferFoundation.toPublicItem({ ...items[0], _parent: { title: 'G' } }, 'groupList', false)).toEqual(items[0]);
        const [, japan] = _generateTreeData(tree());
        const publicItem = TransferFoundation.toPublicItem(japan, 'treeList', true);
        expect(publicItem).not.toHaveProperty('_path');
        expect(publicItem).not.toHaveProperty('_isLeaf');
        expect(publicItem.fullPath.map((node) => node.label)).toEqual(['Asia', 'Japan']);
    });

    it('getValuesAndItemsFromMap 对分组去掉 _parent，showPath 时添加 fullPath', () => {
        const grouped = new Map([[1, { ...items[0], _parent: { title: 'G' } }]]);
        expect(getValuesAndItemsFromMap(grouped, 'groupList', false)).toEqual({ values: ['a'], items: [items[0]] });

        const [, japan] = _generateTreeData(tree());
        const { items: treeItems } = getValuesAndItemsFromMap(new Map([[japan.key, japan]]), 'treeList', true);
        expect(treeItems[0].fullPath.map((node) => node.label)).toEqual(['Asia', 'Japan']);
        expect(getValuesAndItemsFromMap(new Map([[japan.key, japan]]), 'treeList', false).items[0]).not.toHaveProperty('fullPath');
    });
});
