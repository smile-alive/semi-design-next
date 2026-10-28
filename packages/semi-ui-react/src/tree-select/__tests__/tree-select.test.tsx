import { StrictMode, useState } from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { BasicTreeNodeData } from '@fibrae/semi-foundation/tree/foundation';
import { CheckboxGroup, ConfigProvider, Form, Popover, Tag, TreeSelect } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { TreeNodeData } from '@fibrae/semi-ui-react/tree/interface';
import { countLiveListeners } from '@test/utils/react';
import type { TreeSelectProps, TriggerRenderProps } from '../index';

// onChange is an overload set (value form and object form), which one mock type cannot express
type ChangeSpy = (...args: unknown[]) => void;
type LoadData = NonNullable<TreeSelectProps['loadData']>;

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

const treeData2 = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
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
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

const treeData3 = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
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

const treeDataEnNA = {
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
};

const treeDataEn = [
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
                    },
                    {
                        label: 'Shanghai',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                    {
                        label: 'Chengdu',
                        value: 'Chengdu',
                        key: '0-0-2',
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
    treeDataEnNA,
];

const defaultKeyMaps = {
    value: 'value1',
    key: 'key1',
    label: 'label1',
    children: 'children1',
    disabled: 'disabled1',
};

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

const treeDataWithDisabledLeaf = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            { label: 'Beijing', value: 'Beijing', key: '0-0', disabled: true },
            { label: 'Shanghai', value: 'Shanghai', key: '0-1' },
        ],
    },
];

const treeDataWithDisabledGrandchild = [
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
                    { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                ],
            },
        ],
    },
];

const treeDataWithLoad = [
    {
        label: 'Node 1',
        value: 'node1',
        key: 'node1',
        isLeaf: false,
    },
];

const commonProps = {
    motion: false,
    motionExpand: false,
};

// rerender merges onto the initial props, so a test only passes what changes
function renderTreeSelect(props) {
    const baseProps = { ...commonProps, defaultOpen: true, treeData, ...props };
    const ui = (newProps?) => <TreeSelect {...baseProps} {...newProps} />;
    const result = render(ui());
    return { ...result, rerender: (newProps) => result.rerender(ui(newProps)) };
}

