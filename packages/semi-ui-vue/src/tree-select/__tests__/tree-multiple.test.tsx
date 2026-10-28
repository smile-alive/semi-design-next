/** @jsxImportSource vue */
import type { VNodeChild } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import TreeSelect, { type TreeSelectEmits } from '..';
import ConfigProvider from '../../config-provider';
import type { TreeNodeData } from '../../tree';

const treeChildren = [
    { label: '北京', value: 'Beijing', key: 'beijing' },
    { label: '上海', value: 'Shanghai', key: 'shanghai' },
];

const treeChildrenWithFakeObj = [
    { label: '北京', value: 'Beijing', key: 'beijing' },
    { label: '鱼', value: 'Fish', key: 'fish' },
];

const treeData = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            { label: '中国', value: 'Zhongguo', key: 'zhongguo', children: treeChildren },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
                children: [
                    { label: '东京', value: 'Dongjing', key: 'dongjing' },
                    { label: '大阪', value: 'Daban', key: 'daban' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'Beimeizhou',
        key: 'beimeizhou',
        children: [
            { label: '美国', value: 'Meiguo', key: 'meiguo' },
            { label: '加拿大', value: 'Jianada', key: 'jianada' },
        ],
    },
];

const treeDataWithDisabled = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                disabled: true,
                children: [
                    { label: '北京', value: 'Beijing', key: '0-0-0' },
                    { label: '上海', value: 'Shanghai', key: '0-0-1' },
                ],
            },
            { label: '日本', value: 'Japan', key: '0-1' },
        ],
    },
    { label: '北美洲', value: 'North America', key: '1' },
];

