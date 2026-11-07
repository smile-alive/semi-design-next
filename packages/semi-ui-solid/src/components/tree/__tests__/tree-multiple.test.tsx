import { createSignal } from 'solid-js';
import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Tree, { type TreeNodeData, type TreeProps } from '..';

const treeChildren = [
    {
        label: '北京',
        value: 'Beijing',
        key: 'beijing',
    },
    {
        label: '上海',
        value: 'Shanghai',
        key: 'shanghai',
    },
];

const treeData = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'Zhongguo',
                key: 'zhongguo',
                children: treeChildren,
            },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
                children: [
                    {
                        label: '东京',
                        value: 'Dongjing',
                        key: 'dongjing',
                    },
                    {
                        label: '大阪',
                        value: 'Daban',
                        key: 'daban',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'Beimeizhou',
        key: 'beimeizhou',
        children: [
            {
                label: '美国',
                value: 'Meiguo',
                key: 'meiguo',
            },
            {
                label: '加拿大',
                value: 'Jianada',
                key: 'jianada',
            },
        ],
    },
];

const treeDataWithDisabled = [
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
                    {
                        label: 'Beijing',
                        value: 'Beijing',
                        key: '0-0-0',
                        disabled: true,
                    },
                    {
                        label: 'Shanghai',
                        value: 'Shanghai',
                        key: '0-0-1',
                        disabled: true,
                    },
                ],
            },
            {
                label: 'Japan',
                value: 'Japan',
                key: '0-1',
                children: [
                    {
                        label: 'Osaka',
                        value: 'Osaka',
                        key: '0-1-0',
                    },
                ],
            },
        ],
    },
    {
        label: 'North America',
        value: 'North America',
        key: '1',
        children: [
            {
                label: 'United States',
                value: 'United States',
                key: '1-0',
            },
            {
                label: 'Canada',
                value: 'Canada',
                key: '1-1',
            },
        ],
    },
];

const specialTreeData = [
    {
        label1: '亚洲',
        value1: 'Yazhou',
        key1: 'yazhou',
        children1: [
            {
                label1: '中国',
                value1: 'Zhongguo',
                key1: 'zhongguo',
                disabled1: true,
                children1: [
                    {
                        label1: '北京',
                        value1: 'Beijing',
                        key1: 'beijing',
                    },
                    {
                        label1: '上海',
                        value1: 'Shanghai',
                        key1: 'shanghai',
                    },
                ],
            },
            {
                label1: '日本',
                value1: 'Riben',
                key1: 'riben',
                children1: [
                    {
                        label1: '东京',
                        value1: 'Dongjing',
                        key1: 'dongjing',
                    },
                    {
                        label1: '大阪',
                        value1: 'Daban',
                        key1: 'daban',
                    },
                ],
            },
        ],
    },
    {
        label1: '北美洲',
        value1: 'Beimeizhou',
        key1: 'beimeizhou',
        children1: [
            {
                label1: '美国',
                value1: 'Meiguo',
                key1: 'meiguo',
            },
            {
                label1: '加拿大',
                value1: 'Jianada',
                key1: 'jianada',
            },
        ],
    },
];

const defaultKeyMaps = {
    value: 'value1',
    key: 'key1',
    label: 'label1',
    children: 'children1',
    disabled: 'disabled1',
};

const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
const innerCheckedCls = `${BASE_CLASS_PREFIX}-checkbox-inner-checked`;
const indeterminateCls = `${BASE_CLASS_PREFIX}-checkbox-indeterminate`;

function renderTree(initial: TreeProps, haveDisabled = false) {
    const [props, setProps] = createSignal(initial);
    const result = render(() => <Tree multiple treeData={haveDisabled ? treeDataWithDisabled : treeData} {...props()} />);
    return { ...result, rerender: (next: TreeProps) => setProps(next) };
}

const getLevelNodes = (level: number) => document.querySelectorAll<HTMLElement>(`.${optionCls}.${optionCls}-level-${level}`);
const getNode = (key: string) => document.querySelector(`[role="treeitem"][data-key="${key}"]`) as HTMLElement;
const getLabel = (node: Element) => node.querySelector(`.${optionCls}-label-text`)?.textContent;
const isChecked = (node: Element) => node.querySelector(`.${innerCheckedCls}`) !== null;
const isHalfChecked = (node: Element) => node.querySelector(`.${indeterminateCls}`) !== null;
const getCheckedKeys = () => Array.from(document.querySelectorAll('[role="treeitem"][aria-checked="true"]'), (node) => node.getAttribute('data-key'));

