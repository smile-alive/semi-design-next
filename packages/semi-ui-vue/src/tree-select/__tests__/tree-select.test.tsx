/** @jsxImportSource vue */
import { createApp, defineComponent, h, KeepAlive, ref, type Component, type VNodeChild } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { countLiveListeners, render } from '@test/utils/vue';
import TreeSelect, { type TreeSelectEmits, type TreeSelectHandle, type TreeSelectSearchSlotProps, type TreeSelectSelectedItemSlotProps, type TreeSelectTriggerSlotProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import { CheckboxGroup } from '../../checkbox';
import ConfigProvider from '../../config-provider';
import Popover from '../../popover';
import Tag from '../../tag';
import type { TreeNodeData } from '../../tree';
import Kebab from './fixtures/kebab.vue';
import Stateful from './fixtures/stateful.vue';

const treeChildren = [
    { label: '北京', value: 'Beijing', key: 'beijing' },
    { label: '上海', value: 'Shanghai', key: 'shanghai' },
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
                    { label: '北京', value: 'Beijing', key: '0-0-0' },
                    { label: '上海', value: 'Shanghai', key: '0-0-1' },
                ],
            },
        ],
    },
    { label: '北美洲', value: 'North America', key: '1' },
];

const treeData3 = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [{ label: '中国', value: 'China', key: '0-0' }],
    },
    { label: '北美洲', value: 'North America', key: '1' },
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

