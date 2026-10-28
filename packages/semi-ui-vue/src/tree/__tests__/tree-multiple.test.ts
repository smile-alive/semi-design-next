import userEvent from '@testing-library/user-event';
import { fireEvent, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { TreeNodeData } from '..';
import { defaultKeyMaps, getLevelNodes, getNode, optionCls, renderTree as renderBase, specialTreeData, spyOn, treeData } from './fixtures/data';

const treeChildren = treeData[0].children?.[0].children ?? [];

const treeDataWithDisabled: TreeNodeData[] = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: 'China',
                value: 'China',
                key: '0-0',
                children: [
                    { label: 'Beijing', value: 'Beijing', key: '0-0-0', disabled: true },
                    { label: 'Shanghai', value: 'Shanghai', key: '0-0-1', disabled: true },
                ],
            },
            {
                label: 'Japan',
                value: 'Japan',
                key: '0-1',
                children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
            },
        ],
    },
    {
        label: 'North America',
        value: 'North America',
        key: '1',
        children: [
            { label: 'United States', value: 'United States', key: '1-0' },
            { label: 'Canada', value: 'Canada', key: '1-1' },
        ],
    },
];

const innerCheckedCls = `${BASE_CLASS_PREFIX}-checkbox-inner-checked`;
const indeterminateCls = `${BASE_CLASS_PREFIX}-checkbox-indeterminate`;

const renderTree = (props: Record<string, unknown> = {}, haveDisabled = false) => renderBase({ multiple: true, treeData: haveDisabled ? treeDataWithDisabled : treeData, ...props });

const getLabel = (node: Element | null) => node?.querySelector(`.${optionCls}-label-text`)?.textContent;
const isChecked = (node: Element) => node.querySelector(`.${innerCheckedCls}`) !== null;
const isHalfChecked = (node: Element) => node.querySelector(`.${indeterminateCls}`) !== null;
const getCheckedKeys = () => Array.from(document.querySelectorAll('[role="treeitem"][aria-checked="true"]'), (node) => node.getAttribute('data-key'));