describe('Tree', () => {
    it('defaultValue 且叶子节点已勾选', () => {
        const { unmount } = renderTree({
            defaultValue: 'Beijing',
        });
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        renderTree({
            defaultValue: ['Dongjing', 'Beijing'],
        });
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点半选', () => {
        renderTree({
            defaultValue: ['Dongjing', 'Beijing'],
        });
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
        renderTree({
            defaultValue: ['Shanghai', 'Beijing'],
        });
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('defaultValue 且所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTree({
            defaultValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'],
        });
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('defaultValue 且父节点已勾选 => 所有后代全选', () => {
        renderTree({
            defaultValue: ['Yazhou'],
            defaultExpandAll: true,
        });
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
        expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban']);
    });

    it('defaultValue 配合 onChangeWithObject', () => {
        renderTree({
            defaultValue: treeChildren,
            defaultExpandAll: true,
            onChangeWithObject: true,
        });
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(3);
        expect(getCheckedKeys()).toEqual(['zhongguo', 'beijing', 'shanghai']);
    });

    it('选择一个叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('beijing'));
        expect(spyOnSelect).toHaveBeenLastCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Beijing']);
        expect(isChecked(getNode('beijing'))).toBe(true);
        await userEvent.click(getNode('beijing'));
        expect(spyOnSelect).toHaveBeenLastCalledWith('beijing', false, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith([]);
        expect(isHalfChecked(getNode('beijing'))).toBe(false);
        expect(isChecked(getNode('beijing'))).toBe(false);
    });

    it('点击复选框只勾选一次', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({ defaultExpandAll: true, onChange: spyOnChange });
        await userEvent.click(getNode('beijing').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenLastCalledWith(['Beijing']);
    });

    it('选择两个不同分支的叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[2]);
        expect(spyOnSelect).toHaveBeenLastCalledWith('dongjing', true, expect.objectContaining({ key: 'dongjing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Beijing', 'Dongjing']);
    });

    it('选择一个分支下的所有叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        expect(spyOnSelect).toHaveBeenLastCalledWith('shanghai', true, expect.objectContaining({ key: 'shanghai' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Zhongguo']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('选择所有叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        await userEvent.click(nodelevel3[2]);
        await userEvent.click(nodelevel3[3]);
        expect(spyOnSelect).toHaveBeenLastCalledWith('daban', true, expect.objectContaining({ key: 'daban' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Yazhou']);
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
    });

    it('选择父节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(spyOnChange).toHaveBeenCalledWith(['Yazhou']);
        expect(document.querySelectorAll(`.${innerCheckedCls}`)).toHaveLength(7);
    });

    it('onChange 与 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onChangeWithObject: true,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[2]);
        expect(spyOnChange).toHaveBeenCalledTimes(2);
        expect(spyOnChange).toHaveBeenLastCalledWith([
            expect.objectContaining({
                label: '北京',
                value: 'Beijing',
                key: 'beijing',
            }),
            expect.objectContaining({
                label: '东京',
                value: 'Dongjing',
                key: 'dongjing',
            }),
        ]);
    });

    it('unRelated 关联模式', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onChange: spyOnChange,
            checkRelation: 'unRelated',
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo']);
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 value', () => {
        renderTree({
            defaultExpandAll: true,
            checkRelation: 'unRelated',
            value: 'Zhongguo',
        });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 defaultValue', () => {
        renderTree({
            defaultExpandAll: true,
            checkRelation: 'unRelated',
            defaultValue: 'Zhongguo',
        });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getCheckedKeys()).toEqual(['zhongguo']);
    });

    it('unRelated 关联模式配合 onSelect', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            checkRelation: 'unRelated',
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
    });

    it('受控：叶子节点值显示正确', () => {
        const { unmount } = renderTree({
            value: 'Beijing',
        });
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        renderTree({
            value: ['Dongjing', 'Beijing'],
        });
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('受控：叶子节点已勾选 => 祖先节点半选', () => {
        renderTree({
            value: ['Dongjing', 'Beijing'],
        });
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
        renderTree({
            value: ['Shanghai', 'Beijing'],
        });
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('受控：所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTree({
            value: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'],
        });
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            value: '',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        await userEvent.click(getNode('beijing'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Beijing']);
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
    });

    it('JSON 格式的 treeData', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(() => (
            <Tree
                defaultExpandAll
                multiple
                treeDataSimpleJson={{
                    Node1: {
                        Child1: '0-0-1',
                        Child2: '0-0-2',
                    },
                    Node2: '0-1',
                }}
                onChange={spyOnChange}
            />
        ));
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(4);
        const childNodes = getLevelNodes(2);
        await userEvent.click(childNodes[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenLastCalledWith({
            Node1: {
                Child1: '0-0-1',
            },
        });
        await userEvent.click(childNodes[1]);
        expect(spyOnChange).toHaveBeenLastCalledWith({
            Node1: {
                Child1: '0-0-1',
                Child2: '0-0-2',
            },
        });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(spyOnChange).toHaveBeenLastCalledWith({});
    });

    it('onContextMenu', () => {
        const spyOnContextMenu = vi.fn<NonNullable<TreeProps['onContextMenu']>>();
        renderTree({
            onContextMenu: spyOnContextMenu,
        });
        fireEvent.contextMenu(getNode('yazhou'));
        expect(spyOnContextMenu).toHaveBeenCalledTimes(1);
        expect(spyOnContextMenu).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(`${optionCls}-selected`);
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        expect(document.querySelector(`.${indeterminateCls}`)).toBeNull();
    });

    it('expandAction 为 click', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            onExpand: spyOnExpand,
            expandAction: 'click',
        });
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).toHaveBeenCalledTimes(1);
        expect(spyOnExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'riben']);
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getCheckedKeys()).toEqual([]);
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(0);
    });

    it('expandAction 为 doubleClick', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            onExpand: spyOnExpand,
            expandAction: 'doubleClick',
        });
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).not.toHaveBeenCalled();
        fireEvent.dblClick(getNode('yazhou'));
        expect(spyOnExpand).toHaveBeenCalledTimes(1);
        expect(spyOnExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(getCheckedKeys()).toEqual(['yazhou', 'zhongguo', 'riben']));
    });

    it('异步加载数据，并在父节点勾选时检查动态加载的子节点', async () => {
        const mockLoadData = vi.fn<NonNullable<TreeProps['loadData']>>(() => Promise.resolve());
        const data = {
            label: '亚洲',
            value: 'Asia',
            key: 'asia',
        };
        const { rerender } = renderTree({
            loadData: mockLoadData,
            defaultValue: 'Asia',
            treeData: [data],
        });
        expect(getCheckedKeys()).toEqual(['asia']);
        rerender({
            defaultValue: 'Asia',
            loadData: mockLoadData,
            treeData: [
                {
                    ...data,
                    children: treeChildren,
                },
            ],
        });
        await userEvent.click(getNode('asia').querySelector(`.${optionCls}-expand-icon`) as HTMLElement);
        await waitFor(() => expect(getCheckedKeys()).toEqual(['asia', 'beijing', 'shanghai']));
    });

    it('disableStrictly 属性', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree(
            {
                defaultExpandAll: true,
                onChange: spyOnChange,
                disableStrictly: true,
                defaultValue: 'Shanghai',
                multiple: true,
            },
            true
        );
        expect(getCheckedKeys()).toEqual(['0-0-1']);
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(3);
        await userEvent.click(getNode('0-0-0'));
        expect(spyOnChange).not.toHaveBeenCalled();
        await userEvent.click(getNode('0'));
        expect(getCheckedKeys()).toEqual(['0-0-1', '0-1', '0-1-0']);
        expect(isChecked(getNode('0-0-0'))).toBe(false);
    });

    it('disabled 属性', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            disabled: true,
            multiple: true,
            onChange: spyOnChange,
        });
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(10);
        await userEvent.click(getNode('beijing'));
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(document.querySelector(`.${optionCls}-selected`)).toBeNull();
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
    });

    it('keyMaps 属性', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: specialTreeData as unknown as TreeNodeData[],
            defaultValue: 'Beijing',
            onChange: spyOnChange,
            defaultExpandAll: true,
            motion: false,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`) as HTMLElement)).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo']);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('keyMaps 配合 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: specialTreeData as unknown as TreeNodeData[],
            defaultValue: {
                label1: '北京',
                value1: 'Beijing',
                key1: 'beijing',
            } as TreeNodeData,
            onChangeWithObject: true,
            onChange: spyOnChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`) as HTMLElement)).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith([specialTreeData[0].children1[0]]);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('value 不在 treeData 中', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            multiple: true,
            defaultValue: ['fish'],
            onChange: spyOnChange,
            defaultExpandAll: true,
        });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(spyOnChange).toHaveBeenCalledWith(['fish', 'Yazhou']);
    });

    it('onChange 配合 autoMergeValue', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            autoMergeValue: false,
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo', 'Beijing', 'Shanghai']);
    });
});
