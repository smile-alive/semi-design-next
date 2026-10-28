import { describe, expect, it } from 'vite-plus/test';
import {
    calcCheckedKeysForChecked,
    calcCheckedKeysForUnchecked,
    calcDisabledKeys,
    calcDropActualPosition,
    calcExpandedKeys,
    calcExpandedKeysForValues,
    calcMotionKeys,
    convertDataToEntities,
    convertJsonToData,
    matchTreeNode,
    filterTreeData,
    findAncestorKeys,
    findDescendantKeys,
    findKeysForValues,
    findSiblingKeys,
    flattenTreeData,
    getFilterProp,
    getPosition,
    getValueOrKey,
    normalizeKeyList,
} from '../tree-util';

const sorted = (keys: Iterable<string>) => [...keys].sort();

const treeData = [
    {
        key: 'root',
        label: 'Root',
        value: 'root',
        children: [
            {
                key: 'g1',
                label: 'G1',
                value: 'g1',
                children: [
                    { key: 'a1', label: 'A1', value: 'a1' },
                    { key: 'a2', label: 'A2', value: 'a2', disabled: true },
                    { key: 'a3', label: 'A3', value: 'a3' },
                ],
            },
            {
                key: 'g2',
                label: 'G2',
                value: 'g2',
                children: [
                    { key: 'b1', label: 'B1', value: 'b1' },
                    { key: 'b2', label: 'B2', value: 'b2' },
                ],
            },
        ],
    },
];
const { keyEntities, valueEntities, posEntities } = convertDataToEntities(treeData);

describe('convertDataToEntities', () => {
    it('按位置、key、value 建立索引，并串起父子关系', () => {
        expect(Object.keys(posEntities)).toEqual(['0-0', '0-0-0', '0-0-0-0', '0-0-0-1', '0-0-0-2', '0-0-1', '0-0-1-0', '0-0-1-1']);
        expect(keyEntities['a2'].parent.key).toBe('g1');
        expect(keyEntities['a2'].level).toBe(2);
        expect(keyEntities['root'].parent).toBeUndefined();
        expect(keyEntities['g2'].children.map((child: { key: string }) => child.key)).toEqual(['b1', 'b2']);
        expect(valueEntities['b2']).toBe('b2');
    });

    it('keyMaps 改名后按映射字段取 key、value 和子节点', () => {
        const entities = convertDataToEntities([{ id: 'p', val: 'pv', kids: [{ id: 'c', val: 'cv' }] }], {
            key: 'id',
            value: 'val',
            children: 'kids',
        });
        expect(Object.keys(entities.keyEntities)).toEqual(['p', 'c']);
        expect(entities.valueEntities).toEqual({ pv: 'p', cv: 'c' });
        expect(entities.keyEntities['c'].parent.key).toBe('p');
    });

    it('节点没有 key 时用位置兜底', () => {
        const entities = convertDataToEntities([{ label: 'x', children: [{ label: 'y' }] }]);
        expect(Object.keys(entities.keyEntities)).toEqual(['0-0', '0-0-0']);
    });
});

describe('convertJsonToData', () => {
    it('多层对象转成带路径 key 的节点，叶子的 value 为原值', () => {
        const data = convertJsonToData({ Asia: { China: { Beijing: 'bj' }, Japan: 'jp' }, Europe: 'eu' });
        expect(data.map((node) => node.key)).toEqual(['Asia', 'Europe']);
        expect(data[0].children.map((node: { key: string }) => node.key)).toEqual(['Asia_SEMI_TREE_SPLIT_China', 'Asia_SEMI_TREE_SPLIT_Japan']);
        expect(data[0].children[0].children[0]).toEqual({
            key: 'Asia_SEMI_TREE_SPLIT_China_SEMI_TREE_SPLIT_Beijing',
            label: 'Beijing',
            value: 'bj',
        });
        expect(data[1].children).toBeUndefined();
    });
});

