import { describe, expect, it } from 'vite-plus/test';
import { convertDataToEntities } from '../../tree/tree-util';
import TreeSelectFoundation from '../foundation';

const { keyEntities } = convertDataToEntities([
    {
        key: 'p',
        label: 'P',
        children: [
            { key: 'a', label: 'A' },
            { key: 'b', label: 'B' },
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
});