describe('Tree 多选', () => {
    it('defaultValue 且叶子节点已勾选', () => {
        const { unmount } = renderTree({ defaultValue: 'Beijing' });
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        renderTree({ defaultValue: ['Dongjing', 'Beijing'] });
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点半选', () => {
        renderTree({ defaultValue: ['Dongjing', 'Beijing'] });
        const level1Nodes = getLevelNodes(1);
        const level2Nodes = getLevelNodes(2);
        expect(isHalfChecked(level1Nodes[0])).toBe(true);
        expect(isHalfChecked(level1Nodes[1])).toBe(false);
        expect(isChecked(level1Nodes[1])).toBe(false);

        expect(isHalfChecked(level2Nodes[0])).toBe(true);
        expect(isHalfChecked(level2Nodes[1])).toBe(true);
        expect(getLabel(level2Nodes[1])).toEqual('日本');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点全选', () => {
        renderTree({ defaultValue: ['Shanghai', 'Beijing'] });
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('defaultValue 且所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTree({ defaultValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'] });
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('defaultValue 且父节点已勾选 => 所有后代全选', () => {
        renderTree({ defaultValue: ['Yazhou'], defaultExpandAll: true });
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
        expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban']);
    });

    it('defaultValue 配合 changeWithObject', () => {
        renderTree({ defaultValue: treeChildren, defaultExpandAll: true, changeWithObject: true });
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(3);
        expect(getCheckedKeys()).toEqual(['zhongguo', 'beijing', 'shanghai']);
    });

    it('选择一个叶子节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        await userEvent.click(getNode('beijing'));
        expect(onSelect).toHaveBeenLastCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing']);
        expect(isChecked(getNode('beijing'))).toBe(true);
        await userEvent.click(getNode('beijing'));
        expect(onSelect).toHaveBeenLastCalledWith('beijing', false, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(isHalfChecked(getNode('beijing'))).toBe(false);
        expect(isChecked(getNode('beijing'))).toBe(false);
    });

    it('选择两个不同分支的叶子节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[2]);
        expect(onSelect).toHaveBeenLastCalledWith('dongjing', true, expect.objectContaining({ key: 'dongjing' }));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Dongjing']);
    });

    it('选择一个分支下的所有叶子节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        expect(onSelect).toHaveBeenLastCalledWith('shanghai', true, expect.objectContaining({ key: 'shanghai' }));
        expect(onChange).toHaveBeenLastCalledWith(['Zhongguo']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('选择所有叶子节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        await userEvent.click(nodelevel3[2]);
        await userEvent.click(nodelevel3[3]);
        expect(onSelect).toHaveBeenLastCalledWith('daban', true, expect.objectContaining({ key: 'daban' }));
        expect(onChange).toHaveBeenLastCalledWith(['Yazhou']);
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
    });

    it('选择父节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(onSelect).toHaveBeenCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(onChange).toHaveBeenCalledWith(['Yazhou']);
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
    });

    it('onChange 与 changeWithObject', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, changeWithObject: true, onChange });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[2]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ label: '北京', value: 'Beijing', key: 'beijing' }), expect.objectContaining({ label: '东京', value: 'Dongjing', key: 'dongjing' })]);
    });

    it('unRelated 关联模式', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onChange, checkRelation: 'unRelated' });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Zhongguo']);
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 value', () => {
        renderTree({ defaultExpandAll: true, checkRelation: 'unRelated', modelValue: 'Zhongguo' });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 defaultValue', () => {
        renderTree({ defaultExpandAll: true, checkRelation: 'unRelated', defaultValue: 'Zhongguo' });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 onSelect', async () => {
        const onSelect = spyOn<'select'>();
        renderTree({ defaultExpandAll: true, onSelect, checkRelation: 'unRelated' });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
    });

    it('受控：叶子节点值显示正确', () => {
        const { unmount } = renderTree({ modelValue: 'Beijing' });
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        renderTree({ modelValue: ['Dongjing', 'Beijing'] });
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('受控：叶子节点已勾选 => 祖先节点半选', () => {
        renderTree({ modelValue: ['Dongjing', 'Beijing'] });
        const level1Nodes = getLevelNodes(1);
        const level2Nodes = getLevelNodes(2);
        expect(isHalfChecked(level1Nodes[0])).toBe(true);
        expect(isHalfChecked(level1Nodes[1])).toBe(false);
        expect(isChecked(level1Nodes[1])).toBe(false);

        expect(isHalfChecked(level2Nodes[0])).toBe(true);
        expect(isHalfChecked(level2Nodes[1])).toBe(true);
        expect(getLabel(level2Nodes[1])).toEqual('日本');
    });

    it('受控：叶子节点已勾选 => 父节点全选且祖先节点半选', () => {
        renderTree({ modelValue: ['Shanghai', 'Beijing'] });
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('受控：所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTree({ modelValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'] });
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ modelValue: '', defaultExpandAll: true, onChange });
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        await userEvent.click(getNode('beijing'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Beijing']);
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
    });

    it('JSON 格式的 treeData', async () => {
        const onChange = spyOn<'change'>();
        renderTree({
            treeData: undefined,
            defaultExpandAll: true,
            treeDataSimpleJson: { Node1: { Child1: '0-0-1', Child2: '0-0-2' }, Node2: '0-1' },
            onChange,
        });
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(4);
        const childNodes = getLevelNodes(2);
        await userEvent.click(childNodes[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith({ Node1: { Child1: '0-0-1' } });
        await userEvent.click(childNodes[1]);
        expect(onChange).toHaveBeenLastCalledWith({ Node1: { Child1: '0-0-1', Child2: '0-0-2' } });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(onChange).toHaveBeenLastCalledWith({});
    });

    it('onContextMenu', async () => {
        const onContextMenu = spyOn<'contextMenu'>();
        renderTree({ onContextMenu });
        await fireEvent.contextMenu(getNode('yazhou'));
        expect(onContextMenu).toHaveBeenCalledTimes(1);
        expect(onContextMenu).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(`${optionCls}-selected`);
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        expect(document.querySelector(`.${indeterminateCls}`)).toBeNull();
    });

    it('expandAction 为 click', async () => {
        const onExpand = spyOn<'expand'>();
        renderTree({ onExpand, expandAction: 'click' });
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'riben']));
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        await waitFor(() => expect(getCheckedKeys()).toEqual([]));
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(0);
    });

    it('expandAction 为 doubleClick', async () => {
        const onExpand = spyOn<'expand'>();
        renderTree({ onExpand, expandAction: 'doubleClick' });
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).not.toHaveBeenCalled();
        await fireEvent.dblClick(getNode('yazhou'));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'riben']));
    });

    it('异步加载数据，并在父节点勾选时检查动态加载的子节点', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.resolve());
        const data = { label: '亚洲', value: 'Asia', key: 'asia' };
        const { rerender } = renderTree({ loadData, defaultValue: 'Asia', treeData: [data] });
        expect(getCheckedKeys()).toEqual(['asia']);
        await rerender({ treeData: [{ ...data, children: treeChildren }] });
        await userEvent.click(getNode('asia').querySelector(`.${optionCls}-expand-icon`) as HTMLElement);
        await waitFor(() => expect(getCheckedKeys()).toEqual(['asia', 'beijing', 'shanghai']));
    });

    it('disableStrictly 属性', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onChange, disableStrictly: true, defaultValue: 'Shanghai' }, true);
        expect(getCheckedKeys()).toEqual(['0-0-1']);
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(3);
        await userEvent.click(getNode('0-0-0'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(getNode('0'));
        expect(getCheckedKeys()).toEqual(['0-0-1', '0-1', '0-1-0']);
        expect(isChecked(getNode('0-0-0'))).toBe(false);
    });

    it('disabled 属性', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, disabled: true, onChange });
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(10);
        await userEvent.click(getNode('beijing'));
        expect(onChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${optionCls}-selected`)).toBeNull();
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
    });

    it('keyMaps 属性', async () => {
        const onChange = spyOn<'change'>();
        renderTree({
            treeData: specialTreeData,
            defaultValue: 'Beijing',
            onChange,
            defaultExpandAll: true,
            motion: false,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Zhongguo']);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('keyMaps 配合 changeWithObject', async () => {
        const onChange = spyOn<'change'>();
        renderTree({
            treeData: specialTreeData,
            defaultValue: { label1: '北京', value1: 'Beijing', key1: 'beijing' },
            changeWithObject: true,
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        const china = (specialTreeData[0] as Record<string, TreeNodeData[]>).children1[0];
        expect(onChange).toHaveBeenCalledWith([china]);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('value 不在 treeData 中', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ defaultValue: ['fish'], onChange, defaultExpandAll: true });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(onChange).toHaveBeenCalledWith(['fish', 'Yazhou']);
    });

    it('onChange 配合 autoMergeValue', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange, autoMergeValue: false });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange).toHaveBeenCalledWith(['Zhongguo', 'Beijing', 'Shanghai']);
    });
});