const treeDataEnNA = {
    label: 'North America',
    value: 'North America',
    key: '1',
    children: [
        { label: 'United States', value: 'United States', key: '1-0' },
        { label: 'Canada', value: 'Canada', key: '1-1' },
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
                    { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                    { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    { label: 'Chengdu', value: 'Chengdu', key: '0-0-2' },
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
    treeDataEnNA,
];

const defaultKeyMaps = {
    value: 'value1',
    key: 'key1',
    label: 'label1',
    children: 'children1',
    disabled: 'disabled1',
};

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

const treeDataWithLoad = [{ label: 'Node 1', value: 'node1', key: 'node1', isLeaf: false }];

const commonProps = { motion: false, motionExpand: false };
const locale = en_US.TreeSelect;
const emptyText = en_US.Tree.emptyText;

type Emits = TreeSelectEmits<unknown, boolean>;
const spy = <K extends keyof Emits>() => vi.fn<(...args: Emits[K]) => void>();
type LoadData = (data: TreeNodeData) => Promise<void>;
type Slots = Record<string, (scope: never) => VNodeChild>;
const settle = () => new Promise((resolve) => setTimeout(resolve));
async function renderWith<Handle>(component: Component, props: Record<string, unknown> = {}, slots: Slots = {}) {
    let handle: Handle | undefined;
    const capture = (value: unknown) => {
        if (value) handle = value as Handle;
    };
    const Host = (attrs: Record<string, unknown>) => <ConfigProvider locale={en_US}>{() => h(component, { ...attrs, ref: capture }, slots)}</ConfigProvider>;
    const view = render(Host, { props });
    await settle();
    return {
        ...view,
        unmount: () => view.unmount(),
        handle: () => handle as Handle,
        rerender: async (next: Record<string, unknown>) => {
            await view.rerender({ ...props, ...next });
            await settle();
        },
    };
}
const renderTreeSelect = (props: Record<string, unknown> = {}, slots: Slots = {}) => renderWith<TreeSelectHandle>(TreeSelect as Component, { ...commonProps, defaultOpen: true, treeData, ...props }, slots);
// Testing Library re-inserts the mounted nodes, which drops the focus autofocus gave on mount
async function mountInPlace(props: Record<string, unknown>, slots: Slots = {}) {
    const container = document.body.appendChild(document.createElement('div'));
    const app = createApp(() => <ConfigProvider locale={en_US}>{() => <TreeSelect {...props}>{slots}</TreeSelect>}</ConfigProvider>);
    app.mount(container);
    onTestFinished(() => {
        app.unmount();
        container.remove();
    });
    await settle();
}
async function act(run: () => unknown) {
    run();
    await settle();
}

const getTrigger = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select`) as HTMLElement;
const getPopover = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-popover`);
const getPopoverWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-popover-wrapper`) as HTMLElement;
const getOptions = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option`)];
const getOptionsOfLevel = (level: number) => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option.${BASE_CLASS_PREFIX}-tree-option-level-${level}`)];
// label text queries break once Highlight splits a searched label into several spans
const getNode = (label: string) => getOptions().find((node) => node.textContent === label) as HTMLElement;
const getNodeLabels = () => getOptions().map((node) => node.textContent);
const getSelectedLabels = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-option-selected`)].map((node) => node.textContent);
const getHighlights = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option-highlight`)];
const isCollapsed = (node: HTMLElement) => node.classList.contains(`${BASE_CLASS_PREFIX}-tree-option-collapsed`);
const getSelection = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection`) as HTMLElement;
const getSelectionSpan = () => getSelection().querySelector('span') as HTMLElement;
const getSearchInput = () => document.querySelector<HTMLInputElement>(`.${BASE_CLASS_PREFIX}-tree-search-wrapper input`) as HTMLInputElement;
const getTriggerInput = () => getTrigger().querySelector('input') as HTMLInputElement;
const getTags = () => [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-selection .${BASE_CLASS_PREFIX}-tag`)];
const getTagTexts = () => getTags().map((tag) => tag.textContent);
const getTagClose = (index = 0) => getTags()[index].querySelector(`.${BASE_CLASS_PREFIX}-tag-close`);
const getClearButton = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-clearbtn`);
const getExpandIcon = (label: string) => getNode(label).querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-option-expand-icon`);
async function click(element: Element | null) {
    await userEvent.click(element as Element);
    await settle();
}
const clickExpandIcon = (label: string) => click(getExpandIcon(label));
const isChecked = (label: string) => getNode(label).getAttribute('aria-checked') === 'true';
async function search(value: string, input: HTMLElement = getSearchInput()) {
    await fireEvent.update(input, value);
    await settle();
}
// A loadData rejection is rethrown to the caller by design; catch it so it does not fail the test
async function ignoringRejections(run: () => Promise<void>) {
    const onRejection = () => {};
    process.on('unhandledRejection', onRejection);
    try {
        await run();
    } finally {
        await settle();
        process.off('unhandledRejection', onRejection);
    }
}

describe('TreeSelect', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('class 与 style', async () => {
        await renderTreeSelect({ class: 'test', style: { height: '420px' } });
        expect(getTrigger()).toHaveClass('test');
        expect(getTrigger()).toHaveStyle({ height: '420px' });
    });

    it('placeholder 属性', async () => {
        await renderTreeSelect({ placeholder: 'semi' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).toHaveTextContent('semi');
    });

    it('validateStatus 属性', async () => {
        const { rerender } = await renderTreeSelect({});
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-error`);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-warning`);
        await rerender({ validateStatus: 'error' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-error`);
        await rerender({ validateStatus: 'warning' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-warning`);
    });

    it('#outerBottomSlot 插槽', async () => {
        await renderTreeSelect({}, { outerBottomSlot: () => <div class="outer-slot">outer</div> });
        expect(getPopover()).toContainElement(screen.getByText('outer'));
    });

    it('size 属性', async () => {
        const { rerender } = await renderTreeSelect({});
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-large`);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-small`);
        await rerender({ size: 'large' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-large`);
        await rerender({ size: 'small' });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-small`);
    });

    it('自定义 dropdownClassName 和 dropdownStyle', async () => {
        await renderTreeSelect({ dropdownClassName: 'test', dropdownStyle: { color: 'red' } });
        expect(getPopover()).toHaveClass('test');
        expect(getPopover()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    // jsdom has no layout, so only the CSS wiring of `--semi-tooltip-trigger-width` is checked: on the popover wrapper
    it('dropdownMatchSelectWidth 为 true', async () => {
        await renderTreeSelect({ style: { width: '90px' }, defaultValue: 'abc' });
        expect(getPopoverWrapper().style.minWidth).toBe('var(--semi-tooltip-trigger-width)');
    });

    it('dropdownMatchSelectWidth 为 false', async () => {
        await renderTreeSelect({ style: { width: '90px' }, defaultValue: 'abc', dropdownMatchSelectWidth: false });
        expect(getPopoverWrapper().style.minWidth).toEqual('');
    });

    it('#prefix、#suffix 与 #insetLabel 插槽', async () => {
        const { unmount } = await renderTreeSelect(
            {},
            {
                prefix: () => <div class="prefix">prefix content</div>,
                suffix: () => <div class="suffix">suffix content</div>,
            }
        );
        expect(getTrigger()).toContainElement(screen.getByText('prefix content'));
        expect(getTrigger()).toContainElement(screen.getByText('suffix content'));
        unmount();

        await renderTreeSelect({}, { insetLabel: () => 'semi' });
        expect(getTrigger()).toContainElement(screen.getByText('semi'));
    });

    it('空数据', async () => {
        await renderTreeSelect({ treeData: [] }, { emptyContent: () => 'empty' });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent('empty');
    });

    it('defaultOpen 属性', async () => {
        const { unmount } = await renderTreeSelect({ defaultOpen: false });
        expect(getPopover()).toBeNull();
        unmount();

        await renderTreeSelect({ defaultOpen: true });
        expect(getPopover()).not.toBeNull();
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('未声明的 open 属性不打开下拉，按根元素透传', async () => {
        await renderTreeSelect({ defaultOpen: false, open: true });
        expect(getPopover()).toBeNull();
        expect(getTrigger()).toHaveAttribute('open');
    });

    it('defaultValue 属性', async () => {
        const { unmount } = await renderTreeSelect({ defaultValue: 'Beijing' });
        expect(getSelection()).toHaveTextContent('北京');
        expect(getSelectedLabels()).toEqual(['北京']);
        unmount();

        await renderTreeSelect({ defaultValue: ['Riben', 'Beijing'] });
        expect(getSelectedLabels()).toEqual(['日本']);
        expect(getSelection()).toHaveTextContent('日本');
        expect(isCollapsed(getOptionsOfLevel(2)[0])).toEqual(true);
    });

    it('treeData 晚于 defaultValue 到达时保留默认选中', async () => {
        const single = await renderTreeSelect({ defaultOpen: false, treeData: [], defaultValue: 'Beijing' });
        await single.rerender({ treeData });
        expect(getSelection()).toHaveTextContent('北京');
        single.unmount();

        const multiple = await renderTreeSelect({ defaultOpen: false, treeData: [], defaultValue: ['Beijing'], multiple: true });
        await multiple.rerender({ treeData });
        expect(getTagTexts()).toEqual(['北京']);
    });

    it('defaultExpandedKeys 属性', async () => {
        await renderTreeSelect({ defaultExpandedKeys: ['zhongguo', 'beimeizhou'] });
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(false);
        expect(isCollapsed(topNodes[1])).toEqual(false);
        const children = getOptionsOfLevel(2);
        expect(isCollapsed(children[0])).toEqual(false);
        expect(isCollapsed(children[1])).toEqual(true);
    });

    it('defaultExpandAll 属性', async () => {
        const { rerender } = await renderTreeSelect({ defaultExpandAll: true });
        expect(getOptions()).toHaveLength(10);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);

        await rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(2);
        expect(getOptions().filter(isCollapsed)).toHaveLength(2);
    });

    it('expandAll 属性', async () => {
        const { rerender } = await renderTreeSelect({ expandAll: true });
        expect(getOptions()).toHaveLength(10);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);

        await rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(5);
        expect(getOptions().filter(isCollapsed)).toHaveLength(0);
    });

    it('expandedKeys 的值生效', async () => {
        const { rerender } = await renderTreeSelect({ expandedKeys: ['beimeizhou'] });
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
        expect(isCollapsed(topNodes[1])).toEqual(false);
        await rerender({ expandedKeys: ['yazhou', 'zhongguo', 'beimeizhou'] });
        const children = getOptionsOfLevel(2);
        expect(isCollapsed(children[0])).toEqual(false);
        expect(isCollapsed(children[1])).toEqual(true);
    });

    it('展开行为与 expand 事件', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ onExpand });
        await clickExpandIcon('亚洲');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        let topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(false);
        expect(isCollapsed(topNodes[1])).toEqual(true);
        await clickExpandIcon('亚洲');
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
    });

    it('受控 expandedKeys 与 expand 事件', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ expandedKeys: ['beimeizhou'], onExpand });
        await clickExpandIcon('亚洲');
        expect(onExpand).toHaveBeenCalledWith(['beimeizhou', 'yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(isCollapsed(getOptionsOfLevel(1)[0])).toEqual(true);
    });

    it('选择节点、select 与 change 事件', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange });
        await click(getNode('北京'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.anything());

        await click(getTrigger());
        expect(getNode('北京')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-selected`);
        expect(getSelection()).toHaveTextContent('北京');

        await click(getNode('亚洲'));
        expect(onSelect).toHaveBeenLastCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(onChange).toHaveBeenLastCalledWith('Yazhou', expect.objectContaining({ key: 'yazhou' }), expect.anything());

        await click(getTrigger());
        expect(getNode('亚洲')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-selected`);
        expect(getSelection()).toHaveTextContent('亚洲');
    });

    it('clear 事件', async () => {
        const onClear = spy<'clear'>();
        await renderTreeSelect({ defaultExpandAll: true, onClear, showClear: true });
        await click(getNode('北京'));
        await click(getClearButton());

        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelection()).toHaveTextContent('');
    });

    it('value 未变化时不发 change', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange, defaultValue: 'Beijing' });
        await click(getNode('北京'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('change 配合 changeWithObject：值与节点都是节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, changeWithObject: true, onChange });
        await click(getNode('北京'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beijing' }), expect.objectContaining({ key: 'beijing' }), expect.anything());
    });

    it('treeNodeLabelProp 属性', async () => {
        await renderTreeSelect({ defaultValue: 'Beijing', treeNodeLabelProp: 'value' });
        expect(getSelection()).toHaveTextContent('Beijing');

        await click(getNode('亚洲'));
        expect(getSelection()).toHaveTextContent('Yazhou');
    });

    it('filterTreeNode 为 true 时显示输入框', async () => {
        const { rerender } = await renderTreeSelect({});
        expect(getSearchInput()).toBeNull();
        await rerender({ filterTreeNode: true });
        expect(getSearchInput()).not.toBeNull();
    });

    it('searchPlaceholder 属性', async () => {
        await renderTreeSelect({ filterTreeNode: true, searchPlaceholder: 'test' });
        expect(getSearchInput()).toHaveAttribute('placeholder', 'test');
    });

    it('search 事件', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({ filterTreeNode: true, onSearch });
        await search('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch.mock.calls[0][0]).toEqual('semi');

        await search('北京');
        expect(onSearch).toHaveBeenCalledTimes(2);
        const args = onSearch.mock.calls[1];
        expect(args[0]).toEqual('北京');
        expect(args[1]).toContain('yazhou');
        expect(args[1]).toContain('zhongguo');
    });

    it('filterTreeNode 显示正确的结果', async () => {
        const { unmount } = await renderTreeSelect({ filterTreeNode: true });
        await search('北');
        expect(getOptions()).toHaveLength(6);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北', '北']);
        unmount();

        await renderTreeSelect({ filterTreeNode: true, treeNodeFilterProp: 'value' });
        await search('an');
        expect(getOptions()).toHaveLength(10);
    });

    it('filterTreeNode 无结果', async () => {
        const { unmount } = await renderTreeSelect({ filterTreeNode: true });
        await search('Bei');
        expect(getOptions()).toHaveLength(2);
        expect(getHighlights()).toHaveLength(0);
        unmount();

        await renderTreeSelect({ filterTreeNode: true, treeNodeFilterProp: 'value' });
        await search('北');
        expect(getOptions()).toHaveLength(2);
    });

    it('异步加载数据', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.resolve());
        const onLoad = spy<'load'>();
        const data = { label: '亚洲', value: 'Asia', key: 'asia' };
        await renderTreeSelect({ loadData, onLoad, loadedKeys: ['0-1'], treeData: [data] });
        await clickExpandIcon('亚洲');
        expect(loadData).toHaveBeenCalledWith(data);
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['0-1', 'asia']), data));
    });

    it('loadData 失败时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<LoadData>(() => Promise.reject(new Error('load failed')));
        await ignoringRejections(async () => {
            await renderTreeSelect({ loadData, treeData: [{ label: '亚洲', value: 'Asia', key: 'asia' }] });
            await clickExpandIcon('亚洲');
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getNode('亚洲').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
            await clickExpandIcon('亚洲');
            await clickExpandIcon('亚洲');
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        });
    });

    it('filterTreeNode 配合 treeNodeFilterProp', async () => {
        await renderTreeSelect({ filterTreeNode: true, treeNodeFilterProp: 'value' });
        await search('Bei');
        expect(getOptions()).toHaveLength(6);
    });

    it('filterTreeNode 配合 showFilteredOnly 无结果', async () => {
        await renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true });
        await search('Bei');
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent(emptyText);
    });

    it('filterTreeNode 配合 showFilteredOnly 显示正确的结果', async () => {
        await renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true });
        await search('北');
        expect(getOptions()).toHaveLength(4);
        expect(getHighlights()).toHaveLength(2);
    });

    it('filterTreeNode 配合 showFilteredOnly 时 aria-setsize 和 aria-posinset 只统计可见的同级节点', async () => {
        await renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true });
        await search('东京');
        const items = screen.getAllByRole('treeitem');
        expect(items.map((item) => item.textContent)).toEqual(['亚洲', '日本', '东京']);
        for (const item of items) {
            expect(item).toHaveAttribute('aria-setsize', '1');
            expect(item).toHaveAttribute('aria-posinset', '1');
        }
    });

    it('filterTreeNode 为函数', async () => {
        await renderTreeSelect({
            filterTreeNode: (inputValue: string, treeNode: string) => treeNode === inputValue,
        });
        await search('北');
        expect(getHighlights()).toHaveLength(0);
        await search('北京');
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北京']);
    });

    it('受控：modelValue 显示正确', async () => {
        const { unmount } = await renderTreeSelect({ modelValue: 'Beijing' });
        expect(getSelectedLabels()).toEqual(['北京']);
        expect(getSelection()).toHaveTextContent('北京');
        unmount();

        await renderTreeSelect({ modelValue: ['Riben', 'Beijing'] });
        expect(getSelectedLabels()).toEqual(['日本']);
        expect(getSelection()).toHaveTextContent('日本');
        expect(isCollapsed(getOptionsOfLevel(2)[0])).toEqual(true);
    });

    it('受控：发 change 但界面不更新', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ modelValue: '', defaultExpandAll: true, onChange });
        expect(getSelectedLabels()).toEqual([]);
        await click(getNode('北京'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual('Beijing');
        expect(getSelection()).toHaveTextContent('');
        await click(getTrigger());
        expect(getSelectedLabels()).toEqual([]);
    });

    it('受控：modelValue 配合 changeWithObject', async () => {
        await renderTreeSelect({
            modelValue: { label: '北京', value: 'Beijing', key: 'beijing' },
            defaultExpandAll: true,
            onChange: spy<'change'>(),
            changeWithObject: true,
        });
        expect(getSelectedLabels()).toEqual(['北京']);
    });

    it('虚拟化：固定高度', async () => {
        await renderTreeSelect({ defaultExpandAll: true, virtualize: { itemSize: 28, height: 84 } });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
        expect(getOptions().length).toBeLessThan(10);
    });

    it('disabled 属性', async () => {
        await renderTreeSelect({ disabled: true });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-disabled`);
        expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toBeNull();

        await click(getTrigger());
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toBeNull();
    });

    it('#selectedItem 插槽', async () => {
        const onSelect = spy<'select'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({ defaultExpandAll: true, onSelect, onChange }, { selectedItem: ({ item }: { item: TreeNodeData }) => String(item.value) });
        await click(getNode('亚洲'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toEqual('yazhou');
        expect(onChange.mock.calls[0][0]).toEqual('Yazhou');
        expect(getSelectionSpan()).toHaveTextContent('Yazhou');
    });

    it('treeData 更新时，非受控单选不清空 value', async () => {
        const { rerender } = await renderTreeSelect({ defaultExpandAll: true });
        await click(getNode('北京'));
        expect(getSelectionSpan()).toHaveTextContent('北京');
        await rerender({ treeData: treeChildren });
        expect(getSelectionSpan()).toHaveTextContent('北京');
        await rerender({ treeData: treeData2 });
        expect(getSelectionSpan().textContent).toEqual('');
    });

    it('treeData 更新时，非受控多选不清空 value', async () => {
        const { rerender } = await renderTreeSelect({ defaultExpandAll: true, multiple: true });
        await click(getNode('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        await rerender({ treeData: treeChildren });
        expect(getTagTexts()).toEqual(['北京']);
        await rerender({ treeData: treeData2 });
        expect(getTags()).toHaveLength(0);
    });

    it('treeData 更新时，受控单选不清空 value', async () => {
        const { rerender } = await renderTreeSelect({ defaultExpandAll: true, modelValue: 'Beijing' });
        expect(getSelectionSpan()).toHaveTextContent('北京');
        await rerender({ treeData: treeChildren });
        expect(getSelectionSpan()).toHaveTextContent('北京');
        await rerender({ treeData: treeData3 });
        expect(getSelectionSpan()).toHaveTextContent('Beijing');
    });

    it('treeData 更新时，受控多选不清空 value', async () => {
        const { rerender } = await renderTreeSelect({
            defaultExpandAll: true,
            multiple: true,
            modelValue: ['Beijing'],
        });
        expect(getTagTexts()).toEqual(['北京']);
        await rerender({ treeData: treeChildren });
        expect(getTagTexts()).toEqual(['北京']);
        await rerender({ treeData: treeData3 });
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('受控 expandedKeys 配合 filterTreeNode', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ expandedKeys: [], onExpand, filterTreeNode: true });
        await search('北京');
        expect(onExpand).not.toHaveBeenCalled();
        const topNodes = getOptionsOfLevel(1);
        expect(isCollapsed(topNodes[0])).toEqual(true);
        expect(isCollapsed(topNodes[1])).toEqual(true);
    });

    it('option 不在 treeData 中 + treeData 项带有 value', async () => {
        const onChange = spy<'change'>();
        const { unmount } = await renderTreeSelect({ defaultValue: 'fish', defaultExpandAll: true, onChange });
        expect(getSelection()).toHaveTextContent('fish');
        await click(getNode('北京'));
        expect(onChange.mock.calls[0][0]).toEqual('Beijing');
        expect(getSelection()).toHaveTextContent('北京');
        unmount();

        await renderTreeSelect({
            defaultValue: { label: '鱼', value: 'Fish', key: 'fish' },
            changeWithObject: true,
            defaultExpandAll: true,
            onChange,
        });
        expect(getSelection()).toHaveTextContent('鱼');
        await click(getNode('北京'));
        const node = expect.objectContaining({ label: '北京', value: 'Beijing', key: 'beijing' });
        expect(onChange).toHaveBeenLastCalledWith(node, node, expect.anything());
    });

    it('option 不在 treeData 中 + treeData 项没有 value', async () => {
        const onChange = spy<'change'>();
        const { unmount } = await renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: 'fish',
            defaultExpandAll: true,
            onChange,
        });
        expect(getSelection()).toHaveTextContent('fish');
        await click(getNode('北京'));
        expect(onChange.mock.calls[0][0]).toEqual('beijing');
        unmount();

        await renderTreeSelect({
            treeData: treeDataWithoutValue,
            defaultValue: { label: '鱼', key: 'fish' },
            changeWithObject: true,
            defaultExpandAll: true,
            onChange,
        });
        expect(getSelection()).toHaveTextContent('鱼');
        await click(getNode('北京'));
        const node = { label: '北京', key: 'beijing' };
        expect(onChange).toHaveBeenLastCalledWith(node, node, expect.anything());
    });

    it('keyMaps 属性', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: 'Beijing',
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        const disabledNode = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(disabledNode.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('中国');
        expect(getSelectedLabels()).toEqual(['北京']);
        await click(getNode('上海'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual('Shanghai');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('上海');
    });

    it('keyMaps 配合 changeWithObject', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: specialTreeData,
            defaultValue: { label1: '北京', value1: 'Beijing', key1: 'beijing' },
            changeWithObject: true,
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        const disabledNode = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-disabled`) as HTMLElement;
        expect(disabledNode.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('中国');
        expect(getSelectedLabels()).toEqual(['北京']);
        await click(getNode('上海'));
        expect(onChange).toHaveBeenCalledTimes(1);
        const node = expect.objectContaining({ label1: '上海', value1: 'Shanghai', key1: 'shanghai' });
        expect(onChange).toHaveBeenCalledWith(node, node, expect.anything());
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('上海');
    });

    it('search 事件带 filteredNodes', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn, onSearch });
        await search('o');
        const args = onSearch.mock.calls[0];
        expect(args[0]).toEqual('o');
        expect(args[1]).toEqual(['0-1', '0']);
        expect(args[2]).toEqual([treeDataEnNA, { label: 'Osaka', value: 'Osaka', key: '0-1-0' }]);
    });

    it('focus 事件', async () => {
        const onFocus = spy<'focus'>();
        await renderTreeSelect({ defaultOpen: false, onFocus });
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
    });

    it('blur 事件', async () => {
        const onBlur = spy<'blur'>();
        await renderTreeSelect({ defaultOpen: false, onBlur });
        await click(getTrigger());
        expect(onBlur).not.toHaveBeenCalled();
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
    });

    it('maxTagCount', async () => {
        await renderTreeSelect({
            multiple: true,
            maxTagCount: 1,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['北京', '+1']);
    });

    it('borderless 属性', async () => {
        await renderTreeSelect({ borderless: true });
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-borderless`);
    });

    it('#arrowIcon 插槽', async () => {
        await renderTreeSelect({}, { arrowIcon: () => <span class="custom-arrow">arrow</span> });
        expect(getTrigger()).toContainElement(screen.getByText('arrow'));
    });

    it('showClear 属性', async () => {
        await renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
            defaultOpen: false,
        });
        expect(getClearButton()).not.toBeNull();
    });

    it('leafOnly 属性', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ multiple: true, leafOnly: true, defaultExpandAll: true, onChange });
        await click(getNode('亚洲'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai', 'Dongjing', 'Daban']);
        expect(getTagTexts()).toEqual(['北京', '上海', '东京', '大阪']);
    });

    it('searchAutoFocus 与 searchPosition 为 trigger 时挂载即打开并聚焦', async () => {
        await mountInPlace({
            ...commonProps,
            treeData,
            searchAutoFocus: true,
            searchPosition: 'trigger',
            filterTreeNode: true,
            defaultOpen: false,
        });
        expect(getPopover()).not.toBeNull();
        expect(getTrigger()).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        await waitFor(() => expect(getTriggerInput()).toHaveFocus());
    });

    it('changeWithObject 时按节点找回 modelValue', async () => {
        await renderTreeSelect({
            changeWithObject: true,
            modelValue: [{ value: 'Beijing', key: '0-0-0', label: 'Beijing' }],
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('loadData 加载节点', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = spy<'load'>();
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, onLoad, defaultExpandAll: false });
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledWith(treeDataWithLoad[0]);
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
    });

    it('清除配合 filterTreeNode 和 searchPosition 为 trigger', async () => {
        const onClear = spy<'clear'>();
        await renderTreeSelect({
            showClear: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: 'Beijing',
            defaultExpandAll: true,
            onClear,
        });
        expect(getTrigger()).toHaveTextContent('北京');
        await click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveTextContent('北京');
    });

    it('删除标签配合 checkRelation 为 related', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['中国']);
        await click(getTagClose());
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(false);
    });

    it('删除标签配合 checkRelation 为 unRelated', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京', '上海']);
        await click(getTagClose());
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['上海']);
    });

    it('清空搜索词恢复 expandedKeys', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultValue: 'Beijing', defaultExpandAll: true });
        await search('test');
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
        await search('');
        expect(getOptions()).toHaveLength(10);
        expect(getSelectedLabels()).toEqual(['北京']);
    });

    it('搜索配合 showFilteredOnly 为 false', async () => {
        await renderTreeSelect({ filterTreeNode: true, showFilteredOnly: false, defaultExpandAll: true });
        await search('北京');
        expect(getNodeLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '北美洲']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['北京']);
    });

    it('多选勾选配合 disableStrictly', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith(['child2'], expect.anything(), expect.anything());
        expect(isChecked('Child 1')).toEqual(false);
        expect(isChecked('Child 2')).toEqual(true);
        expect(isChecked('Parent')).toEqual(false);
        await click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Child 2')).toEqual(false);
    });

    it('搜索中展开节点', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: false,
            defaultExpandAll: false,
            onExpand,
            treeData: treeDataEn,
        });
        await search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('叶子节点没有展开图标', async () => {
        await renderTreeSelect({
            treeData: [
                { label: 'Leaf 1', value: 'leaf1', key: 'leaf1' },
                { label: 'Leaf 2', value: 'leaf2', key: 'leaf2' },
            ],
        });
        expect(getNodeLabels()).toEqual(['Leaf 1', 'Leaf 2']);
        expect(getExpandIcon('Leaf 1')).toBeNull();
        expect(getExpandIcon('Leaf 2')).toBeNull();
    });

    it('单选 #selectedItem 自定义文本', async () => {
        await renderTreeSelect({ defaultValue: 'Beijing', defaultExpandAll: true }, { selectedItem: ({ item }: { item: TreeNodeData }) => `Custom: ${String(item.label)}` });
        expect(getSelection()).toHaveTextContent('Custom: 北京');
    });

    it('触发器搜索框聚焦与失焦切换 upper 类', async () => {
        await renderTreeSelect({ filterTreeNode: true, searchPosition: 'trigger', defaultOpen: true });
        const upperCls = `${BASE_CLASS_PREFIX}-tree-select-triggerSingleSearch-upper`;
        const wrapper = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-triggerSingleSearch-wrapper`);
        expect(wrapper()).not.toHaveClass(upperCls);
        await act(() => getTriggerInput().focus());
        expect(wrapper()).toHaveClass(upperCls);
        await act(() => getTriggerInput().blur());
        expect(wrapper()).not.toHaveClass(upperCls);
    });

    it('文本 #suffix 插槽', async () => {
        await renderTreeSelect({}, { suffix: () => 'suffix text' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-suffix-text`)).toHaveTextContent('suffix text');
    });

    it('#insetLabel 插槽', async () => {
        await renderTreeSelect({}, { insetLabel: () => 'Label:' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-inset-label`)).toHaveTextContent('Label:');
    });

    it('多选下拉搜索时 #tag 整体替换标签', async () => {
        await renderTreeSelect({ multiple: true, defaultValue: ['Beijing', 'Shanghai'], defaultExpandAll: true }, { tag: ({ item }: { item: TreeNodeData }) => <span class="custom-tag">{String(item.label)}</span> });
        const customTags = [...getSelection().querySelectorAll('.custom-tag')];
        expect(customTags.map((tag) => tag.textContent)).toEqual(['中国']);
        expect(getTags()).toHaveLength(0);
    });

    it('禁用项的标签不可关闭', async () => {
        await renderTreeSelect({
            multiple: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(getTagClose()).toBeNull();
    });

    it('单选触发器搜索显示 placeholder', async () => {
        await renderTreeSelect({ filterTreeNode: true, searchPosition: 'trigger', placeholder: 'Select something' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`)).toHaveTextContent('Select something');
    });

    it('多选无值时显示 placeholder', async () => {
        await renderTreeSelect({ multiple: true, placeholder: 'Please select' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).toHaveTextContent('Please select');
        expect(getTags()).toHaveLength(0);
    });

    it('多选触发器搜索时 #tag 整体替换标签', async () => {
        await renderTreeSelect(
            {
                multiple: true,
                filterTreeNode: true,
                searchPosition: 'trigger',
                defaultValue: ['Beijing'],
                defaultExpandAll: true,
            },
            { tag: ({ item }: { item: TreeNodeData }) => <span class="custom-content">{String(item.label)}</span> }
        );
        expect(getTrigger().querySelector('.custom-content')).toHaveTextContent('北京');
        expect(getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-tag`)).toBeNull();
    });

    it('空 #search 插槽不渲染搜索框', async () => {
        await renderTreeSelect({ filterTreeNode: true }, { search: () => [] });
        expect(getSearchInput()).toBeNull();
        expect(getPopover()?.querySelector('input')).toBeNull();
    });

    it('没有 #search 插槽时渲染默认搜索框', async () => {
        await renderTreeSelect({ filterTreeNode: true });
        expect(getSearchInput()).toHaveAttribute('placeholder', locale.searchPlaceholder);
        await search('东京');
        expect(getHighlights()).toHaveLength(1);
    });

    it('#search 插槽自定义搜索框', async () => {
        await renderTreeSelect(
            { filterTreeNode: true },
            {
                search: (inputProps: TreeSelectSearchSlotProps) => <input class="custom-search" placeholder={inputProps.placeholder} />,
            }
        );
        const customSearch = getPopover()?.querySelector('.custom-search');
        expect(customSearch).not.toBeNull();
        expect(customSearch).toHaveAttribute('placeholder', locale.searchPlaceholder);
    });

    it('motion 时 treeData 换为新 key', async () => {
        const { rerender } = await renderTreeSelect({ motion: true, treeData: treeDataEn });
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await rerender({ treeData: [{ label: 'New Node', value: 'new', key: 'new' }] });
        expect(getNodeLabels()).toEqual(['New Node']);
    });

    it('受控 expandedKeys 更新', async () => {
        const { rerender } = await renderTreeSelect({ expandedKeys: ['0'], treeData: treeDataEn });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        await rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
    });

    it('motion 时 expandedKeys 收起', async () => {
        const { rerender } = await renderTreeSelect({ motion: true, expandedKeys: ['0', '0-0'], treeData: treeDataEn });
        expect(getOptions()).toHaveLength(7);
        await rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        expect(isCollapsed(getNode('China'))).toEqual(true);
    });

    it('搜索时 treeData 变化', async () => {
        const { rerender } = await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn });
        await search('Asia');
        await rerender({ treeData: [{ label: 'Asia Updated', value: 'Asia', key: '0' }] });
        expect(getNodeLabels()).toEqual(['Asia Updated']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Asia']);
    });
    it('搜索时 expandedKeys 变化', async () => {
        const { rerender } = await renderTreeSelect({
            filterTreeNode: true,
            expandedKeys: ['0'],
            motion: true,
            treeData: treeDataEn,
        });
        await search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        await rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Asia']);
    });

    it('单选时 modelValue 变化', async () => {
        const { rerender } = await renderTreeSelect({ modelValue: 'Beijing', treeData: treeDataEn });
        expect(getSelection()).toHaveTextContent('Beijing');
        await rerender({ modelValue: 'Shanghai' });
        expect(getSelection()).toHaveTextContent('Shanghai');
        expect(getSelectedLabels()).toEqual(['Shanghai']);
    });

    it('defaultExpandedKeys 展开节点', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultExpandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('defaultValue 展开祖先节点', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultValue: 'Beijing' });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('modelValue 展开祖先节点', async () => {
        await renderTreeSelect({ treeData: treeDataEn, modelValue: 'Beijing' });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('treeData 变化时保留仍存在的选中项', async () => {
        const { rerender } = await renderTreeSelect({ defaultValue: 'Beijing', treeData: treeDataEn });
        expect(getSelectedLabels()).toEqual(['Beijing']);
        await rerender({
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

    it('有禁用后代时的勾选状态', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await click(getNode('Parent'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Child 2')).toEqual(false);
        expect(isChecked('Child 1')).toEqual(false);
    });

    it('所有后代都禁用时父节点也禁用', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await click(getNode('Parent'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getTags()).toHaveLength(0);
    });

    it('搜索中收起节点', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: false,
            defaultExpandAll: true,
            onExpand,
            treeData: treeDataEn,
        });
        await search('Asia');
        await clickExpandIcon('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('展开时调用 loadData', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData });
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledTimes(1);
        expect(loadData).toHaveBeenCalledWith(treeDataWithLoad[0]);
        await waitFor(() => expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true'));
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
    });

    it('收起节点', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ defaultExpandAll: true, onExpand, treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(expect.not.arrayContaining(['0']), expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('virtualize 属性', async () => {
        await renderTreeSelect({
            virtualize: { height: 300, itemSize: 36 },
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
        expect(getNode('Asia')).toHaveStyle({ height: '36px', top: '0px' });
        expect(getNode('China')).toHaveStyle({ height: '36px', top: '36px' });
    });

    it('#emptyContent 插槽', async () => {
        await renderTreeSelect({ treeData: [] }, { emptyContent: () => <div class="custom-empty">No Data</div> });
        expect(getPopover()).toContainElement(screen.getByText('No Data'));
    });

    it('#trigger 插槽', async () => {
        await renderTreeSelect(
            { defaultValue: 'Beijing', defaultExpandAll: true },
            {
                trigger: ({ value, placeholder }: { value: TreeNodeData[]; placeholder?: string }) => <div class="custom-trigger">{value.length > 0 ? value.map((v) => v.label).join(', ') : placeholder}</div>,
            }
        );
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('北京');
    });

    it('expandAction 为 click', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({
            expandAction: 'click',
            defaultExpandAll: false,
            treeData: treeDataEn,
            onDropdownVisibleChange,
        });
        await click(getNode('Asia'));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
        expect(getSelectedLabels()).toEqual(['Asia']);
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        await click(getNode('China'));
        await click(getNode('Beijing'));
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('expandAction 为 doubleClick', async () => {
        const onSelect = spy<'select'>();
        await renderTreeSelect({
            expandAction: 'doubleClick',
            defaultExpandAll: false,
            treeData: treeDataEn,
            onSelect,
        });
        await click(getNode('Asia'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);

        await userEvent.dblClick(getNode('North America'));
        await settle();
        expect(onSelect).toHaveBeenCalledTimes(2);
        expect(onSelect).toHaveBeenLastCalledWith('1', true, expect.objectContaining({ label: 'North America' }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('labelEllipsis 属性', async () => {
        await renderTreeSelect({ labelEllipsis: true, treeData: treeDataEn, defaultExpandAll: true });
        expect(getOptions().every((node) => node.classList.contains(`${BASE_CLASS_PREFIX}-tree-option-ellipsis`))).toBe(true);
    });

    it('showLine 属性', async () => {
        await renderTreeSelect({ showLine: true, treeData: treeDataEn, defaultExpandAll: true });
        expect(getNode('Beijing').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-switcher-leaf-line`)).not.toBeNull();
        expect(getNode('Asia').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-switcher`)).toBeNull();
    });

    it('#label 插槽', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true }, { label: ({ label }: { label?: string | number }) => <span class="custom-label">{String(label)}</span> });
        const labels = [...document.querySelectorAll('.custom-label')];
        expect(labels).toHaveLength(10);
        expect(labels[0]).toHaveTextContent('Asia');
    });

    it('#fullLabel 插槽', async () => {
        await renderTreeSelect(
            { treeData: treeDataEn, defaultExpandAll: true },
            {
                fullLabel: ({ data }: { data: TreeNodeData }) => <div class="full-label">{String(data.label)}</div>,
            }
        );
        const labels = [...document.querySelectorAll('.full-label')];
        expect(labels).toHaveLength(10);
        expect(labels[0]).toHaveTextContent('Asia');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label`)).toBeNull();
        expect(screen.getAllByRole('treeitem')).toHaveLength(10);
    });

    it('preventScroll 属性', async () => {
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        await renderTreeSelect({
            preventScroll: true,
            filterTreeNode: true,
            searchAutoFocus: true,
            defaultOpen: false,
        });
        await click(getTrigger());
        await waitFor(() => expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true }));
    });

    it('restTagsPopoverProps 属性', async () => {
        await renderTreeSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { position: 'top', mouseEnterDelay: 0, mouseLeaveDelay: 0 },
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['北京', '+1']);
        await userEvent.hover(screen.getByText('+1'));
        await waitFor(() => expect(screen.getAllByText('东京')).toHaveLength(2));
    });

    it('在 +N 弹层里按下鼠标不关闭下拉面板，在外部按下才关闭', async () => {
        await renderTreeSelect({
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: { trigger: 'custom', visible: true, motion: false },
            defaultValue: ['Beijing', 'Dongjing'],
            defaultOpen: true,
        });
        const restTag = await waitFor(() => {
            const tag = [...document.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-tag`)].find((el) => el.textContent === '东京');
            expect(tag).toBeDefined();
            return tag as HTMLElement;
        });
        await fireEvent.mouseDown(restTag);
        expect(getPopover()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('dropdownVisibleChange 事件', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ onDropdownVisibleChange, defaultOpen: false });
        await click(getTrigger());
        expect(onDropdownVisibleChange).toHaveBeenCalledWith(true);
    });

    it('关闭后清空搜索词', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultOpen: true });
        await search('test');
        await click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('加载中显示加载状态', async () => {
        let resolveLoad = () => {};
        const loadData = vi.fn<LoadData>(
            () =>
                new Promise<void>((resolve) => {
                    resolveLoad = resolve;
                })
        );
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData });
        await clickExpandIcon('Node 1');
        expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).not.toBeNull();
        resolveLoad();
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
    });

    it('不在 treeData 中的 modelValue 原样显示', async () => {
        await renderTreeSelect({ changeWithObject: false, modelValue: 'nonexistent', treeData: treeDataEn });
        expect(getSelection()).toHaveTextContent('nonexistent');
    });

    it('多选无值时不显示清除按钮', async () => {
        await renderTreeSelect({ multiple: true, showClear: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`)).not.toBeNull();
        expect(getClearButton()).toBeNull();
    });

    it('多选 #selectedItem 渲染为空时跳过该标签', async () => {
        await renderTreeSelect({ multiple: true, defaultValue: ['Beijing'], defaultExpandAll: true }, { selectedItem: () => null });
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(true);
    });

    it('多选触发器搜索时不在 treeData 中的值原样显示为标签', async () => {
        await renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: ['nonexistent'],
            treeData: treeDataEn,
        });
        expect(getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tag`)).toHaveTextContent('nonexistent');
    });

    it('expandAll 时 treeData 变化', async () => {
        const { rerender } = await renderTreeSelect({ expandAll: true, treeData: treeDataEn });
        expect(getOptions()).toHaveLength(10);
        await rerender({
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

    it('showFilteredOnly 且搜索时 expandedKeys 变化', async () => {
        const { rerender } = await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            expandedKeys: ['0'],
            motion: true,
            treeData: treeDataEn,
        });
        await search('Asia');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan']);
        await rerender({ expandedKeys: ['0', '0-0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan']);
    });

    it('多选 related 模式下 modelValue 变化', async () => {
        const { rerender } = await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            modelValue: ['Beijing'],
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        await rerender({ modelValue: ['Beijing', 'Shanghai', 'Chengdu'] });
        expect(getTagTexts()).toEqual(['China']);
        expect(isChecked('China')).toEqual(true);
    });

    it('多选 unRelated 模式下 modelValue 变化', async () => {
        const { rerender } = await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            modelValue: ['Beijing'],
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        await rerender({ modelValue: ['Beijing', 'Shanghai', 'Chengdu'] });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
        expect(isChecked('China')).toEqual(false);
    });

    it('已聚焦时再次点击不重复发 focus', async () => {
        const onFocus = spy<'focus'>();
        await renderTreeSelect({ onFocus, defaultOpen: false });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('按 Escape 关闭', async () => {
        await renderTreeSelect({ defaultOpen: true });
        await fireEvent.keyDown(getPopover() as HTMLElement, { key: 'Escape' });
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('单选后关闭下拉', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ onChange, defaultExpandAll: true });
        await click(getNode('北京'));
        expect(onChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.anything());
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('空 treeData 显示默认空状态', async () => {
        await renderTreeSelect({ treeData: [] });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-empty`);
        expect(nodes[0]).toHaveTextContent(emptyText);
    });

    it('expandAction 为 false 时选父节点也关闭', async () => {
        await renderTreeSelect({ expandAction: false, defaultExpandAll: true });
        await click(getNode('亚洲'));
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(getSelection()).toHaveTextContent('亚洲');
    });

    it('disableStrictly 时唯一子节点禁用则父节点也禁用', async () => {
        await renderTreeSelect({
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

    it('空 #emptyContent 插槽不渲染空状态', async () => {
        await renderTreeSelect({ treeData: [] }, { emptyContent: () => [] });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-option-empty`)).toBeNull();
        const list = document.getElementById(getTrigger().getAttribute('aria-controls') as string);
        expect(list).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-list-hidden`);
    });

    it('多选触发器搜索的默认标签可关闭', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京']);
        await click(getTagClose());
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTags()).toHaveLength(0);
    });

    it('通过 handle 搜索会打开下拉框并过滤', async () => {
        const { handle } = await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn, defaultOpen: false });
        expect(getPopover()).toBeNull();
        await act(() => handle().search('Osaka'));
        expect(getPopover()).not.toBeNull();
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Osaka']);
    });

    it('在触发器上按 Enter 打开下拉框', async () => {
        await renderTreeSelect({ defaultOpen: false });
        await fireEvent.keyDown(getTrigger(), { key: 'Enter', code: 'Enter' });
        await settle();
        expect(getPopover()).not.toBeNull();
    });

    it.each(['{Enter}', ' '])('清空按钮是具名原生按钮，%s 可以按下它，但不打开树', async (key) => {
        const onClear = spy<'clear'>();
        await renderTreeSelect({ showClear: true, defaultValue: 'Beijing', defaultOpen: false, onClear });
        await userEvent.tab();
        expect(getTrigger()).toHaveFocus();
        await userEvent.tab();
        const clear = screen.getByRole('button', { name: locale.clear });
        expect(clear).toHaveFocus();
        expect(clear).toHaveAttribute('type', 'button');
        await userEvent.keyboard(key);
        await settle();
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelection()).not.toHaveTextContent('北京');
        expect(screen.queryByRole('button', { name: locale.clear })).toBeNull();
        expect(getTrigger()).toHaveFocus();
        expect(getPopover()).toBeNull();
    });

    it('搜索输入框作为 combobox 时，清空后焦点回到该输入框', async () => {
        await renderTreeSelect({
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
        expect(screen.getByRole('button', { name: locale.clear })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await settle();
        expect(getSelection()).not.toHaveTextContent('北京');
        expect(input).toHaveFocus();
    });

    it('多选触发器搜索 searchAutoFocus 时 TagInput 获得焦点', async () => {
        await mountInPlace({
            ...commonProps,
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

    it('没有 searchAutoFocus 时下拉搜索框不获得焦点', async () => {
        await renderTreeSelect({ filterTreeNode: true, searchPosition: 'dropdown', defaultOpen: true });
        expect(getPopover()).toContainElement(getSearchInput());
        expect(getSearchInput()).not.toHaveFocus();
    });

    it('虚拟化时每个可见行只渲染一次', async () => {
        await renderTreeSelect({
            virtualize: { height: 300, itemSize: 36 },
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getNodeLabels().slice(0, 4)).toEqual(['Asia', 'China', 'Beijing', 'Shanghai']);
        expect(new Set(getNodeLabels()).size).toEqual(getNodeLabels().length);
    });

    it('全部展开时按树序渲染所有行', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka', 'North America', 'United States', 'Canada']);
    });

    it('多选模式点击勾选框', async () => {
        const onChange = spy<'change'>();
        const onSelect = spy<'select'>();
        await renderTreeSelect({ multiple: true, defaultExpandAll: true, treeData: treeDataEn, onChange, onSelect });
        await click(getNode('Beijing').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(onSelect).toHaveBeenCalledWith('0-0-0', true, { label: 'Beijing', value: 'Beijing', key: '0-0-0' });
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('China')).toEqual(false);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('行的 aria 状态', async () => {
        const { unmount } = await renderTreeSelect({
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

        await renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        expect(getOptions().every((node) => node.getAttribute('aria-selected') === 'false')).toBe(true);
    });

    it('多选 #selectedItem 渲染为空数组时跳过该标签', async () => {
        await renderTreeSelect({ multiple: true, defaultValue: ['Beijing'], defaultExpandAll: true }, { selectedItem: () => [] });
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toEqual(true);
    });

    it('在弹层上按 Escape 以外的键不关闭', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ defaultOpen: true, onDropdownVisibleChange });
        await fireEvent.keyDown(getPopover() as HTMLElement, { key: 'Enter' });
        await settle();
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
    });

    it('禁用时点击不打开', async () => {
        const onFocus = spy<'focus'>();
        await renderTreeSelect({ disabled: true, defaultOpen: false, onFocus });
        await click(getTrigger());
        expect(getPopover()).toBeNull();
        expect(onFocus).not.toHaveBeenCalled();
    });

    it('clickTriggerToHide 为 false 时点击触发器不关闭', async () => {
        const onFocus = spy<'focus'>();
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ clickTriggerToHide: false, defaultOpen: true, onFocus, onDropdownVisibleChange });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        await click(getTrigger());
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
    });

    it('受控多选清除', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            showClear: true,
            modelValue: ['Beijing', 'Shanghai'],
            onChange,
            defaultExpandAll: true,
        });
        await click(getClearButton());
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(getTagTexts()).toEqual(['中国']);
    });

    it('受控单选清除', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ showClear: true, modelValue: 'Beijing', onChange, defaultExpandAll: true });
        await click(getClearButton());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBeUndefined();
        expect(getSelection()).toHaveTextContent('北京');
    });

    it('受控 loadedKeys 已含该节点时不再加载', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
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

    it('changeWithObject 多选按节点数组找回 modelValue', async () => {
        await renderTreeSelect({
            changeWithObject: true,
            modelValue: [
                { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
                { value: 'Shanghai', key: '0-0-1', label: 'Shanghai' },
            ],
            multiple: true,
            treeData: treeDataEn,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
    });

    it('changeWithObject 时按节点找回 defaultValue', async () => {
        await renderTreeSelect({
            changeWithObject: true,
            defaultValue: { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
            treeData: treeDataEn,
        });
        expect(getSelection()).toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual(['Beijing']);
    });

    it('motion 且搜索时 expandedKeys 收起', async () => {
        const { rerender } = await renderTreeSelect({
            filterTreeNode: true,
            motion: true,
            expandedKeys: ['0', '0-0'],
            treeData: treeDataEn,
        });
        await search('Asia');
        expect(getOptions()).toHaveLength(7);
        await rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('点击弹层内部不关闭，点击外部关闭', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ defaultOpen: true, onDropdownVisibleChange });
        await click(screen.getByRole('tree'));
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        await click(document.body);
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('多选触发器搜索时 disableStrictly 的禁用标签不可关闭', async () => {
        await renderTreeSelect({
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
        expect(getTagClose()).toBeNull();
    });

    it('单选触发器搜索禁用时', async () => {
        await renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            disabled: true,
            defaultValue: 'Beijing',
            defaultExpandAll: true,
        });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-disabled`)).toHaveTextContent('北京');
        expect(getTriggerInput()).toBeDisabled();
    });

    it('触发器搜索有输入时点击触发器不关闭', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultOpen: true,
            onDropdownVisibleChange,
        });
        await act(() => getTriggerInput().focus());
        await search('test', getTriggerInput());
        await click(getTrigger());
        expect(onDropdownVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopover()).not.toBeNull();
        expect(getTriggerInput()).toHaveValue('test');
    });

    it('搜索配合自定义 filterTreeNode 函数', async () => {
        const onSearch = spy<'search'>();
        const filterTreeNode = (inputValue: string, label: string) => label.toLowerCase().includes(inputValue.toLowerCase());
        await renderTreeSelect({ filterTreeNode, onSearch, treeData: treeDataEn });
        await search('asia');
        expect(onSearch.mock.calls[0][2].map((node) => node.label)).toEqual(['Asia']);
    });

    it('搜索配合 treeNodeFilterProp', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({ filterTreeNode: true, treeNodeFilterProp: 'value', onSearch, treeData: treeDataEn });
        await search('Asia');
        expect(onSearch.mock.calls[0][2].map((node) => node.value)).toEqual(['Asia']);
    });

    it('treeData 变化时重算禁用节点', async () => {
        const { rerender } = await renderTreeSelect({
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
        await rerender({
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

    it('搜索时更新显示的行', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultExpandAll: true, treeData: treeDataEn });
        await search('Beijing');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Beijing']);
    });

    it('#outerTopSlot 插槽', async () => {
        await renderTreeSelect({}, { outerTopSlot: () => <div class="outer-top">Top Slot</div> });
        expect(getPopover()).toContainElement(screen.getByText('Top Slot'));
    });

    it('#outerTopSlot 与 #outerBottomSlot 同时使用', async () => {
        await renderTreeSelect(
            {},
            {
                outerTopSlot: () => <div class="outer-top-slot">Top</div>,
                outerBottomSlot: () => <div class="outer-bottom-slot">Bottom</div>,
            }
        );
        const tree = screen.getByRole('tree');
        expect(screen.getByText('Top').compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByText('Bottom').compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    });

    it('#outerTopSlot 取代默认搜索框', async () => {
        await renderTreeSelect({ filterTreeNode: true }, { outerTopSlot: () => <div class="custom-search">Custom Search</div> });
        expect(screen.getByText('Custom Search')).toBeInTheDocument();
        expect(getSearchInput()).toBeNull();
    });

    it('showSearchClear 属性', async () => {
        await renderTreeSelect({ filterTreeNode: true, showSearchClear: true });
        await search('test');
        await fireEvent.mouseEnter(getSearchInput().parentElement as HTMLElement);
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`));
        expect(getSearchInput()).toHaveValue('');
    });

    // Vue events do not bubble through Teleport like React's, so check the native click at the window
    it.each([true, false])('stopPropagation=%s 决定弹层内点击是否冒泡', async (stopPropagation) => {
        const onWindowClick = vi.fn<() => void>();
        window.addEventListener('click', onWindowClick);
        try {
            await renderTreeSelect({ stopPropagation });
            await click(getNode('亚洲'));
            expect(onWindowClick).toHaveBeenCalledTimes(stopPropagation ? 0 : 1);
        } finally {
            window.removeEventListener('click', onWindowClick);
        }
    });

    it('在面板内嵌套 Popover 的弹层里按下鼠标不关闭，在外部按下才关闭', async () => {
        await renderTreeSelect(
            { treeData: treeDataEn },
            {
                label: ({ label }: { label?: string | number }) =>
                    label === 'Asia' ? (
                        <Popover motion={false} trigger="custom" visible>
                            {{
                                default: () => <span>{label}</span>,
                                content: () => <button type="button">inside nested</button>,
                            }}
                        </Popover>
                    ) : (
                        String(label)
                    ),
            }
        );
        await fireEvent.mouseDown(await screen.findByRole('button', { name: 'inside nested' }));
        expect(getPopover()).not.toBeNull();
        await fireEvent.mouseDown(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('搜索时展开匹配项的祖先节点', async () => {
        await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn });
        await search('Beijing');
        expect(isCollapsed(getNode('Asia'))).toEqual(false);
        expect(isCollapsed(getNode('China'))).toEqual(false);
        expect(getHighlights().map((node) => node.textContent)).toEqual(['Beijing']);
    });

    it('Escape 关闭后清空输入', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultOpen: true });
        await search('北京');
        expect(getHighlights()).toHaveLength(1);
        await fireEvent.keyDown(getPopover() as HTMLElement, { key: 'Escape' });
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getHighlights()).toHaveLength(0);
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲']);
    });

    it('insetLabelId 属性', async () => {
        await renderTreeSelect({ insetLabelId: 'custom-label-id' }, { insetLabel: () => 'Label:' });
        expect(document.getElementById('custom-label-id')).toHaveTextContent('Label:');
    });

    it('aria-label 属性', async () => {
        await renderTreeSelect({ 'aria-label': 'Select a location' });
        expect(screen.getByRole('combobox', { name: 'Select a location' })).toBe(getTrigger());
    });

    it('aria-labelledby 属性', async () => {
        await renderTreeSelect({ 'aria-labelledby': 'label-id' });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('aria-describedby 属性', async () => {
        await renderTreeSelect({ 'aria-describedby': 'desc-id' });
        expect(getTrigger()).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('aria-required 属性', async () => {
        await renderTreeSelect({ 'aria-required': true });
        expect(getTrigger()).toHaveAttribute('aria-required', 'true');
    });

    it('aria-invalid 属性', async () => {
        await renderTreeSelect({ 'aria-invalid': true });
        expect(getTrigger()).toHaveAttribute('aria-invalid', 'true');
    });

    it('aria-errormessage 属性', async () => {
        await renderTreeSelect({ 'aria-errormessage': 'error-msg-id' });
        expect(getTrigger()).toHaveAttribute('aria-errormessage', 'error-msg-id');
    });

    it('changeWithObject 多选勾选后 change 带全部节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            changeWithObject: true,
            modelValue: [{ value: 'Beijing', key: '0-0-0', label: 'Beijing' }],
            multiple: true,
            treeData: treeDataEn,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        await click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual([
            { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
            { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
        ]);
    });

    it('defaultExpandAll 展开的未加载节点在用户展开时才加载', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = spy<'load'>();
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, onLoad, defaultExpandAll: true });
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

    it('changeWithObject 多选 change 的值与节点都是节点数组', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            changeWithObject: true,
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await click(getNode('Beijing'));
        const nodes = [{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }];
        expect(onChange).toHaveBeenCalledWith(nodes, nodes, expect.anything());
    });

    it('打开时点击触发器关闭，再点击打开，focus 只发一次', async () => {
        const onFocus = spy<'focus'>();
        await renderTreeSelect({ defaultOpen: true, onFocus });
        await click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(getTrigger());
        expect(getPopover()).not.toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('触发器搜索有输入时清除同时清空输入和值', async () => {
        const onChange = spy<'change'>();
        const onClear = spy<'clear'>();
        await renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            showClear: true,
            defaultValue: 'Beijing',
            onChange,
            onClear,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await search('test', getTriggerInput());
        await click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBeUndefined();
        expect(getTriggerInput()).toHaveValue('');
        expect(getTrigger()).not.toHaveTextContent('Beijing');
        expect(getSelectedLabels()).toEqual([]);
    });

    it('unRelated 时禁用项的标签不可删除', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagClose(0)).toBeNull();
        await click(getTagClose(1));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('disableStrictly 时删除父节点标签不改变禁用子节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        await click(getTagClose());
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('unRelated 时删除第二个标签', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await click(getTagClose(1));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('related 时删除部分勾选的标签', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await click(getTagClose(0));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['Shanghai']);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('unRelated 时依次勾选', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await click(getNode('Beijing'));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing'], expect.anything(), expect.anything());
        await click(getNode('Shanghai'));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai'], expect.anything(), expect.anything());
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
    });

    it('unRelated 时取消勾选', async () => {
        const onChange = spy<'change'>();
        const onSelect = spy<'select'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            onChange,
            onSelect,
            treeData: treeDataEn,
            defaultValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(isChecked('Beijing')).toEqual(true);
        await click(getNode('Beijing'));
        expect(onSelect).toHaveBeenCalledWith('0-0-0', false, { label: 'Beijing', value: 'Beijing', key: '0-0-0' });
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('Beijing')).toEqual(false);
        expect(getTags()).toHaveLength(0);
    });

    it('搜索结果中收起已展开的节点', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn, defaultExpandAll: true, onExpand });
        await search('Beijing');
        expect(getNodeLabels()).toContain('Beijing');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0-0'], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('单选无值时选择框为空的 placeholder', async () => {
        await renderTreeSelect({ treeData: treeDataEn });
        const content = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`) as HTMLElement;
        expect(content).toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`);
        expect(content.textContent).toEqual('');
    });

    it('触发器搜索框聚焦时已选文本变灰', async () => {
        await renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            defaultValue: 'Beijing',
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        const item = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`);
        const placeholderCls = `${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`;
        expect(item()).toHaveTextContent('Beijing');
        expect(item()).not.toHaveClass(placeholderCls);
        await act(() => getTriggerInput().focus());
        expect(item()).toHaveClass(placeholderCls);
        await act(() => getTriggerInput().blur());
        expect(item()).not.toHaveClass(placeholderCls);
    });

    it('不可搜索时点击触发器关闭', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ filterTreeNode: false, defaultOpen: true, onDropdownVisibleChange });
        await click(getTrigger());
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('点击外部关闭后清空搜索词', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultOpen: true });
        await search('北京');
        await click(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(getHighlights()).toHaveLength(0);
    });

    it('未聚焦时点击外部关闭但不发 blur', async () => {
        const onBlur = spy<'blur'>();
        await renderTreeSelect({ treeData: treeDataEn, onBlur });
        await click(document.body);
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('单选清除时 change 的值与节点为 undefined', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ showClear: true, defaultValue: 'Beijing', onChange, treeData: treeDataEn });
        await click(getClearButton());
        expect(onChange).toHaveBeenCalledWith(undefined, undefined, expect.anything());
        expect(getSelection()).not.toHaveTextContent('Beijing');
    });

    it('受控多选勾选不更新界面', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            modelValue: ['Beijing'],
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai']);
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('清空搜索词后按选中项恢复展开', async () => {
        await renderTreeSelect({ filterTreeNode: true, defaultValue: 'Beijing', treeData: treeDataEn });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
        await search('test');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await search('');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'North America']);
    });

    it('多选时保留不在树中的值', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            onChange,
            treeData: treeDataEn,
            defaultValue: ['NotInTree'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['NotInTree']);
        await click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toHaveLength(2);
        expect(onChange.mock.calls[0][0]).toEqual(expect.arrayContaining(['NotInTree', 'Beijing']));
    });

    it('删除不在树中的值的标签', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            onChange,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'NotInTree'],
            defaultExpandAll: true,
        });
        const notInTreeTag = getTags().find((tag) => tag.textContent === 'NotInTree') as HTMLElement;
        await click(notInTreeTag.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('单选时不在树中的值原样显示', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultValue: 'NotInTree' });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-content`)).toHaveTextContent('NotInTree');
        expect(getSelectedLabels()).toEqual([]);
    });

    it('loadData 的 promise 完成后才发 load', async () => {
        let resolveLoad = () => {};
        const loadData = vi.fn<LoadData>(
            () =>
                new Promise<void>((resolve) => {
                    resolveLoad = resolve;
                })
        );
        const onLoad = spy<'load'>();
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, onLoad });
        await clickExpandIcon('Node 1');
        expect(onLoad).not.toHaveBeenCalled();
        resolveLoad();
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
    });

    it('受控 loadedKeys 未变时再次展开会再次加载', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        const onLoad = spy<'load'>();
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, onLoad, loadedKeys: [] });
        await clickExpandIcon('Node 1');
        await waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]));
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        expect(loadData).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
    });

    it('已加载的节点不再加载', async () => {
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, loadedKeys: ['node1'], defaultExpandAll: true });
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        expect(loadData).not.toHaveBeenCalled();
        expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull();
    });

    it('取消勾选一项', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            treeData: treeDataEn,
            defaultValue: ['Beijing', 'Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai']);
        await click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(getTagTexts()).toEqual(['Shanghai']);
    });

    it('disableStrictly 时勾选祖先跳过禁用的孙节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            onChange,
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
        });
        await click(getNode('Asia'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(isChecked('Shanghai')).toEqual(true);
        expect(isChecked('Beijing')).toEqual(false);
        expect(isChecked('China')).toEqual(false);
    });

    it('所有非禁用节点均已勾选时点击父节点取消勾选', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            treeData: treeDataWithDisabledLeaf,
            defaultValue: ['Shanghai'],
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Shanghai')).toEqual(true);
        await click(getNode('Asia'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(getTags()).toHaveLength(0);
    });

    it('搜索结果中收起子节点', async () => {
        await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn, defaultExpandAll: true });
        await search('Beijing');
        expect(getNodeLabels()).toContain('Beijing');
        await clickExpandIcon('China');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('收起子节点', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        await clickExpandIcon('China');
        expect(isCollapsed(getNode('China'))).toEqual(true);
        expect(getNode('Beijing')).toBeUndefined();
        expect(getNode('Osaka')).not.toBeUndefined();
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'Osaka', 'North America', 'United States', 'Canada']);
    });

    it('searchAutoFocus 时打开下拉聚焦下拉搜索框', async () => {
        await renderTreeSelect({
            filterTreeNode: true,
            searchAutoFocus: true,
            searchPosition: 'dropdown',
            defaultOpen: false,
        });
        expect(getSearchInput()).toBeNull();
        await click(getTrigger());
        await waitFor(() => expect(getSearchInput()).toHaveFocus());
    });

    it('changeWithObject 单选 change 的值与节点都是节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            changeWithObject: true,
            showClear: true,
            defaultValue: { value: 'Beijing', key: '0-0-0', label: 'Beijing' },
            onChange,
            treeData: treeDataEn,
        });
        await click(getNode('Shanghai'));
        const node = { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' };
        expect(onChange).toHaveBeenCalledWith(node, node, expect.anything());
    });

    it('勾选唯一子节点同时勾选父节点', async () => {
        await renderTreeSelect({ multiple: true, treeData: treeDataEn, defaultExpandAll: true });
        await click(getNode('Osaka').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`));
        expect(isChecked('Osaka')).toEqual(true);
        expect(isChecked('Japan')).toEqual(true);
        expect(getTagTexts()).toEqual(['Japan']);
    });

    it('非受控多选清空后下拉保持打开', async () => {
        await renderTreeSelect({ multiple: true, showClear: true, defaultValue: ['Beijing'], treeData: treeDataEn });
        expect(getTagTexts()).toEqual(['Beijing']);
        await click(getClearButton());
        expect(getTags()).toHaveLength(0);
        expect(getPopover()).not.toBeNull();
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('search 事件只发一次并带匹配节点', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({ filterTreeNode: true, onSearch, treeData: treeDataEn });
        await search('Beijing');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('Beijing', expect.arrayContaining(['0', '0-0']), [{ label: 'Beijing', value: 'Beijing', key: '0-0-0' }]);
    });

    it('多选触发器搜索勾选后清空输入', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onChange,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await search('Beijing', getTriggerInput());
        expect(getTriggerInput()).toHaveValue('Beijing');
        await click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(getTriggerInput()).toHaveValue('');
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('disableStrictly 时勾选父节点只勾选非禁用后代', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            onChange,
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
        });
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Shanghai']);
        expect(isChecked('Beijing')).toEqual(false);
        expect(isChecked('Shanghai')).toEqual(true);
    });

    it('点击展开图标展开', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ onExpand, treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('受控 expandedKeys 时收起不改变界面', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ expandedKeys: ['0'], onExpand, treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: '0' }) }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('搜索时展开不影响无关键词时的展开项', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ filterTreeNode: true, onExpand, treeData: treeDataEn, defaultExpandAll: true });
        await search('Asia');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true }));
        await search('');
        expect(getOptions()).toHaveLength(10);
    });

    it('Backspace 删除最后一个标签，禁用项除外', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        await fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Beijing']);
    });
    it('disableStrictly 时 Backspace 不删除禁用项', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        await fireEvent.keyDown(getTriggerInput(), { key: 'Backspace' });
        await settle();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
    });

    it('单选点击节点', async () => {
        const onChange = spy<'change'>();
        const onSelect = spy<'select'>();
        await renderTreeSelect({ onChange, onSelect, treeData: treeDataEn, defaultExpandAll: true });
        await click(getNode('Beijing'));
        const node = { label: 'Beijing', value: 'Beijing', key: '0-0-0' };
        expect(onSelect).toHaveBeenCalledWith('0-0-0', true, node);
        expect(onChange).toHaveBeenCalledWith('Beijing', node, expect.anything());
        expect(getSelection()).toHaveTextContent('Beijing');
    });

    it('受控单选点击节点不更新界面', async () => {
        const onChange = spy<'change'>();
        const onSelect = spy<'select'>();
        await renderTreeSelect({
            modelValue: 'Beijing',
            onChange,
            onSelect,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await click(getNode('Shanghai'));
        expect(onSelect).toHaveBeenCalledWith('0-0-1', true, expect.objectContaining({ key: '0-0-1' }));
        expect(onChange.mock.calls[0][0]).toEqual('Shanghai');
        expect(getSelection()).toHaveTextContent('Beijing');
    });

    it('禁用节点不可选，其子节点可选', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
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
        await click(getNode('Asia'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelectedLabels()).toEqual([]);
        await click(getNode('Beijing'));
        expect(onChange.mock.calls[0][0]).toEqual('Beijing');
    });

    it('showFilteredOnly 只在有关键词时过滤', async () => {
        await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await search('Beijing');
        expect(getOptions()).toHaveLength(3);
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing']);
        await search('');
        expect(getOptions()).toHaveLength(10);
    });

    it('非受控清除后隐藏清除按钮', async () => {
        const onClear = spy<'clear'>();
        await renderTreeSelect({
            showClear: true,
            defaultValue: 'Beijing',
            onClear,
            treeData: treeDataEn,
            defaultOpen: false,
        });
        await click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(getSelection()).not.toHaveTextContent('Beijing');
        expect(getClearButton()).toBeNull();
    });

    it('收起动画结束后移除子行', async () => {
        await renderTreeSelect({ motion: true, motionExpand: true, treeData: treeDataEn, defaultExpandAll: true });
        await clickExpandIcon('Asia');
        const collapsible = document.querySelector(`.${BASE_CLASS_PREFIX}-collapsible-wrapper`) as HTMLElement;
        expect(collapsible).toContainElement(getNode('China'));
        await waitFor(() => expect(collapsible).toHaveStyle({ '--semi-collapsible-height': '0px' }));
        // jsdom runs no CSS transitions, so end it by hand
        await fireEvent.transitionEnd(collapsible, { propertyName: 'height' });
        await settle();
        expect(getNode('China')).toBeUndefined();
        expect(getNodeLabels()).toEqual(['Asia', 'North America', 'United States', 'Canada']);
    });

    it('Escape 关闭后焦点不留在搜索框', async () => {
        await renderTreeSelect({ filterTreeNode: true, treeData: treeDataEn, defaultOpen: true });
        await click(getSearchInput());
        expect(getSearchInput()).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(document.activeElement?.tagName).not.toEqual('INPUT');
    });

    it('行带数据 key', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultExpandAll: true });
        expect(getNode('Asia')).toHaveAttribute('data-key', '0');
        expect(getNode('China')).toHaveAttribute('data-key', '0-0');
        expect(getNode('Canada')).toHaveAttribute('data-key', '1-1');
    });

    it('收起再展开后加载并发 load', async () => {
        const onLoad = spy<'load'>();
        const loadData = vi.fn<LoadData>().mockResolvedValue(undefined);
        await renderTreeSelect({ treeData: treeDataWithLoad, loadData, onLoad, defaultExpandAll: true });
        await clickExpandIcon('Node 1');
        await clickExpandIcon('Node 1');
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad).toHaveBeenCalledWith(new Set(['node1']), treeDataWithLoad[0]);
    });

    it('showFilteredOnly 时设置 expandedKeys', async () => {
        const { rerender } = await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        await rerender({ expandedKeys: ['0'] });
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'North America']);
    });

    it('disableStrictly 合并后的父节点标签可关闭', async () => {
        await renderTreeSelect({
            multiple: true,
            disableStrictly: true,
            defaultValue: ['Beijing', 'Shanghai'],
            treeData: treeDataWithDisabledLeaf,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        expect(getTagClose()).not.toBeNull();
        expect(getNode('Beijing')).toHaveAttribute('aria-disabled', 'true');
        expect(isChecked('Beijing')).toEqual(true);
    });

    it('searchAutoFocus 时 defaultOpen 的下拉搜索框获得焦点', async () => {
        await mountInPlace({
            ...commonProps,
            defaultOpen: true,
            filterTreeNode: true,
            searchPosition: 'dropdown',
            searchAutoFocus: true,
            treeData: treeDataEn,
        });
        await waitFor(() => expect(getSearchInput()).toHaveFocus());
    });

    it('点击叶子节点不发 expand', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            onExpand,
            treeData: [{ label: 'Node 1', value: 'node1', key: 'node1' }],
            defaultExpandAll: true,
        });
        expect(getExpandIcon('Node 1')).toBeNull();
        await click(getNode('Node 1'));
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('收起时 expand 带节点数据', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ onExpand, treeData: treeDataEn, defaultExpandAll: true });
        await clickExpandIcon('North America');
        expect(onExpand).toHaveBeenCalledWith(expect.not.arrayContaining(['1']), expect.objectContaining({ expanded: false, node: treeDataEnNA }));
        expect(getNode('Canada')).toBeUndefined();
    });

    it('受控 expandedKeys 时搜索结果中展开', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({ filterTreeNode: true, expandedKeys: ['0'], onExpand, treeData: treeDataEn });
        await search('Asia');
        await clickExpandIcon('China');
        expect(onExpand).toHaveBeenCalledWith(['0', '0-0'], expect.objectContaining({ expanded: true }));
        expect(getNode('Beijing')).toBeUndefined();
    });

    it('related 且 disableStrictly 时非禁用后代都已勾选则点击父节点取消', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Shanghai')).toEqual(true);
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Shanghai')).toEqual(false);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('related 且 disableStrictly 时取消父节点保留禁用后代', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Beijing', 'Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        expect(getTagTexts()).toEqual(['Asia']);
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect(isChecked('Beijing')).toEqual(true);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('多选默认标签可关闭', async () => {
        await renderTreeSelect({
            multiple: true,
            defaultValue: ['Beijing'],
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['Beijing']);
        expect(getTagClose()).not.toBeNull();
    });

    it('showFilteredOnly 时搜索结果中展开显示后代', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            onExpand,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await search('Asia');
        expect(getNodeLabels()).toEqual(['Asia']);
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenCalledWith(['0'], expect.objectContaining({ expanded: true }));
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan']);
    });

    it('showFilteredOnly 时搜索结果中展开再收起', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            onExpand,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await search('Asia');
        await clickExpandIcon('Asia');
        await clickExpandIcon('Asia');
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false }));
        expect(getNodeLabels()).toEqual(['Asia']);
    });

    it('showFilteredOnly 搜索中收起节点时，动画中的子行留在该节点之后', async () => {
        await renderTreeSelect({ filterTreeNode: true, showFilteredOnly: true, motionExpand: true });
        await search('大阪');
        expect(getNodeLabels()).toEqual(['亚洲', '日本', '大阪']);
        await clickExpandIcon('亚洲');
        expect(getNodeLabels()).toEqual(['亚洲', '日本', '大阪']);
    });

    it('motion 时 expandedKeys 置空收起全部', async () => {
        const { rerender } = await renderTreeSelect({ motion: true, treeData: treeDataEn, defaultExpandAll: true });
        expect(getOptions()).toHaveLength(10);
        await rerender({ expandedKeys: [] });
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('related 且 disableStrictly 时取消已勾选的父节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultValue: ['China'],
            defaultExpandAll: true,
            onChange,
        });
        expect(isChecked('Beijing')).toEqual(true);
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('related 且 disableStrictly、无禁用后代时勾选顶层节点', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await click(getNode('Asia'));
        expect(onChange.mock.calls[0][0]).toEqual(['Asia']);
        expect(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka'].every(isChecked)).toBe(true);
        expect(isChecked('North America')).toEqual(false);
    });

    it('触发器搜索无选中项时清除重置关键词，不触发 onChange', async () => {
        const onClear = spy<'clear'>();
        const onChange = spy<'change'>();
        await renderTreeSelect({
            showClear: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onClear,
            onChange,
            treeData: treeDataEn,
        });
        await search('Asia', getTriggerInput());
        await click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getTriggerInput()).toHaveValue('');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
    });

    it('点击单选触发器搜索的已选文本聚焦输入框', async () => {
        await renderTreeSelect({
            filterTreeNode: true,
            searchPosition: 'trigger',
            treeData: treeDataEn,
            defaultValue: 'Beijing',
        });
        await click(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`));
        expect(getTriggerInput()).toHaveFocus();
    });

    it('related 且 disableStrictly 时取消勾选叶子', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            defaultValue: ['Shanghai'],
            treeData: treeDataWithDisabledGrandchild,
            defaultExpandAll: true,
            onChange,
        });
        await click(getNode('Shanghai'));
        expect(onChange.mock.calls[0][0]).toEqual([]);
        expect(isChecked('Shanghai')).toEqual(false);
    });

    it('related 且 disableStrictly、无禁用后代时勾选与取消', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'related',
            disableStrictly: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['China']);
        expect(['Beijing', 'Shanghai', 'Chengdu'].every(isChecked)).toBe(true);
        expect(isChecked('Asia')).toEqual(false);
        await click(getNode('China'));
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything(), expect.anything());
        expect(isChecked('China')).toEqual(false);
        expect(isChecked('Beijing')).toEqual(false);
    });

    it('失焦后不再响应外部点击', async () => {
        const onBlur = spy<'blur'>();
        await renderTreeSelect({ onBlur, treeData: treeDataEn, defaultOpen: false });
        await click(getTrigger());
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('没有关键词时关闭不发 search', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({ filterTreeNode: true, onSearch, treeData: treeDataEn });
        await click(getTrigger());
        await waitFor(() => expect(getPopover()).toBeNull());
        await click(getTrigger());
        expect(getSearchInput()).toHaveValue('');
        expect(onSearch).not.toHaveBeenCalled();
    });

    // The row's checkbox carries no value, so a surrounding CheckboxGroup does not take it over
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
        const onChange = spy<'change'>();
        const InGroup = (attrs: Record<string, unknown>) => <CheckboxGroup>{() => <TreeSelect {...attrs} />}</CheckboxGroup>;
        await renderWith(InGroup, {
            ...commonProps,
            multiple: true,
            defaultOpen: true,
            expandAll: true,
            leafOnly: true,
            treeData: groupData,
            onChange,
        });
        await click(getNode('Semi'));
        expect(onChange.mock.lastCall?.[0]).toEqual(['semi@bytedance.com']);
        expect(getTagTexts()).toEqual(['Semi']);
        expect(isChecked('Semi')).toBe(true);
        expect(isChecked('Design')).toBe(false);
        expect(isChecked('React')).toBe(false);
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`)).toHaveLength(1);
    });

    it('多选时 tree 下直接是 treeitem，没有 CheckboxGroup 的 role=group 层', async () => {
        await renderTreeSelect({ multiple: true, defaultExpandAll: true });
        const tree = screen.getByRole('tree');
        expect(tree.querySelector('[role="group"]')).toBeNull();
        expect(within(tree).getAllByRole('treeitem')[0].parentElement).toBe(tree);
    });

    it("修复 #1206（valueNotInTreeDataIssue）：checkRelation='unRelated' 时接受不在 treeData 中的值", async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            defaultExpandAll: true,
            treeData: treeDataWithoutValue,
            defaultValue: ['beijing', 'fish'],
            onChange,
        });
        expect(getTagTexts()).toEqual(['北京', 'fish']);
        expect(isChecked('北京')).toBe(true);
        await click(getNode('上海'));
        expect(onChange.mock.lastCall?.[0]).toEqual(['beijing', 'fish', 'shanghai']);
        expect(getTagTexts()).toEqual(['北京', 'fish', '上海']);
    });

    it("修复 #1852：checkRelation='unRelated' 时，loadData 后保留已勾选的节点", async () => {
        type Host = { data: TreeNodeData[] };
        let host: Host | undefined;
        const loadData = ({ key, children }: TreeNodeData) => {
            if (!children && host) {
                host.data = host.data.map((node) => (node.key === key ? { ...node, children: [{ label: `Child Node${key}-0`, key: `${key}-0` }] } : node));
            }
            return Promise.resolve();
        };
        const view = await renderWith<Host>(Stateful, {
            initialData: [
                { label: 'Expand to load0', value: '0', key: '0' },
                { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
            ],
            initialValue: ['0'],
            multiple: true,
            checkRelation: 'unRelated',
            defaultOpen: true,
            loadData,
        });
        host = view.handle();
        expect(isChecked('Expand to load0')).toBe(true);
        await clickExpandIcon('Expand to load0');
        await waitFor(() => expect(getNode('Child Node0-0')).toBeDefined());
        expect(isChecked('Expand to load0')).toBe(true);
        expect(isChecked('Child Node0-0')).toBe(false);
        expect(getTagTexts()).toEqual(['Expand to load0']);
    });

    it('修复 #1542：expandedKeys 受控时 showFilteredOnly 仍然过滤', async () => {
        type Host = { expandedKeys: string[] };
        let host: Host | undefined;
        const view = await renderWith<Host>(Stateful, {
            initialData: treeDataEn,
            initialExpandedKeys: [],
            filterTreeNode: true,
            searchPosition: 'trigger',
            showFilteredOnly: true,
            onSearch: (_input: string, filteredExpandedKeys: string[]) => {
                if (host) host.expandedKeys = filteredExpandedKeys;
            },
        });
        host = view.handle();
        await click(getTrigger());
        await userEvent.type(getTriggerInput(), 'b');
        await settle();
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing']);
        await userEvent.clear(getTriggerInput());
        await settle();
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        await userEvent.type(getTriggerInput(), 's');
        await settle();
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Beijing', 'Shanghai', 'Chengdu', 'Japan', 'Osaka', 'North America', 'United States']);
        await clickExpandIcon('China');
        expect(getNodeLabels()).toEqual(['Asia', 'China', 'Japan', 'Osaka', 'North America', 'United States']);
    });
});

describe('TreeSelect 行为', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('通过 handle 关闭会关闭下拉框', async () => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        const { handle } = await renderTreeSelect({ onDropdownVisibleChange });
        expect(getPopover()).not.toBeNull();
        await act(() => handle().close());
        expect(getPopover()).toBeNull();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('data-* 属性落在 combobox 上', async () => {
        await renderTreeSelect({ defaultOpen: false, 'data-index': '1', 'data-testid': 'region' });
        expect(screen.getByTestId('region')).toBe(getTrigger());
        expect(getTrigger()).toHaveAttribute('data-index', '1');
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'tree');
    });

    it('#trigger 插槽拿到 value，并可以清空、搜索和删除', async () => {
        const onChange = spy<'change'>();
        const onSearch = spy<'search'>();
        let triggerProps: TreeSelectTriggerSlotProps<unknown, boolean> | undefined;
        await renderTreeSelect(
            {
                multiple: true,
                filterTreeNode: true,
                defaultValue: ['Beijing', 'Dongjing'],
                defaultOpen: false,
                onChange,
                onSearch,
            },
            {
                trigger: (props: TreeSelectTriggerSlotProps<unknown, boolean>) => {
                    triggerProps = props;
                    return <div class="custom-trigger">{props.value.map((node) => node.label).join(',')}</div>;
                },
            }
        );
        const slotProps = () => triggerProps as TreeSelectTriggerSlotProps<unknown, boolean>;
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('北京,东京');
        expect(slotProps().componentProps.multiple).toBe(true);
        await act(() => slotProps().onRemove('dongjing'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        await act(() => slotProps().onSearch('上'));
        expect(onSearch.mock.calls[0][0]).toBe('上');
        await act(() => slotProps().onClear());
        expect(onChange.mock.calls[1][0]).toEqual([]);
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('');
    });

    it('聚焦时卸载会移除外部点击监听', async () => {
        const onBlur = spy<'blur'>();
        const added = vi.spyOn(document, 'addEventListener');
        const removed = vi.spyOn(document, 'removeEventListener');
        const { unmount } = await renderTreeSelect({ defaultOpen: false, onBlur });
        await click(getTrigger());
        expect(countLiveListeners(added, removed, 'mousedown')).toBeGreaterThan(0);
        unmount();
        expect(countLiveListeners(added, removed, 'mousedown')).toBe(0);
        await fireEvent.mouseDown(document.body);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('受控多选值跟随父组件', async () => {
        const { rerender } = await renderTreeSelect({
            multiple: true,
            modelValue: ['Beijing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['北京']);
        expect(isChecked('北京')).toBe(true);
        await rerender({ modelValue: ['Shanghai', 'Dongjing'] });
        expect(getTagTexts()).toEqual(['上海', '东京']);
        expect(isChecked('北京')).toBe(false);
        expect(isChecked('上海')).toBe(true);
    });

    it('触发器已关闭下拉框后，外部点击才触发 blur', async () => {
        const onBlur = spy<'blur'>();
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({ defaultOpen: false, onBlur, onDropdownVisibleChange });
        await click(getTrigger());
        await click(getTrigger());
        expect(getPopover()).toBeNull();
        expect(onBlur).not.toHaveBeenCalled();
        await click(document.body);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getTrigger()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        expect(onDropdownVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('aria-expanded 跟随下拉框，clickTriggerToHide 为 false 时同样如此', async () => {
        await renderTreeSelect({ defaultOpen: false, clickTriggerToHide: false });
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        await click(getTrigger());
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        await click(getTrigger());
        expect(getPopover()).not.toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        await click(document.body);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('aria-controls 指向 role="tree" 列表，单选和多选均如此', async () => {
        const { unmount } = await renderTreeSelect({ defaultOpen: false });
        await click(getTrigger());
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        const tree = document.getElementById(getTrigger().getAttribute('aria-controls') as string);
        expect(tree).toHaveAttribute('role', 'tree');
        expect(tree).toHaveAttribute('aria-multiselectable', 'false');
        expect(tree).toHaveAccessibleName(locale.label);
        unmount();
        await renderTreeSelect({ defaultOpen: false, multiple: true, 'aria-label': 'Region' });
        await click(getTrigger());
        const multipleTree = document.getElementById(getTrigger().getAttribute('aria-controls') as string);
        expect(multipleTree).toHaveAttribute('role', 'tree');
        expect(multipleTree).toHaveAttribute('aria-multiselectable', 'true');
        expect(multipleTree).toHaveAccessibleName('Region');
    });

    it('optionListStyle 在有数据和无数据时都落在 aria-controls 指向的元素上', async () => {
        const { unmount } = await renderTreeSelect({ defaultOpen: false, optionListStyle: { height: '200px' } });
        await click(getTrigger());
        const tree = document.getElementById(getTrigger().getAttribute('aria-controls') as string);
        expect(tree).toHaveAttribute('role', 'tree');
        expect(tree).toHaveStyle({ height: '200px' });
        unmount();
        await renderTreeSelect({ defaultOpen: false, treeData: [], optionListStyle: { height: '200px' } });
        await click(getTrigger());
        const empty = document.getElementById(getTrigger().getAttribute('aria-controls') as string);
        expect(empty).not.toHaveAttribute('role', 'tree');
        expect(empty).toHaveStyle({ height: '200px' });
    });

    it('触发器搜索上的 searchAutoFocus 聚焦输入框，原生 input 不带组件属性', async () => {
        await mountInPlace({
            ...commonProps,
            filterTreeNode: true,
            searchAutoFocus: true,
            searchPosition: 'trigger',
            treeData,
        });
        const input = getTriggerInput();
        expect(document.activeElement).toBe(input);
        const names = input.getAttributeNames();
        for (const name of ['autofocus', 'preventscroll', 'showclear', 'inputref', 'modelvalue', 'searchautofocus']) {
            expect(names).not.toContain(name);
        }
    });

    it('handle 只暴露 search 和 close', async () => {
        const { handle } = await renderTreeSelect({ defaultOpen: false });
        expect(Object.keys(handle()).sort()).toEqual(['close', 'search']);
    });

    it('渲染时读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { TreeSelect: { placeholder: 'global placeholder' } };
        const { unmount } = await renderTreeSelect({ defaultOpen: false });
        expect(getSelection()).toHaveTextContent('global placeholder');
        unmount();
        await renderTreeSelect({ defaultOpen: false, placeholder: 'own' });
        expect(getSelection()).toHaveTextContent('own');
    });

    it('未声明属性落在 combobox 上，已声明的属性不落在上面', async () => {
        await renderTreeSelect(
            {
                defaultOpen: false,
                id: 'region',
                title: 'Region',
                insetLabelId: 'label-id',
                validateStatus: 'error',
                onBlur: () => {},
            },
            { insetLabel: () => 'Label' }
        );
        const root = getTrigger();
        expect(root).toHaveAttribute('id', 'region');
        expect(root).toHaveAttribute('title', 'Region');
        expect(root).not.toHaveAttribute('validatestatus');
        expect(root).not.toHaveAttribute('insetlabelid');
        expect(root.querySelector('#label-id')).toHaveTextContent('Label');
    });
});

describe('TreeSelect Tab 停靠点', () => {
    it('禁用时 combobox 不是 Tab 停靠点', async () => {
        await renderTreeSelect({ disabled: true, defaultOpen: false });
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });
});

describe('TreeSelect 键盘操作（APG combobox 配合树形弹层）', () => {
    const activeLabel = (host: Element) => document.getElementById(host.getAttribute('aria-activedescendant') ?? '')?.textContent;
    const focus = (element: HTMLElement) => act(() => element.focus());
    const keyboard = async (keys: string) => {
        await userEvent.keyboard(keys);
        await settle();
    };

    it.each(['{Enter}', ' ', '{ArrowDown}'])('#trigger 内按钮聚焦时 %j 只交给按钮，不打开面板', async (key) => {
        const onPress = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
        await renderTreeSelect(
            { treeData: treeDataEn, defaultOpen: false },
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <button type="button" aria-label="清除" onClick={onPress} />
                    </div>
                ),
            }
        );
        await focus(screen.getByRole('button', { name: '清除' }));
        await keyboard(key);
        expect(onPress).toHaveBeenCalledTimes(key === '{ArrowDown}' ? 0 : 1);
        expect(getPopover()).toBeNull();
    });

    it('#trigger 内 role="button" 的元素上按 Enter 只交给它，不打开面板；指针点击仍打开', async () => {
        const onPress = vi.fn<() => void>();
        await renderTreeSelect(
            { treeData: treeDataEn, defaultOpen: false },
            {
                trigger: () => (
                    <div class="custom-trigger">
                        <Tag aria-label="清除" onClick={onPress}>
                            {() => 'Asia'}
                        </Tag>
                    </div>
                ),
            }
        );
        await focus(screen.getByRole('button', { name: '清除' }));
        await keyboard('{Enter}');
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(getPopover()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: '清除' }));
        await settle();
        expect(getPopover()).not.toBeNull();
    });

    it.each([false, true])('多选时已选标签上按 Enter 不改变面板开合（defaultOpen=%s）', async (defaultOpen) => {
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        await renderTreeSelect({
            treeData: treeDataEn,
            multiple: true,
            defaultValue: ['Beijing'],
            defaultOpen,
            onDropdownVisibleChange,
        });
        onDropdownVisibleChange.mockClear();
        await focus(screen.getByRole('button', { name: /Beijing/ }));
        await keyboard('{Enter}');
        expect(onDropdownVisibleChange).not.toHaveBeenCalled();
        expect(getPopover() !== null).toBe(defaultOpen);
    });

    it.each(['{Enter}', ' '])('多选、面板打开且有激活行时，已选标签上按 %j 不选中激活行', async (key) => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            treeData: treeDataEn,
            multiple: true,
            defaultValue: ['Beijing'],
            defaultOpen: true,
            onChange,
        });
        await focus(getTrigger());
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBeTruthy();

        await focus(screen.getByRole('button', { name: /Beijing/ }));
        await keyboard(key);
        expect(onChange).not.toHaveBeenCalled();
        expect(getPopover()).not.toBeNull();
    });

    it('打开时没有激活行；ArrowDown 激活第一行，Enter 选中它', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({ treeData: treeDataEn, onChange });
        await focus(getTrigger());
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-focused`);
        await keyboard('{End}{Enter}');
        expect(onChange).toHaveBeenCalledWith('North America', expect.anything(), expect.anything());
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('Right 展开激活行并进入其中，Left 返回并收起', async () => {
        await renderTreeSelect({ treeData: treeDataEn });
        await focus(getTrigger());
        await keyboard('{ArrowDown}{ArrowRight}');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'true');
        await keyboard('{ArrowRight}');
        expect(activeLabel(getTrigger())).toBe('China');
        await keyboard('{ArrowLeft}{ArrowLeft}');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'false');
    });

    it('下拉框搜索输入框中 Up 和 Down 移动，Left 和 Right 留在文本内', async () => {
        await renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true });
        const input = getSearchInput();
        await focus(input);
        await keyboard('{ArrowDown}{ArrowDown}');
        expect(activeLabel(input)).toBe('North America');
        await keyboard('{ArrowLeft}');
        expect(getNode('Asia')).toHaveAttribute('aria-expanded', 'false');
        expect(activeLabel(input)).toBe('North America');
    });

    it('搜索无结果时方向键无处可去', async () => {
        await renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, showFilteredOnly: true });
        const input = getSearchInput();
        await userEvent.type(input, 'none');
        await keyboard('{ArrowDown}');
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('多选触发器上搜索时，输入框指向激活行，Enter 勾选它', async () => {
        await renderTreeSelect({
            treeData: treeDataEn,
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        const input = getTriggerInput();
        await focus(input);
        await keyboard('{ArrowDown}{ArrowDown}{Enter}');
        expect(activeLabel(input)).toBe('North America');
        expect(isChecked('North America')).toBe(true);
    });

    it('在触发器上输入时移动到以输入内容开头的下一个可见行', async () => {
        await renderTreeSelect({ treeData: treeDataEn });
        await focus(getTrigger());
        await keyboard('n');
        expect(activeLabel(getTrigger())).toBe('North America');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('数字标签参与键入跳转', async () => {
        await renderTreeSelect({
            treeData: [
                { label: 'alpha', value: 'a', key: 'a' },
                { label: 2024, value: 'y', key: 'y' },
            ],
        });
        await focus(getTrigger());
        await keyboard('2');
        expect(activeLabel(getTrigger())).toBe('2024');
    });

    it('关闭状态下在触发器上输入字符无效果，与 Cascader 一致', async () => {
        await renderTreeSelect({ treeData: treeDataEn, defaultOpen: false });
        await focus(getTrigger());
        await keyboard('n');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
    });

    it('搜索结果立即渲染，aria-activedescendant 指向已渲染的行', async () => {
        await renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true, showFilteredOnly: true });
        const input = getSearchInput();
        await focus(input);
        await search('Beijing');
        expect(input).toHaveValue('Beijing');
        expect(getNodeLabels()).toContain('Beijing');
        await keyboard('{ArrowDown}');
        const active = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
        expect(active).not.toBeNull();
        expect(screen.getByRole('tree')).toContainElement(active);
        await search('none');
        expect(getNodeLabels()).toEqual([emptyText]);
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('下拉框搜索输入框中输入的字符留在文本内', async () => {
        await renderTreeSelect({ treeData: treeDataEn, filterTreeNode: true });
        const input = getSearchInput();
        await focus(input);
        await keyboard('n');
        expect(input).toHaveValue('n');
    });

    it('#search 插槽的 textarea 中输入的字符留在文本内', async () => {
        await renderTreeSelect(
            { treeData: treeDataEn, filterTreeNode: true },
            {
                search: ({ modelValue, onChange }: TreeSelectSearchSlotProps) => <textarea aria-label="search" value={modelValue} onInput={(event: Event) => onChange((event.target as HTMLTextAreaElement).value)} />,
            }
        );
        const textarea = screen.getByRole('textbox', { name: 'search' });
        await focus(textarea);
        await keyboard('n ');
        expect(textarea).toHaveValue('n ');
    });

    it('#search 插槽接收指向激活行的属性', async () => {
        await renderTreeSelect(
            { treeData: treeDataEn, filterTreeNode: true },
            {
                search: (inputProps: TreeSelectSearchSlotProps) => (
                    <input
                        class="custom-search"
                        aria-activedescendant={inputProps['aria-activedescendant']}
                        aria-autocomplete={inputProps['aria-autocomplete']}
                        aria-controls={inputProps['aria-controls']}
                        aria-label={inputProps['aria-label']}
                        value={inputProps.modelValue}
                        onInput={(event: Event) => inputProps.onChange((event.target as HTMLInputElement).value)}
                    />
                ),
            }
        );
        const input = document.querySelector('.custom-search') as HTMLElement;
        await focus(input);
        await keyboard('{ArrowDown}');
        expect(activeLabel(input)).toBe('Asia');
        expect(input).toHaveAttribute('aria-controls', screen.getByRole('tree').id);
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAccessibleName(locale.filter);
    });

    it('从关闭的 combobox 按 ArrowDown 和 ArrowUp 可打开', async () => {
        await renderTreeSelect({ defaultOpen: false });
        const combobox = screen.getByRole('combobox');
        await focus(combobox);
        await keyboard('{ArrowDown}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await keyboard('{Escape}');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        await keyboard('{ArrowUp}');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('触发器上的搜索输入框作为 combobox 且是唯一的 Tab 停靠点（ARIA 1.2）', async () => {
        const { unmount } = await renderTreeSelect({
            defaultOpen: false,
            defaultValue: 'Beijing',
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        const input = screen.getByRole('combobox', { name: locale.label });
        expect(input).toBe(getTriggerInput());
        expect(input).toHaveAttribute('aria-autocomplete', 'list');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).toHaveAccessibleDescription('北京');
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
        expect(getTrigger()).not.toHaveAttribute('role');
        expect(getTrigger()).not.toHaveAttribute('aria-expanded');
        await search('京', input);
        expect(input).not.toHaveAttribute('aria-describedby');
        unmount();

        await renderTreeSelect({ defaultOpen: false, multiple: true, filterTreeNode: true, searchPosition: 'trigger' });
        expect(screen.getByRole('combobox')).toBe(getTriggerInput());
        expect(getTrigger()).toHaveAttribute('tabindex', '-1');
    });

    it('搜索输入框在下拉框中时，触发器仍是 combobox', async () => {
        await renderTreeSelect({ filterTreeNode: true, searchPosition: 'dropdown' });
        const searchBox = screen.getByRole('textbox', { name: locale.filter });
        expect(searchBox).toHaveAttribute('aria-autocomplete', 'list');
        expect(searchBox).toHaveAttribute('aria-controls', screen.getByRole('tree').id);
        expect(screen.getByRole('combobox')).toBe(getTrigger());
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(getTrigger()).toHaveAttribute('aria-haspopup', 'tree');
        expect(getTrigger()).not.toHaveAttribute('aria-describedby');
    });
});

describe('TreeSelect 审计修复', () => {
    it('多选触发器搜索后勾选，列表恢复为未搜索的结构并通知清空关键词', async () => {
        const onSearch = spy<'search'>();
        await renderTreeSelect({
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
            treeData: treeDataEn,
            onSearch,
        });
        await search('Beijing', getTriggerInput());
        await click(getNode('Beijing'));
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        expect(onSearch).toHaveBeenLastCalledWith('', [], []);
    });

    it('unRelated 且 autoMergeValue 为 false 时，勾选的节点显示为标签', async () => {
        await renderTreeSelect({
            multiple: true,
            checkRelation: 'unRelated',
            autoMergeValue: false,
            showClear: true,
            treeData: treeDataEn,
            defaultExpandAll: true,
        });
        await click(getNode('Beijing'));
        expect(getTagTexts()).toEqual(['Beijing']);
    });

    it('leafOnly 且 autoMergeValue 为 false 时，勾选父节点只回传叶子', async () => {
        const onChange = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            leafOnly: true,
            autoMergeValue: false,
            treeData: treeDataEn,
            defaultExpandAll: true,
            onChange,
        });
        await click(getNode('China'));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
        expect(getTagTexts()).toEqual(['Beijing', 'Shanghai', 'Chengdu']);
    });

    it('keyMaps.label 下搜索期间 treeData 变化后仍按映射的字段过滤', async () => {
        const data = [
            { label1: 'Apple', value1: 'a', key1: 'a' },
            { label1: 'Banana', value1: 'b', key1: 'b' },
        ];
        const keyMaps = { label: 'label1', value: 'value1', key: 'key1' };
        const { rerender } = await renderTreeSelect({
            filterTreeNode: true,
            showFilteredOnly: true,
            keyMaps,
            treeData: data,
        });
        await search('Ban');
        expect(getNodeLabels()).toEqual(['Banana']);
        await rerender({ treeData: [...data, { label1: 'Banner', value1: 'c', key1: 'c' }] });
        expect(getNodeLabels()).toEqual(['Banana', 'Banner']);
    });

    it('#trigger 的 value 不含 undefined：受控 modelValue 不在 treeData 中时给出兜底节点', async () => {
        await renderTreeSelect(
            { multiple: true, modelValue: ['ghost'], treeData: treeDataEn },
            {
                trigger: ({ value }: { value: TreeNodeData[] }) => <div class="custom-trigger">{value.map((item) => item.label).join(',')}</div>,
            }
        );
        expect(screen.getByRole('combobox').querySelector('.custom-trigger')).toHaveTextContent('ghost');
    });

    it('受控 expandedKeys 的 TreeSelect 搜索后清空，保持控制方给出的展开状态', async () => {
        const onExpand = spy<'expand'>();
        await renderTreeSelect({
            filterTreeNode: true,
            expandedKeys: [],
            modelValue: 'Beijing',
            treeData: treeDataEn,
            onExpand,
        });
        await search('Bei');
        await search('');
        expect(getNodeLabels()).toEqual(['Asia', 'North America']);
        expect(onExpand).not.toHaveBeenCalled();
    });

    it.each(['dropdown', 'trigger'] as const)('keyMaps.disabled 标记的禁用节点，其标签没有关闭按钮（searchPosition=%s）', async (searchPosition) => {
        await renderTreeSelect({
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
        ['单选', { modelValue: 'Beijing' }, { modelValue: undefined }],
        ['触发器搜索多选', { multiple: true, filterTreeNode: true, searchPosition: 'trigger', modelValue: ['Beijing'] }, { multiple: true, filterTreeNode: true, searchPosition: 'trigger', modelValue: [] }],
    ])('%s：清除按钮持焦时值被外部清空，焦点回到 combobox', async (_, before, after) => {
        const { rerender } = await renderTreeSelect({ defaultOpen: false, showClear: true, treeData: treeDataEn, ...before });
        const clear = screen.getByRole('button', { name: locale.clear });
        await act(() => clear.focus());
        await rerender({ ...commonProps, defaultOpen: false, showClear: true, treeData: treeDataEn, ...after });
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('RTL 下默认弹出方位为 bottomRight', async () => {
        render(() => (
            <ConfigProvider direction="rtl" locale={en_US}>
                {() => <TreeSelect {...commonProps} defaultOpen treeData={treeData} />}
            </ConfigProvider>
        ));
        await settle();
        expect(getPopoverWrapper()).toHaveAttribute('x-placement', 'bottomRight');
    });

    it('单选 defaultValue 为 0 时选中值为 0 的节点并展开其祖先', async () => {
        await renderTreeSelect({ defaultValue: 0, treeData: [{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 0 }] }] });
        expect(getSelectedLabels()).toEqual(['C']);
    });

    it('多选 defaultValue 为 0、受控 modelValue 为 0 在 treeData 晚到时都选中值为 0 的节点', async () => {
        const zero = [
            { key: 'z', label: 'Zero', value: 0 },
            { key: 'o', label: 'One', value: 1 },
        ];
        const { unmount } = await renderTreeSelect({ defaultOpen: false, multiple: true, defaultValue: 0, treeData: zero });
        expect(getTagTexts()).toEqual(['Zero']);
        unmount();
        const { rerender } = await renderTreeSelect({ defaultOpen: false, modelValue: 0, treeData: [] });
        await rerender({ treeData: zero });
        expect(getSelection()).toHaveTextContent('Zero');
    });
});

describe('TreeSelect Vue', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const activeLabel = (host: Element) => document.getElementById(host.getAttribute('aria-activedescendant') ?? '')?.textContent;
    const keyboard = async (keys: string) => {
        await userEvent.keyboard(keys);
        await settle();
    };
    // dispatches by hand so the test can read whether the TreeSelect prevented the default
    const pressKey = async (target: Element, key: string) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        await settle();
        return event;
    };

    it('V1 v-model：update:modelValue 先于 change，二者首参相同，change 带节点与事件', async () => {
        const onUpdate = vi.fn<(value: unknown) => void>();
        const onChange = spy<'change'>();
        const { unmount } = await renderTreeSelect({
            defaultExpandAll: true,
            'onUpdate:modelValue': onUpdate,
            onChange,
        });
        await click(getNode('北京'));
        expect(onUpdate).toHaveBeenCalledWith('Beijing');
        expect(onChange).toHaveBeenCalledWith('Beijing', expect.objectContaining({ key: 'beijing' }), expect.any(MouseEvent));
        expect(onUpdate.mock.invocationCallOrder[0]).toBeLessThan(onChange.mock.invocationCallOrder[0]);
        unmount();

        const onUpdateMultiple = vi.fn<(value: unknown) => void>();
        const onChangeMultiple = spy<'change'>();
        await renderTreeSelect({
            multiple: true,
            defaultExpandAll: true,
            'onUpdate:modelValue': onUpdateMultiple,
            onChange: onChangeMultiple,
        });
        await click(getNode('北京'));
        expect(onUpdateMultiple).toHaveBeenCalledWith(['Beijing']);
        expect(onChangeMultiple.mock.calls[0][0]).toEqual(onUpdateMultiple.mock.calls[0][0]);
        expect(onChangeMultiple.mock.calls[0][1]).toEqual([expect.objectContaining({ key: 'beijing' })]);
        expect(onUpdateMultiple.mock.invocationCallOrder[0]).toBeLessThan(onChangeMultiple.mock.invocationCallOrder[0]);
    });

    it('V2 changeWithObject：v-model 收到节点，change 的首参与第二参是同一节点', async () => {
        const { handle, unmount } = await renderWith<{ value: unknown }>(Stateful, {
            initialData: treeData,
            defaultOpen: true,
            defaultExpandAll: true,
            changeWithObject: true,
        });
        await click(getNode('北京'));
        expect(handle().value).toEqual(expect.objectContaining({ key: 'beijing', value: 'Beijing' }));
        unmount();

        const onChange = spy<'change'>();
        await renderTreeSelect({ multiple: true, defaultExpandAll: true, changeWithObject: true, onChange });
        await click(getNode('北京'));
        const [value, node] = onChange.mock.calls[0];
        expect(value).toBe(node);
        expect(value).toEqual([expect.objectContaining({ key: 'beijing' })]);
    });

    it('V3 单向绑定：只给 modelValue 时单选、多选都不自行改变', async () => {
        const { unmount } = await renderTreeSelect({ modelValue: 'Beijing', defaultExpandAll: true });
        await click(getNode('上海'));
        expect(getSelection()).toHaveTextContent('北京');
        unmount();

        await renderTreeSelect({ multiple: true, modelValue: ['Beijing'], defaultExpandAll: true });
        await click(getNode('上海'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(isChecked('上海')).toBe(false);
    });

    it('V4 modelValue 改回 undefined 时单选、多选都清空', async () => {
        const single = await renderTreeSelect({ modelValue: 'Beijing', defaultExpandAll: true });
        expect(getSelection()).toHaveTextContent('北京');
        await single.rerender({ modelValue: undefined });
        expect(getSelection()).not.toHaveTextContent('北京');
        expect(getSelectedLabels()).toEqual([]);
        single.unmount();

        const multiple = await renderTreeSelect({ multiple: true, modelValue: ['Beijing'], defaultExpandAll: true });
        expect(getTagTexts()).toEqual(['北京']);
        await multiple.rerender({ modelValue: undefined });
        expect(getTags()).toHaveLength(0);
        expect(isChecked('北京')).toBe(false);
    });

    it('V5 v-model:expandedKeys：展开写回，update:expandedKeys 先于 expand 且载荷相同', async () => {
        const onUpdate = vi.fn<(keys: string[]) => void>();
        const onExpand = spy<'expand'>();
        const { handle } = await renderWith<{ expandedKeys: string[] | undefined }>(Stateful, {
            initialData: treeData,
            initialExpandedKeys: [],
            defaultOpen: true,
            'onUpdate:expandedKeys': onUpdate,
            onExpand,
        });
        await clickExpandIcon('亚洲');
        expect(handle().expandedKeys).toEqual(['yazhou']);
        expect(getNodeLabels()).toEqual(['亚洲', '中国', '日本', '北美洲']);
        expect(onUpdate).toHaveBeenCalledWith(['yazhou']);
        expect(onExpand.mock.calls[0][0]).toEqual(onUpdate.mock.calls[0][0]);
        expect(onUpdate.mock.invocationCallOrder[0]).toBeLessThan(onExpand.mock.invocationCallOrder[0]);
    });

    it('V6 treeData 只认整体替换：就地修改不生效，内容相同的新数组不重置展开与选中', async () => {
        const { handle } = await renderWith<{ data: TreeNodeData[] }>(Stateful, {
            initialData: structuredClone(treeData),
            initialValue: 'Beijing',
            defaultOpen: true,
        });
        expect(getNodeLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '北美洲']);
        (handle().data[1].children as TreeNodeData[]).push({ label: '墨西哥', value: 'Mexico', key: 'mexico' });
        await clickExpandIcon('北美洲');
        expect(getNodeLabels()).not.toContain('墨西哥');

        handle().data = structuredClone(treeData);
        await settle();
        expect(getNodeLabels()).toEqual(['亚洲', '中国', '北京', '上海', '日本', '北美洲', '美国', '加拿大']);
        expect(getSelectedLabels()).toEqual(['北京']);
    });

    it('V7 KeepAlive 切走再切回后弹层关闭，发 dropdownVisibleChange(false)，不发 blur', async () => {
        const shown = ref(true);
        const onBlur = spy<'blur'>();
        const onDropdownVisibleChange = spy<'dropdownVisibleChange'>();
        const Other = defineComponent({ render: () => <div>other</div> });
        render(() => (
            <ConfigProvider locale={en_US}>
                {() => (
                    <KeepAlive>
                        {{
                            default: () => (shown.value ? <TreeSelect {...commonProps} treeData={treeData} defaultOpen onBlur={onBlur} onDropdownVisibleChange={onDropdownVisibleChange} /> : <Other />),
                        }}
                    </KeepAlive>
                )}
            </ConfigProvider>
        ));
        await settle();
        expect(getPopover()).not.toBeNull();
        shown.value = false;
        await settle();
        expect(onDropdownVisibleChange).toHaveBeenLastCalledWith(false);
        shown.value = true;
        await settle();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        expect(getPopover()).toBeNull();
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('V8 keydown 监听先于组件处理；触发器搜索框上按键只发一次', async () => {
        let expandedSeen: string | null = null;
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>(() => {
            expandedSeen = getTrigger().getAttribute('aria-expanded');
        });
        const { unmount } = await renderTreeSelect({ defaultOpen: false, onKeydown });
        await act(() => getTrigger().focus());
        await keyboard('{ArrowDown}');
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(expandedSeen).toBe('false');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        unmount();

        const onInputKeydown = vi.fn<(event: KeyboardEvent) => void>();
        await renderTreeSelect({
            defaultOpen: false,
            filterTreeNode: true,
            searchPosition: 'trigger',
            onKeydown: onInputKeydown,
        });
        await act(() => getTriggerInput().focus());
        await keyboard('a');
        expect(onInputKeydown).toHaveBeenCalledTimes(1);
    });

    it('V9 focus、blur、clear、change、select 各只触发一次；搜索框的原生事件不到达同名事件', async () => {
        const onFocus = spy<'focus'>();
        const onBlur = spy<'blur'>();
        const onClear = spy<'clear'>();
        const onChange = spy<'change'>();
        const onSelect = spy<'select'>();
        await renderTreeSelect({
            defaultOpen: false,
            defaultExpandAll: true,
            filterTreeNode: true,
            showClear: true,
            onFocus,
            onBlur,
            onClear,
            onChange,
            onSelect,
        });
        await click(getTrigger());
        expect(onFocus).toHaveBeenCalledTimes(1);
        const input = getSearchInput();
        await fireEvent.change(input);
        await fireEvent.select(input);
        expect(onChange).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
        await click(getNode('北京'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await click(getClearButton());
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('V10 单选 #selectedItem 的 index 为 0，onClose 清除并发 change(undefined, undefined, event)', async () => {
        const onChange = spy<'change'>();
        let slotProps: TreeSelectSelectedItemSlotProps | undefined;
        await renderTreeSelect(
            { defaultValue: 'Beijing', defaultOpen: false, onChange },
            {
                selectedItem: (props: TreeSelectSelectedItemSlotProps) => {
                    slotProps = props;
                    return (
                        <button type="button" onClick={(event: MouseEvent) => props.onClose(event)}>
                            {String(props.item.label)}
                        </button>
                    );
                },
            }
        );
        expect(slotProps?.index).toBe(0);
        expect(slotProps?.disabled).toBe(false);
        await click(screen.getByRole('button', { name: '北京' }));
        expect(onChange).toHaveBeenCalledWith(undefined, undefined, expect.any(MouseEvent));
        expect(getSelection()).not.toHaveTextContent('北京');
        expect(getPopover()).toBeNull();
    });

    it('V11 #tag 优先于 #selectedItem，onClose 删除该项；空 #arrowIcon 隐藏箭头，空 #clearIcon 用默认图标', async () => {
        const onChange = spy<'change'>();
        const { unmount } = await renderTreeSelect(
            { multiple: true, defaultValue: ['Beijing', 'Dongjing'], defaultExpandAll: true, onChange },
            {
                selectedItem: () => 'from selectedItem',
                tag: ({ item, onClose }: TreeSelectSelectedItemSlotProps) => (
                    <button type="button" class="own-tag" onClick={() => onClose()}>
                        {String(item.label)}
                    </button>
                ),
            }
        );
        expect([...document.querySelectorAll('.own-tag')].map((tag) => tag.textContent)).toEqual(['北京', '东京']);
        expect(getSelection()).not.toHaveTextContent('from selectedItem');
        await click(screen.getByRole('button', { name: '东京' }));
        expect(onChange.mock.calls[0][0]).toEqual(['Beijing']);
        expect([...document.querySelectorAll('.own-tag')].map((tag) => tag.textContent)).toEqual(['北京']);
        unmount();

        await renderTreeSelect({ defaultValue: 'Beijing', showClear: true, defaultOpen: false }, { arrowIcon: () => [], clearIcon: () => [] });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-arrow`)).toBeNull();
        expect(getClearButton()?.querySelector(`.${BASE_CLASS_PREFIX}-icon`)).not.toBeNull();
    });

    it('V12 关闭时 Space 打开并阻止默认行为', async () => {
        await renderTreeSelect({ defaultOpen: false });
        await act(() => getTrigger().focus());
        const event = await pressKey(getTrigger(), ' ');
        expect(event.defaultPrevented).toBe(true);
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('V12 关闭时 Home 与 End 打开并激活首、尾可见行', async () => {
        await renderTreeSelect({ defaultOpen: false, treeData: treeDataEn });
        await act(() => getTrigger().focus());
        await keyboard('{End}');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(getTrigger())).toBe('North America');
        await keyboard('{Escape}{Home}');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(activeLabel(getTrigger())).toBe('Asia');
    });

    it('V12 触发器搜索框内 Space 照常输入，Alt+ArrowDown 打开', async () => {
        const { unmount } = await renderTreeSelect({
            defaultOpen: false,
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        await act(() => getTriggerInput().focus());
        await keyboard('a b');
        expect(getTriggerInput()).toHaveValue('a b');
        unmount();

        await renderTreeSelect({ defaultOpen: false });
        await act(() => getTrigger().focus());
        await keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('V12 打开且没有激活行时 Space 与 Enter 一样关闭；触发器搜索框内 Home、End 不打开', async () => {
        const { unmount } = await renderTreeSelect({});
        await act(() => getTrigger().focus());
        await keyboard(' ');
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        unmount();

        await renderTreeSelect({ defaultOpen: false, filterTreeNode: true, searchPosition: 'trigger' });
        await act(() => getTriggerInput().focus());
        await keyboard('{Home}{End}');
        expect(getTriggerInput()).toHaveAttribute('aria-expanded', 'false');
    });

    it('V13 控制属性的落点随 combobox 移动，class、style、data-* 始终在根元素，tree 带同一名称', async () => {
        const control = {
            'aria-label': 'Region',
            'aria-describedby': 'desc',
            'aria-errormessage': 'err',
            'aria-invalid': true,
            'aria-required': true,
        };
        const rootAttrs = { class: 'own', style: { color: 'red' }, 'data-test': 'x' };
        const expectControl = (element: Element) => {
            expect(element).toHaveAttribute('aria-label', 'Region');
            expect(element).toHaveAttribute('aria-errormessage', 'err');
            expect(element).toHaveAttribute('aria-invalid', 'true');
            expect(element).toHaveAttribute('aria-required', 'true');
            expect(element.getAttribute('aria-describedby')?.split(' ')).toContain('desc');
        };
        const expectRoot = () => {
            expect(getTrigger()).toHaveClass('own');
            expect(getTrigger()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
            expect(getTrigger()).toHaveAttribute('data-test', 'x');
            expect(screen.getByRole('tree')).toHaveAccessibleName('Region');
        };

        const plain = await renderTreeSelect({ ...control, ...rootAttrs });
        expectControl(getTrigger());
        expectRoot();
        plain.unmount();

        const single = await renderTreeSelect({
            ...control,
            ...rootAttrs,
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        expectControl(getTriggerInput());
        expect(getTrigger()).not.toHaveAttribute('aria-label');
        expect(getTrigger()).not.toHaveAttribute('aria-invalid');
        expectRoot();
        single.unmount();

        await renderTreeSelect({
            ...control,
            ...rootAttrs,
            multiple: true,
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        expectControl(getTriggerInput());
        expect(getTrigger()).not.toHaveAttribute('aria-label');
        expectRoot();
    });

    it('V13 aria-labelledby 同时给 combobox 与 tree，combobox 不再加默认名称', async () => {
        await renderTreeSelect({ 'aria-labelledby': 'outer-label' });
        expect(getTrigger()).toHaveAttribute('aria-labelledby', 'outer-label');
        expect(getTrigger()).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('tree')).toHaveAttribute('aria-labelledby', 'outer-label');
    });

    describe('combobox 与 tree 用同一个名称来源', () => {
        const getTree = () => screen.getByRole('tree');

        it('使用方 aria-label 时两者都用该值', async () => {
            await renderTreeSelect({ 'aria-label': 'Region' }, { insetLabel: () => 'Inset' });
            expect(getTrigger()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAttribute('aria-label', 'Region');
            expect(getTree()).not.toHaveAttribute('aria-labelledby');
        });

        it('使用方 aria-labelledby 优先于 #insetLabel，两者指向同一个标签', async () => {
            const label = document.body.appendChild(document.createElement('span'));
            label.id = 'external-label';
            label.textContent = 'External';
            onTestFinished(() => label.remove());
            await renderTreeSelect({ 'aria-labelledby': 'external-label' }, { insetLabel: () => 'Inset' });
            expect(getTrigger()).toHaveAccessibleName('External');
            expect(getTree()).toHaveAccessibleName('External');
        });

        it('只有 #insetLabel 时 combobox 与 tree 都以 insetLabel 命名，没有 insetLabelId 时也能引用', async () => {
            const { unmount } = await renderTreeSelect({}, { insetLabel: () => 'Region' });
            expect(getTrigger()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
            unmount();
            await renderTreeSelect({ insetLabelId: 'region-label' }, { insetLabel: () => 'Region' });
            expect(getTrigger()).toHaveAttribute('aria-labelledby', 'region-label');
            expect(getTree()).toHaveAttribute('aria-labelledby', 'region-label');
        });

        it('有 #prefix 时 insetLabel 不渲染，也不作名称来源', async () => {
            await renderTreeSelect({}, { prefix: () => 'Pre', insetLabel: () => 'Region' });
            expect(getTrigger()).toHaveAccessibleName(locale.label);
            expect(getTree()).toHaveAccessibleName(locale.label);
        });

        it('没有任何名称来源时 tree 名称等于 combobox 的语言包回落名', async () => {
            await renderTreeSelect();
            expect(getTrigger()).toHaveAccessibleName(locale.label);
            expect(getTree()).toHaveAccessibleName(locale.label);
        });

        it('触发器上的搜索框是 combobox 时同样以 insetLabel 命名', async () => {
            await renderTreeSelect({ multiple: true, filterTreeNode: true, searchPosition: 'trigger' }, { insetLabel: () => 'Region' });
            expect(getTriggerInput()).toHaveAccessibleName('Region');
            expect(getTree()).toHaveAccessibleName('Region');
        });
    });

    it('V15 size 为 small 的多选下拉搜索：+N 与标签同为 small', async () => {
        await renderTreeSelect({
            multiple: true,
            size: 'small',
            maxTagCount: 1,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultExpandAll: true,
        });
        expect(getTagTexts()).toEqual(['北京', '+1']);
        for (const tag of getTags()) {
            expect(tag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        }
    });

    it('V16 #label、#expandIcon、#icon 转发到行，未提供时行用默认内容', async () => {
        const iconProps: unknown[] = [];
        const { unmount } = await renderTreeSelect(
            { defaultExpandAll: true },
            {
                label: ({ label, searchWord }: { label?: string | number; searchWord: string }) => <i class="own-label">{`${String(label)}${searchWord}`}</i>,
                icon: (props: Record<string, unknown>) => {
                    iconProps.push(props);
                    return <b class="own-icon" />;
                },
                expandIcon: ({ onClick, class: cls }: { onClick: (event: MouseEvent) => void; class: string }) => <button type="button" aria-label="expand" class={[cls, 'own-expand']} onClick={onClick} />,
            }
        );
        expect(document.querySelectorAll('.own-label')).toHaveLength(10);
        expect(document.querySelectorAll('.own-icon')).toHaveLength(10);
        expect(iconProps[0]).toEqual({
            item: expect.objectContaining({ key: 'yazhou' }),
            level: 0,
            expanded: true,
            isLeaf: false,
            loading: false,
            selected: false,
            checked: false,
            halfChecked: false,
        });
        await click(getNode('亚洲').querySelector('.own-expand'));
        expect(getNodeLabels()).toEqual(['亚洲', '北美洲', '美国', '加拿大']);
        unmount();

        await renderTreeSelect({ defaultExpandAll: true });
        expect(document.querySelector('.own-label, .own-icon, .own-expand')).toBeNull();
        expect(getExpandIcon('亚洲')).not.toBeNull();
        expect(getNode('北京').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-label-text`)).toHaveTextContent('北京');
    });

    it('V17 两个实例共用的 restTagsPopoverProps 不被修改', async () => {
        const popoverProps = Object.freeze({ position: 'top' as const, mouseEnterDelay: 0, mouseLeaveDelay: 0 });
        const props = {
            multiple: true,
            maxTagCount: 1,
            showRestTagsPopover: true,
            restTagsPopoverProps: popoverProps,
            defaultValue: ['Beijing', 'Dongjing'],
            defaultOpen: false,
        };
        const Pair = () => (
            <ConfigProvider locale={en_US}>
                {() => (
                    <>
                        <TreeSelect {...commonProps} {...props} treeData={treeData} />
                        <TreeSelect {...commonProps} {...props} treeData={treeData} />
                    </>
                )}
            </ConfigProvider>
        );
        render(Pair);
        await settle();
        const plus = screen.getAllByText('+1');
        expect(plus).toHaveLength(2);
        await userEvent.hover(plus[1]);
        await waitFor(() => expect(screen.getByText('东京')).toBeInTheDocument());
        expect(popoverProps).toEqual({ position: 'top', mouseEnterDelay: 0, mouseLeaveDelay: 0 });
    });

    it('V18 loadData：resolve 前整体替换 treeData，resolve 后加载态清除且子节点可见', async () => {
        type Host = { data: TreeNodeData[] };
        let host: Host | undefined;
        let finish = () => {};
        const loadData = (node: TreeNodeData) =>
            new Promise<void>((resolve) => {
                finish = () => {
                    if (host) {
                        host.data = host.data.map((item) => (item.key === node.key ? { ...item, children: [{ label: 'Loaded', value: 'loaded', key: 'loaded' }] } : item));
                    }
                    resolve();
                };
            });
        const view = await renderWith<Host>(Stateful, {
            initialData: [{ label: 'Node 1', value: 'node1', key: 'node1' }],
            defaultOpen: true,
            loadData,
        });
        host = view.handle();
        await clickExpandIcon('Node 1');
        expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).not.toBeNull();
        await act(() => finish());
        await waitFor(() => expect(getNode('Node 1').querySelector(`.${BASE_CLASS_PREFIX}-tree-option-spin-icon`)).toBeNull());
        expect(getNodeLabels()).toEqual(['Node 1', 'Loaded']);
        expect(getNode('Node 1')).toHaveAttribute('aria-expanded', 'true');
    });

    it('update:loadedKeys 带加载后的全部 key', async () => {
        const onUpdate = vi.fn<(keys: string[]) => void>();
        await renderTreeSelect({
            treeData: treeDataWithLoad,
            loadData: () => Promise.resolve(),
            loadedKeys: ['other'],
            'onUpdate:loadedKeys': onUpdate,
        });
        await clickExpandIcon('Node 1');
        await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(['other', 'node1']));
    });

    it('模板的 kebab-case 与布尔简写生效', async () => {
        const { handle } = await renderWith<{ value: TreeNodeData[] | undefined }>(Kebab, { data: treeData });
        expect(screen.getByRole('combobox')).toBe(getTriggerInput());
        await click(getNode('北京'));
        expect(getTagTexts()).toEqual(['北京']);
        expect(handle().value).toEqual([expect.objectContaining({ key: 'beijing' })]);
        expect(screen.getByRole('button', { name: locale.clear })).toBeInTheDocument();
    });

    it('单选触发器搜索每次 render 只调用一次 #search，事件处理不调用它', async () => {
        const searchSlot = vi.fn<(inputProps: TreeSelectSearchSlotProps) => VNodeChild>(() => <input class="custom-search" />);
        const { rerender } = await renderTreeSelect({ filterTreeNode: true, searchPosition: 'trigger', defaultOpen: false }, { search: searchSlot });
        searchSlot.mockClear();
        await rerender({ placeholder: 'next' });
        expect(searchSlot).toHaveBeenCalledTimes(1);
        searchSlot.mockClear();
        await fireEvent.mouseDown(getTrigger());
        expect(searchSlot).not.toHaveBeenCalled();
    });

    it('指针展开的行成为键盘当前行', async () => {
        await renderTreeSelect({ treeData: treeDataEn });
        await clickExpandIcon('Asia');
        expect(activeLabel(getTrigger())).toBe('Asia');
        expect(getNode('Asia')).toHaveClass(`${BASE_CLASS_PREFIX}-tree-option-focused`);
        getTrigger().focus();
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('China');
    });

    it('单选时指针选中的行成为键盘当前行', async () => {
        await renderTreeSelect({ clickToHide: false, defaultExpandAll: true, treeData: treeDataEn });
        await click(getNode('Asia'));
        expect(activeLabel(getTrigger())).toBe('Asia');
        getTrigger().focus();
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('China');
    });

    it('指针勾选的行成为键盘当前行', async () => {
        await renderTreeSelect({ multiple: true, defaultExpandAll: true, treeData: treeDataEn });
        await click(getNode('Beijing'));
        expect(activeLabel(getTrigger())).toBe('Beijing');
        getTrigger().focus();
        await keyboard('{ArrowDown}');
        expect(activeLabel(getTrigger())).toBe('Shanghai');
    });

    it('焦点离开触发器与弹层时只触发一次 blur，在二者之间移动不触发', async () => {
        const onBlur = spy<'blur'>();
        const outside = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => outside.remove());
        await renderTreeSelect({ defaultOpen: false, filterTreeNode: true, onBlur });
        await click(getTrigger());
        await act(() => getSearchInput().focus());
        expect(onBlur).not.toHaveBeenCalled();
        await act(() => outside.focus());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        await act(() => getTrigger().focus());
        await act(() => outside.focus());
        expect(onBlur).toHaveBeenCalledTimes(2);
    });

    describe('focus 与 blur 跟随 DOM 焦点', () => {
        const setup = async (props: Record<string, unknown> = {}) => {
            const onFocus = spy<'focus'>();
            const onBlur = spy<'blur'>();
            const outside = document.body.appendChild(document.createElement('button'));
            onTestFinished(() => outside.remove());
            await renderTreeSelect({ defaultOpen: false, treeData: treeDataEn, onFocus, onBlur, ...props });
            return { onFocus, onBlur, outside };
        };

        it('焦点进入再离开时 focus 与 blur 各触发一次', async () => {
            const { onFocus, onBlur, outside } = await setup();
            await act(() => getTrigger().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
            await act(() => outside.focus());
            expect(onBlur).toHaveBeenCalledTimes(1);
            expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
        });

        it('打开下拉、Escape 关闭后离开，focus 与 blur 各触发一次', async () => {
            const { onFocus, onBlur, outside } = await setup();
            await act(() => getTrigger().focus());
            await keyboard('{ArrowDown}');
            expect(getPopover()).not.toBeNull();
            await keyboard('{Escape}');
            await act(() => outside.focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            expect(onBlur).toHaveBeenCalledTimes(1);
        });

        it('焦点从外部进入弹层搜索框时触发 focus，回到触发器不重复', async () => {
            const { onFocus } = await setup({ defaultOpen: true, filterTreeNode: true });
            await act(() => getSearchInput().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
            await act(() => getTrigger().focus());
            expect(onFocus).toHaveBeenCalledTimes(1);
        });

        it('禁用时聚焦不触发 focus 或 blur', async () => {
            const { onFocus, onBlur, outside } = await setup({ disabled: true });
            await act(() => getTrigger().focus());
            await act(() => outside.focus());
            expect(onFocus).not.toHaveBeenCalled();
            expect(onBlur).not.toHaveBeenCalled();
        });
    });

    it('单选节点 label 为 0 时触发器显示 0', async () => {
        const zeroData = [{ label: 0, value: 'zero', key: 'zero' }];
        const { unmount } = await renderTreeSelect({
            treeData: zeroData,
            defaultValue: 'zero',
            defaultOpen: false,
            placeholder: 'pick',
        });
        expect(getSelectionSpan()).toHaveTextContent('0');
        expect(getSelectionSpan()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-placeholder`);
        unmount();

        await renderTreeSelect({
            treeData: zeroData,
            defaultValue: 'zero',
            defaultOpen: false,
            placeholder: 'pick',
            filterTreeNode: true,
            searchPosition: 'trigger',
        });
        const item = getTrigger().querySelector(`.${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem`);
        expect(item).toHaveTextContent('0');
        expect(item).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-selection-TriggerSearchItem-placeholder`);
    });
});
