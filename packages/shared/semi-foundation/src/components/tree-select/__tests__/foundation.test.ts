import { describe, expect, it } from 'vite-plus/test';
import type { BasicKeyEntities } from '../../tree/foundation';
import { convertDataToEntities } from '../../tree/tree-util';
import TreeSelectFoundation from '../foundation';

const { keyEntities } = convertDataToEntities([
    {
        key: 'p',
        label: 'P',
        children: [
            { key: 'a', label: 'A', name: 'Name A' },
            { key: 'b', label: 'B', disabled: true },
        ],
    },
]);
const state = { keyEntities, selectedKeys: ['a'], checkedKeys: new Set(['p', 'a', 'b']), realCheckedKeys: new Set(['b']) };

describe('TreeSelect 触发器的选中值', () => {
    it('getTriggerKeys 单选取 selectedKeys，unRelated 取 realCheckedKeys，合并时收拢到父节点，leafOnly 时只留叶子', () => {
        expect(TreeSelectFoundation.getTriggerKeys({ multiple: false }, state)).toEqual(['a']);
        expect(TreeSelectFoundation.getTriggerKeys({ multiple: true, checkRelation: 'unRelated' }, state)).toEqual(['b']);
        expect(TreeSelectFoundation.getTriggerKeys({ multiple: true, autoMergeValue: true }, state)).toEqual(['p']);
        expect(TreeSelectFoundation.getTriggerKeys({ multiple: true, autoMergeValue: false, leafOnly: true }, state).sort()).toEqual(['a', 'b']);
        expect(TreeSelectFoundation.getTriggerKeys({ multiple: true, autoMergeValue: false }, state)).toEqual(['p', 'a', 'b']);
    });

    it('hasValue 按选择模式与关系读取对应的键', () => {
        const empty = { selectedKeys: [], checkedKeys: new Set<string>(), realCheckedKeys: new Set<string>() };
        expect(TreeSelectFoundation.hasValue({ multiple: false }, state)).toBe(true);
        expect(TreeSelectFoundation.hasValue({ multiple: false }, empty)).toBe(false);
        expect(TreeSelectFoundation.hasValue({ multiple: true }, { ...empty, realCheckedKeys: state.realCheckedKeys })).toBe(false);
        expect(TreeSelectFoundation.hasValue({ multiple: true }, { ...empty, checkedKeys: state.checkedKeys })).toBe(true);
        expect(TreeSelectFoundation.hasValue({ multiple: true, checkRelation: 'unRelated' }, { ...empty, checkedKeys: state.checkedKeys })).toBe(false);
        expect(TreeSelectFoundation.hasValue({ multiple: true, checkRelation: 'unRelated' }, { ...empty, realCheckedKeys: state.realCheckedKeys })).toBe(true);
    });

    it('isClearable 在有值，或触发器搜索位置有搜索文字时为 true，禁用或不显示清除按钮时为 false', () => {
        const empty = { inputValue: '', selectedKeys: [], checkedKeys: new Set<string>(), realCheckedKeys: new Set<string>() };
        const props = { showClear: true, multiple: false };
        expect(TreeSelectFoundation.isClearable(props, empty)).toBe(false);
        expect(TreeSelectFoundation.isClearable(props, { ...empty, selectedKeys: ['a'] })).toBe(true);
        expect(TreeSelectFoundation.isClearable(props, { ...empty, inputValue: 'x' })).toBe(false);
        expect(TreeSelectFoundation.isClearable({ ...props, searchPosition: 'trigger' }, { ...empty, inputValue: 'x' })).toBe(true);
        expect(TreeSelectFoundation.isClearable({ ...props, disabled: true }, { ...empty, selectedKeys: ['a'] })).toBe(false);
        expect(TreeSelectFoundation.isClearable({ ...props, showClear: false }, { ...empty, selectedKeys: ['a'] })).toBe(false);
    });
});

describe('TreeSelect 标签', () => {
    it('getNodeLabel 依次读 keyMaps.label 与 treeNodeLabelProp', () => {
        const item = (keyEntities as BasicKeyEntities).a.data;
        expect(TreeSelectFoundation.getNodeLabel(item, { treeNodeLabelProp: 'label' })).toBe('A');
        expect(TreeSelectFoundation.getNodeLabel(item, { treeNodeLabelProp: 'label', keyMaps: { label: 'name' } })).toBe('Name A');
        expect(TreeSelectFoundation.getNodeLabel(item, { treeNodeLabelProp: 'title' })).toBeNull();
    });

    it('isTagClosable 在组件禁用、节点禁用、disableStrictly 下的禁用键上为 false', () => {
        const tagState = { keyEntities, disabledKeys: new Set(['p']) };
        expect(TreeSelectFoundation.isTagClosable('a', {}, tagState)).toBe(true);
        expect(TreeSelectFoundation.isTagClosable('x', {}, tagState)).toBe(true);
        expect(TreeSelectFoundation.isTagClosable('a', { disabled: true }, tagState)).toBe(false);
        expect(TreeSelectFoundation.isTagClosable('b', {}, tagState)).toBe(false);
        expect(TreeSelectFoundation.isTagClosable('p', {}, tagState)).toBe(true);
        expect(TreeSelectFoundation.isTagClosable('p', { disableStrictly: true }, tagState)).toBe(false);
    });
});