// the root; it is the combobox unless a search input on it takes that role
const getTrigger = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select`);
const getPopover = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-popover`);
const getPopoverWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
const getOptions = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option`)];
const getOptionsOfLevel = (level) => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option.${BASE_CLASS_PREFIX}-tree-option-level-${level}`)];
// label text queries break once Highlight splits a searched label into several spans
const getNode = (label) => getOptions().find((node) => node.textContent === label);
const getNodeLabels = () => getOptions().map((node) => node.textContent);
const getSelectedLabels = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-option-selected`)].map((node) => node.textContent);
const getHighlights = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option-highlight`)];
const isCollapsed = (node) => node.classList.contains(`${BASE_CLASS_PREFIX}-tree-option-collapsed`);
const getSelection = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection`);
const getSearchInput = () => document.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-tree-search-wrapper input`);
const getTriggerInput = () => getTrigger().querySelector('input');
const getTags = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection .${BASE_CLASS_PREFIX}-tag`)];
const getTagTexts = () => getTags().map((tag) => tag.textContent);
const getClearButton = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-clearbtn`);
const getExpandIcon = (label) => getNode(label).querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option-expand-icon`);
const clickExpandIcon = (label) => userEvent.click(getExpandIcon(label));
const isChecked = (label) => getNode(label).getAttribute('aria-checked') === 'true';
// one change event per keyword: userEvent.type would fire onSearch once per character
const search = (value, input: HTMLElement = getSearchInput()) => fireEvent.change(input, { target: { value } });

describe('TreeSelect', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('className 和 style', () => {
        renderTreeSelect({
            className: 'test',
            style: { height: 420 },
        });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ height: '420px' });
    });

    it('placeholder 属性', () => {
        renderTreeSelect({ placeholder: 'semi' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).toHaveTextContent('semi');
    });

    it('validateStatus 属性', () => {
        const { rerender } = renderTreeSelect({});
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-error`);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-warning`);
        rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-error`);
        rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-warning`);
    });

    it('outerBottomSlot 属性', () => {
        renderTreeSelect({
            outerBottomSlot: <div className="outer-slot">outer</div>,
        });
        expect(getPopover()).toContainElement(screen.getByText('outer'));
    });

    it('size 属性', () => {
        const { rerender } = renderTreeSelect({});
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-large`);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-small`);
        rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-large`);
        rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-small`);
    });

    it('自定义 dropdownClassName 和 dropdownStyle', () => {
        renderTreeSelect({
            dropdownClassName: 'test',
            dropdownStyle: {
                color: 'red',
            },
        });
        expect(getPopover()).toHaveClass('test');
        expect(getPopover()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    // jsdom has no layout, so only the trigger-width variable wiring on the popover wrapper is checked
    it('dropdownMatchSelectWidth 为 true', () => {
        renderTreeSelect({
            style: { width: 90 },
            defaultValue: 'abc',
        });
        expect(getPopoverWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth 为 false', () => {
        renderTreeSelect({
            style: { width: 90 },
            defaultValue: 'abc',
            dropdownMatchSelectWidth: false,
        });
        expect(getPopoverWrapper().style.minWidth).toEqual('');
    });

    it('自定义 prefix、suffix 和 insetLabel', () => {
        const { unmount } = renderTreeSelect({
            prefix: <div className="prefix">prefix content</div>,
            suffix: <div className="suffix">suffix content</div>,
        });
        expect(getTrigger()).toContainElement(screen.getByText('prefix content'));
        expect(getTrigger()).toContainElement(screen.getByText('suffix content'));
        unmount();

        renderTreeSelect({ insetLabel: 'semi' });
        expect(getTrigger()).toContainElement(screen.getByText('semi'));
    });

    it('prefix、suffix、insetLabel 为 0 时照常渲染', () => {
        const { unmount } = renderTreeSelect({ prefix: 0, suffix: 0 });
        expect(getTrigger().querySelector('.semi-tree-select-prefix')).toHaveTextContent(/^0$/);
        expect(getTrigger().querySelector('.semi-tree-select-suffix')).toHaveClass('semi-tree-select-suffix-text');
        expect(getTrigger()).toHaveClass('semi-tree-select-with-prefix', 'semi-tree-select-with-suffix');
        unmount();
        renderTreeSelect({ insetLabel: 0 });
        expect(screen.getByRole('combobox')).toHaveAccessibleName('0');
    });

    it('空数据', () => {
        renderTreeSelect({
            treeData: [],
            emptyContent: 'empty',
        });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent('empty');
    });

    it('defaultOpen 属性', () => {
        const { unmount } = renderTreeSelect({ defaultOpen: false });
        expect(getPopover()).toBeNull();
        unmount();

        renderTreeSelect({ defaultOpen: true });
        expect(getPopover()).not.toBeNull();
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('未声明的 open 属性不打开下拉，按根元素透传', () => {
        renderTreeSelect({ defaultOpen: false, open: true });
        expect(getPopover()).toBeNull();
        expect(getTrigger()).toHaveAttribute('open');
    });

    it('defaultValue 属性', () => {
        const { unmount } = renderTreeSelect({
            defaultValue: 'Beijing',
        });
        expect(getSelection()).toHaveTextContent('北京');
        expect(getSelectedLabels()).toEqual(['北京']);
        unmount();

        renderTreeSelect({
            defaultValue: ['Riben', 'Beijing'],
        });
        expect(getSelectedLabels()).toEqual(['日本']);
        expect(getSelection()).toHaveTextContent('日本');
        expect(isCollapsed(getOptionsOfLevel(2)[0])).toEqual(true);
    });

    it('treeData 晚于 defaultValue 到达时保留默认选中', () => {
        const single = renderTreeSelect({ defaultOpen: false, treeData: [], defaultValue: 'Beijing' });
        single.rerender({ treeData });
        expect(getSelection()).toHaveTextContent('北京');
        single.unmount();

        const multiple = renderTreeSelect({ defaultOpen: false, treeData: [], defaultValue: ['Beijing'], multiple: true });
        multiple.rerender({ treeData });
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('defaultExpandedKeys 属性', () => {
        renderTreeSelect({
            defaultExpandedKeys: ['zhongguo', 'beimeizhou'],
        });
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(false);
        expect(isCollapsed(topNodes[1])).toEqual(false);
        const children = getOptionsOfLevel(2);
        expect(isCollapsed(children[0])).toEqual(false);
        expect(isCollapsed(children[1])).toEqual(true);
    });

    it('defaultExpandAll 属性', () => {
        const { rerender } = renderTreeSelect({
            defaultExpandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);

        rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(2);
        expect(getOptions().filter(isCollapsed)).toHaveLength(2);
    });

    it('expandAll 属性', () => {
        const { rerender } = renderTreeSelect({
            expandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);

        rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(5);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);
    });

    it('expandedKeys 的值生效', () => {
        const { rerender } = renderTreeSelect({
            expandedKeys: ['beimeizhou'],
        });
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
        expect(isCollapsed(topNodes[1])).toEqual(false);
        rerender({ expandedKeys: ['yazhou', 'zhongguo', 'beimeizhou'] });
        const children = getOptionsOfLevel(2);
        expect(isCollapsed(children[0])).toEqual(false);
        expect(isCollapsed(children[1])).toEqual(true);
    });

    it('展开行为与 onExpand', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            onExpand: spyOnExpand,
        });
        await clickExpandIcon('亚洲');
        expect(spyOnExpand).toHaveBeenCalledTimes(1);
        expect(spyOnExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        let topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(false);
        expect(isCollapsed(topNodes[1])).toEqual(true);
        await clickExpandIcon('亚洲');
        expect(spyOnExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
    });

    it('受控 expandedKeys 与 onExpand', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            expandedKeys: ['beimeizhou'],
            onExpand: spyOnExpand,
        });
        await clickExpandIcon('亚洲');
        expect(spyOnExpand).toHaveBeenCalledWith(['beimeizhou', 'yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(isCollapsed(getOptionsOfLevel(1)[0])).toEqual(true);
    });

    it('选择节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('北京'));
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.anything());

        await userEvent.click(getTrigger());
        expect(getNode('北京')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-selected`);
        expect(getSelection()).toHaveTextContent('北京');

        await userEvent.click(getNode('亚洲'));
        expect(spyOnSelect).toHaveBeenLastCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(spyOnChange).toHaveBeenLastCalledWith('Yazhou', expect.objectContaining({ key: 'yazhou' }), expect.anything());

        await userEvent.click(getTrigger());
        expect(getNode('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-selected`);
        expect(getSelection()).toHaveTextContent('亚洲');
    });

    it('onClear', async () => {
        const spyOnClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        renderTreeSelect({
            defaultExpandAll: true,
            onClear: spyOnClear,
            showClear: true,
        });
        await userEvent.click(getNode('北京'));
        await userEvent.click(getClearButton());

        expect(spyOnClear).toHaveBeenCalledTimes(1);
        expect(getSelection()).toHaveTextContent('');
    });

    it('onChange 且 value 未变化', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
            defaultValue: 'Beijing',
        });
        await userEvent.click(getNode('北京'));
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).not.toHaveBeenCalled();
    });

    it('onChange 与 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            defaultExpandAll: true,
            onChangeWithObject: true,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('北京'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beijing' }), expect.anything());
    });

    it('treeNodeLabelProp 属性', async () => {
        renderTreeSelect({
            defaultValue: 'Beijing',
            treeNodeLabelProp: 'value',
        });
        expect(getSelection()).toHaveTextContent('Beijing');

        await userEvent.click(getNode('亚洲'));
        expect(getSelection()).toHaveTextContent('Yazhou');
    });

    it('filterTreeNode 为 true 时显示输入框', () => {
        const { rerender } = renderTreeSelect({});
        expect(getSearchInput()).toBeNull();
        rerender({
            filterTreeNode: true,
        });
        expect(getSearchInput()).not.toBeNull();
    });

    it('searchPlaceholder 属性', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPlaceholder: 'test',
        });
        expect(getSearchInput()).toHaveAttribute('placeholder', 'test');
    });

    it('onSearch', () => {
        const spyOnSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            filterTreeNode: true,
            onSearch: spyOnSearch,
        });
        search('semi');
        expect(spyOnSearch).toHaveBeenCalledTimes(1);
        expect(spyOnSearch.mock.calls[0][0]).toEqual('semi');

        search('北京');
        expect(spyOnSearch).toHaveBeenCalledTimes(2);
        const args = spyOnSearch.mock.calls[1];
        expect(args[0]).toEqual('北京');
        expect(args[1]).toContain('yazhou');
        expect(args[1]).toContain('zhongguo');
    });

    it('filterTreeNode 显示正确的结果', () => {
        const { unmount } = renderTreeSelect({
            filterTreeNode: true,
        });
        search('北');
        expect(getOptions()).toHaveLength(6);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北', '北']);
        unmount();

        renderTreeSelect({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
        });
        search('an');
        expect(getOptions()).toHaveLength(10);
    });

    it('filterTreeNode 无结果', () => {
        const { unmount } = renderTreeSelect({
            filterTreeNode: true,
        });
        search('Bei');
        expect(getOptions()).toHaveLength(2);
        expect(getHighlights()).toHaveLength(0);
        unmount();

        renderTreeSelect({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
        });
        search('北');
        expect(getOptions()).toHaveLength(2);
    });

    it('异步加载数据', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        const data = {
            label: '亚洲',
            value: 'Asia',
            key: 'asia',
        };
        renderTreeSelect({
            loadData,
            onLoad,
            loadedKeys: ['0-1'],
            treeData: [data],
        });
        await clickExpandIcon('亚洲');
        expect(loadData).toHaveBeenCalledWith(data);
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['0-1', 'asia']), data));
    });

    it('loadData 失败时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.reject(new Error('load failed')));
        const onRejection = () => {};
        // A loadData rejection is rethrown to the caller by design; catch it so it does not fail the test
        process.on('unhandledRejection', onRejection);
        try {
            renderTreeSelect({ loadData, treeData: [{ label: '亚洲', value: 'Asia', key: 'asia' }] });
            await clickExpandIcon('亚洲');
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getNode('亚洲').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
            await clickExpandIcon('亚洲');
            await clickExpandIcon('亚洲');
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await new Promise((resolve) => setTimeout(resolve, 0));
            process.off('unhandledRejection', onRejection);
        }
    });

    it('filterTreeNode 配合 treeNodeFilterProp', () => {
        renderTreeSelect({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
        });
        search('Bei');
        expect(getOptions()).toHaveLength(6);
    });

    it('filterTreeNode 配合 showFilteredOnly 无结果', () => {
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
        });
        search('Bei');
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent('暂无数据');
    });

    it('filterTreeNode 配合 showFilteredOnly 显示正确的结果', () => {
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
        });
        search('北');
        expect(getOptions()).toHaveLength(4);
        expect(getHighlights()).toHaveLength(2);
    });

    it('filterTreeNode 配合 showFilteredOnly 时 aria-setsize 和 aria-posinset 只统计可见的同级节点', () => {
        renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true });
        search('东京');
        const items = screen.getAllByRole('treeitem');
        expect(items.map((item) => item.textContent)).toEqual(['亚洲', '日本', '东京']);
        for (const item of items) {
            expect(item).toHaveAttribute('aria-setsize', '1');
            expect(item).toHaveAttribute('aria-posinset', '1');
        }
    });

    it('filterTreeNode 为函数', () => {
        renderTreeSelect({
            filterTreeNode: (inputValue, treeNode) => treeNode === inputValue,
        });
        search('北');
        expect(getHighlights()).toHaveLength(0);
        search('北京');
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北京']);
    });

    it('受控：value 显示正确', () => {
        const { unmount } = renderTreeSelect({
            value: 'Beijing',
        });
        expect(getSelectedLabels()).toEqual(['北京']);
        expect(getSelection()).toHaveTextContent('北京');
        unmount();

        renderTreeSelect({
            value: ['Riben', 'Beijing'],
        });
        expect(getSelectedLabels()).toEqual(['日本']);
        expect(getSelection()).toHaveTextContent('日本');
        expect(isCollapsed(getOptionsOfLevel(2)[0])).toEqual(true);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            value: '',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelectedLabels()).toEqual([]);
        await userEvent.click(getNode('北京'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.calls[0][0]).toEqual('Beijing');
        expect(getSelection()).toHaveTextContent('');
        await userEvent.click(getTrigger());
        expect(getSelectedLabels()).toEqual([]);
    });

    it('受控：value 配合 onChangeWithObject', () => {
        renderTreeSelect({
            value: {
                label: '北京',
                value: 'Beijing',
                key: 'beijing',
            },
            defaultExpandAll: true,
            onChange: vi.fn<ChangeSpy>(),
            onChangeWithObject: true,
        });
        expect(getSelectedLabels()).toEqual(['北京']);
    });

    it('虚拟化：固定高度', () => {
        renderTreeSelect({
            defaultExpandAll: true,
            virtualize: {
                itemSize: 28,
                height: 84,
            },
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
        expect(getOptions().length).toBeLessThan(10);
    });

    it('disabled 属性', async () => {
        renderTreeSelect({
            disabled: true,
        });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-disabled`);
        expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toBeNull();

        await userEvent.click(getTrigger());
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toBeNull();
    });

    it('renderSelectedItem', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            renderSelectedItem: (treeNode) => treeNode.value,
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('亚洲'));
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect.mock.calls[0][0]).toEqual('yazhou');
        expect(spyOnChange.mock.calls[0][0]).toEqual('Yazhou');
        expect(getSelection().querySelector('span')).toHaveTextContent('Yazhou');
    });

    it('treeData 更新时，非受控单选不清空 value', async () => {
        const { rerender } = renderTreeSelect({
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('北京'));
        expect(getSelection().querySelector('span')).toHaveTextContent('北京');
        rerender({ treeData: treeChildren });
        expect(getSelection().querySelector('span')).toHaveTextContent('北京');
        rerender({ treeData: treeData2 });
        expect(getSelection().querySelector('span').textContent).toEqual('');
    });

    it('treeData 更新时，非受控多选不清空 value', async () => {
        const { rerender } = renderTreeSelect({
            defaultExpandAll: true,
            multiple: true,
        });
        await userEvent.click(getNode('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        rerender({ treeData: treeChildren });
        expect(getTagTexts()).toEqual(['北京']);
        rerender({ treeData: treeData2 });
        expect(getTags()).toHaveLength(0);
    });

    it('treeData 更新时，受控单选不清空 value', () => {
        const { rerender } = renderTreeSelect({
            defaultExpandAll: true,
            value: 'Beijing',
        });
        expect(getSelection().querySelector('span')).toHaveTextContent('北京');
        rerender({ treeData: treeChildren });
        expect(getSelection().querySelector('span')).toHaveTextContent('北京');
        rerender({ treeData: treeData3 });
        expect(getSelection().querySelector('span')).toHaveTextContent('Beijing');
    });

    it('treeData 更新时，受控多选不清空 value', () => {
        const { rerender } = renderTreeSelect({
            defaultExpandAll: true,
            multiple: true,
            value: 'Beijing',
        });
        expect(getTagTexts()).toEqual(['北京']);
        rerender({ treeData: treeChildren });
        expect(getTagTexts()).toEqual(['北京']);
        rerender({ treeData: treeData3 });
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('受控 expandedKeys 配合 filterTreeNode', () => {
        const spyOnExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            expandedKeys: [],
            onExpand: spyOnExpand,
            filterTreeNode: true,
        });
        search('北京');
        expect(spyOnExpand).not.toHaveBeenCalled();
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
        expect(isCollapsed(topNodes[1])).toEqual(true);
    });

    it('option 不在 treeData 中 + treeData 项带有 value', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        const { unmount } = renderTreeSelect({
            defaultValue: 'fish',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelection()).toHaveTextContent('fish');
        await userEvent.click(getNode('北京'));
        expect(spyOnChange.mock.calls[0][0]).toEqual('Beijing');
        expect(getSelection()).toHaveTextContent('北京');
        unmount();

        renderTreeSelect({
            defaultValue: { label: '鱼', value: 'Fish', key: 'fish' },
            onChangeWithObject: true,
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelection()).toHaveTextContent('鱼');
        await userEvent.click(getNode('北京'));
        expect(spyOnChange).toHaveBeenLastCalledWith(expect.objectContaining({ label: '北京', value: 'Beijing', key: 'beijing' }), expect.anything());
    });

    it('option 不在 treeData 中 + treeData 项没有 value', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        const { unmount } = renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: 'fish',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelection()).toHaveTextContent('fish');
        await userEvent.click(getNode('北京'));
        expect(spyOnChange.mock.calls[0][0]).toEqual('beijing');
        unmount();

        renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: { label: '鱼', key: 'fish' },
            onChangeWithObject: true,
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelection()).toHaveTextContent('鱼');
        await userEvent.click(getNode('北京'));
        expect(spyOnChange).toHaveBeenLastCalledWith({ label: '北京', key: 'beijing' }, expect.anything());
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
        const disabledNode = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`);
        expect(disabledNode.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('中国');
        expect(getSelectedLabels()).toEqual(['北京']);
        await userEvent.click(getNode('上海'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.calls[0][0]).toEqual('Shanghai');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('上海');
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
        const disabledNode = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`);
        expect(disabledNode.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('中国');
        expect(getSelectedLabels()).toEqual(['北京']);
        await userEvent.click(getNode('上海'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
                label1: '上海',
                value1: 'Shanghai',
                key1: 'shanghai',
            }),
            expect.anything()
        );
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('上海');
    });

    it('onSearch 配合 filteredNodes', () => {
        const spyOnSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
            onSearch: spyOnSearch,
        });
        search('o');
        const args = spyOnSearch.mock.calls[0];
        expect(args[0]).toEqual('o');
        expect(args[1]).toEqual(['0-1', '0']);
        expect(args[2]).toEqual([treeDataEnNA, { label: 'Osaka', value: 'Osaka', key: '0-1-0' }]);
    });

    it('onFocus 回调', async () => {
        const spyOnFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        renderTreeSelect({
            defaultOpen: false,
            onFocus: spyOnFocus,
        });
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        await userEvent.click(getTrigger());
        expect(spyOnFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
    });

    it('onBlur 回调', async () => {
        const spyOnBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        renderTreeSelect({
            defaultOpen: false,
            onBlur: spyOnBlur,
        });
        await userEvent.click(getTrigger());
        expect(spyOnBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(spyOnBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
    });

    it('maxTagCount', () => {
        renderTreeSelect({
            multiple: true,
            maxTagCount: 1,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });

        expect(getTagTexts()).toEqual(['北京', '+1']);
    });

    it('size="small" 时 maxTagCount 的 +N 标签与标签组同为 small', () => {
        renderTreeSelect({
            multiple: true,
            size: 'small',
            maxTagCount: 1,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });
        const tags = getTags();
        expect(tags.map((tag) => tag.textContent)).toEqual(['北京', '+1']);
        expect(tags[1]).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tag-group`)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-group-small`);
    });

    it('borderless 属性', () => {
        renderTreeSelect({
            borderless: true,
        });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-borderless`);
    });

    it('arrowIcon 属性', () => {
        renderTreeSelect({
            arrowIcon: <span className="custom-arrow">arrow</span>,
        });
        expect(getTrigger()).toContainElement(screen.getByText('arrow'));
    });

    it('showClear 属性', () => {
        renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
            defaultOpen: false,
        });
        expect(getClearButton()).not.toBeNull();
    });

    it('leafOnly 属性', async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            leafOnly: true,
            defaultExpandAll: true,
            onChange: spyOnChange,
        });

        await userEvent.click(getNode('亚洲'));

        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai', 'Dongjing', 'Daban']);
        expect(getTagTexts()).toEqual(['北京', '上海', '东京', '大阪']);
    });

    it('foundation 初始化：searchAutoFocus 与 searchPosition 为 trigger', async () => {
        renderTreeSelect({
            searchAutoFocus: true,
            searchPosition: 'trigger',
            filterTreeNode: true,
            defaultOpen: false,
        });
        expect(getPopover()).not.toBeNull();
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        await waitFor(() => expect(getTriggerInput()).toHaveFocus());
    });

    it('foundation findDataForValue 配合 onChangeWithObject', () => {
        renderTreeSelect({
            onChangeWithObject: true,
            value: [{ value: 'Beijing', key: '0-0-0', label: 'Beijing' }],
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('foundation handleNodeLoad 配合 loadData', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            onLoad,
            defaultExpandAll: false,
        });
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledWith(treeDataWithLoad[0]);
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
    });

    it('foundation handleClear 配合 filterTreeNode 和 searchPosition 为 trigger', async () => {
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        renderTreeSelect({
            showClear: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: 'Beijing',
            defaultExpandAll: true,
            onClear,
        });
        expect(getTrigger()).toHaveTextContent('北京');
        await userEvent.click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveTextContent('北京');
    });

    it('foundation removeTag 配合 checkRelation 为 related', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['中国']);
        await userEvent.click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(false);
    });

    it('foundation removeTag 配合 checkRelation 为 unRelated', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京', '上海']);
        await userEvent.click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('foundation clearInput 恢复 expandedKeys', () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
        });
        search('test');
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
        search('');
        expect(getOptions()).toHaveLength(10);
        expect(getSelectedLabels()).toEqual(['北京']);
    });

    it('foundation handleInputChange 配合 showFilteredOnly 为 false', () => {
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: false,
            defaultExpandAll: true,
        });
        search('北京');
        expect(getNodeLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '北美洲']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北京']);
    });

    it('foundation handleMultipleSelect 配合 disableStrictly', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [
                        { label: 'Child 1', value: 'child1', key: 'child1', disabled: true },
                        { label: 'Child 2', value: 'child2', key: 'child2' },
                    ],
                },
            ],
            defaultExpandAll: true,
            onChange,
        });
        await userEvent.click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith(['child2'], expect.anything(), expect.anything());
        expect(isChecked('Child 1')).toEqual(false);
        expect(isChecked('Child 2')).toEqual(true);
        expect(isChecked('Parent')).toEqual(false);
        await userEvent.click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Child 2')).toEqual(false);
    });

    it('foundation handleNodeExpandInSearch', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: false,
            defaultExpandAll: false,
            onExpand,
            treeData: treeDataEn,
        });
        search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('foundation handleNodeExpand 无子节点时', () => {
        renderTreeSelect({
            treeData: [
                { label: 'Leaf 1', value: 'leaf1', key: 'leaf1' },
                { label: 'Leaf 2', value: 'leaf2', key: 'leaf2' },
            ],
        });
        expect(getNodeLabels()).toEqual(['Leaf 1', 'Leaf 2']);
        expect(getExpandIcon('Leaf 1')).toBeNull();
        expect(getExpandIcon('Leaf 2')).toBeNull();
    });

    it('foundation getRenderTextInSingle 配合自定义 renderSelectedItem', () => {
        renderTreeSelect({
            renderSelectedItem: (item) => `Custom: ${item.label}`,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
        });
        expect(getSelection()).toHaveTextContent('Custom: 北京');
    });

    it('foundation handleInputTriggerFocus 与 handleInputTriggerBlur', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultOpen: true,
        });
        const upperCls = `${BASE_CLASS_PREFIX}-tree-select-triggerSingleSearch-upper`;
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-triggerSingleSearch-wrapper`);
        expect(wrapper).not.toHaveClass(upperCls);
        fireEvent.focus(getTriggerInput());
        expect(wrapper).toHaveClass(upperCls);
        fireEvent.blur(getTriggerInput());
        expect(wrapper).not.toHaveClass(upperCls);
    });

    it('index.tsx renderSuffix 字符串类型的 suffix', () => {
        renderTreeSelect({
            suffix: 'suffix text',
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-suffix-text`)).toHaveTextContent('suffix text');
    });

    it('index.tsx renderPrefix 配合 insetLabel', () => {
        renderTreeSelect({
            insetLabel: 'Label:',
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-inset-label`)).toHaveTextContent('Label:');
    });

    it('index.tsx renderTagList 中 renderSelectedItem 返回 isRenderInTag 为 false', () => {
        const renderSelectedItem = (item, { index }) => ({
            isRenderInTag: false,
            content: (
                <span key={index} className="custom-tag">
                    {item.label}
                </span>
            ),
        });
        renderTreeSelect({
            multiple: true,
            renderSelectedItem,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        const customTags = [...getSelection().querySelectorAll('.custom-tag')];
        expect(customTags.map((tag) => tag.textContent)).toEqual(['中国']);
        expect(getTags()).toHaveLength(0);
    });

    it('index.tsx renderTagList 禁用项', () => {
        renderTreeSelect({
            multiple: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
    });

    it('index.tsx renderSingleTriggerSearchItem 配合 placeholder', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            placeholder: 'Select something',
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`)).toHaveTextContent('Select something');
    });

    it('index.tsx renderSelectContent 多选且无值', () => {
        renderTreeSelect({
            multiple: true,
            placeholder: 'Please select',
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).toHaveTextContent('Please select');
        expect(getTags()).toHaveLength(0);
    });

    it('index.tsx renderTagItem 中 renderSelectedItem 返回 isRenderInTag 为 false', () => {
        const renderSelectedItem = (item, { index }) => ({
            isRenderInTag: false,
            content: (
                <span key={index} className="custom-content">
                    {item.label}
                </span>
            ),
        });
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            renderSelectedItem,
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTrigger().querySelector('.custom-content')).toHaveTextContent('北京');
        expect(getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-tag`)).toBeNull();
    });

    it('index.tsx renderInput 配合 searchRender 为 false', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchRender: false,
        });
        expect(getSearchInput()).toBeNull();
        expect(getPopover().querySelector('input')).toBeNull();
    });

    it('searchRender 为 true 时渲染默认搜索框', () => {
        renderTreeSelect({ filterTreeNode: true, searchRender: true });
        expect(getSearchInput()).toHaveAttribute('placeholder', '搜索');
        search('东京');
        expect(getHighlights()).toHaveLength(1);
    });

    it('index.tsx renderInput 配合自定义 searchRender 函数', () => {
        const searchRender = (inputProps) => <input className="custom-search" placeholder={inputProps.placeholder} />;
        renderTreeSelect({
            filterTreeNode: true,
            searchRender,
        });
        const customSearch = getPopover().querySelector('.custom-search');
        expect(customSearch).not.toBeNull();
        expect(customSearch).toHaveAttribute('placeholder', '搜索');
    });

    it('getDerivedStateFromProps：motion 与 treeData 的 key 变化', () => {
        const { rerender } = renderTreeSelect({
            motion: true,
            treeData: treeDataEn,
        });
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        rerender({ treeData: [{ label: 'New Node', value: 'new', key: 'new' }] });
        expect(getNodeLabels()).toEqual(['New Node']);
    });

    it('getDerivedStateFromProps：受控 expandedKeys', () => {
        const { rerender } = renderTreeSelect({
            expandedKeys: ['0'],
            treeData: treeDataEn,
        });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
    });

    it('getDerivedStateFromProps：expandedKeys 与 motion 隐藏', () => {
        const { rerender } = renderTreeSelect({
            motion: true,
            expandedKeys: ['0', '0-0'],
            treeData: treeDataEn,
        });
        expect(getOptions()).toHaveLength(7);
        rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        expect(isCollapsed(getNode('China'))).toEqual(true);
    });

    it('getDerivedStateFromProps：搜索时 treeData 变化', () => {
        const { rerender } = renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
        });
        search('Asia');
        rerender({ treeData: [{ label: 'Asia Updated', value: 'Asia', key: '0' }] });
        expect(getNodeLabels()).toEqual(['Asia Updated']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Asia']);
    });

    it('getDerivedStateFromProps：搜索时 expandedKeys 变化', () => {
        const { rerender } = renderTreeSelect({
            filterTreeNode: true,
            expandedKeys: ['0'],
            motion: true,
            treeData: treeDataEn,
        });
        search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Asia']);
    });

    it('getDerivedStateFromProps：单选模式下 value 变化', () => {
        const { rerender } = renderTreeSelect({
            value: 'Beijing',
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        rerender({ value: 'Shanghai' });
        expect(getSelection()).toHaveTextContent('Shanghai');
        expect(getSelectedLabels()).toEqual(['Shanghai']);
    });

    it('getDerivedStateFromProps：defaultExpandedKeys', () => {
        renderTreeSelect({ treeData: treeDataEn, defaultExpandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('getDerivedStateFromProps：defaultValue 展开祖先节点', () => {
        renderTreeSelect({ treeData: treeDataEn, defaultValue: 'Beijing' });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('getDerivedStateFromProps：value 展开祖先节点', () => {
        renderTreeSelect({ treeData: treeDataEn, value: 'Beijing' });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('getDerivedStateFromProps：treeData 变化时的 selectedKeys', () => {
        const { rerender } = renderTreeSelect({
            defaultValue: 'Beijing',
            treeData: treeDataEn,
        });
        expect(getSelectedLabels()).toEqual(['Beijing']);
        rerender({
            treeData: [
                {
                    label: 'Asia',
                    value: 'Asia',
                    key: '0',
                    children: [{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }],
                },
            ],
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('calcCheckedStatus 有禁用的后代节点', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [
                        { label: 'Child 1', value: 'child1', key: 'child1', disabled: true },
                        { label: 'Child 2', value: 'child2', key: 'child2' },
                    ],
                },
            ],
            defaultExpandAll: true,
            defaultValue: ['child2'],
            onChange,
        });
        expect(isChecked('Child 2')).toEqual(true);
        await userEvent.click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Child 2')).toEqual(false);
        expect(isChecked('Child 1')).toEqual(false);
    });

    it('calcNonDisabledCheckedKeys 所有后代都禁用', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [
                        { label: 'Child 1', value: 'child1', key: 'child1', disabled: true },
                        { label: 'Child 2', value: 'child2', key: 'child2', disabled: true },
                    ],
                },
            ],
            defaultExpandAll: true,
            onChange,
        });
        expect(getNode('Parent')).toHaveAttribute('aria-disabled', 'true');
        expect(getNode('Child 1')).toHaveAttribute('aria-disabled', 'true');
        expect(getNode('Child 2')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getNode('Parent'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getTags()).toHaveLength(0);
    });

    it('handleNodeExpandInSearch 通过 filteredExpandedKeys 收起', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: false,
            defaultExpandAll: true,
            onExpand,
            treeData: treeDataEn,
        });
        search('Asia');
        await clickExpandIcon('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('handleNodeExpand 配合 loadData', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
        });
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(loadData).toHaveBeenCalledWith(treeDataWithLoad[0]);
        await waitFor(() => expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true'));
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
    });

    it('handleNodeExpand 收起', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            defaultExpandAll: true,
            onExpand,
            treeData: treeDataEn,
        });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(expect.not.arrayContaining(['0']), expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('virtualize 属性', () => {
        renderTreeSelect({
            virtualize: {
                height: 300,
                itemSize: 36,
            },
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
        expect(getNode('Asia')).toHaveStyle({ height: '36px', top: '0px' });
        expect(getNode('China')).toHaveStyle({ height: '36px', top: '36px' });
    });

    it('emptyContent 属性', () => {
        renderTreeSelect({
            treeData: [],
            emptyContent: <div className="custom-empty">No Data</div>,
        });
        expect(getPopover()).toContainElement(screen.getByText('No Data'));
    });

    it('triggerRender 属性', () => {
        const triggerRender = ({ value, placeholder }) => <div className="custom-trigger">{value.length > 0 ? value.map((v) => v.label).join(', ') : placeholder}</div>;
        renderTreeSelect({
            triggerRender,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
        });
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('北京');
    });

    it('expandAction 为 click', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            expandAction: 'click',
            defaultExpandAll: false,
            treeData: treeDataEn,
            onVisibleChange,
        });
        await userEvent.click(getNode('Asia'));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Asia']);
        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        await userEvent.click(getNode('China'));
        await userEvent.click(getNode('Beijing'));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('expandAction 为 doubleClick', async () => {
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({
            expandAction: 'doubleClick',
            defaultExpandAll: false,
            treeData: treeDataEn,
            onSelect,
        });
        await userEvent.click(getNode('Asia'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);

        await userEvent.dblClick(getNode('North America'));
        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(onSelect).toHaveBeenLastCalledWith('1', true, expect.objectContaining({ label: 'North America' }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('labelEllipsis 属性', () => {
        renderTreeSelect({
            labelEllipsis: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getOptions().every((node) => node.classList.contains(`${BASE_CLASS_PREFIX}-tree-option-ellipsis`))).toBe(true);
    });

    it('showLine 属性', () => {
        renderTreeSelect({
            showLine: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getNode('Beijing').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-switcher-leaf-line`)).not.toBeNull();
        expect(getNode('Asia').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-switcher`)).toBeNull();
    });

    it('renderLabel 属性', () => {
        const renderLabel = (label) => <span className="custom-label">{label}</span>;
        renderTreeSelect({
            renderLabel,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        const labels = [...document.querySelectorAll('.custom-label')];
        expect(labels).toHaveLength(10);
        expect(labels[0]).toHaveTextContent('Asia');
    });

    it('renderFullLabel 属性', () => {
        const renderFullLabel = (data) => <div className="full-label">{data.data.label}</div>;
        renderTreeSelect({
            renderFullLabel,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        const labels = [...document.querySelectorAll('.full-label')];
        expect(labels).toHaveLength(10);
        expect(labels[0]).toHaveTextContent('Asia');
        expect(getOptions()).toHaveLength(0);
    });

    it('preventScroll 属性', async () => {
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        renderTreeSelect({
            preventScroll: true,
            filterTreeNode: true,
            searchAutoFocus: true,
            defaultOpen: false,
        });
        await userEvent.click(getTrigger());
        await waitFor(() => expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true }));
    });

    it('searchAutoFocus 在下拉显示时聚焦搜索框，不等进场动画结束', async () => {
        // jsdom runs no transitions; one that never finishes keeps the popup entering
        const spy = vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ finished: new Promise(() => {}) } as unknown as Animation]);
        onTestFinished(() => spy.mockRestore());
        renderTreeSelect({ filterTreeNode: true, searchAutoFocus: true, defaultOpen: false });
        await userEvent.click(getTrigger());
        await waitFor(() => expect(getSearchInput()).toHaveFocus());
    });

    it('restTagsPopoverProps 属性', async () => {
        renderTreeSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'top' },
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['北京', '+1']);
        fireEvent.mouseEnter(screen.getByText('+1'));
        await waitFor(() => expect(screen.getByText('东京')).toBeInTheDocument());
    });

    it('stopPropagation={false} 时，在 +N 弹层里按下鼠标不关闭下拉面板，在外部按下才关闭', async () => {
        renderTreeSelect({
            stopPropagation: false,
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { trigger: 'custom', visible: true, motion: false, stopPropagation: false },
            defaultValue: ['Beijing', 'Dongjing'],
            defaultOpen: true,
        });
        const restTag = await waitFor(() => {
            const tag = [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag`)].find((el) => el.textContent === '东京');
            expect(tag).toBeDefined();
            return tag;
        });
        fireEvent.mouseDown(restTag);
        expect(getPopover()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('onVisibleChange 回调', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            onVisibleChange,
            defaultOpen: false,
        });
        await userEvent.click(getTrigger());
        expect(onVisibleChange).toHaveBeenCalledWith(true);
    });

    it('foundation handleAfterClose', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultOpen: true,
        });
        search('test');
        await userEvent.click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('foundation setLoadKeys', async () => {
        let resolveLoad;
        const loadData = vi.fn<LoadData>(
            () =>
                new Promise<void>((resolve) => {
                    resolveLoad = resolve;
                })
        );
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
        });
        await clickExpandIcon('Node 1');
        expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).not.toBeNull();
        resolveLoad();
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
    });

    it('foundation getDataForKeyNotInKeyEntities 配合 constructDataForValue', () => {
        renderTreeSelect({
            onChangeWithObject: false,
            value: 'nonexistent',
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('nonexistent');
    });

    it('index.tsx hasValue 无选中时返回 false', () => {
        renderTreeSelect({
            multiple: true,
            showClear: true,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).not.toBeNull();
        expect(getClearButton()).toBeNull();
    });

    it('index.tsx renderTagList 中 renderSelectedItem 返回 null 内容', () => {
        renderTreeSelect({
            multiple: true,
            renderSelectedItem: () => ({
                isRenderInTag: true,
                content: null,
            }),
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(true);
    });

    it('index.tsx renderTagItem 节点为空', () => {
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: ['nonexistent'],
            treeData: treeDataEn,
        });
        expect(getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toHaveTextContent('nonexistent');
    });

    it('getDerivedStateFromProps：expandAll 与 treeData 变化', () => {
        const { rerender } = renderTreeSelect({
            expandAll: true,
            treeData: treeDataEn,
        });
        expect(getOptions()).toHaveLength(10);
        rerender({
            treeData: [
                {
                    label: 'New Root',
                    value: 'newroot',
                    key: 'newroot',
                    children: [{ label: 'New Child', value: 'newchild', key: 'newchild' }],
                },
            ],
        });
        expect(getNodeLabels()).toEqual(['New Root', 'New Child']);
    });

    it('getDerivedStateFromProps：showFilteredOnly 与搜索时 expandedKeys 变化', () => {
        const { rerender } = renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            expandedKeys: ['0'],
            motion: true,
            treeData: treeDataEn,
        });
        search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan']);
        rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan']);
    });

    it('getDerivedStateFromProps：多选 related 模式下的 checkedKeys', () => {
        const { rerender } = renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            value: ['Beijing'],
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        rerender({ value: ['Beijing', 'Shanghai', 'Chengdu'] });
        expect(getTagTexts()).toEqual(['China']);
        expect(isChecked('China')).toEqual(true);
    });

    it('getDerivedStateFromProps：多选 unRelated 模式下的 realCheckedKeys', () => {
        const { rerender } = renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            value: ['Beijing'],
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        rerender({ value: ['Beijing', 'Shanghai', 'Chengdu'] });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
        expect(isChecked('China')).toEqual(false);
    });

    it('foundation handleTriggerFocus', async () => {
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        renderTreeSelect({
            onFocus,
            defaultOpen: false,
        });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('foundation handleKeyDown 按 Escape', async () => {
        renderTreeSelect({
            defaultOpen: true,
        });
        fireEvent.keyDown(getPopover(), { key: 'Escape' });
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('foundation handleSingleSelect', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            onChange,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('北京'));
        expect(onChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.anything());
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('index.tsx renderTree 配合空 treeData', () => {
        renderTreeSelect({
            treeData: [],
        });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent('暂无数据');
    });

    it('foundation _isSelectToClose 在 expandAction 为 false 时返回 true', async () => {
        renderTreeSelect({
            expandAction: false,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('亚洲'));
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(getSelection()).toHaveTextContent('亚洲');
    });

    it('foundation getTreeNodeProps 配合 disableStrictly', () => {
        renderTreeSelect({
            disableStrictly: true,
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [{ label: 'Child', value: 'child', key: 'child', disabled: true }],
                },
            ],
            defaultExpandAll: true,
        });
        expect(getNode('Child')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-disabled`);
        expect(getNode('Parent')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-disabled`);
    });

    it('emptyContent 为 null 时不渲染任何内容', () => {
        renderTreeSelect({
            treeData: [],
            emptyContent: null,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-empty`)).toBeNull();
        const list = document.getElementById(screen.getByRole('combobox').getAttribute('aria-controls'));
        expect(list).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-list-hidden`);
    });

    it('没有数据时列表容器是 role="none"，不是没有 treeitem 的 tree', () => {
        renderTreeSelect({ treeData: [], multiple: true, 'aria-label': 'Region' });
        expect(screen.queryByRole('tree')).toBeNull();
        const list = document.getElementById(screen.getByRole('combobox').getAttribute('aria-controls'));
        expect(list).toHaveAttribute('role', 'none');
        expect(list).not.toHaveAttribute('aria-label');
        expect(list).not.toHaveAttribute('aria-multiselectable');
        expect(list).toHaveTextContent(zh_CN.Tree.emptyText);
    });

    it('renderTagItem 没有 renderSelectedItem 函数', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京']);
        await userEvent.click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTags()).toHaveLength(0);
    });

    it('通过 ref 搜索会打开下拉框并过滤', () => {
        const ref = { current: null };
        render(<TreeSelect {...commonProps} ref={ref} filterTreeNode treeData={treeDataEn} />);
        expect(getPopover()).toBeNull();
        void act(() => ref.current.search('Osaka'));
        expect(getPopover()).not.toBeNull();
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Osaka']);
    });

    it('在触发器上按 Enter 打开下拉框', () => {
        renderTreeSelect({ defaultOpen: false });
        fireEvent.keyDown(getTrigger(), { key: 'Enter', code: 'Enter' });
        expect(getPopover()).not.toBeNull();
    });

    it('清空按钮是具名原生按钮，Enter 和 Space 可以按下它，但不打开树', async () => {
        for (const key of ['{Enter}', ' ']) {
            const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
            const { unmount } = renderTreeSelect({
                showClear: true,
                defaultValue: 'Beijing',
                defaultOpen: false,
                onClear,
            });
            await userEvent.tab();
            expect(getTrigger()).toHaveFocus();
            await userEvent.tab();
            const clear = screen.getByRole('button', { name: zh_CN.TreeSelect.clear });
            expect(clear).toHaveFocus();
            expect(clear).toHaveAttribute('type', 'button');
            await userEvent.keyboard(key);
            expect(onClear).toHaveBeenCalledTimes(1);
            expect(getSelection()).not.toHaveTextContent('北京');
            expect(screen.queryByRole('button', { name: zh_CN.TreeSelect.clear })).toBeNull();
            expect(getTrigger()).toHaveFocus();
            expect(getPopover()).toBeNull();
            unmount();
        }
    });

    it('搜索输入框作为 combobox 时，清空后焦点回到该输入框', async () => {
        renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            defaultOpen: false,
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        await userEvent.tab();
        expect(input).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: zh_CN.TreeSelect.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(getSelection()).not.toHaveTextContent('北京');
        expect(input).toHaveFocus();
    });

    it('adapter updateInputFocus 配合 tagInputRef', async () => {
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            searchAutoFocus: true,
            defaultExpandAll: true,
            treeData: treeDataEn,
            defaultOpen: false,
        });
        await waitFor(() => expect(getTriggerInput()).toHaveFocus());
        expect(getPopover()).not.toBeNull();
    });

    it('adapter updateInputFocus 配合 inputRef 失焦', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'dropdown',
            defaultOpen: true,
        });
        expect(getPopover()).toContainElement(getSearchInput());
        expect(getSearchInput()).not.toHaveFocus();
    });

    it('getTreeNodeKey', () => {
        renderTreeSelect({
            virtualize: {
                height: 300,
                itemSize: 36,
            },
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getNodeLabels().slice(0, 4)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai']);
        expect(new Set(getNodeLabels()).size).toEqual(getNodeLabels().length);
    });

    it('renderTreeNode 在 treeNodeProps 为 null 时返回 null', () => {
        renderTreeSelect({
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka', 'North America', 'United States', 'Canada']);
    });

    it('多选模式下的 onNodeCheck', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({
            multiple: true,
            defaultExpandAll: true,
            treeData: treeDataEn,
            onChange,
            onSelect,
        });
        await userEvent.click(getNode('Beijing').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledWith('0-0-0', true, { label: 'Beijing', value: 'Beijing', key: '0-0-0' });
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('China')).toEqual(false);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('getTreeNodeRequiredProps', () => {
        const { unmount } = renderTreeSelect({
            defaultExpandAll: true,
            defaultValue: 'Beijing',
            treeData: treeDataEn,
        });
        expect(getNode('Beijing')).toHaveAttribute('aria-selected', 'true');
        expect(getNode('Shanghai')).toHaveAttribute('aria-selected', 'false');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('Beijing')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-selected`);
        expect(getNode('Beijing')).toHaveAttribute('aria-level', '3');
        expect(getOptions().filter(isCollapsed)).toEqual([]);
        expect(getNode('Beijing')).not.toHaveAttribute('aria-expanded');
        unmount();

        renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        expect(getOptions().every((node) => node.getAttribute('aria-selected') === 'false')).toBe(true);
    });

    it('renderTagList 中项目返回 undefined 内容', () => {
        renderTreeSelect({
            multiple: true,
            renderSelectedItem: () => ({
                isRenderInTag: true,
                content: undefined,
            }),
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(true);
    });

    it('foundation handleKeyDown 按非 Escape 键', () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            defaultOpen: true,
            onVisibleChange,
        });
        fireEvent.keyDown(getPopover(), { key: 'Enter' });
        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
    });

    it('foundation handleClick 禁用时', async () => {
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        renderTreeSelect({
            disabled: true,
            defaultOpen: false,
            onFocus,
        });
        await userEvent.click(getTrigger());
        expect(getPopover()).toBeNull();
        expect(onFocus).not.toHaveBeenCalled();
    });

    it('foundation handleClick 配合 clickTriggerToHide 为 false', async () => {
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            clickTriggerToHide: false,
            defaultOpen: true,
            onFocus,
            onVisibleChange,
        });
        await userEvent.click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(getTrigger());
        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
    });

    it('foundation handleClear 多选受控', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            showClear: true,
            value: ['Beijing', 'Shanghai'],
            onChange,
            defaultExpandAll: true,
        });
        await userEvent.click(getClearButton());
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('foundation handleClear 单选受控', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            showClear: true,
            value: 'Beijing',
            onChange,
            defaultExpandAll: true,
        });
        await userEvent.click(getClearButton());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBeUndefined();
        expect(getSelection()).toHaveTextContent('北京');
    });

    it('foundation _isLoadControlled 配合 loadedKeys', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            loadedKeys: ['node1'],
            loadData,
            onExpand,
            treeData: [{ label: 'Node 1', value: 'node1', key: 'node1', isLeaf: false }],
        });
        await clickExpandIcon('Node 1');
        expect(onExpand).toHaveBeenCalledWith(['node1'], expect.objectContaining({ expanded: true }));
        expect(loadData).not.toHaveBeenCalled();
        expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true');
    });

    it('foundation findDataForValue 数组类型的 value', () => {
        renderTreeSelect({
            onChangeWithObject: true,
            value: [
                { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
                { value: 'Shanghai', key: '0-0-1', label: 'Shanghai' },
            ],
            multiple: true,
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
    });

    it('foundation findDataForValue 配合 defaultValue', () => {
        renderTreeSelect({
            onChangeWithObject: true,
            defaultValue: { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('getDerivedStateFromProps：motion 与搜索时 expandedKeys 隐藏', () => {
        const { rerender } = renderTreeSelect({
            filterTreeNode: true,
            motion: true,
            expandedKeys: ['0', '0-0'],
            treeData: treeDataEn,
        });
        search('Asia');
        expect(getOptions()).toHaveLength(7);
        rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('adapter registerClickOutsideHandler', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            defaultOpen: true,
            onVisibleChange,
        });
        await userEvent.click(screen.getByRole('tree'));
        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        await userEvent.click(document.body);
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('renderTagItem 配合 disableStrictly 与禁用节点', () => {
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            disableStrictly: true,
            treeData: [
                {
                    label: 'Asia',
                    value: 'Asia',
                    key: '0',
                    children: [{ label: 'Beijing', value: 'Beijing', key: '0-0', disabled: true }],
                },
            ],
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTags()).toHaveLength(1);
        expect(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
    });

    it('renderSingleTriggerSearchItem 禁用时', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            disabled: true,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-disabled`)).toHaveTextContent('北京');
        expect(getTriggerInput()).toBeDisabled();
    });

    it('foundation handleClick 配合 searchPosition 为 trigger 与 inputValue', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultOpen: true,
            onVisibleChange,
        });
        act(() => {
            getTriggerInput().focus();
        });
        search('test', getTriggerInput());
        await userEvent.click(getTrigger());
        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
        expect(getTriggerInput()).toHaveValue('test');
    });

    it('foundation handleInputChange 配合自定义 filterTreeNode 函数', () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        const filterTreeNode = (inputValue, label) => label.toLowerCase().includes(inputValue.toLowerCase());
        renderTreeSelect({
            filterTreeNode,
            onSearch,
            treeData: treeDataEn,
        });
        search('asia');
        expect(onSearch.mock.calls[0][2].map((node) => node.label)).toEqual(['Asia']);
    });

    it('foundation handleInputChange 配合 treeNodeFilterProp', () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
            onSearch,
            treeData: treeDataEn,
        });
        search('Asia');
        expect(onSearch.mock.calls[0][2].map((node) => node.value)).toEqual(['Asia']);
    });

    it('getDerivedStateFromProps：disabledKeys', () => {
        const { rerender } = renderTreeSelect({
            disableStrictly: true,
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [{ label: 'Child', value: 'child', key: 'child', disabled: true }],
                },
            ],
            defaultExpandAll: true,
        });
        expect(getNode('Parent')).toHaveAttribute('aria-disabled', 'true');
        rerender({
            treeData: [
                {
                    label: 'Parent',
                    value: 'parent',
                    key: 'parent',
                    children: [
                        { label: 'Child 1', value: 'child1', key: 'child1', disabled: true },
                        { label: 'Child 2', value: 'child2', key: 'child2' },
                    ],
                },
            ],
        });
        expect(getNode('Parent')).toHaveAttribute('aria-disabled', 'false');
        expect(getNode('Child 1')).toHaveAttribute('aria-disabled', 'true');
        expect(getNode('Child 2')).toHaveAttribute('aria-disabled', 'false');
    });

    it('adapter updateState 经搜索触发', () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultExpandAll: true,
            treeData: treeDataEn,
        });
        search('Beijing');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Beijing']);
    });

    it('outerTopSlot 属性', () => {
        renderTreeSelect({
            outerTopSlot: <div className="outer-top">Top Slot</div>,
        });
        expect(getPopover()).toContainElement(screen.getByText('Top Slot'));
    });

    it('outerTopSlot 与 outerBottomSlot 同时使用', () => {
        renderTreeSelect({
            outerTopSlot: <div className="outer-top-slot">Top</div>,
            outerBottomSlot: <div className="outer-bottom-slot">Bottom</div>,
        });
        const tree = screen.getByRole('tree');
        expect(screen.getByText('Top').compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByText('Bottom').compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('outerTopSlot 隐藏默认搜索框', () => {
        renderTreeSelect({
            filterTreeNode: true,
            outerTopSlot: <div className="custom-search">Custom Search</div>,
        });
        expect(screen.getByText('Custom Search')).toBeInTheDocument();
        expect(getSearchInput()).toBeNull();
    });

    it('showSearchClear 属性', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            showSearchClear: true,
        });
        search('test');
        fireEvent.mouseEnter(getSearchInput().parentElement);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`));
        expect(getSearchInput()).toHaveValue('');
    });

    it('stopPropagation 属性', async () => {
        const onOuterClick = vi.fn<() => void>();
        const { unmount } = render(
            <div onClick={onOuterClick}>
                <TreeSelect {...commonProps} defaultOpen stopPropagation treeData={treeData} />
            </div>
        );
        await userEvent.click(getNode('亚洲'));
        expect(onOuterClick).not.toHaveBeenCalled();
        unmount();

        render(
            <div onClick={onOuterClick}>
                <TreeSelect {...commonProps} defaultOpen stopPropagation={false} treeData={treeData} />
            </div>
        );
        await userEvent.click(getNode('亚洲'));
        expect(onOuterClick).toHaveBeenCalled();
    });

    it('stopPropagation={false} 时，在面板内嵌套 Popover 的弹层里按下鼠标不关闭，在外部按下才关闭', async () => {
        renderTreeSelect({
            stopPropagation: false,
            treeData: treeDataEn,
            renderLabel: (label) =>
                label === 'Asia' ? (
                    <Popover content={<button type="button">inside nested</button>} motion={false} stopPropagation={false} trigger="custom" visible>
                        <span>{label}</span>
                    </Popover>
                ) : (
                    label
                ),
        });
        fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPopover()).not.toBeNull();
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('搜索时展开匹配项的祖先节点', () => {
        renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
        });
        search('Beijing');
        expect(isCollapsed(getNode('Asia'))).toEqual(false);
        expect(isCollapsed(getNode('China'))).toEqual(false);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Beijing']);
    });

    it('foundation handleAfterClose 清空输入', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultOpen: true,
        });
        search('北京');
        expect(getHighlights()).toHaveLength(1);
        fireEvent.keyDown(getPopover(), { key: 'Escape' });
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getHighlights()).toHaveLength(0);
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('insetLabelId 属性', () => {
        renderTreeSelect({
            insetLabel: 'Label:',
            insetLabelId: 'custom-label-id',
        });
        expect(document.getElementById('custom-label-id')).toHaveTextContent('Label:');
    });

    it('aria-label 属性', () => {
        renderTreeSelect({
            'aria-label': 'Select a location',
        });
        expect(screen.getByRole('combobox', { name: 'Select a location' })).toBe(getTrigger());
    });

    it('aria-labelledby 属性', () => {
        renderTreeSelect({
            'aria-labelledby': 'label-id',
        });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('aria-describedby 属性', () => {
        renderTreeSelect({
            'aria-describedby': 'desc-id',
        });
        expect(getTrigger()).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('aria-required 属性', () => {
        renderTreeSelect({
            'aria-required': true,
        });
        expect(getTrigger()).toHaveAttribute('aria-required', 'true');
    });

    it('aria-invalid 属性', () => {
        renderTreeSelect({
            'aria-invalid': true,
        });
        expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-errormessage 属性', () => {
        renderTreeSelect({
            'aria-errormessage': 'error-msg-id',
        });
        expect(getTrigger()).toHaveAttribute('aria-errormessage', 'error-msg-id');
    });

    it('foundation findDataForValue 数组类型的 value', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            onChangeWithObject: true,
            value: [{ value: 'Beijing', key: '0-0-0', label: 'Beijing' }],
            multiple: true,
            treeData: treeDataEn,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        await userEvent.click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual([
            { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
            { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
        ]);
    });

    it('foundation handleNodeLoad 配合 loadData', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            onLoad,
            defaultExpandAll: true,
        });
        expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true');
        await clickExpandIcon('Node 1');
        expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'false');
        expect(loadData).not.toHaveBeenCalled();
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(loadData).toHaveBeenCalledWith(treeDataWithLoad[0]);
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
        expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true');
    });

    it('foundation _notifyMultipleChange 配合 onChangeWithObject', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            onChangeWithObject: true,
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Beijing'));
        expect(onChange).toHaveBeenCalledWith([{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }], expect.anything());
    });

    it('foundation handleClick 已聚焦时', async () => {
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        renderTreeSelect({
            defaultOpen: true,
            onFocus,
        });
        await userEvent.click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(getTrigger());
        expect(getPopover()).not.toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('foundation handleClear 配合 filterTreeNode 为 trigger 且 selectedKeys 非空', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            showClear: true,
            defaultValue: 'Beijing',
            onChange,
            onClear,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('test', getTriggerInput());
        await userEvent.click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBeUndefined();
        expect(getTriggerInput()).toHaveValue('');
        expect(getTrigger()).not.toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual([]);
    });

    it('foundation removeTag 禁用项', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        const [beijingTag, shanghaiTag] = getTags();
        expect(beijingTag.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).toBeNull();
        await userEvent.click(shanghaiTag.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('foundation removeTag 配合 disableStrictly', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        await userEvent.click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('foundation removeTag 配合 checkRelation 为 unRelated', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await userEvent.click(getTags()[1].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('foundation removeTag 配合 checkRelation 为 related', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await userEvent.click(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['Shanghai']);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('foundation handleMultipleSelect 配合 checkRelation 为 unRelated 时新增', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Beijing'));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing'], expect.anything(), expect.anything());
        await userEvent.click(getNode('Shanghai'));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
    });

    it('foundation handleMultipleSelect 配合 checkRelation 为 unRelated 时移除', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            onSelect,
            treeData: treeDataEn,
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(isChecked('Beijing')).toEqual(true);
        await userEvent.click(getNode('Beijing'));
        expect(onSelect).toHaveBeenCalledWith('0-0-0', false, { label: 'Beijing', value: 'Beijing', key: '0-0-0' });
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Beijing')).toEqual(false);
        expect(getTags()).toHaveLength(0);
    });

    it('foundation handleNodeExpandInSearch 配合 expanded 为 true', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onExpand,
        });
        search('Beijing');
        expect(getNodeLabels()).toContain('Beijing');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0-0'], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('foundation getRenderTextInSingle 无 selectedKeys', () => {
        renderTreeSelect({
            treeData: treeDataEn,
        });
        const content = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`);
        expect(content).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`);
        expect(content.textContent).toEqual('');
    });

    it('foundation handleInputTriggerBlur', () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: 'Beijing',
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        const item = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`);
        const placeholderCls = `${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`;
        expect(item).toHaveTextContent('Beijing');
        expect(item).not.toHaveClass(placeholderCls);
        fireEvent.focus(getTriggerInput());
        expect(item).toHaveClass(placeholderCls);
        fireEvent.blur(getTriggerInput());
        expect(item).not.toHaveClass(placeholderCls);
    });

    it('foundation handlePopoverVisibleChange 配合 filterTreeNode 为 false', async () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        renderTreeSelect({
            filterTreeNode: false,
            defaultOpen: true,
            onVisibleChange,
        });
        await userEvent.click(getTrigger());
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('foundation handleAfterClose 配合 filterTreeNode', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultOpen: true,
        });
        search('北京');
        await userEvent.click(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getHighlights()).toHaveLength(0);
    });

    it('foundation handleTriggerBlur 未聚焦时', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        renderTreeSelect({
            treeData: treeDataEn,
            onBlur,
        });
        await userEvent.click(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('foundation _notifyChange 单选值为 undefined', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            onChange,
            treeData: treeDataEn,
        });
        await userEvent.click(getClearButton());
        expect(onChange).toHaveBeenCalledWith(undefined, undefined, expect.anything());
        expect(getSelection()).not.toHaveTextContent('Beijing');
    });

    it('foundation handleMultipleSelect 受控 value', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            value: ['Beijing'],
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai']);
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('foundation clearInput 从 selectedKeys 恢复 expandedKeys', () => {
        renderTreeSelect({
            filterTreeNode: true,
            defaultValue: 'Beijing',
            treeData: treeDataEn,
        });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        search('test');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        search('');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
    });

    it('foundation _notifyMultipleChange 中 key 不在 keyEntities 内', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            onChange,
            treeData: treeDataEn,
            defaultValue: ['NotInTree'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['NotInTree']);
        await userEvent.click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toHaveLength(2);
        expect(onChange.mock.calls[0][0]).toEqual(expect.arrayContaining(['NotInTree', 'Beijing']));
    });

    it('foundation removeTag 中 key 不在 keyEntities 内', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'NotInTree'],
            defaultExpandAll: true,
        });
        const notInTreeTag = getTags().find((tag) => tag.textContent === 'NotInTree');
        await userEvent.click(notInTreeTag.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('foundation getRenderTextInSingle 中 key 不在 keyEntities 内', () => {
        renderTreeSelect({
            treeData: treeDataEn,
            defaultValue: 'NotInTree',
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('NotInTree');
        expect(getSelectedLabels()).toEqual([]);
    });

    it('foundation handleNodeLoad 异步回调', async () => {
        let resolveLoad;
        const loadData = vi.fn<LoadData>(
            () =>
                new Promise<void>((resolve) => {
                    resolveLoad = resolve;
                })
        );
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            onLoad,
        });
        await clickExpandIcon('Node 1');
        expect(onLoad).not.toHaveBeenCalled();
        resolveLoad();
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
    });

    it('foundation handleNodeLoad 配合受控 loadedKeys', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            onLoad,
            loadedKeys: [],
        });
        await clickExpandIcon('Node 1');
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
    });

    it('foundation handleNodeLoad 在 key 已加载时返回空', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            loadedKeys: ['node1'],
            defaultExpandAll: true,
        });
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        expect(loadData).not.toHaveBeenCalled();
        expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull();
    });

    it('foundation calcCheckedKeys 取消勾选', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await userEvent.click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['Shanghai']);
    });

    it('foundation handleMultipleSelect 配合 disableStrictly 与禁用后代', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            onChange,
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Asia'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(isChecked('Shanghai')).toEqual(true);
        expect(isChecked('Beijing')).toEqual(false);
        expect(isChecked('China')).toEqual(false);
    });

    it('foundation calcCheckedStatus 所有非禁用节点均已勾选', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Shanghai')).toEqual(true);
        await userEvent.click(getNode('Asia'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(getTags()).toHaveLength(0);
    });

    it('foundation handleNodeExpandInSearch 通过 filteredExpandedKeys 删除', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Beijing');
        expect(getNodeLabels()).toContain('Beijing');
        await clickExpandIcon('China');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('foundation handleNodeExpand 通过 expandedKeys 删除', async () => {
        renderTreeSelect({
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await clickExpandIcon('China');
        expect(isCollapsed(getNode('China'))).toEqual(true);
        expect(getNode('Beijing')).toBeUndefined();
        expect(getNode('Osaka')).not.toBeUndefined();
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'Osaka', 'North America', 'United States', 'Canada']);
    });

    it('foundation handlePopoverVisibleChange 配合 searchAutoFocus 与下拉框', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchAutoFocus: true,
            searchPosition: 'dropdown',
            defaultOpen: false,
        });
        expect(getSearchInput()).toBeNull();
        await userEvent.click(getTrigger());
        await waitFor(() => expect(getSearchInput()).toHaveFocus());
    });

    it('foundation _notifySingleChange 配合 onChangeWithObject', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            onChangeWithObject: true,
            showClear: true,
            defaultValue: { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
            onChange,
            treeData: treeDataEn,
        });
        await userEvent.click(getNode('Shanghai'));
        expect(onChange).toHaveBeenCalledWith({ label: 'Shanghai', value: 'Shanghai', key: '0-0-1' }, expect.anything());
    });

    it('index.tsx onNodeCheck', async () => {
        renderTreeSelect({
            multiple: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Osaka').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(isChecked('Osaka')).toEqual(true);
        expect(isChecked('Japan')).toEqual(true);
        expect(getTagTexts()).toEqual(['Japan']);
    });

    it('非受控多选清空后下拉保持打开', async () => {
        renderTreeSelect({
            multiple: true,
            showClear: true,
            defaultValue: ['Beijing'],
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        await userEvent.click(getClearButton());
        expect(getTags()).toHaveLength(0);
        expect(getPopover()).not.toBeNull();
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('index.tsx adapter notifySearch', () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            filterTreeNode: true,
            onSearch,
            treeData: treeDataEn,
        });
        search('Beijing');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('Beijing', expect.arrayContaining(['0', '0-0']), [{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }]);
    });

    it('foundation handleMultipleSelect 配合 searchPosition 为 trigger', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Beijing', getTriggerInput());
        expect(getTriggerInput()).toHaveValue('Beijing');
        await userEvent.click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTriggerInput()).toHaveValue('');
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('foundation calcNonDisabledCheckedKeys 有禁用后代', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            onChange,
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(isChecked('Beijing')).toEqual(false);
        expect(isChecked('Shanghai')).toEqual(true);
    });

    it('foundation handleNodeExpand 直接展开', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({ onExpand, treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('foundation handleNodeExpand 受控 expandedKeys', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({ expandedKeys: ['0'], onExpand, treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('foundation handleNodeExpand 搜索时', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            onExpand,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Asia');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true }));
        search('');
        expect(getOptions()).toHaveLength(10);
    });

    it('foundation removeTag 禁用项', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            filterTreeNode: true,
            searchPosition: 'trigger',
            onChange,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('foundation removeTag 配合 disableStrictly', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onChange,
            treeData: [...treeDataWithDisabledLeaf, { label: 'Tokyo', value: 'Tokyo', key: '1' }],
            defaultValue: ['Beijing', 'Tokyo'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Tokyo']);
        fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
    });

    it('foundation handleSingleSelect 直接调用', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({ onChange, onSelect, treeData: treeDataEn, defaultExpandAll: true });
        await userEvent.click(getNode('Beijing'));
        expect(onSelect).toHaveBeenCalledWith('0-0-0', true, { label: 'Beijing', value: 'Beijing', key: '0-0-0' });
        expect(onChange).toHaveBeenCalledWith('Beijing', { label: 'Beijing', value: 'Beijing', key: '0-0-0' }, expect.anything());
        expect(getSelection()).toHaveTextContent('Beijing');
    });

    it('foundation handleSingleSelect 受控 value', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
        renderTreeSelect({ value: 'Beijing', onChange, onSelect, treeData: treeDataEn, defaultExpandAll: true });
        await userEvent.click(getNode('Shanghai'));
        expect(onSelect).toHaveBeenCalledWith('0-0-1', true, expect.objectContaining({ key: '0-0-1' }));
        expect(onChange.mock.calls[0][0]).toEqual('Shanghai');
        expect(getSelection()).toHaveTextContent('Beijing');
    });

    it('foundation handleNodeSelect 禁用时', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            onChange,
            treeData: [
                {
                    label: 'Asia',
                    value: 'Asia',
                    key: '0',
                    disabled: true,
                    children: [{ label: 'Beijing', value: 'Beijing', key: '0-0' }],
                },
            ],
            defaultExpandAll: true,
        });
        expect(getNode('Asia')).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(getNode('Asia'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectedLabels()).toEqual([]);
        await userEvent.click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual('Beijing');
    });

    it('foundation _showFilteredOnly 方法', () => {
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Beijing');
        expect(getOptions()).toHaveLength(3);
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing']);
        search('');
        expect(getOptions()).toHaveLength(10);
    });

    it('foundation handleClear 非受控模式', async () => {
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            onClear,
            treeData: treeDataEn,
            defaultOpen: false,
        });
        await userEvent.click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelection()).not.toHaveTextContent('Beijing');
        expect(getClearButton()).toBeNull();
    });

    it('折叠动画结束后移除收起的行', async () => {
        renderTreeSelect({
            motion: true,
            motionExpand: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await clickExpandIcon('Asia');
        const collapsible = document.querySelector(`.${BASE_CLASS_PREFIX}-collapsible-wrapper`);
        expect(collapsible).toContainElement(getNode('China'));
        await waitFor(() => expect(collapsible).toHaveStyle({ '--semi-collapsible-height': '0px' }));
        // jsdom runs no CSS transitions, so end it by hand
        fireEvent.transitionEnd(collapsible, { propertyName: 'height' });
        expect(getNode('China')).toBeUndefined();
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('index.tsx updateInputFocus 配合失焦', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            treeData: treeDataEn,
            defaultOpen: true,
        });
        await userEvent.click(getSearchInput());
        expect(getSearchInput()).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(document.activeElement.tagName).not.toEqual('INPUT');
    });

    it('index.tsx getTreeNodeKey', () => {
        renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        expect(getNode('Asia')).toHaveAttribute('data-key', '0');
        expect(getNode('China')).toHaveAttribute('data-key', '0-0');
        expect(getNode('Canada')).toHaveAttribute('data-key', '1-1');
    });

    it('index.tsx notifyLoad 回调', async () => {
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData,
            onLoad,
            defaultExpandAll: true,
        });
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]);
    });

    it('getDerivedStateFromProps：showFilteredOnly 与 motionKeys', () => {
        const { rerender } = renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('index.tsx renderTagList 中 disableStrictly 导致的禁用项', () => {
        renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            defaultValue: ['Beijing', 'Shanghai'],
            treeData: treeDataWithDisabledLeaf,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        expect(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).not.toBeNull();
        expect(getNode('Beijing')).toHaveAttribute('aria-disabled', 'true');
        expect(isChecked('Beijing')).toEqual(true);
    });

    it('foundation handlePopoverVisibleChange 配合 searchAutoFocus 与下拉框搜索', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'dropdown',
            searchAutoFocus: true,
            treeData: treeDataEn,
        });
        await waitFor(() => expect(getSearchInput()).toHaveFocus());
    });

    it('foundation handleNodeExpand 无子节点且无 loadData', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            onExpand,
            treeData: [{ label: 'Node 1', value: 'node1', key: 'node1' }],
            defaultExpandAll: true,
        });
        expect(getExpandIcon('Node 1')).toBeNull();
        await userEvent.click(getNode('Node 1'));
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('foundation handleNodeExpand 收起', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({ onExpand, treeData: treeDataEn, defaultExpandAll: true });
        await clickExpandIcon('North America');
        expect(onExpand).toHaveBeenCalledWith(expect.not.arrayContaining(['1']), expect.objectContaining({ expanded: false, node: treeDataEnNA }));
        expect(getNode('Canada')).toBeUndefined();
    });

    it('foundation handleNodeExpandInSearch 受控 expandedKeys', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            expandedKeys: ['0'],
            onExpand,
            treeData: treeDataEn,
        });
        search('Asia');
        await clickExpandIcon('China');
        expect(onExpand).toHaveBeenCalledWith(['0', '0-0'], expect.objectContaining({ expanded: true }));
        expect(getNode('Beijing')).toBeUndefined();
    });

    it('foundation calcNonDisabledCheckedKeys 有禁用后代', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Shanghai')).toEqual(true);
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Shanghai')).toEqual(false);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('foundation calcNonDisabledCheckedKeys 所有后代都已勾选', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Beijing', 'Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('index.tsx renderTagItem 没有 renderSelectedItem', () => {
        renderTreeSelect({
            multiple: true,
            defaultValue: ['Beijing'],
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(getTags()[0].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`)).not.toBeNull();
    });

    it('foundation handleNodeExpandInSearch 配合 showFilteredOnly', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            onExpand,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Asia');
        expect(getNodeLabels()).toEqual(['Asia']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan']);
    });

    it('foundation handleNodeExpand 配合 showFilteredOnly', async () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            onExpand,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        search('Asia');
        await clickExpandIcon('Asia');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false }));
        expect(getNodeLabels()).toEqual(['Asia']);
    });

    it('showFilteredOnly 搜索中收起节点时，动画中的子行留在该节点之后', async () => {
        renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true, motionExpand: true });
        search('大阪');
        expect(getNodeLabels()).toEqual(['亚洲', '日本', '大阪']);
        await clickExpandIcon('亚洲');
        expect(getNodeLabels()).toEqual(['亚洲', '日本', '大阪']);
    });

    it('getDerivedStateFromProps：motionType 为 hide', () => {
        const { rerender } = renderTreeSelect({ motion: true, treeData: treeDataEn, defaultExpandAll: true });
        expect(getOptions()).toHaveLength(10);
        rerender({ expandedKeys: [] });
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('foundation calcNonDisabledCheckedKeys 在 targetStatus 为 false 时返回 false', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultValue: ['China'],
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Beijing')).toEqual(true);
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('foundation calcNonDisabledCheckedKeys 无禁用后代', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await userEvent.click(getNode('Asia'));
        expect(onChange.mock.calls[0][0]).toEqual(['Asia']);
        expect(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka'].every(isChecked)).toBe(true);
        expect(isChecked('North America')).toEqual(false);
    });

    it('foundation handleClear 配合 triggerSearch、inputValue 且 selectedKeys 为空', async () => {
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            showClear: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onClear,
            onChange,
            treeData: treeDataEn,
        });
        search('Asia', getTriggerInput());
        await userEvent.click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getTriggerInput()).toHaveValue('');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('foundation onClickSingleTriggerSearchItem', async () => {
        renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            treeData: treeDataEn,
            defaultValue: 'Beijing',
        });
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`));
        expect(getTriggerInput()).toHaveFocus();
    });

    it('foundation calcCheckedKeys 有禁用后代且 targetStatus 为 false', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        await userEvent.click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('foundation calcCheckedKeys 无禁用后代', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['China']);
        expect(['Beijing', 'Shanghai', 'Chengdu'].every(isChecked)).toBe(true);
        expect(isChecked('Asia')).toEqual(false);
        await userEvent.click(getNode('China'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('China')).toEqual(false);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('foundation _registerClickOutsideHandler 回调', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        renderTreeSelect({ onBlur, treeData: treeDataEn, defaultOpen: false });
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('foundation clearInputValue 无 inputValue', async () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            filterTreeNode: true,
            onSearch,
            treeData: treeDataEn,
        });
        await userEvent.click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(onSearch).not.toHaveBeenCalled();
    });

    it('修复 #750：在 CheckboxGroup 内勾选一个节点不会勾选所有节点', async () => {
        const groupData = [
            {
                key: '1',
                label: '所有节点',
                value: '1',
                children: [
                    { key: '20006251', label: 'Semi', value: 'semi@bytedance.com' },
                    { key: '20006248', label: 'Design', value: 'design@bytedance.com' },
                    { key: '20006205', label: 'React', value: 'react@bytedance.com' },
                ],
            },
        ];
        const spyOnChange = vi.fn<ChangeSpy>();
        render(
            <CheckboxGroup>
                <TreeSelect {...commonProps} multiple defaultOpen expandAll leafOnly treeData={groupData} onChange={spyOnChange} />
            </CheckboxGroup>
        );
        await userEvent.click(getNode('Semi'));
        expect(spyOnChange.mock.lastCall[0]).toEqual(['semi@bytedance.com']);
        expect(getTagTexts()).toEqual(['Semi']);
        expect(isChecked('Semi')).toBe(true);
        expect(isChecked('Design')).toBe(false);
        expect(isChecked('React')).toBe(false);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
    });

    it('多选时 tree 下直接是 treeitem，没有 CheckboxGroup 的 role=group 层', () => {
        renderTreeSelect({ multiple: true, defaultExpandAll: true });
        const tree = screen.getByRole('tree');
        expect(tree.querySelector('[role="group"]')).toBeNull();
        expect(within(tree).getAllByRole('treeitem')[0].parentElement).toBe(tree);
    });

    it("修复 #1206（valueNotInTreeDataIssue）：checkRelation='unRelated' 时接受不在 treeData 中的值", async () => {
        const spyOnChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            defaultExpandAll: true,
            treeData: treeDataWithoutValue,
            defaultValue: ['beijing', 'fish'],
            onChange: spyOnChange,
        });
        expect(getTagTexts()).toEqual(['北京', 'fish']);
        expect(isChecked('北京')).toBe(true);
        await userEvent.click(getNode('上海'));
        expect(spyOnChange.mock.lastCall[0]).toEqual(['beijing', 'fish', 'shanghai']);
        expect(getTagTexts()).toEqual(['北京', 'fish', '上海']);
    });

    it("修复 #1852：checkRelation='unRelated' 时，loadData 后保留已勾选的节点", async () => {
        function Demo() {
            const [data, setData] = useState([
                { label: 'Expand to load0', value: '0', key: '0' },
                { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
            ]);
            const loadData = ({ key, children }: BasicTreeNodeData) => {
                if (!children) {
                    setData((origin) => origin.map((node) => (node.key === key ? { ...node, children: [{ label: `Child Node${key}-0`, key: `${key}-0` }] } : node)));
                }
                return Promise.resolve();
            };
            return <TreeSelect {...commonProps} defaultValue={['0']} multiple checkRelation="unRelated" defaultOpen loadData={loadData} treeData={data} />;
        }
        render(<Demo />);
        expect(isChecked('Expand to load0')).toBe(true);
        await clickExpandIcon('Expand to load0');
        await waitFor(() => expect(getNode('Child Node0-0')).toBeDefined());
        expect(isChecked('Expand to load0')).toBe(true);
        expect(isChecked('Child Node0-0')).toBe(false);
        expect(getTagTexts()).toEqual(['Expand to load0']);
    });

    it('修复 #1542：expandedKeys 受控时 showFilteredOnly 仍然过滤', async () => {
        function Demo() {
            const [expandedKeys, setExpandedKeys] = useState([]);
            return <TreeSelect {...commonProps} expandedKeys={expandedKeys} filterTreeNode searchPosition="trigger" showFilteredOnly treeData={treeDataEn} onExpand={setExpandedKeys} onSearch={(_input, filteredExpandedKeys) => setExpandedKeys(filteredExpandedKeys)} />;
        }
        render(<Demo />);
        await userEvent.click(getTrigger());
        await userEvent.type(getTriggerInput(), 'b');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing']);
        await userEvent.clear(getTriggerInput());
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await userEvent.type(getTriggerInput(), 's');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka', 'North America', 'United States']);
        await clickExpandIcon('China');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'Osaka', 'North America', 'United States']);
    });
});

