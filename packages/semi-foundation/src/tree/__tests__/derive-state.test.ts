import { describe, expect, it } from 'vite-plus/test';
import TreeSelectFoundation, { type BasicTreeSelectInnerData } from '@fibrae/semi-foundation/tree-select/foundation';
import TreeFoundation, { type BasicTreeInnerData } from '../foundation';

const keyMaps = { key: 'key', label: 'label', value: 'value', children: 'children', disabled: 'disabled' };
const treeData = [{ key: 'a', label: 'A', value: 'a' }];

// Vue hands the same props object over every time and mutates it in place
describe.each([
    ['Tree', TreeFoundation],
    ['TreeSelect', TreeSelectFoundation],
])('%s 在 props 对象被修改后的 deriveState', (_name, Foundation) => {
    it('同一 props 对象变化后重新推导', () => {
        const props = { keyMaps, treeData, multiple: false, value: 'a' };
        const initial = { prevProps: null, inputValue: '' } as unknown as BasicTreeInnerData & BasicTreeSelectInnerData;
        const first = { ...initial, ...Foundation.deriveState(props, initial) } as typeof initial;

        props.value = 'b';
        const second = Foundation.deriveState(props, first);

        expect(second).not.toBeNull();
        expect(second.prevProps.value).toBe('b');
    });

    it('getInitialState 从空状态推导出 props 指定的展开与选中', () => {
        const props = { treeData: [{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 'c' }] }], defaultExpandAll: true, multiple: false, value: 'c' };
        const state = Foundation.getInitialState(props) as BasicTreeInnerData & BasicTreeSelectInnerData;
        expect([...state.expandedKeys]).toEqual(['p', 'c']);
        expect(state.flattenNodes.map((node) => node.key)).toEqual(['p', 'c']);
        expect(state.selectedKeys).toEqual(['c']);
        expect(state.prevProps).toEqual(props);
        expect(Foundation.deriveState(props, state)).toBeNull();
    });
});

type InnerData = BasicTreeInnerData;
const mappedKeyMaps = { key: 'id', label: 'name', value: 'id', children: 'kids' };
const mappedTree = [
    { id: 'fruit', name: 'Fruit', kids: [{ id: 'apple', name: 'Apple' }] },
    { id: 'veg', name: 'Vegetable', kids: [{ id: 'bean', name: 'Bean' }] },
];

function derive(props: Record<string, unknown>, prev: InnerData): InnerData {
    return { ...prev, ...TreeFoundation.deriveState(props, prev) };
}
const keysOf = (state: InnerData) => state.flattenNodes.map((node) => node.key);

describe('Tree deriveState 的搜索与展开', () => {
    const initial = {
        prevProps: null,
        inputValue: '',
        expandedKeys: new Set<string>(),
        filteredExpandedKeys: new Set<string>(),
        filteredShownKeys: new Set<string>(),
    } as unknown as InnerData;

    it.each([
        [
            '默认 keyMaps',
            undefined,
            'label',
            [
                { key: 'a', label: 'Apple' },
                { key: 'b', label: 'Banana' },
            ],
        ],
        [
            '自定义 keyMaps',
            mappedKeyMaps,
            'name',
            [
                { id: 'a', name: 'Apple' },
                { id: 'b', name: 'Banana' },
            ],
        ],
    ])('%s：搜索期间 treeData 引用变化后，仍按 keyMaps 映射的字段过滤', (_name, maps, labelField, data) => {
        const props = {
            keyMaps: maps,
            treeData: data,
            filterTreeNode: true,
            showFilteredOnly: true,
            treeNodeFilterProp: 'label',
        };
        const first = derive(props, initial);
        const searching = { ...first, inputValue: 'Ban' };
        const next = derive({ ...props, treeData: [...data, { ...data[1], [labelField]: 'Banner', [maps ? 'id' : 'key']: 'c' }] }, searching);
        expect(next.flattenNodes.map((node) => node.label)).toEqual(['Banana', 'Banner']);
    });

    it('受控 expandedKeys 为空时，清空关键词后只显示根节点；控制方给出的 key 展开其子节点', () => {
        const props = {
            keyMaps: mappedKeyMaps,
            treeData: mappedTree,
            filterTreeNode: true,
            expandedKeys: [] as string[],
        };
        const first = derive(props, initial);
        const searching = derive(props, { ...first, inputValue: 'Apple' });
        const cleared = derive({ ...props, expandedKeys: [] }, { ...searching, inputValue: '' });
        expect(keysOf({ ...searching, ...cleared })).toEqual(['fruit', 'veg']);
        const opened = derive(
            { ...props, expandedKeys: ['veg'] },
            {
                ...searching,
                ...cleared,
                inputValue: '',
            }
        );
        expect(keysOf(opened)).toEqual(['fruit', 'veg', 'bean']);
    });
});