describe('flattenTreeData', () => {
    it('只展开 expandedKeys 中节点的子节点，isEnd 记录每一层是否为最后一个', () => {
        const flat = flattenTreeData(treeData, new Set(['root', 'g1']), undefined);
        expect(flat.map((node) => node.key)).toEqual(['root', 'g1', 'a1', 'a2', 'a3', 'g2']);
        const root = flat[0];
        expect(root.children.map((node: { key: string }) => node.key)).toEqual(['g1', 'g2']);
        const g1 = root.children[0];
        expect(g1.children.map((node: { key: string }) => node.key)).toEqual(['a1', 'a2', 'a3']);
        expect(g1.children[2].isEnd).toEqual([true, false, true]);
        expect(root.children[1].children).toEqual([]);
    });

    it('treeData 为 undefined 时返回空列表', () => {
        expect(flattenTreeData(undefined as never, new Set(), undefined)).toEqual([]);
    });

    it('keyMaps 改名后把映射字段还原成标准字段名', () => {
        const flat = flattenTreeData([{ id: 'p', title: 'P', kids: [{ id: 'c', title: 'C' }] }], new Set(['p']), {
            key: 'id',
            label: 'title',
            children: 'kids',
        });
        expect(flat[0]).toMatchObject({ key: 'p', label: 'P', pos: '0-0' });
        expect(flat[0].children[0]).toMatchObject({ key: 'c', label: 'C', pos: '0-0-0' });
    });

    it('filteredShownKeys 限制只保留命中的节点', () => {
        const flat = flattenTreeData(treeData, new Set(['root', 'g1']), undefined, new Set(['root', 'g1']));
        expect(flat.map((node) => node.key)).toEqual(['root', 'g1']);
        expect(flat[0].children.map((node: { key: string }) => node.key)).toEqual(['g1', 'g2']);
    });

    it('getPosition 在父节点 pos 后拼接下标', () => {
        expect(getPosition('0-1', 2)).toBe('0-1-2');
    });
});

describe('find*Keys', () => {
    it('findDescendantKeys 含自身或不含自身，多层展开', () => {
        expect(sorted(findDescendantKeys(['g1'], keyEntities))).toEqual(['a1', 'a2', 'a3', 'g1']);
        expect(sorted(findDescendantKeys(['root'], keyEntities, false))).toEqual(['a1', 'a2', 'a3', 'b1', 'b2', 'g1', 'g2']);
        expect(findDescendantKeys(['ghost'], keyEntities)).toEqual(['ghost']);
    });

    it('findAncestorKeys 由近到远，含自身时放在末尾', () => {
        expect(findAncestorKeys(['a1'], keyEntities, false)).toEqual(['g1', 'root']);
        expect(findAncestorKeys(['a1'], keyEntities)).toEqual(['g1', 'root', 'a1']);
        expect(findAncestorKeys(['ghost'], keyEntities, false)).toEqual([]);
    });

    it('findSiblingKeys 含或不含自身，并跳过未知 key', () => {
        expect(findSiblingKeys(['a1'], keyEntities)).toEqual(['a1', 'a2', 'a3']);
        expect(findSiblingKeys(['a1'], keyEntities, false)).toEqual(['a2', 'a3']);
        expect(findSiblingKeys(['ghost', 'root'], keyEntities)).toEqual([]);
    });

    it('findKeysForValues 单选只取第一个，未知 value 当作 key 保留，空值丢弃', () => {
        expect(findKeysForValues(['b1', 'b2'], valueEntities)).toEqual(['b1']);
        expect(findKeysForValues(['b1', 'ghost', ''], valueEntities, true)).toEqual(['b1', 'ghost']);
        expect(findKeysForValues(null, valueEntities)).toEqual([]);
        expect(findKeysForValues('x', {})).toEqual(['x']);
    });
});

