import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { TreeSelect } from '@fibrae/semi-ui-react';
import type { TreeSelectProps } from '../index';

// onChange is an overload set (value form and object form), which one mock type cannot express
type ChangeSpy = (...args: unknown[]) => void;

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

const treeChildrenWithFakeObj = [
    {
        label: '北京',
        value: 'Beijing',
        key: 'beijing',
    },
    {
        label: '鱼',
        value: 'Fish',
        key: 'fish',
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
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
            {
                label: '日本',
                value: 'Japan',
                key: '0-1',
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

const treeChildrenWithoutValue = [
    {
        label: '北京',
        key: 'beijing',
    },
    {
        label: '上海',
        key: 'shanghai',
    },
];

const treeDataWithoutValue = [
    {
        label: '亚洲',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                key: 'zhongguo',
                children: treeChildrenWithoutValue,
            },
            {
                label: '日本',
                key: 'riben',
                children: [
                    {
                        label: '东京',
                        key: 'dongjing',
                    },
                    {
                        label: '大阪',
                        key: 'daban',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        key: 'beimeizhou',
        children: [
            {
                label: '美国',
                key: 'meiguo',
            },
            {
                label: '加拿大',
                key: 'jianada',
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

const commonProps = {
    motion: false,
    motionExpand: false,
};

const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
const innerCheckedCls = `${BASE_CLASS_PREFIX}-checkbox-inner-checked`;
const indeterminateCls = `${BASE_CLASS_PREFIX}-checkbox-indeterminate`;

// rerender merges onto the initial props, so a test only passes what changes
function renderTreeSelect(props) {
    const baseProps = { multiple: true, ...commonProps, defaultOpen: true, treeData, ...props };
    const ui = (newProps?) => <TreeSelect {...baseProps} {...newProps} />;
    const result = render(ui());
    return { ...result, rerender: (newProps) => result.rerender(ui(newProps)) };
}

const getLevelNodes = (level) => document.querySelectorAll(`.${optionCls}.${optionCls}-level-${level}`);
const getNode = (key) => document.querySelector(`[role="treeitem"][data-key="${key}"]`);
const getLabel = (node) => node.querySelector(`.${optionCls}-label-text`).textContent;
const isChecked = (node) => node.querySelector(`.${innerCheckedCls}`) !== null;
const isHalfChecked = (node) => node.querySelector(`.${indeterminateCls}`) !== null;
const isCollapsed = (node) => node.classList.contains(`${optionCls}-collapsed`);
const getCheckedCount = () => document.querySelectorAll(`.${innerCheckedCls}`).length;
const getHighlights = () => document.querySelectorAll(`.${optionCls}-highlight`);
const getSelection = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection`);
const getTags = () => Array.from(getSelection().querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`));
const getTagTexts = () => getTags().map((tag) => tag.textContent);
const closeTag = (index) => userEvent.click(getTags()[index].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
// one change event per keyword: userEvent.type would fire onSearch once per character
const searchInTrigger = (value) => fireEvent.change(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tagInput input`), { target: { value } });

describe('TreeSelect', () => {
    it('defaultValue 且叶子节点已勾选', () => {
        const { unmount } = renderTreeSelect({
            defaultValue: 'Beijing',
        });
        expect(getTagTexts()).toEqual(['北京']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();
        renderTreeSelect({
            defaultValue: ['Dongjing', 'Beijing'],
        });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('defaultValue 且叶子节点已勾选 => 父节点半选', () => {
        renderTreeSelect({
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
        renderTreeSelect({
            defaultValue: ['Shanghai', 'Beijing'],
        });
        expect(getTagTexts()).toEqual(['中国']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('defaultValue 且所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTreeSelect({
            defaultValue: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'],
        });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('defaultValue 且父节点已勾选 => 所有后代全选', () => {
        renderTreeSelect({
            defaultValue: ['Yazhou'],
            defaultExpandAll: true,
        });
        expect(getCheckedCount()).toEqual(7);
    });

    it('defaultValue 配合 onChangeWithObject', () => {
        renderTreeSelect({
            defaultValue: treeChildren,
            defaultExpandAll: true,
            onChangeWithObject: true,
        });
        expect(getCheckedCount()).toEqual(3);
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('maxTagCount', () => {
        renderTreeSelect({
            defaultValue: ['Shanghai', 'Dongjing', 'Daban', 'Meiguo'],
            maxTagCount: 2,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['上海', '美国', '+1']);
        expect(getCheckedCount()).toEqual(5);
    });

    it('removeTag', async () => {
        renderTreeSelect({
            defaultValue: ['Shanghai', 'Dongjing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['上海', '东京']);
        await closeTag(1);
        expect(getTagTexts()).toEqual(['上海']);
        expect(getCheckedCount()).toEqual(1);
        expect(isChecked(getNode('shanghai'))).toBe(true);
    });

    it('expandedKeys 配合 autoExpandParent', () => {
        const { rerender } = renderTreeSelect({
            expandedKeys: ['beimeizhou'],
        });
        let topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(true);
        expect(isCollapsed(topNode[1])).toBe(false);

        rerender({ expandedKeys: ['riben'] });
        topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(true);
        expect(isCollapsed(topNode[1])).toBe(true);

        rerender({ expandedKeys: ['riben'], autoExpandParent: true });
        topNode = getLevelNodes(1);
        expect(isCollapsed(topNode[0])).toBe(false);
        expect(isCollapsed(topNode[1])).toBe(true);
    });

    it('选择一个叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('beijing'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(spyOnSelect).toHaveBeenLastCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Beijing'], expect.anything(), expect.anything());
        expect(isChecked(getNode('beijing'))).toBe(true);
        await userEvent.click(getNode('beijing'));
        expect(getTags()).toHaveLength(0);
        expect(spyOnSelect).toHaveBeenLastCalledWith('beijing', false, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isHalfChecked(getNode('beijing'))).toBe(false);
        expect(isChecked(getNode('beijing'))).toBe(false);
    });

    it('选择两个不同分支的叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[2]);
        expect(getTagTexts()).toEqual(['北京', '东京']);
        expect(spyOnSelect).toHaveBeenLastCalledWith('dongjing', true, expect.objectContaining({ key: 'dongjing' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Beijing', 'Dongjing'], expect.anything(), expect.anything());
    });

    it('选择一个分支下的所有叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        expect(getTagTexts()).toEqual(['中国']);
        expect(spyOnSelect).toHaveBeenLastCalledWith('shanghai', true, expect.objectContaining({ key: 'shanghai' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('选择所有叶子节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const nodelevel3 = getLevelNodes(3);
        await userEvent.click(nodelevel3[0]);
        await userEvent.click(nodelevel3[1]);
        await userEvent.click(nodelevel3[2]);
        await userEvent.click(nodelevel3[3]);
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(spyOnSelect).toHaveBeenLastCalledWith('daban', true, expect.objectContaining({ key: 'daban' }));
        expect(spyOnChange).toHaveBeenLastCalledWith(['Yazhou'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(7);
    });

    it('选择父节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getLevelNodes(1)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(spyOnChange).toHaveBeenCalledWith(['Yazhou'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(7);
    });

    it('onChange 配合 leafOnly', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            leafOnly: true,
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange).toHaveBeenCalledWith(['Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['北京', '上海']);
    });

    it('受控：叶子节点值显示正确', () => {
        const { unmount } = renderTreeSelect({
            value: 'Beijing',
        });
        expect(getTagTexts()).toEqual(['北京']);
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        unmount();

        renderTreeSelect({
            value: ['Dongjing', 'Beijing'],
        });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        const level3Nodes = getLevelNodes(3);
        expect(isChecked(level3Nodes[0])).toBe(true);
        expect(getLabel(level3Nodes[0])).toEqual('北京');
        expect(isChecked(level3Nodes[2])).toBe(true);
        expect(getLabel(level3Nodes[2])).toEqual('东京');
    });

    it('受控：叶子节点已勾选 => 祖先节点半选', () => {
        renderTreeSelect({
            value: ['Dongjing', 'Beijing'],
        });
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

    it('受控：叶子节点已勾选 => 父节点全选且祖先节点半选', () => {
        renderTreeSelect({
            value: ['Shanghai', 'Beijing'],
        });
        expect(getTagTexts()).toEqual(['中国']);
        expect(isHalfChecked(getLevelNodes(1)[0])).toBe(true);
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
    });

    it('受控：所有叶子节点已勾选 => 祖先节点全选', () => {
        renderTreeSelect({
            value: ['Shanghai', 'Beijing', 'Dongjing', 'Daban'],
        });
        expect(getTagTexts()).toEqual(['亚洲']);
        expect(isChecked(getLevelNodes(1)[0])).toBe(true);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            value: '',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getCheckedCount()).toEqual(0);
        await userEvent.click(getNode('beijing'));
        expect(getTags()).toHaveLength(0);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Beijing'], expect.anything(), expect.anything());
        expect(getCheckedCount()).toEqual(0);
    });

    it('disabled 属性', () => {
        renderTreeSelect({
            defaultValue: ['Dongjing', 'Beijing'],
            disabled: true,
        });
        expect(getTagTexts()).toEqual(['东京', '北京']);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-closable`)).toHaveLength(0);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)).toHaveLength(0);
    });

    it('受控：treeData 为空但有 value', () => {
        renderTreeSelect({
            value: [''],
            treeData: [],
        });
        expect(document.querySelector(`.${optionCls}-selected`)).toBeNull();
        expect(document.querySelector(`.${innerCheckedCls}`)).toBeNull();
        expect(getSelection()).toHaveTextContent(/^$/);
    });

    it('renderSelectedItem', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            renderSelectedItem: (item) => ({ content: item.value, isRenderInTag: true }),
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        const yaZhouKey = 'yazhou';
        const yaZhouValue = 'Yazhou';
        await userEvent.click(getLevelNodes(1)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect.mock.calls[0][0]).toEqual(yaZhouKey);
        expect(spyOnChange.mock.calls[0][0]).toEqual([yaZhouValue]);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag .${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(new RegExp(`^${yaZhouValue}$`));
    });

    it('disabledStrictly 属性', async () => {
        const { unmount } = render(<TreeSelect dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} style={{ width: 300 }} multiple defaultExpandAll defaultOpen disableStrictly leafOnly treeData={treeData} {...commonProps} />);
        expect(getTags()).toHaveLength(0);
        await userEvent.click(getLevelNodes(1)[0]);
        expect(getTagTexts()).toEqual(['北京', '上海', '东京', '大阪']);
        unmount();

        render(<TreeSelect dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} style={{ width: 300 }} multiple defaultExpandAll defaultOpen disableStrictly treeData={treeDataWithDisabled} {...commonProps} />);
        expect(getTags()).toHaveLength(0);
        await userEvent.click(getLevelNodes(1)[0]);
        expect(getTagTexts()).toEqual(['日本']);
        expect(isChecked(getNode('0-0-0'))).toBe(false);
    });

    it('searchPosition 为 trigger', () => {
        renderTreeSelect({
            searchPosition: 'trigger',
            filterTreeNode: true,
            multiple: true,
            maxTagCount: 1,
            defaultValue: ['Zhongguo', 'Meiguo'],
        });
        const selection = getSelection();
        expect(selection.querySelectorAll(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tag`)).toHaveLength(1);
        expect(selection.querySelector(`.${BASE_CLASS_PREFIX}-tagInput .${BASE_CLASS_PREFIX}-tagInput-wrapper-n`)).toHaveTextContent(/^\+1$/);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`)).toBeNull();
        searchInTrigger('北');
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(6);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
    });

    it('searchPosition 为 trigger 配合 leafOnly', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({
            onSelect: spyOnSelect,
            searchPosition: 'trigger',
            filterTreeNode: true,
            multiple: true,
            defaultExpandAll: true,
            leafOnly: true,
        });

        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(getTagTexts()).toEqual(['北京', '上海']);

        searchInTrigger('北');
        expect(document.querySelectorAll(`.${optionCls}`)).toHaveLength(6);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
    });

    it('unRelated 关联模式', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            checkRelation: 'unRelated',
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 value', () => {
        renderTreeSelect({
            defaultExpandAll: true,
            checkRelation: 'unRelated',
            value: 'Zhongguo',
        });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 defaultValue', () => {
        renderTreeSelect({
            defaultExpandAll: true,
            checkRelation: 'unRelated',
            defaultValue: 'Zhongguo',
        });
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-checked`)).not.toBeNull();
        const nodelevel3 = getLevelNodes(3);
        expect(nodelevel3[0].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(nodelevel3[1].querySelector(`.${BASE_CLASS_PREFIX}-checkbox-unChecked`)).not.toBeNull();
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('unRelated 关联模式配合 onSelect', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            checkRelation: 'unRelated',
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
    });

    it('option 不在 treeData 中 + treeData 项带有 value', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultValue: ['Beijing', 'fish'],
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });

        expect(getTagTexts()).toEqual(['北京', 'fish']);

        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['fish']);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.lastCall[0]).toEqual(['fish']);

        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange.mock.lastCall[0]).toEqual(['fish', 'Zhongguo']);
    });

    it('option 不在 treeData 中 + treeData 项带有 value + onChangeWithObject', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultValue: treeChildrenWithFakeObj,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            defaultExpandAll: true,
            onChangeWithObject: true,
        });

        expect(getTagTexts()).toEqual(['北京', '鱼']);

        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['鱼']);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.lastCall[0]).toEqual([expect.objectContaining({ label: '鱼', value: 'Fish', key: 'fish' })]);

        await userEvent.click(getLevelNodes(3)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange.mock.lastCall[0]).toEqual([expect.objectContaining({ label: '鱼', value: 'Fish', key: 'fish' }), expect.objectContaining({ label: '北京', value: 'Beijing', key: 'beijing' })]);
    });

    it('option 不在 treeData 中 + treeData 项没有 value', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: ['beijing', 'fish'],
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });

        expect(getTagTexts()).toEqual(['北京', 'fish']);

        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['fish']);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.lastCall[0]).toEqual(['fish']);

        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange.mock.lastCall[0]).toEqual(['fish', 'zhongguo']);
    });

    it('option 不在 treeData 中 + treeData 项没有 value + onChangeWithObject', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: [
                { label: '北京', key: 'beijing' },
                { label: '鱼', key: 'fish' },
            ],
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            defaultExpandAll: true,
            onChangeWithObject: true,
        });

        expect(getTagTexts()).toEqual(['北京', '鱼']);

        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        expect(getCheckedCount()).toEqual(1);

        await closeTag(0);
        expect(getTagTexts()).toEqual(['鱼']);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.lastCall[0]).toEqual([expect.objectContaining({ label: '鱼', key: 'fish' })]);

        await userEvent.click(getLevelNodes(3)[0]);
        expect(spyOnSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange.mock.lastCall[0]).toEqual([expect.objectContaining({ label: '鱼', key: 'fish' }), expect.objectContaining({ label: '北京', key: 'beijing' })]);
    });

    it('keyMaps 属性', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: 'Beijing',
            onChange: spyOnChange,
            defaultExpandAll: true,
            motion: false,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo'], expect.anything(), expect.anything());
        expect(isChecked(getLevelNodes(2)[0])).toBe(true);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(/^中国$/);
    });

    it('keyMaps 配合 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: {
                label1: '北京',
                value1: 'Beijing',
                key1: 'beijing',
            },
            onChangeWithObject: true,
            onChange: spyOnChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        expect(getLabel(document.querySelector(`.${optionCls}-disabled`))).toEqual('中国');
        const selectedNode = getLevelNodes(3)[0];
        expect(isChecked(selectedNode)).toBe(true);
        expect(getLabel(selectedNode)).toEqual('北京');
        await userEvent.click(getLevelNodes(3)[1]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.lastCall[0]).toEqual([specialTreeData[0].children1[0]]);
        expect(getSelection().querySelector(`.${BASE_CLASS_PREFIX}-tag-content`)).toHaveTextContent(/^中国$/);
    });

    it('onChange 配合 autoMergeValue', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            autoMergeValue: false,
        });
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('zhongguo', true, expect.objectContaining({ key: 'zhongguo' }));
        expect(spyOnChange).toHaveBeenCalledWith(['Zhongguo', 'Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['中国', '北京', '上海']);
    });
});
