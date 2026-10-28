import { describe, expect, it } from 'vite-plus/test';
import type { CheckRelation } from '../foundation';
import { buildRowProps, calcCheckedStatus, calcRelatedCheckedKeys, getDataForKeyNotInKeyEntities, getMultipleSelectResult, getTransitionNodes, getTreeLabelClassMap, getTreeNodeProps, getTreeRowAria, getTreeRowClassMap, nodeId, sameKeys } from '../shared';
import { convertDataToEntities, flattenTreeData } from '../tree-util';

const treeData = [
    {
        key: 'p',
        label: 'P',
        children: [
            { key: 'a', label: 'A' },
            { key: 'b', label: 'B', disabled: true },
            { key: 'c', label: 'C' },
        ],
    },
];
const { keyEntities } = convertDataToEntities(treeData);
const state = (checked: string[] = [], realChecked: string[] = []) => ({
    keyEntities,
    checkedKeys: new Set(checked),
    halfCheckedKeys: new Set<string>(),
    realCheckedKeys: new Set(realChecked),
    disabledKeys: new Set(['b']),
});

describe('tree 共享逻辑', () => {
    it('getDataForKeyNotInKeyEntities 依次从 keyMaps、treeNodeLabelProp、label 构建标签', () => {
        expect(getDataForKeyNotInKeyEntities('x', {})).toEqual({ key: 'x', label: 'x' });
        expect(getDataForKeyNotInKeyEntities('x', { treeNodeLabelProp: 'name' })).toEqual({ key: 'x', name: 'x' });
        expect(getDataForKeyNotInKeyEntities('x', { treeNodeLabelProp: 'name', keyMaps: { key: 'id', label: 'title' } })).toEqual({ id: 'x', title: 'x' });
    });

    it('getDataForKeyNotInKeyEntities 通过 onChangeWithObject 找到对象值', () => {
        const node = { key: 'x', value: 'X', label: 'Ex' };
        expect(getDataForKeyNotInKeyEntities('X', { onChangeWithObject: true, value: [node] })).toBe(node);
        expect(getDataForKeyNotInKeyEntities('x', { onChangeWithObject: true, defaultValue: node })).toBe(node);
        expect(getDataForKeyNotInKeyEntities('y', { onChangeWithObject: true, value: node })).toBeUndefined();
    });

    it('calcRelatedCheckedKeys 在 disableStrictly 下保留禁用的后代，并复制输入集合', () => {
        const s = state();
        expect([...calcRelatedCheckedKeys('p', true, false, s).checkedKeys].sort()).toEqual(['a', 'b', 'c', 'p']);
        const strict = calcRelatedCheckedKeys('p', true, true, s);
        expect([...strict.checkedKeys].sort()).toEqual(['a', 'c']);
        expect([...strict.halfCheckedKeys]).toEqual(['p']);
        expect(s.checkedKeys.size).toBe(0);
        const unchecked = calcRelatedCheckedKeys('p', false, true, state(['a', 'b', 'c', 'p']));
        expect([...unchecked.checkedKeys]).toEqual(['b']);
    });

    it('calcCheckedStatus 所有未禁用的后代都选中后取消选中', () => {
        expect(calcCheckedStatus(true, 'p', state())).toBe(true);
        expect(calcCheckedStatus(true, 'p', state(['a', 'c']))).toBe(false);
        expect(calcCheckedStatus(false, 'p', state())).toBe(false);
    });

    it('getMultipleSelectResult 对 unRelated 切换 realCheckedKeys，未知关系返回 null', () => {
        const props = { checkRelation: 'unRelated' } as const;
        const added = getMultipleSelectResult({ eventKey: 'a' }, props, state([], ['c']));
        expect(added).toEqual({
            targetStatus: true,
            keys: ['c', 'a'],
            state: { realCheckedKeys: new Set(['c', 'a']) },
        });
        const removed = getMultipleSelectResult({ eventKey: 'c' }, props, state([], ['c']));
        expect(removed.targetStatus).toBe(false);
        expect(removed.keys).toEqual([]);
        const unknownRelation = 'other' as unknown as CheckRelation;
        expect(getMultipleSelectResult({ eventKey: 'a' }, { checkRelation: unknownRelation }, state())).toBeNull();
    });

    it('getTreeNodeProps 标记严格禁用的节点，并按关系读取选中键', () => {
        const s = { ...state(['a'], ['c']), keyEntities };
        expect(getTreeNodeProps('missing', s, {})).toBeNull();
        expect(getTreeNodeProps('a', s, { checkRelation: 'related' }).checked).toBe(true);
        expect(getTreeNodeProps('a', s, { checkRelation: 'unRelated' }).checked).toBe(false);
        expect(getTreeNodeProps('c', s, { checkRelation: 'unRelated' }).checked).toBe(true);
        expect(getTreeNodeProps('b', s, { disableStrictly: true }).disabled).toBe(true);
        expect(getTreeNodeProps('b', s, {}).disabled).toBeUndefined();
    });

    it('getTreeNodeProps 在 showFilteredOnly 搜索时按可见兄弟计算 setsize 与 posinset', () => {
        const data = [...treeData, { key: 'q', label: 'Q' }, { key: 'r', label: 'R' }];
        const entities = convertDataToEntities(data).keyEntities;
        const s = { keyEntities: entities, treeData: data, inputValue: 'C', filteredShownKeys: new Set(['p', 'c']) };
        const place = (key: string, showFilteredOnly: boolean) => {
            const { setsize, posinset } = getTreeNodeProps(key, s, { showFilteredOnly });
            return [posinset, setsize];
        };
        expect(place('c', true)).toEqual([1, 1]);
        expect(place('p', true)).toEqual([1, 1]);
        expect(place('c', false)).toEqual([3, 3]);
        expect(place('q', false)).toEqual([2, 3]);
        expect(getTreeNodeProps('c', { ...s, inputValue: '' }, { showFilteredOnly: true }).setsize).toBe(3);
    });

    it('getTreeNodeProps 在 showFilteredOnly 搜索时每个结果只收集一次根节点，不随行数重复遍历', () => {
        const data = Array.from({ length: 50 }, (_, i) => ({ key: `r${i}`, label: `R${i}` }));
        let scans = 0;
        // Object.values reads the own keys: counting them counts the full scans of keyEntities
        const entities = new Proxy(convertDataToEntities(data).keyEntities, {
            ownKeys: (target) => {
                scans++;
                return Reflect.ownKeys(target);
            },
        });
        const s = { keyEntities: entities, treeData: data, inputValue: 'R', filteredShownKeys: new Set(data.map((node) => node.key)) };
        const places = data.map((node) => getTreeNodeProps(node.key, s, { showFilteredOnly: true })).map(({ posinset, setsize }) => [posinset, setsize]);
        expect(places).toEqual(data.map((_, i) => [i + 1, 50]));
        expect(scans).toBe(1);
    });

    it('buildRowProps 让行状态与按 keyMaps 映射的字段覆盖节点数据，不在树中的 key 返回 null', () => {
        const data = [{ id: 'x', name: 'X', mark: 'M', icon: 'raw', expanded: true, kids: [{ id: 'y', name: 'Y' }] }];
        const keyMaps = { key: 'id', label: 'name', icon: 'mark', children: 'kids' };
        const entities = convertDataToEntities(data, keyMaps).keyEntities;
        const [node] = flattenTreeData(data, new Set(), keyMaps);
        const row = buildRowProps(node, { keyEntities: entities, treeData: data }, { keyMaps });
        expect(row).toMatchObject({ key: 'x', eventKey: 'x', label: 'X', icon: 'M', expanded: false, isEnd: [true], data: data[0] });
        expect(row.children).toBe(data[0].kids);
        expect(buildRowProps({ ...node, key: 'missing' }, { keyEntities: entities }, {})).toBeNull();
        expect(nodeId('tree', 'a b')).toBe('tree-a%20b');
    });

    it('getTreeRowAria 多选时给出 aria-checked，单选时给出 aria-selected，叶子没有 aria-expanded', () => {
        const row = { level: 1, posinset: 2, setsize: 3, checked: true, selected: true, expanded: false };
        expect(getTreeRowAria(row, { disabled: false, isLeaf: false, multiple: true })).toEqual({
            'aria-busy': undefined,
            'aria-checked': true,
            'aria-disabled': false,
            'aria-expanded': false,
            'aria-level': 2,
            'aria-posinset': 2,
            'aria-selected': undefined,
            'aria-setsize': 3,
        });
        expect(getTreeRowAria({ ...row, halfChecked: true, loading: true }, { disabled: true, isLeaf: true, multiple: true })).toMatchObject({ 'aria-busy': true, 'aria-checked': 'mixed', 'aria-disabled': true, 'aria-expanded': undefined });
        expect(getTreeRowAria(row, { disabled: false, isLeaf: false })).toMatchObject({ 'aria-checked': undefined, 'aria-selected': true });
    });

    it('getTreeRowClassMap 与 getTreeLabelClassMap 只给未禁用的行加拖拽类，自定义整行时用 fullLabel 变体', () => {
        const prefix = 'semi-tree-option';
        const row = { eventKey: 'a', level: 0, expanded: false, isEnd: [true] };
        const active = (map: Record<string, boolean | undefined>) => Object.keys(map).filter((name) => map[name]);
        const over = { disabled: false, draggable: true, dragOverNodeKey: 'a', dropPosition: -1 };
        expect(active(getTreeRowClassMap(row, over))).toEqual([prefix, `${prefix}-level-1`, `${prefix}-collapsed`, `${prefix}-draggable`, `${prefix}-tree-node-last-leaf`]);
        expect(active(getTreeLabelClassMap(row, over))).toEqual([`${prefix}-label`, `${prefix}-drag-over-gap-top`]);
        expect(active(getTreeRowClassMap(row, { ...over, fullLabel: true }))).toContain(`${prefix}-fullLabel-drag-over-gap-top`);
        expect(active(getTreeRowClassMap(row, { ...over, disabled: true }))).toEqual([prefix, `${prefix}-level-1`, `${prefix}-collapsed`, `${prefix}-disabled`, `${prefix}-tree-node-last-leaf`]);
        expect(active(getTreeLabelClassMap(row, { ...over, disabled: true }))).toEqual([`${prefix}-label`]);
    });

    it('getTransitionNodes 把动画中的行放进一个数组，置于第一个动画行的位置', () => {
        const nodes = ['a', 'b', 'c', 'd'].map((key) => ({ key }));
        const [a, b, c, d] = nodes;
        expect(getTransitionNodes(nodes, new Set(['b', 'c']), 'show')).toEqual([a, [b, c], d]);
        // collapsing rows come from the list cached before the collapse
        expect(getTransitionNodes([a, d], new Set(['b', 'c']), 'hide', nodes)).toEqual([a, [b, c], d]);
        expect(getTransitionNodes(nodes, new Set(['b']), 'hide')).toEqual([a, [b], c, d]);
        expect(getTransitionNodes([a], new Set(['z']), 'show')).toEqual([[], a]);
    });

    it('sameKeys 按顺序比较 key', () => {
        expect(sameKeys([{ key: 'a' }, { key: 'b' }], [{ key: 'a' }, { key: 'b' }])).toBe(true);
        expect(sameKeys([{ key: 'a' }], [{ key: 'a' }, { key: 'b' }])).toBe(false);
        expect(sameKeys([{ key: 'a' }, { key: 'b' }], [{ key: 'b' }, { key: 'a' }])).toBe(false);
    });
});
