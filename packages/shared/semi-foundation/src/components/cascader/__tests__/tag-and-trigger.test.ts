import { describe, expect, it } from 'vite-plus/test';
import CascaderFoundation, { type BasicCascaderProps } from '../foundation';
import { convertDataToEntities } from '../util';

const keyEntities = convertDataToEntities([
    {
        label: 'A',
        value: 'a',
        children: [
            { label: 'A1', value: 'a1' },
            { label: 'A2', value: 'a2', disabled: true },
        ],
    },
]);
const keyOf = (value: string) => Object.keys(keyEntities).find((key) => keyEntities[key].data.value === value);
const props = (overrides: Partial<BasicCascaderProps> = {}) => overrides as BasicCascaderProps;

describe('Cascader 触发器的选中值与标签', () => {
    it('getTriggerKeys 在 unRelated 或不合并时取 checkedKeys，否则取合并后的键', () => {
        const keys = { checkedKeys: new Set(['p', 'c']), resolvedCheckedKeys: new Set(['p']) };
        expect(CascaderFoundation.getTriggerKeys(props({ checkRelation: 'unRelated', autoMergeValue: true }), keys)).toBe(keys.checkedKeys);
        expect(CascaderFoundation.getTriggerKeys(props({ checkRelation: 'related', autoMergeValue: false, leafOnly: false }), keys)).toBe(keys.checkedKeys);
        expect(CascaderFoundation.getTriggerKeys(props({ checkRelation: 'related', autoMergeValue: true }), keys)).toBe(keys.resolvedCheckedKeys);
        expect(CascaderFoundation.getTriggerKeys(props({ checkRelation: 'related', autoMergeValue: false, leafOnly: true }), keys)).toBe(keys.resolvedCheckedKeys);
    });

    it('isTagClosable 在组件禁用、选项禁用、disableStrictly 下的禁用键和未知键上为 false', () => {
        const a = keyOf('a');
        const a2 = keyOf('a2');
        const state = { keyEntities, disabledKeys: new Set([a]) };
        expect(CascaderFoundation.isTagClosable(a, props(), state)).toBe(true);
        expect(CascaderFoundation.isTagClosable(a, props({ disabled: true }), state)).toBe(false);
        expect(CascaderFoundation.isTagClosable(a2, props(), state)).toBe(false);
        expect(CascaderFoundation.isTagClosable(a, props({ disableStrictly: true }), state)).toBe(false);
        expect(CascaderFoundation.isTagClosable('missing', props(), state)).toBe(false);
    });

    it('isClearable 在有搜索文字或值时为 true，禁用或不显示清除按钮时为 false', () => {
        const empty = { inputValue: '', selectedKeys: new Set<string>(), checkedKeys: new Set<string>(), keyEntities };
        const selected = { ...empty, selectedKeys: new Set([keyOf('a')]) };
        expect(CascaderFoundation.isClearable(props({ showClear: true }), empty)).toBe(false);
        expect(CascaderFoundation.isClearable(props({ showClear: true }), selected)).toBe(true);
        expect(CascaderFoundation.isClearable(props({ showClear: true }), { ...empty, inputValue: 'x' })).toBe(true);
        expect(CascaderFoundation.isClearable(props({ showClear: true, multiple: true }), { ...empty, checkedKeys: new Set([keyOf('a1')]) })).toBe(true);
        expect(CascaderFoundation.isClearable(props({ showClear: true, multiple: true }), selected)).toBe(false);
        expect(CascaderFoundation.isClearable(props({ showClear: true, disabled: true }), selected)).toBe(false);
        expect(CascaderFoundation.isClearable(props({ showClear: false }), selected)).toBe(false);
    });
});