describe('选中状态推导', () => {
    it('calcCheckedKeysForChecked 逐个勾选兄弟，最后一个勾选后父节点从半选变为选中', () => {
        let state = { checkedKeys: new Set<string>(), halfCheckedKeys: new Set<string>() };
        state = calcCheckedKeysForChecked('b1', keyEntities, state.checkedKeys, state.halfCheckedKeys);
        expect(sorted(state.checkedKeys)).toEqual(['b1']);
        expect(sorted(state.halfCheckedKeys)).toEqual(['g2', 'root']);
        state = calcCheckedKeysForChecked('b2', keyEntities, state.checkedKeys, state.halfCheckedKeys);
        expect(sorted(state.checkedKeys)).toEqual(['b1', 'b2', 'g2']);
        expect(sorted(state.halfCheckedKeys)).toEqual(['root']);
    });

    it('含禁用节点的分组：勾选其余兄弟后父节点不会选中，禁用节点勾选后才选中', () => {
        let state = { checkedKeys: new Set<string>(), halfCheckedKeys: new Set<string>() };
        for (const key of ['a1', 'a3']) {
            state = calcCheckedKeysForChecked(key, keyEntities, state.checkedKeys, state.halfCheckedKeys);
        }
        expect(sorted(state.checkedKeys)).toEqual(['a1', 'a3']);
        expect(sorted(state.halfCheckedKeys)).toEqual(['g1', 'root']);
        state = calcCheckedKeysForChecked('a2', keyEntities, state.checkedKeys, state.halfCheckedKeys);
        expect(sorted(state.checkedKeys)).toEqual(['a1', 'a2', 'a3', 'g1']);
    });

    it('calcCheckedKeysForUnchecked 取消一个子节点后祖先降为半选，取消最后一个后全部清空', () => {
        const all = new Set(['a1', 'a2', 'a3', 'g1']);
        const half = new Set(['root']);
        const first = calcCheckedKeysForUnchecked('a1', keyEntities, new Set(all), new Set(half));
        expect(sorted(first.checkedKeys)).toEqual(['a2', 'a3']);
        expect(sorted(first.halfCheckedKeys)).toEqual(['g1', 'root']);
        const second = calcCheckedKeysForUnchecked('a2', keyEntities, first.checkedKeys, first.halfCheckedKeys);
        const third = calcCheckedKeysForUnchecked('a3', keyEntities, second.checkedKeys, second.halfCheckedKeys);
        expect(sorted(third.checkedKeys)).toEqual([]);
        expect(sorted(third.halfCheckedKeys)).toEqual([]);
    });

    it('calcDisabledKeys 禁用节点及其后代被视为禁用，使用 keyMaps.disabled 字段', () => {
        expect(sorted(calcDisabledKeys(keyEntities))).toEqual(['a2']);
        const mapped = convertDataToEntities([{ key: 'p', off: true, children: [{ key: 'c' }] }, { key: 'q' }], {});
        expect(sorted(calcDisabledKeys(mapped.keyEntities, { disabled: 'off' }))).toEqual(['c', 'p']);
    });

    it('normalizeKeyList 去掉父节点已选中的后代；leafOnly 只保留叶子；keepUnknownKeys 保留未知 key', () => {
        expect(normalizeKeyList(['g1', 'a1', 'b1'], keyEntities)).toEqual(['g1', 'b1']);
        expect(normalizeKeyList(['g1', 'a1', 'ghost'], keyEntities, true)).toEqual(['a1']);
        expect(normalizeKeyList(['g1', 'ghost'], keyEntities, false, true)).toEqual(['g1', 'ghost']);
        expect(normalizeKeyList(['a1', 'ghost'], keyEntities, true, true)).toEqual(['a1', 'ghost']);
    });
});

describe('展开状态推导', () => {
    it('calcExpandedKeys 默认带上祖先，autoExpandParent 为 false 时只用给定 key', () => {
        expect(sorted(calcExpandedKeys(['a1'], keyEntities))).toEqual(['a1', 'g1', 'root']);
        expect(sorted(calcExpandedKeys(['a1'], keyEntities, false))).toEqual(['a1']);
        expect(sorted(calcExpandedKeys('g2' as never, keyEntities, false))).toEqual(['g2']);
    });

    it('calcExpandedKeysForValues 由 value 找到 key 后只展开祖先', () => {
        expect(sorted(calcExpandedKeysForValues(['b1'], keyEntities, true, valueEntities))).toEqual(['g2', 'root']);
        expect(sorted(calcExpandedKeysForValues('ghost', keyEntities, false, valueEntities))).toEqual([]);
    });

    it('calcMotionKeys 只有恰好增减一个 key 时返回动画节点', () => {
        expect(calcMotionKeys(new Set(['root']), new Set(['root', 'g1']), keyEntities)).toEqual({
            motionType: 'show',
            motionKeys: ['a1', 'a2', 'a3'],
        });
        expect(calcMotionKeys(new Set(['root', 'g1']), new Set(['root']), keyEntities)).toEqual({
            motionType: 'hide',
            motionKeys: ['a1', 'a2', 'a3'],
        });
        expect(calcMotionKeys(new Set(['root']), new Set(['root', 'g1', 'g2']), keyEntities)).toEqual({
            motionType: 'show',
            motionKeys: [],
        });
    });
});