describe('TreeSelect 行为', () => {
    it('通过 ref 关闭会关闭下拉框', () => {
        const ref = { current: null };
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        render(<TreeSelect {...commonProps} ref={ref} defaultOpen treeData={treeData} onVisibleChange={onVisibleChange} />);
        expect(getPopover()).not.toBeNull();
        void act(() => ref.current.close());
        expect(getPopover()).toBeNull();
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('data-* 属性落在 combobox 上', () => {
        render(<TreeSelect {...commonProps} data-index="1" data-testid="region" treeData={treeData} />);
        expect(screen.getByTestId('region')).toBe(getTrigger());
        expect(getTrigger()).toHaveAttribute('data-index', '1');
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'tree');
    });

    it('Form：blur 校验与重置', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.TreeSelect {...commonProps} defaultExpandAll field="region" rules={[{ required: true, message: 'required' }]} treeData={treeData} trigger="blur" />
            </Form>
        );
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        await waitFor(() => expect(screen.getByText('required')).toBeInTheDocument());
        await userEvent.click(getTrigger());
        await userEvent.click(getNode('北京'));
        expect(formApi.getValue('region')).toBe('Beijing');
        expect(getSelection()).toHaveTextContent('北京');
        void act(() => formApi.reset());
        expect(formApi.getValue('region')).toBeUndefined();
        expect(getSelection()).not.toHaveTextContent('北京');
    });

    it('StrictMode 下选择只上报一次，外部点击只触发一次 blur', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        render(
            <StrictMode>
                <TreeSelect {...commonProps} defaultExpandAll treeData={treeData} onBlur={onBlur} onChange={onChange} onFocus={onFocus} onVisibleChange={onVisibleChange} />
            </StrictMode>
        );
        await userEvent.click(getTrigger());
        await userEvent.click(getNode('北京'));
        expect(onChange.mock.calls.map((call) => call[0])).toEqual(['Beijing']);
        expect(getPopover()).toBeNull();
        expect(onBlur).toHaveBeenCalledTimes(1);
        await userEvent.click(getTrigger());
        await userEvent.click(document.body);
        expect(getPopover()).toBeNull();
        expect(onVisibleChange.mock.calls).toEqual([[true], [false], [true], [false]]);
        expect(onFocus).toHaveBeenCalledTimes(2);
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    it('StrictMode 下 defaultOpen 只通知一次 onVisibleChange，searchAutoFocus 只通知一次 onFocus', () => {
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
        render(
            <StrictMode>
                <TreeSelect {...commonProps} defaultOpen filterTreeNode searchAutoFocus searchPosition="trigger" treeData={treeData} onFocus={onFocus} onVisibleChange={onVisibleChange} />
            </StrictMode>
        );
        expect(onVisibleChange.mock.calls).toEqual([[true]]);
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('StrictMode 下节点只加载一次', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.resolve());
        const onLoad = vi.fn<NonNullable<TreeSelectProps['onLoad']>>();
        const data = { label: '亚洲', value: 'Asia', key: 'asia' };
        render(
            <StrictMode>
                <TreeSelect {...commonProps} defaultOpen loadData={loadData} treeData={[data]} onLoad={onLoad} />
            </StrictMode>
        );
        await clickExpandIcon('亚洲');
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(loadData).toHaveBeenCalledTimes(1);
    });

    it('triggerRender 拿到 value，并可以清空、搜索和删除', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        let triggerProps;
        const triggerRender = (props) => {
            triggerProps = props;
            return <div className="custom-trigger">{props.value.map((node) => node.label).join(',')}</div>;
        };
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultOpen: false,
            triggerRender,
            onChange,
            onSearch,
        });
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('北京,东京');
        expect(triggerProps.componentProps.multiple).toBe(true);
        void act(() => triggerProps.onRemove('dongjing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        void act(() => triggerProps.onSearch('上'));
        expect(onSearch.mock.calls[0][0]).toBe('上');
        void act(() => triggerProps.onClear({ stopPropagation() {} }));
        expect(onChange.mock.calls[1][0]).toEqual([]);
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('');
    });

    it('聚焦时卸载会移除外部点击监听', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const { unmount } = render(<TreeSelect {...commonProps} treeData={treeData} onBlur={onBlur} />);
        await userEvent.click(getTrigger());
        expect(countLiveListeners(added, removed, 'mousedown')).toBeGreaterThan(0);
        unmount();
        expect(countLiveListeners(added, removed, 'mousedown')).toBe(0);
        fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('受控多选值跟随父组件', () => {
        const { rerender } = renderTreeSelect({ multiple: true, value: ['Beijing'], defaultExpandAll: true });
        expect(getTagTexts()).toEqual(['北京']);
        expect(isChecked('北京')).toBe(true);
        rerender({ value: ['Shanghai', 'Dongjing'] });
        expect(getTagTexts()).toEqual(['上海', '东京']);
        expect(isChecked('北京')).toBe(false);
        expect(isChecked('上海')).toBe(true);
    });

    it('触发器已关闭下拉框后，外部点击才触发 blur', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        const onVisibleChange = vi.fn<NonNullable<TreeSelectProps['onVisibleChange']>>();
        render(<TreeSelect {...commonProps} treeData={treeData} onBlur={onBlur} onVisibleChange={onVisibleChange} />);
        await userEvent.click(getTrigger());
        await userEvent.click(getTrigger());
        expect(getPopover()).toBeNull();
        expect(onBlur).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('aria-expanded 跟随下拉框，clickTriggerToHide 为 false 时同样如此', async () => {
        render(<TreeSelect {...commonProps} clickTriggerToHide={false} treeData={treeData} />);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(getTrigger());
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(getTrigger());
        expect(getPopover()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(document.body);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('aria-controls 指向 role="tree" 列表，单选和多选均如此', async () => {
        const { unmount } = render(<TreeSelect {...commonProps} treeData={treeData} />);
        await userEvent.click(getTrigger());
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        const tree = document.getElementById(getTrigger().getAttribute('aria-controls'));
        expect(tree).toHaveAttribute('role', 'tree');
        expect(tree).toHaveAttribute('aria-multiselectable', 'false');
        expect(tree).toHaveAccessibleName(getTrigger().getAttribute('aria-label'));
        unmount();
        render(<TreeSelect {...commonProps} multiple treeData={treeData} />);
        await userEvent.click(getTrigger());
        const multipleTree = document.getElementById(getTrigger().getAttribute('aria-controls'));
        expect(multipleTree).toHaveAttribute('role', 'tree');
        expect(multipleTree).toHaveAttribute('aria-multiselectable', 'true');
    });

    describe('combobox 与 tree 用同一个名称来源', () => {
        const getTree = () => screen.getByRole('tree');

        it('使用方 aria-label 时两者都用该值', () => {
            renderTreeSelect({ defaultOpen: true, 'aria-label': 'Region', insetLabel: 'Inset' });
            expect(getTrigger()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAttribute('aria-label', 'Region');
            expect(getTree()).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 insetLabel，两者指向同一个标签', () => {
            render(
                <>
                    <span id="external-label">External</span>
                    <TreeSelect {...commonProps} aria-labelledby="external-label" defaultOpen insetLabel="Inset" treeData={treeData} />
                </>
            );
            expect(getTrigger()).toHaveAccessibleName('External');
            expect(getTree()).toHaveAccessibleName('External');
        });

        it('只有 insetLabel 时 combobox 与 tree 都以 insetLabel 命名，没有 insetLabelId 时也能引用', () => {
            const { unmount } = renderTreeSelect({ defaultOpen: true, insetLabel: 'Region' });
            expect(getTrigger()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
            unmount();
            renderTreeSelect({ defaultOpen: true, insetLabel: 'Region', insetLabelId: 'region-label' });
            expect(getTrigger()).toHaveAttribute('aria-labelledby', 'region-label');
            expect(getTree()).toHaveAttribute('aria-labelledby', 'region-label');
        });

        it('有 prefix 时 insetLabel 不渲染，也不作名称来源', () => {
            render(
                <ConfigProvider locale={en_US}>
                    <TreeSelect {...commonProps} defaultOpen insetLabel="Region" treeData={treeData} prefix="Pre" />
                </ConfigProvider>
            );
            expect(getTrigger()).toHaveAccessibleName(en_US.TreeSelect.label);
            expect(getTree()).toHaveAccessibleName(en_US.TreeSelect.label);
        });

        it('没有任何名称来源时 tree 名称等于 combobox 的语言包回落名', () => {
            render(
                <ConfigProvider locale={en_US}>
                    <TreeSelect {...commonProps} defaultOpen treeData={treeData} />
                </ConfigProvider>
            );
            expect(getTrigger()).toHaveAccessibleName(en_US.TreeSelect.label);
            expect(getTree()).toHaveAccessibleName(en_US.TreeSelect.label);
        });

        it('触发器上的搜索框是 combobox 时同样以 insetLabel 命名', () => {
            renderTreeSelect({
                defaultOpen: true,
                multiple: true,
                filterTreeNode: true,
                searchPosition: 'trigger',
                insetLabel: 'Region',
            });
            expect(getTriggerInput()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
        });
    });

    it('触发器搜索上的 searchAutoFocus 聚焦输入框，且不产生未知 DOM 属性', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<TreeSelect {...commonProps} filterTreeNode searchAutoFocus searchPosition="trigger" treeData={treeData} />);
        expect(document.activeElement).toBe(getTriggerInput());
        expect(consoleError.mock.calls.filter((call) => String(call[0]).includes('Invalid DOM property'))).toEqual([]);
    });

    it('ref 暴露 search 和 close', () => {
        const ref = { current: null };
        render(<TreeSelect {...commonProps} ref={ref} treeData={treeData} />);
        expect(Object.keys(ref.current).sort()).toEqual(['close', 'search']);
    });

    it('渲染时读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { TreeSelect: { placeholder: 'global placeholder' } };
        try {
            const { unmount } = render(<TreeSelect {...commonProps} treeData={treeData} />);
            expect(getSelection()).toHaveTextContent('global placeholder');
            unmount();
            render(<TreeSelect {...commonProps} placeholder="own" treeData={treeData} />);
            expect(getSelection()).toHaveTextContent('own');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('未声明属性落在 combobox 上，已声明和 Form 注入的属性不落在上面', () => {
        render(<TreeSelect {...commonProps} id="region" title="Region" insetLabel="Label" insetLabelId="label-id" treeData={treeData} validateStatus="error" onBlur={() => {}} />);
        const root = getTrigger();
        expect(root).toHaveAttribute('id', 'region');
        expect(root).toHaveAttribute('title', 'Region');
        expect(root).not.toHaveAttribute('validatestatus');
        expect(root).not.toHaveAttribute('insetlabel');
        expect(root.querySelector('#label-id')).toHaveTextContent('Label');
    });
});

describe('TreeSelect Tab 停靠点', () => {
    it('禁用时 combobox 不是 Tab 停靠点', async () => {
        render(<TreeSelect disabled treeData={treeData} />);
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('TreeSelect 键盘操作（APG combobox 配合树形弹层）', () => {
    const activeLabel = (host) => document.getElementById(host.getAttribute('aria-activedescendant'))?.textContent;
    const focus = (el) => act(() => el.focus());

    it.each(['{Enter}', ' ', '{ArrowDown}'])('triggerRender 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(e: { stopPropagation: () => void }) => void>((e) => e.stopPropagation());
        renderTreeSelect({
            treeData: treeDataEn,
            defaultOpen: false,
            triggerRender: () => (
                <div className="custom-trigger">
                    <button type="button" aria-label="清除" onClick={onPress} />
                </div>
            ),
        });

        await focus(screen.getByRole('button', { name: '清除' }));
        await userEvent.keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopover()).toBeNull();
    });

    it('triggerRender 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        renderTreeSelect({
            treeData: treeDataEn,
            defaultOpen: false,
            triggerRender: () => (
                <div className="custom-trigger">
                    <Tag aria-label="清除" onClick={onPress}>
                        Asia
                    </Tag>
                </div>
            ),
        });

        await focus(screen.getByRole('button', { name: '清除' }));
        await userEvent.keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getPopover()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: '清除' }));
        expect(getPopover()).not.toBeNull();
    });

    it.each([false, true])('多选时已选标签上按 Enter 不改变面板开合（defaultOpen=%s）', async (defaultOpen) => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        renderTreeSelect({
            treeData: treeDataEn,
            multiple: true,
            defaultValue: ['Beijing'],
            defaultOpen,
            onVisibleChange,
        });

        onVisibleChange.mockClear();

        await focus(screen.getByRole('button', { name: /Beijing/ }));
        await userEvent.keyboard('{Enter}');
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(getPopover() !== null).toBe(defaultOpen);
    });

    it.each(['{Enter}', ' '])('多选、面板打开且有激活行时，已选标签上按 %j 不选中激活行', async (key) => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            treeData: treeDataEn,
            multiple: true,
            defaultValue: ['Beijing'],
            defaultOpen: true,
            onChange,
        });
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBeTruthy();

        await focus(screen.getByRole('button', { name: /Beijing/ }));
        await userEvent.keyboard(key);
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopover()).not.toBeNull();
    });

    it('打开时没有激活行；ArrowDown 激活第一行，Enter 选中它', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({ treeData: treeDataEn, onChange });
        await focus(getTrigger());
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-focused`);
        await userEvent.keyboard('{End}{Enter}');
        expect(onChange).toHaveBeenCalledWith('North America', expect.anything(), expect.anything());
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('Right 展开激活行并进入其中，Left 返回并收起', async () => {
        renderTreeSelect({ treeData: treeDataEn });
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowRight}');
        expect(activeLabel(getTrigger())).toBe('China');
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'false');
    });

    it('下拉框搜索输入框中 Up 和 Down 移动，Left 和 Right 留在文本内', async () => {
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true });
        const input = getSearchInput();
        await focus(input);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(activeLabel(input)).toBe('North America');
        await userEvent.keyboard('{ArrowLeft}');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'false');
        expect(activeLabel(input)).toBe('North America');
    });

    it('搜索无结果时方向键无处可去', async () => {
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, showFilteredOnly: true });
        const input = getSearchInput();
        await userEvent.type(input, 'none');
        await userEvent.keyboard('{ArrowDown}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('多选触发器上搜索时，输入框指向激活行，Enter 勾选它', async () => {
        renderTreeSelect({ treeData: treeDataEn, multiple: true, filterTreeNode: true, searchPosition: 'trigger' });
        const input = getTriggerInput();
        await focus(input);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        expect(activeLabel(input)).toBe('North America');
        expect(isChecked('North America')).toBe(true);
    });

    it('在触发器上输入时移动到以输入内容开头的下一个可见行', async () => {
        renderTreeSelect({ treeData: treeDataEn });
        await focus(getTrigger());
        await userEvent.keyboard('n');
        expect(activeLabel(getTrigger())).toBe('North America');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('数字标签参与键入跳转', async () => {
        renderTreeSelect({
            treeData: [
                { label: 'alpha', value: 'a', key: 'a' },
                { label: 2024, value: 'y', key: 'y' },
            ],
        });
        await focus(getTrigger());
        await userEvent.keyboard('2');
        expect(activeLabel(getTrigger())).toBe('2024');
    });

    it('关闭状态下在触发器上输入字符不打开', async () => {
        renderTreeSelect({ treeData: treeDataEn, defaultOpen: false });
        await focus(getTrigger());
        await userEvent.keyboard('n');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('关闭时 Space 打开面板并阻止默认行为', async () => {
        renderTreeSelect({ treeData: treeDataEn, defaultOpen: false });
        await focus(getTrigger());
        expect(fireEvent.keyDown(getTrigger(), { key: ' ' })).toBe(false);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('打开且没有激活行时 Space 与 Enter 一样关闭面板', async () => {
        renderTreeSelect({ treeData: treeDataEn });
        await focus(getTrigger());
        await userEvent.keyboard(' ');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('关闭时 Home 与 End 打开并激活首、尾可见行', async () => {
        renderTreeSelect({ treeData: treeDataEn, defaultOpen: false });
        await focus(getTrigger());
        await userEvent.keyboard('{End}');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(getTrigger())).toBe('North America');
        await userEvent.keyboard('{Escape}{Home}');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(getTrigger())).toBe('Asia');
    });

    it('触发器搜索框内 Space、Home、End 编辑文本，不打开面板', async () => {
        renderTreeSelect({ treeData: treeDataEn, defaultOpen: false, filterTreeNode: true, searchPosition: 'trigger' });
        await focus(getTriggerInput());
        await userEvent.keyboard('{Home}{End}');
        expect(getTriggerInput()).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('a b');
        expect(getTriggerInput()).toHaveValue('a b');
    });

    it('搜索结果延后渲染，aria-activedescendant 指向已渲染的行', async () => {
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, showFilteredOnly: true });
        const input = getSearchInput();
        await focus(input);
        search('Beijing');
        expect(input).toHaveValue('Beijing');
        await waitFor(() => expect(getNodeLabels()).toContain('Beijing'));
        await userEvent.keyboard('{ArrowDown}');
        const active = document.getElementById(input.getAttribute('aria-activedescendant'));
        expect(active).not.toBeNull();
        expect(getOptions()).toContain(active);
        search('none');
        await waitFor(() => expect(getNodeLabels()).toEqual([zh_CN.Tree.emptyText]));
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('下拉框搜索输入框中输入的字符留在文本内', async () => {
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true });
        const input = getSearchInput();
        await focus(input);
        await userEvent.keyboard('n');
        expect(input).toHaveValue('n');
    });

    it('自定义 textarea 搜索中输入的字符留在文本内', async () => {
        const searchRender = ({ value, onChange }) => <textarea aria-label="search" value={value} onChange={(e) => onChange(e.target.value)} />;
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, searchRender });
        const textarea = screen.getByRole('textbox', { name: 'search' });
        await focus(textarea);
        await userEvent.keyboard('n ');
        expect(textarea).toHaveValue('n ');
    });

    it('自定义 searchRender 接收指向激活行的属性', async () => {
        const searchRender = (inputProps) => (
            <input className="custom-search" aria-activedescendant={inputProps['aria-activedescendant']} aria-autocomplete={inputProps['aria-autocomplete']} aria-controls={inputProps['aria-controls']} aria-label={inputProps['aria-label']} value={inputProps.value} onChange={(e) => inputProps.onChange(e.target.value)} />
        );
        renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, searchRender });
        const input = document.querySelector('.custom-search');
        await focus(input);
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(input)).toBe('Asia');
        expect(input).toHaveAttribute('aria-controls', screen.getByRole('tree').id);
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAccessibleName(zh_CN.TreeSelect.filter);
    });

    it('从关闭的 combobox 按 ArrowDown 和 ArrowUp 可打开', async () => {
        render(<TreeSelect treeData={treeData} />);
        const combobox = screen.getByRole('combobox');
        act(() => {
            combobox.focus();
        });
        await userEvent.keyboard('{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{Escape}');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('触发器上的搜索输入框作为 combobox 且是唯一的 Tab 停靠点（ARIA 1.2）', () => {
        const { unmount } = render(<TreeSelect defaultValue="Beijing" filterTreeNode searchPosition="trigger" treeData={treeData} />);
        const input = screen.getByRole('combobox', { name: zh_CN.TreeSelect.label });
        expect(input).toBe(getTriggerInput());
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveAccessibleDescription('北京');
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
        expect(getTrigger()).not.toHaveAttribute('aria-expanded');
        search('京', input);
        expect(input).not.toHaveAttribute('aria-describedby');
        unmount();

        render(<TreeSelect multiple filterTreeNode searchPosition="trigger" treeData={treeData} />);
        expect(screen.getByRole('combobox')).toBe(getTriggerInput());
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
    });

    it('搜索输入框在下拉框中时，触发器仍是 combobox', () => {
        renderTreeSelect({ filterTreeNode: true, searchPosition: 'dropdown' });
        const search = screen.getByRole('textbox', { name: zh_CN.TreeSelect.filter });
        expect(search).toHaveAttribute('aria-autocomplete', 'list');
        expect(search).toHaveAttribute('aria-controls', screen.getByRole('tree').id);
        expect(screen.getByRole('combobox')).toBe(getTrigger());
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'tree');
        expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    });

    it('指针展开的行成为键盘当前行', async () => {
        renderTreeSelect({ treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-focused`);
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('China');
    });

    it('单选时指针选中的行成为键盘当前行', async () => {
        renderTreeSelect({ clickToHide: false, defaultExpandAll: true, treeData: treeDataEn });
        await userEvent.click(getNode('Asia'));
        expect(activeLabel(getTrigger())).toBe('Asia');
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('China');
    });

    it('指针勾选的行成为键盘当前行', async () => {
        renderTreeSelect({ multiple: true, defaultExpandAll: true, treeData: treeDataEn });
        await userEvent.click(getNode('Beijing'));
        expect(activeLabel(getTrigger())).toBe('Beijing');
        await focus(getTrigger());
        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('Shanghai');
    });
});