const treeDataWithoutValue = [
    {
        label: '亚洲',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                key: 'zhongguo',
                children: [
                    { label: '北京', key: 'beijing' },
                    { label: '上海', key: 'shanghai' },
                ],
            },
            {
                label: '日本',
                key: 'riben',
                children: [
                    { label: '东京', key: 'dongjing' },
                    { label: '大阪', key: 'daban' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        key: 'beimeizhou',
        children: [
            { label: '美国', key: 'meiguo' },
            { label: '加拿大', key: 'jianada' },
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
                    { label1: '北京', value1: 'Beijing', key1: 'beijing' },
                    { label1: '上海', value1: 'Shanghai', key1: 'shanghai' },
                ],
            },
            {
                label1: '日本',
                value1: 'Riben',
                key1: 'riben',
                children1: [
                    { label1: '东京', value1: 'Dongjing', key1: 'dongjing' },
                    { label1: '大阪', value1: 'Daban', key1: 'daban' },
                ],
            },
        ],
    },
    {
        label1: '北美洲',
        value1: 'Beimeizhou',
        key1: 'beimeizhou',
        children1: [
            { label1: '美国', value1: 'Meiguo', key1: 'meiguo' },
            { label1: '加拿大', value1: 'Jianada', key1: 'jianada' },
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

const commonProps = { motion: false, motionExpand: false };

const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
const innerCheckedCls = `${BASE_CLASS_PREFIX}-checkbox-inner-checked`;
const indeterminateCls = `${BASE_CLASS_PREFIX}-checkbox-indeterminate`;

type Emits = TreeSelectEmits<unknown, true>;
const spy = <K extends keyof Emits>() => vi.fn<(...args: Emits[K]) => void>();
type Slots = Record<string, (scope: never) => VNodeChild>;
const settle = () => new Promise((resolve) => setTimeout(resolve));
async function renderTreeSelect(props: Record<string, unknown> = {}, slots: Slots = {}) {
    const merged = { multiple: true, ...commonProps, defaultOpen: true, treeData, ...props };
    const Host = (attrs: Record<string, unknown>) => <ConfigProvider locale={en_US}>{() => <TreeSelect {...attrs}>{slots}</TreeSelect>}</ConfigProvider>;
    const view = render(Host, { props: merged });
    await settle();
    return {
        ...view,
        unmount: () => view.unmount(),
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender({ ...merged, ...next });
            await settle();
        },
    };
}

const getLevelNodes = (level: number) => document.querySelectorAll<HTMLElement>(`.${optionCls}.${optionCls}-level-${level}`);
const getNode = (key: string) => document.querySelector<HTMLElement>(`[role="treeitem"][data-key="${key}"]`);
const getLabel = (node: Element | null) => node?.querySelector(`.${optionCls}-label-text`)?.textContent;
const isChecked = (node: Element | null) => node?.querySelector(`.${innerCheckedCls}`) !== null;
const isHalfChecked = (node: Element | null) => node?.querySelector(`.${indeterminateCls}`) !== null;
const isCollapsed = (node: Element) => node.classList.contains(`${optionCls}-collapsed`);
const getCheckedCount = () => document.querySelectorAll(`.${innerCheckedCls}`).length;
const getHighlights = () => document.querySelectorAll(`.${optionCls}-highlight`);
const getSelection = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection`) as HTMLElement;
const getTags = () => Array.from(getSelection().querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`));
const getTagTexts = () => getTags().map((tag) => tag.textContent);
const click = async (element: Element | null) => {
    await userEvent.click(element as Element);
    await settle();
};
const closeTag = (index: number) => click(getTags()[index].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
const searchInTrigger = async (value: string) => {
    await fireEvent.update(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tagInput input`) as HTMLInputElement, value);
    await settle();
};

describe('TreeSelect 多选', () => {
    it('defaultValue 且叶子节点已勾选', async () => {
        const { unmount } = await renderTreeSelect({ defaultValue: ['Beijing'] });
        expect(getTagTexts()).toEqual(['北京']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        await renderTreeSelect({ defaultValue: ['Dongjing', 'Beijing'] });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点半选', async () => {
        await renderTreeSelect({ defaultValue: ['Dongjing', 'Beijing'] });
        const level1Nodes = getLevelNodes(1);
        const level2Nodes = getLevelNodes(2);
        expect(isHalfChecked(level1Nodes[0])).toBe(true);
        expect(isHalfChecked(level1Nodes[1])).toBe(false);
        expect(isChecked(level1Nodes[1])).toBe(false);

        expect(isHalfChecked(level2Nodes[0])).toBe(true);
        expect(isHalfChecked(level2Nodes[1])).toBe(true);
        expect(getLabel(level2Nodes[1])).toEqual('日本');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点全选', async () => {
        await renderTreeSelect({ defaultValue: ['Shanghai', 'Beijing'] });
        expect(getTagTexts()).toEqual(['中国']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('defaultValue 且所有叶子节点已勾选 => 祖先节点全选', async () => {
        await renderTreeSelect({ defaultValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'] });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('defaultValue 且父节点已勾选 => 所有后代全选', async () => {
        await renderTreeSelect({ defaultValue: ['Yazhou'], defaultExpandAll: true });
        expect(getCheckedCount()).toEqual(7);
    });

    it('defaultValue 配合 changeWithObject', async () => {
        await renderTreeSelect({ defaultValue: treeChildren, defaultExpandAll: true, changeWithObject: true });
        expect(getCheckedCount()).toEqual(3);
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('maxTagCount', async () => {
        await renderTreeSelect({
            defaultValue: ['Shanghai', 'Dongjing', 'Daban', 'Meiguo'],
            maxTagCount: 2,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['上海', '美国', '+1']);
        expect(getCheckedCount()).toEqual(5);
    });

    it('删除标签', async () => {
        await renderTreeSelect({ defaultValue: ['Shanghai', 'Dongjing'], defaultExpandAll: true });
        expect(getTagTexts()).toEqual(['上海', '东京']);
        await closeTag(1);
        expect(getTagTexts()).toEqual(['上海']);
        expect(getCheckedCount()).toEqual(1);
        expect(isChecked(getNode('shanghai'))).toBe(true);
    });

    it('expandedKeys 配合 autoExpandParent', async () => {
        const { rerender } = await renderTreeSelect({ expandedKeys: ['beimeizhou'] });
        let topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(true);
        expect(isCollapsed(topNode[1])).toBe(false);

        await rerender({ expandedKeys: ['riben'] });
        topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(true);
        expect(isCollapsed(topNode[1])).toBe(true);

        await rerender({ expandedKeys: ['riben'], autoExpandParent: true });
        topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(false);
        expect(isCollapsed(topNode[1])).toBe(true);
    });

    it('选择一个叶子节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getNode('beijing'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(onSelect).toHaveBeenLastCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing'], expect.anything(), expect.anything());
        expect(isChecked(getNode('beijing'))).toBe(true);
        await click(getNode('beijing'));
        expect(getTags()).toHaveLength(0);
        expect(onSelect).toHaveBeenLastCalledWith('beijing', false, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isHalfChecked(getNode('beijing'))).toBe(false);
        expect(isChecked(getNode('beijing'))).toBe(false);
    });

    it('选择两个不同分支的叶子节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getLevelNodes(3)[0]);
        await click(getLevelNodes(3)[2]);
        expect(getTagTexts()).toEqual(['北京', '东京']);
        expect(onSelect).toHaveBeenLastCalledWith('dongjing', true, expect.objectContaining({ key: 'dongjing' }));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Dongjing'], expect.anything(), expect.anything());
    });

    it('选择一个分支下的所有叶子节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getLevelNodes(3)[0]);
        await click(getLevelNodes(3)[1]);
        expect(getTagTexts()).toEqual(['中国']);
        expect(onSelect).toHaveBeenLastCalledWith('shanghai', true, expect.objectContaining({ key: 'shanghai' }));
        expect(onChange).toHaveBeenLastCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('选择所有叶子节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getLevelNodes(3)[0]);
        await click(getLevelNodes(3)[1]);
        await click(getLevelNodes(3)[2]);
        await click(getLevelNodes(3)[3]);
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(onSelect).toHaveBeenLastCalledWith('daban', true, expect.objectContaining({ key: 'daban' }));
        expect(onChange).toHaveBeenLastCalledWith(['Yazhou'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(7);
    });

    it('选择父节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getLevelNodes(1)[0]);
        expect(onSelect).toHaveBeenCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(onChange).toHaveBeenCalledWith(['Yazhou'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(7);
    });

    it('change 配合 leafOnly', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange, leafOnly: true });
        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange).toHaveBeenCalledWith(['Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['北京', '上海']);
    });

    it('受控：叶子节点值显示正确', async () => {
        const { unmount } = await renderTreeSelect({ modelValue: ['Beijing'] });
        expect(getTagTexts()).toEqual(['北京']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();

        await renderTreeSelect({ modelValue: ['Dongjing', 'Beijing'] });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('受控：叶子节点已勾选 => 祖先节点半选', async () => {
        await renderTreeSelect({ modelValue: ['Dongjing', 'Beijing'] });
        expect(getTags()).toHaveLength(2);
        const level1Nodes = getLevelNodes(1);
        const level2Nodes = getLevelNodes(2);
        expect(isHalfChecked(level1Nodes[0])).toBe(true);
        expect(isHalfChecked(level1Nodes[1])).toBe(false);
        expect(isChecked(level1Nodes[1])).toBe(false);

        expect(isHalfChecked(level2Nodes[0])).toBe(true);
        expect(isHalfChecked(level2Nodes[1])).toBe(true);
        expect(getLabel(level2Nodes[1])).toEqual('日本');
    });

    it('受控：叶子节点已勾选 => 父节点全选且祖先节点半选', async () => {
        await renderTreeSelect({ modelValue: ['Shanghai', 'Beijing'] });
        expect(getTagTexts()).toEqual(['中国']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('受控：所有叶子节点已勾选 => 祖先节点全选', async () => {
        await renderTreeSelect({ modelValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'] });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('受控：发 change 但界面不更新', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ modelValue: [], defaultExpandAll: true, onChange });
        expect(getCheckedCount()).toEqual(0);
        await click(getNode('beijing'));
        expect(getTags()).toHaveLength(0);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Beijing'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(0);
    });

    it('disabled 属性', async () => {
        await renderTreeSelect({ defaultValue: ['Dongjing', 'Beijing'], disabled: true });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-closable`)).toHaveLength(0);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)).toHaveLength(0);
    });

    it('受控：treeData 为空但有 modelValue', async () => {
        await renderTreeSelect({ modelValue: [''], treeData: [] });
        expect(document.querySelector(`.${optionCls}-selected`)).toBeNull();
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        expect(getSelection()).toHaveTextContent(/^$/);
    });

    it('#selectedItem 插槽替换标签内容', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange }, { selectedItem: ({ item }: { item: TreeNodeData }) => String(item.value) });
        await click(getLevelNodes(1)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toEqual('yazhou');
        expect(onChange.mock.calls[0][0]).toEqual(['Yazhou']);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag .${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(/^Yazhou$/);
    });

    it('disableStrictly 属性', async () => {
        const base = {
            dropdownStyle: { maxHeight: '400px', overflow: 'auto' },
            style: { width: '300px' },
            defaultExpandAll: true,
            disableStrictly: true,
        };
        const { unmount } = await renderTreeSelect({ ...base, leafOnly: true });
        expect(getTags()).toHaveLength(0);
        await click(getLevelNodes(1)[0]);
        expect(getTagTexts()).toEqual(['北京', '上海', '东京', '大阪']);
        unmount();

        await renderTreeSelect({ ...base, treeData: treeDataWithDisabled });
        expect(getTags()).toHaveLength(0);
        await click(getLevelNodes(1)[0]);
        expect(getTagTexts()).toEqual(['日本']);
        expect(isChecked(getNode('0-0-0'))).toBe(false);
    });

    it('searchPosition 为 trigger', async () => {
        await renderTreeSelect({
            searchPosition: 'trigger',
            filterTreeNode: true,
            maxTagCount: 1,
            defaultValue: ['Zhongguo', 'Meiguo'],
        });
        const selection = getSelection();
        expect(selection.querySelectorAll(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag`)).toHaveLength(1);
        expect(selection.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tagInput-wrapper-n`)).toHaveTextContent(/^\+1$/);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`)).toBeNull();
        await searchInTrigger('北');
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(6);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
    });

    it('searchPosition 为 trigger 配合 leafOnly', async () => {
        const onSelect = spy<'select'>();
        await renderTreeSelect({
            onSelect,
            searchPosition: 'trigger',
            filterTreeNode: true,
            defaultExpandAll: true,
            leafOnly: true,
        });
        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(getTagTexts()).toEqual(['北京', '上海']);

        await searchInTrigger('北');
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(6);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
    });

    it('unRelated 关联模式', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange, checkRelation: 'unRelated' });
        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 modelValue', async () => {
        await renderTreeSelect({ defaultExpandAll: true, checkRelation: 'unRelated', modelValue: ['Zhongguo'] });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 defaultValue', async () => {
        await renderTreeSelect({ defaultExpandAll: true, checkRelation: 'unRelated', defaultValue: ['Zhongguo'] });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 select 事件', async () => {
        const onSelect = spy<'select'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, checkRelation: 'unRelated' });
        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
    });

    it('option 不在 treeData 中 + treeData 项带有 value', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultValue: ['Beijing', 'fish'], onSelect, onChange });
        expect(getTagTexts()).toEqual(['北京', 'fish']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['fish']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall?.[0]).toEqual(['fish']);

        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange.mock.lastCall?.[0]).toEqual(['fish', 'Zhongguo']);
    });

    it('option 不在 treeData 中 + treeData 项带有 value + changeWithObject', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({
            defaultValue: treeChildrenWithFakeObj,
            onSelect,
            onChange,
            defaultExpandAll: true,
            changeWithObject: true,
        });
        expect(getTagTexts()).toEqual(['北京', '鱼']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['鱼']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall?.[0]).toEqual([expect.objectContaining({ label: '鱼', value: 'Fish', key: 'fish' })]);

        await click(getLevelNodes(3)[0]);
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange.mock.lastCall?.[0]).toEqual([expect.objectContaining({ label: '鱼', value: 'Fish', key: 'fish' }), expect.objectContaining({ label: '北京', value: 'Beijing', key: 'beijing' })]);
    });

    it('option 不在 treeData 中 + treeData 项没有 value', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: ['beijing', 'fish'],
            onSelect,
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京', 'fish']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['fish']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall?.[0]).toEqual(['fish']);

        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange.mock.lastCall?.[0]).toEqual(['fish', 'zhongguo']);
    });

    it('option 不在 treeData 中 + treeData 项没有 value + changeWithObject', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: [
                { label: '北京', key: 'beijing' },
                { label: '鱼', key: 'fish' },
            ],
            onSelect,
            onChange,
            defaultExpandAll: true,
            changeWithObject: true,
        });
        expect(getTagTexts()).toEqual(['北京', '鱼']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['鱼']);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall?.[0]).toEqual([expect.objectContaining({ label: '鱼', key: 'fish' })]);

        await click(getLevelNodes(3)[0]);
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange.mock.lastCall?.[0]).toEqual([expect.objectContaining({ label: '鱼', key: 'fish' }), expect.objectContaining({ label: '北京', key: 'beijing' })]);
    });

    it('keyMaps 属性', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: ['Beijing'],
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await click(getLevelNodes(3)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(/^中国$/);
    });

    it('keyMaps 配合 changeWithObject', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: [{ label1: '北京', value1: 'Beijing', key1: 'beijing' }],
            changeWithObject: true,
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await click(getLevelNodes(3)[1]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall?.[0]).toEqual([specialTreeData[0].children1[0]]);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(/^中国$/);
    });

    it('change 配合 autoMergeValue', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange, autoMergeValue: false });
        await click(getLevelNodes(2)[0]);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(onChange).toHaveBeenCalledWith(['Zhongguo', 'Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['中国', '北京', '上海']);
    });
});