describe('搜索', () => {
    it('matchTreeNode 布尔值不区分大小写，函数值把 filterProps 指向的字段交给回调', () => {
        expect(matchTreeNode('a', { label: 'ABC' }, true, 'label')).toBe(true);
        expect(matchTreeNode('z', { label: 'ABC' }, true, 'label')).toBe(false);
        expect(matchTreeNode('z', { label: 'ABC' }, false, 'label')).toBe(true);
        const fn = (input: string, target: string) => target === input;
        expect(matchTreeNode('abc', { label: 'abc' }, fn, 'label')).toBe(true);
    });

    it('getFilterProp 默认的 label 跟随 keyMaps.label', () => {
        expect(getFilterProp('label', { label: 'title' })).toBe('title');
        expect(getFilterProp('value', { label: 'title' })).toBe('value');
        expect(getFilterProp('label')).toBe('label');
    });

    it('filterTreeData 命中节点的祖先被展开，showFilteredOnly 只保留命中节点、祖先与后代', () => {
        const base = {
            keyEntities,
            inputValue: 'B1',
            treeData,
            filterTreeNode: true,
            filterProps: 'label',
            prevExpandedKeys: [],
            keyMaps: undefined,
        };
        const all = filterTreeData({ ...base, showFilteredOnly: false });
        expect(sorted(all.filteredKeys)).toEqual(['b1']);
        expect(sorted(all.filteredExpandedKeys)).toEqual(['g2', 'root']);
        expect(all.flattenNodes.map((node: { key: string }) => node.key)).toEqual(['root', 'g1', 'g2', 'b1', 'b2']);
        const only = filterTreeData({ ...base, showFilteredOnly: true });
        expect(sorted(only.filteredShownKeys)).toEqual(['b1', 'g2', 'root']);
        expect(only.flattenNodes.map((node: { key: string }) => node.key)).toEqual(['root', 'g2', 'b1']);
    });

    it('filterTreeData 把仍存在的 prevExpandedKeys 合并进展开集合，丢弃已不存在的', () => {
        const result = filterTreeData({
            keyEntities,
            inputValue: 'B1',
            treeData,
            filterTreeNode: true,
            filterProps: 'label',
            prevExpandedKeys: ['g1', 'gone'],
            keyMaps: undefined,
            showFilteredOnly: false,
        });
        expect(sorted(result.filteredExpandedKeys)).toEqual(['g1', 'g2', 'root']);
    });
});

describe('值与拖拽', () => {
    it('getValueOrKey 没有 value 时回落到 key，数组逐项处理，keyMaps 改名后读映射字段', () => {
        expect(getValueOrKey({ key: 'k' })).toBe('k');
        expect(getValueOrKey([{ key: 'k', value: 'v' }, { key: 'k2' }])).toEqual(['v', 'k2']);
        expect(getValueOrKey({ id: 'i', val: 'v' }, { key: 'id', value: 'val' })).toBe('v');
        expect(getValueOrKey({ id: 'i' }, { key: 'id', value: 'val' })).toBe('i');
    });

    it('calcDropActualPosition 在目标下标上叠加相对位置', () => {
        expect(calcDropActualPosition('0-0-2', -1)).toBe(1);
        expect(calcDropActualPosition('0-0-2', 0)).toBe(2);
        expect(calcDropActualPosition('0-0-2', 1)).toBe(3);
    });
});