describe('TreeSelect 审计修复', () => {
    it('多选触发器搜索后勾选，列表恢复为未搜索的结构并通知清空关键词', async () => {
        const onSearch = vi.fn<NonNullable<TreeSelectProps['onSearch']>>();
        renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            treeData: treeDataEn,
            onSearch,
        });
        search('Beijing', getTriggerInput());
        await userEvent.click(getNode('Beijing'));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        expect(onSearch).toHaveBeenLastCalledWith('', [], []);
    });

    it('unRelated 且 autoMergeValue 为 false 时，勾选的节点显示为标签', async () => {
        renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            autoMergeValue: false,
            showClear: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await userEvent.click(getNode('Beijing'));
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('leafOnly 且 autoMergeValue 为 false 时，勾选父节点只回传叶子', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            leafOnly: true,
            autoMergeValue: false,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await userEvent.click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
    });

    it('keyMaps.label 下搜索期间 treeData 变化后仍按映射的字段过滤', () => {
        const data = [
            { label1: 'Apple', value1: 'a', key1: 'a' },
            { label1: 'Banana', value1: 'b', key1: 'b' },
        ];
        const keyMaps = { label: 'label1', value: 'value1', key: 'key1' };
        const props = { filterTreeNode: true, showFilteredOnly: true, keyMaps };
        const { rerender } = renderTreeSelect({ ...props, treeData: data });
        search('Ban');
        expect(getNodeLabels()).toEqual(['Banana']);
        rerender({ treeData: [...data, { label1: 'Banner', value1: 'c', key1: 'c' }] });
        expect(getNodeLabels()).toEqual(['Banana', 'Banner']);
    });

    it('triggerRender 的 value 不含 undefined：受控 value 不在 treeData 中时给出兜底节点', () => {
        const triggerRender = ({ value }) => <div className="custom-trigger">{value.map((item) => item.label).join(',')}</div>;
        renderTreeSelect({ multiple: true, value: ['ghost'], treeData: treeDataEn, triggerRender });
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('ghost');
    });

    it('受控 expandedKeys 的 TreeSelect 搜索后清空，保持控制方给出的展开状态', () => {
        const onExpand = vi.fn<NonNullable<TreeSelectProps['onExpand']>>();
        renderTreeSelect({
            filterTreeNode: true,
            expandedKeys: [],
            value: 'Beijing',
            treeData: treeDataEn,
            onExpand,
        });
        search('Bei');
        search('');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('焦点离开触发器与弹层时只触发一次 onBlur，在二者之间移动不触发', async () => {
        const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
        const outside = document.body.appendChild(document.createElement('button'));
        renderTreeSelect({ defaultOpen: false, filterTreeNode: true, onBlur });
        await userEvent.click(getTrigger());
        act(() => getSearchInput().focus());
        expect(onBlur).not.toHaveBeenCalled();
        act(() => outside.focus());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        act(() => getTrigger().focus());
        act(() => outside.focus());
        expect(onBlur).toHaveBeenCalledTimes(2);
        outside.remove();
    });

    describe('onFocus 与 onBlur 跟随 DOM 焦点', () => {
        const setup = (props: Partial<TreeSelectProps> = {}) => {
            const onFocus = vi.fn<NonNullable<TreeSelectProps['onFocus']>>();
            const onBlur = vi.fn<NonNullable<TreeSelectProps['onBlur']>>();
            const outside = document.body.appendChild(document.createElement('button'));
            renderTreeSelect({ defaultOpen: false, treeData: treeDataEn, onFocus, onBlur, ...props });
            return { onFocus, onBlur, outside };
        };
        afterEach(() => document.querySelectorAll('body > button').forEach((button) => button.remove()));

        it('焦点进入再离开时 onFocus 与 onBlur 各触发一次', () => {
            const { onFocus, onBlur, outside } = setup();
            act(() => getTrigger().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
            act(() => outside.focus());
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        });

        it('打开下拉、Escape 关闭后离开，onFocus 与 onBlur 各触发一次', async () => {
            const { onFocus, onBlur, outside } = setup();
            act(() => getTrigger().focus());
            await userEvent.keyboard('{ArrowDown}');
            expect(getPopover()).not.toBeNull();
            await userEvent.keyboard('{Escape}');
            act(() => outside.focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('焦点从外部进入弹层搜索框时触发 onFocus，回到触发器不重复', () => {
            const { onFocus } = setup({ defaultOpen: true, filterTreeNode: true });
            act(() => getSearchInput().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            act(() => getTrigger().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
        });

        it('禁用时聚焦不触发 onFocus 或 onBlur', () => {
            const { onFocus, onBlur, outside } = setup({ disabled: true });
            act(() => getTrigger().focus());
            act(() => outside.focus());
            expect(onFocus).not.toHaveBeenCalled();
            expect(onBlur).not.toHaveBeenCalled();
        });
    });

    it('单选节点 label 为 0 时触发器显示 0', () => {
        const zeroData = [{ label: 0, value: 'zero', key: 'zero' }];
        const props = { treeData: zeroData, defaultValue: 'zero', defaultOpen: false, placeholder: 'pick' };
        const { unmount } = renderTreeSelect(props);
        const content = getSelection().querySelector('span');
        expect(content).toHaveTextContent('0');
        expect(content).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`);
        unmount();

        renderTreeSelect({ ...props, filterTreeNode: true, searchPosition: 'trigger' });
        const item = getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`);
        expect(item).toHaveTextContent('0');
        expect(item).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`);
    });

    it('节点数据带 expanded、checked 同名字段时不覆盖行状态', async () => {
        const onChange = vi.fn<ChangeSpy>();
        renderTreeSelect({
            multiple: true,
            motion: false,
            treeData: [
                {
                    key: 'p',
                    label: 'P',
                    value: 'p',
                    expanded: true,
                    children: [
                        { key: 'c', label: 'C', value: 'c', checked: true },
                        { key: 'd', label: 'D', value: 'd' },
                    ],
                },
            ],
            onChange,
        });
        await userEvent.click(getExpandIcon('P'));
        await userEvent.click(getNode('C'));
        expect(onChange.mock.calls[0][0]).toEqual(['c']);
    });

    it('keyMaps.children 映射到其他字段时，节点自带的 children 业务字段不让叶子变成分支', () => {
        renderTreeSelect({ keyMaps: { children: 'items' }, treeData: [{ key: 'a', label: 'A', value: 'a', children: [{ key: 'x', label: 'X', value: 'x' }] }] });
        expect(getNode('A')).not.toHaveAttribute('aria-expanded');
        expect(getExpandIcon('A')).toBeNull();
    });

    it('单选 defaultValue={0} 选中值为 0 的节点并展开其祖先', () => {
        renderTreeSelect({ defaultValue: 0, treeData: [{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 0 }] }] });
        expect(getSelectedLabels()).toEqual(['C']);
    });

    it('多选 defaultValue={0}、受控 value={0} 在 treeData 晚到时都选中值为 0 的节点', () => {
        const zero = [
            { key: 'z', label: 'Zero', value: 0 },
            { key: 'o', label: 'One', value: 1 },
        ];
        const { unmount } = renderTreeSelect({ defaultOpen: false, multiple: true, defaultValue: 0, treeData: zero });
        expect(getTagTexts()).toEqual(['Zero']);
        unmount();
        const { rerender } = renderTreeSelect({ defaultOpen: false, value: 0, treeData: [] });
        rerender({ treeData: zero });
        expect(getSelection()).toHaveTextContent('Zero');
    });

    it('keyMaps.key 配合 loadData 时，依次展开的每个节点都会加载', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.resolve());
        renderTreeSelect({
            keyMaps: { key: 'id' },
            loadData,
            treeData: [
                { id: 'a', label: 'A', value: 'a' },
                { id: 'b', label: 'B', value: 'b' },
            ],
        });
        await clickExpandIcon('A');
        await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
        await clickExpandIcon('B');
        await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        expect(loadData.mock.calls[1][0]).toMatchObject({ id: 'b' });
    });

    it('keyMaps.children 自定义时，expandAction 下单选点击父节点只展开不关闭', async () => {
        renderTreeSelect({ expandAction: 'click', keyMaps: { children: 'items' }, treeData: [{ key: 'p', label: 'P', value: 'p', items: [{ key: 'c', label: 'C', value: 'c' }] }] });
        await userEvent.click(getNode('P'));
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        expect(getNodeLabels()).toEqual(['P', 'C']);
    });

    it.each(['dropdown', 'trigger'] as const)('keyMaps.disabled 标记的禁用节点，其标签没有关闭按钮（searchPosition=%s）', (searchPosition) => {
        renderTreeSelect({
            defaultOpen: false,
            multiple: true,
            filterTreeNode: true,
            searchPosition,
            keyMaps: { key: 'id', disabled: 'off' },
            defaultValue: ['a', 'b'],
            treeData: [
                { id: 'a', label: 'A', value: 'a', off: true },
                { id: 'b', label: 'B', value: 'b' },
            ],
        });
        const closeOf = (text: string) =>
            getTags()
                .find((tag) => tag.textContent === text)
                ?.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`) ?? null;
        expect(getTagTexts()).toEqual(['A', 'B']);
        expect(closeOf('A')).toBeNull();
        expect(closeOf('B')).not.toBeNull();
    });

    it.each([
        ['单选', { value: 'Beijing' }, { value: undefined }],
        ['触发器搜索多选', { multiple: true, filterTreeNode: true, searchPosition: 'trigger', value: ['Beijing'] }, { multiple: true, filterTreeNode: true, searchPosition: 'trigger', value: [] }],
    ])('%s：清除按钮持焦时值被外部清空，焦点回到 combobox', (_, before, after) => {
        const { rerender } = render(<TreeSelect {...commonProps} showClear treeData={treeDataEn} {...(before as TreeSelectProps)} />);
        const clear = screen.getByRole('button', { name: zh_CN.TreeSelect.clear });
        act(() => clear.focus());
        rerender(<TreeSelect {...commonProps} showClear treeData={treeDataEn} {...(after as TreeSelectProps)} />);
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('多选没有选中值时，清除按钮只清空搜索文字，不触发 onChange', async () => {
        const onChange = vi.fn<ChangeSpy>();
        const onClear = vi.fn<NonNullable<TreeSelectProps['onClear']>>();
        renderTreeSelect({ multiple: true, showClear: true, filterTreeNode: true, searchPosition: 'trigger', treeData: treeDataEn, onChange, onClear });
        search('Asia', getTriggerInput());
        await userEvent.click(getClearButton());
        expect(getTriggerInput()).toHaveValue('');
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控 expandedKeys 且 showFilteredOnly 时，搜索中 treeData 新增的命中节点会显示', () => {
        const first = [{ key: 'p', label: 'P', value: 'p', children: [{ key: 'a', label: 'Apple', value: 'a' }] }];
        const second = [...first, { key: 'q', label: 'Q', value: 'q', children: [{ key: 'b', label: 'Apricot', value: 'b' }] }];
        const { rerender } = renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true, expandedKeys: ['p', 'q'], treeData: first });
        search('Ap');
        expect(getNodeLabels()).toEqual(['P', 'Apple']);
        rerender({ treeData: second });
        expect(getNodeLabels()).toEqual(['P', 'Apple', 'Q', 'Apricot']);
    });

    it('RTL 下默认弹出方位为 bottomRight', () => {
        render(
            <ConfigProvider direction="rtl">
                <TreeSelect {...commonProps} defaultOpen treeData={treeData} />
            </ConfigProvider>
        );
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'bottomRight');
    });

    it('触发器上传入的 onClick、onMouseDown 会被调用，下拉照常打开', () => {
        const onClick = vi.fn<() => void>();
        const onMouseDown = vi.fn<() => void>();
        renderTreeSelect({ defaultOpen: false, onClick, onMouseDown });
        const combobox = screen.getByRole('combobox');
        fireEvent.mouseDown(combobox);
        fireEvent.click(combobox);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('TreeSelect 回调事件类型', () => {
    it('onFocus 可收到键盘事件、焦点进入的 focusin 与 null，onBlur 可收到键盘事件与原生事件（含焦点离开的 focusout）', () => {
        expectTypeOf<Parameters<NonNullable<TreeSelectProps['onFocus']>>[0]>().toEqualTypeOf<React.MouseEvent | React.KeyboardEvent | globalThis.FocusEvent | null>();
        expectTypeOf<Parameters<NonNullable<TreeSelectProps['onBlur']>>[0]>().toEqualTypeOf<React.MouseEvent | React.KeyboardEvent | globalThis.MouseEvent | globalThis.FocusEvent>();
    });

    it('onChange 的事件参数可为键盘事件与 null', () => {
        type OnChange = NonNullable<TreeSelectProps['onChange']>;
        type OnChangeWithObject = NonNullable<TreeSelectProps<string, undefined, true>['onChange']>;
        const node: TreeNodeData = { key: 'a', label: 'a', value: 'a' };
        const keyboardEvent = {} as React.KeyboardEvent;
        expectTypeOf<OnChange>().toBeCallableWith('a', node, keyboardEvent);
        expectTypeOf<OnChange>().toBeCallableWith('a', node, null);
        expectTypeOf<OnChangeWithObject>().toBeCallableWith(node, keyboardEvent);
        expectTypeOf<OnChangeWithObject>().toBeCallableWith(node, null);
    });

    it('value、onChange、renderSelectedItem 的类型随 multiple 与 onChangeWithObject 区分', () => {
        type Event = React.MouseEvent | React.KeyboardEvent | null;
        expectTypeOf<Parameters<NonNullable<TreeSelectProps<string>['onChange']>>>().toEqualTypeOf<[value: string | undefined, node: TreeNodeData | undefined, e: Event]>();
        expectTypeOf<Parameters<NonNullable<TreeSelectProps<string, true>['onChange']>>>().toEqualTypeOf<[value: string[], node: TreeNodeData[], e: Event]>();
        expectTypeOf<Parameters<NonNullable<TreeSelectProps<string, true, true>['onChange']>>>().toEqualTypeOf<[node: TreeNodeData[], e: Event]>();
        expectTypeOf<TreeSelectProps<string>['value']>().toEqualTypeOf<string | TreeNodeData | undefined>();
        expectTypeOf<Parameters<NonNullable<TreeSelectProps<string, true>['renderSelectedItem']>>>().toHaveProperty(1);

        function Single() {
            const [value, setValue] = useState<string>();
            return <TreeSelect value={value} onChange={setValue} />;
        }
        function Multiple() {
            const [value, setValue] = useState<string[]>([]);
            return <TreeSelect multiple value={value} onChange={setValue} />;
        }
        void (
            <>
                <Single />
                <Multiple />
                <TreeSelect multiple onChange={(nodes) => expectTypeOf(nodes).toEqualTypeOf<TreeNodeData[]>()} onChangeWithObject />
                <TreeSelect renderSelectedItem={(node) => node.label} />
            </>
        );
    });
});

describe('TreeSelect 属性类型', () => {
    it('不声明对 trigger="custom" 弹层无效的 mouseEnterDelay、mouseLeaveDelay', () => {
        expectTypeOf<TreeSelectProps>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<TreeSelectProps>().not.toHaveProperty('mouseLeaveDelay');
    });

    it('searchPosition 只接受 dropdown 与 trigger', () => {
        expectTypeOf<TreeSelectProps['searchPosition']>().toEqualTypeOf<'dropdown' | 'trigger' | undefined>();
        expectTypeOf<'dropdwon'>().not.toExtend<NonNullable<TreeSelectProps['searchPosition']>>();
    });

    it('triggerRender 的参数只含声明的字段', () => {
        expectTypeOf<TriggerRenderProps>().not.toHaveProperty('onChnage');
        expectTypeOf<TriggerRenderProps['onSearch']>().toEqualTypeOf<(inputValue: string) => void>();
        expectTypeOf<TriggerRenderProps['onRemove']>().toEqualTypeOf<(key: string) => void>();
        expectTypeOf<TriggerRenderProps['disabled']>().toEqualTypeOf<boolean>();
    });
});
