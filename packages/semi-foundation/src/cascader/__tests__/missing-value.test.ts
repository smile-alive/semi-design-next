import { describe, expect, it } from 'vite-plus/test';
import CascaderFoundation, { type BasicCascaderProps } from '../foundation';

const treeData = [{ label: 'A', value: 'a', children: [{ label: 'A1', value: 'a1' }] }];

describe('CascaderFoundation 选中 treeData 中没有的值', () => {
    const props = { treeData, value: ['x', 'y'], separator: ' / ' } as unknown as BasicCascaderProps;
    const state = CascaderFoundation.getInitialState(props);
    const [selectedKey] = state.selectedKeys;

    it('占位实体不带下划线键', () => {
        const entity = state.keyEntities[selectedKey];
        expect(entity.data).toStrictEqual({ label: 'y', value: 'y' });
        for (const item of Object.values(state.keyEntities)) {
            expect(Object.keys(item).filter((key) => key.startsWith('_'))).toEqual([]);
        }
    });

    it('选中路径仍显示原值，顶层与搜索结果不含占位实体', () => {
        expect(CascaderFoundation.getItemPropPath(selectedKey, 'label', state.keyEntities)).toEqual(['x', 'y']);
        expect(CascaderFoundation.getRenderData(props, state).map((item) => (item as { key: string }).key)).toEqual(['a']);
    });
});
