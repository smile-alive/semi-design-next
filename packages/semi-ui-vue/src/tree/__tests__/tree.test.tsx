/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { IconMapPin } from '@fibrae/semi-icons-vue';
import { mockResizeObserver, render } from '@test/utils/vue';
import Tree, { type TreeDataSimpleJson, type TreeEmits, type TreeProps } from '..';
import ConfigProvider from '../../config-provider';
import AsyncTree from './fixtures/async-tree.vue';
import { collapsedCls, defaultKeyMaps, getExpandIcon, getHighlights, getLevelNodes, getNode, getOptions, getSearchWrapper, getSelected, optionCls, search, selectedCls, specialTreeData, treeData, treeData2 } from './fixtures/data';

const treeData3 = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        newLabel: '亚洲#1#yazhou',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                newLabel: '中国#2#zhongguo',
                children: [
                    { label: '北京', value: 'Beijing', key: '0-0-0', newLabel: '北京#3#beijing' },
                    { label: '上海', value: 'Shanghai', key: '0-0-1', newLabel: '上海#4#shanghai' },
                ],
            },
        ],
    },
    { label: '北美洲', value: 'North America', newLabel: '北美洲#5#beimeizhou', key: '1' },
];

const dragNodeData = {
    label: '亚洲',
    value: 'Yazhou',
    key: 'yazhou',
    children: [
        {
            label: '中国',
            value: 'Zhongguo',
            key: 'zhongguo',
            children: [
                { label: '北京', value: 'Beijing', key: 'beijing' },
                { label: '上海', value: 'Shanghai', key: 'shanghai' },
            ],
        },
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
    expanded: false,
    pos: '0-0',
};
const dropNodeData = {
    label: '北美洲',
    value: 'Beimeizhou',
    key: 'beimeizhou',
    children: [
        { label: '美国', value: 'Meiguo', key: 'meiguo' },
        { label: '加拿大', value: 'Jianada', key: 'jianada' },
    ],
    expanded: false,
    pos: '0-1',
};

type Listeners = { [K in keyof TreeEmits as `on${Capitalize<K & string>}`]?: (...args: TreeEmits[K]) => void };
type Slots = Parameters<typeof render>[1] extends infer O ? (O extends { slots?: infer S } ? S : never) : never;

function renderTree(props: TreeProps & Listeners & Record<string, unknown> = {}, slots?: Slots) {
    const view = render(Tree, { props: { motion: true, treeData, ...props }, slots });
    return {
        container: view.container,
        rerender: (next: Record<string, unknown>) => view.rerender(next),
        unmount: () => view.unmount(),
    };
}

const fn = <K extends keyof TreeEmits>(impl?: (...args: TreeEmits[K]) => unknown) => vi.fn<(...args: TreeEmits[K]) => unknown>(impl);

describe('Tree', () => {
    it('className 和 style', () => {
        const { container } = renderTree({ class: 'test', style: { height: '420px' } });
        const wrapper = container.firstElementChild;
        expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-tree-wrapper`, 'test');
        expect(wrapper).toHaveStyle({ height: '420px' });
    });

    it('blockNode 属性', async () => {
        const { rerender } = renderTree({ defaultValue: 'Beijing' });
        expect(document.querySelector(`.${optionCls}-list-block`)).not.toBeNull();
        await rerender({ blockNode: false });
        expect(document.querySelector(`.${optionCls}-list-block`)).toBeNull();
    });

    it('空数据', () => {
        renderTree({ treeData: [] });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${optionCls}-empty`);
    });

    it('defaultValue 属性', () => {
        const { unmount } = renderTree({ defaultValue: 'Beijing' });
        let selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        unmount();
        renderTree({ defaultValue: ['Riben', 'Beijing'] });
        selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^日本$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
    });

    it('defaultExpandedKeys 属性', () => {
        renderTree({ defaultExpandedKeys: ['zhongguo', 'beimeizhou'] });
        const topNode = getLevelNodes(1);
        expect(topNode[0]).not.toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);
        const children = getLevelNodes(2);
        expect(children[0]).not.toHaveClass(collapsedCls);
        expect(children[1]).toHaveClass(collapsedCls);
    });

    it('defaultExpandAll 属性', async () => {
        const { rerender } = renderTree({ defaultExpandAll: true });
        expect(getOptions()).toHaveLength(10);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);

        await rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(2);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(2);
    });

    it('expandAll 属性', async () => {
        const { rerender } = renderTree({ expandAll: true });
        expect(getOptions()).toHaveLength(10);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);

        await rerender({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(5);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);
    });

    it('目录模式', () => {
        renderTree({ defaultExpandedKeys: ['beimeizhou'], directory: true });
        const topNode = getLevelNodes(1);
        expect(topNode[1].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder_open`)).not.toBeNull();
        expect(topNode[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder`)).not.toBeNull();
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-file`)).not.toBeNull();
    });

    it('自定义图标', () => {
        renderTree({ defaultExpandAll: true }, { icon: () => <IconMapPin /> });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-map_pin`)).toHaveLength(10);
    });

    it('expandedKeys 的值生效', async () => {
        const { rerender } = renderTree({ expandedKeys: ['beimeizhou'] });
        const topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);
        await rerender({ expandedKeys: ['yazhou', 'zhongguo', 'beimeizhou'] });
        const children = getLevelNodes(2);
        expect(children[0]).not.toHaveClass(collapsedCls);
        expect(children[1]).toHaveClass(collapsedCls);
    });

    it('expandedKeys 配合 autoExpandParent', async () => {
        const { rerender } = renderTree({ expandedKeys: ['beimeizhou'] });
        let topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);

        await rerender({ expandedKeys: ['riben'] });
        topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);

        await rerender({ autoExpandParent: true });
        topNode = getLevelNodes(1);
        expect(topNode[0]).not.toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);
    });

    it('展开行为与 onExpand', async () => {
        const onExpand = fn<'expand'>();
        renderTree({ onExpand });
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('受控 expandedKeys 与 onExpand', async () => {
        const onExpand = fn<'expand'>();
        const onUpdate = fn<'update:expandedKeys'>();
        renderTree({ expandedKeys: ['beimeizhou'], onExpand, 'onUpdate:expandedKeys': onUpdate });
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledWith(['beimeizhou', 'yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(onUpdate).toHaveBeenCalledWith(['beimeizhou', 'yazhou']);
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('选择节点、onSelect 与 onChange', async () => {
        const onSelect = fn<'select'>();
        const onChange = fn<'change'>();
        renderTree({ defaultExpandAll: true, onSelect, onChange });
        await userEvent.click(getNode('beijing'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenCalledWith('Beijing');
        expect(getNode('beijing')).toHaveClass(selectedCls);
        expect(getNode('beijing')).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(getNode('yazhou'));
        expect(onSelect).toHaveBeenLastCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(onChange).toHaveBeenLastCalledWith('Yazhou');
        expect(getNode('yazhou')).toHaveClass(selectedCls);
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
    });

    it('onChange 与 changeWithObject', async () => {
        const onChange = fn<'change'>();
        renderTree({ defaultExpandAll: true, changeWithObject: true, onChange });
        await userEvent.click(getNode('beijing'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beijing', value: 'Beijing' }));
    });

    it('filterTreeNode 为 true 时显示输入框', async () => {
        const { rerender } = renderTree({});
        expect(getSearchWrapper()).toBeNull();
        await rerender({ filterTreeNode: true });
        expect(getSearchWrapper()).not.toBeNull();
    });

    it('搜索框的可访问名称来自语言包', () => {
        render(ConfigProvider, {
            props: { locale: en_US },
            slots: { default: () => <Tree filterTreeNode treeData={treeData} /> },
        });
        expect(screen.getByRole('textbox', { name: en_US.Tree.filter })).toHaveAttribute('placeholder', en_US.Tree.searchPlaceholder);
    });

    it('onSearch', async () => {
        const onSearch = fn<'search'>();
        renderTree({ filterTreeNode: true, onSearch });
        await search('semi');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('semi', expect.anything());
        expect(screen.getByRole('textbox')).toHaveValue('semi');
    });

    it('搜索后 aria-activedescendant 指向实时结果中的行', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        await search('东京');
        expect(screen.getAllByRole('treeitem').map((row) => row.textContent)).toContain('东京');
        const activeId = screen.getByRole('tree').getAttribute('aria-activedescendant') ?? '';
        expect(document.getElementById(activeId)).toBe(screen.getAllByRole('treeitem')[0]);
    });

    it('不搜索时点击节点，选中状态在 nextTick 后可见', async () => {
        renderTree({ filterTreeNode: true, defaultExpandAll: true });
        await fireEvent.click(getNode('beijing'));
        expect(getNode('beijing')).toHaveAttribute('aria-selected', 'true');
    });

    it('emptyContent 插槽', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true }, { emptyContent: () => 'diy empty' });
        await search('asd');
        expect(document.querySelector(`.${optionCls}-label-empty`)).toHaveTextContent(/^diy empty$/);
    });

    it('searchClassName、searchPlaceholder 和 searchStyle', () => {
        renderTree({
            filterTreeNode: true,
            searchClassName: 'search',
            searchPlaceholder: 'placeholder',
            searchStyle: { padding: '16px' },
            showClear: true,
        });
        const searchWrapper = getSearchWrapper();
        expect(searchWrapper).toHaveClass('search');
        expect(searchWrapper).toHaveStyle({ padding: '16px' });
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'placeholder');
    });

    it('filterTreeNode 显示正确的结果', async () => {
        const { unmount } = renderTree({ filterTreeNode: true });
        await search('北');
        expect(getOptions()).toHaveLength(6);
        let highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
        unmount();

        renderTree({ filterTreeNode: true, treeNodeFilterProp: 'value' });
        await search('an');
        expect(getOptions()).toHaveLength(10);
        highlights = getHighlights();
        expect(highlights).toHaveLength(0);
    });

    it('filterTreeNode 无结果', async () => {
        const { unmount } = renderTree({ filterTreeNode: true });
        await search('Bei');
        expect(getOptions()).toHaveLength(2);
        expect(getHighlights()).toHaveLength(0);
        unmount();

        renderTree({ filterTreeNode: true, treeNodeFilterProp: 'value' });
        await search('北京');
        expect(getOptions()).toHaveLength(2);
    });

    it('filterTreeNode 配合 treeNodeFilterProp 时高亮正确', async () => {
        renderTree({ treeData: treeData3, filterTreeNode: true, treeNodeFilterProp: 'newLabel' });
        await search('中');
        expect(getOptions()).toHaveLength(3);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(1);
        expect(highlights[0]).toHaveTextContent(/^中$/);
    });

    it('filterTreeNode 配合 showFilteredOnly 无结果', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        await search('Bei');
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${optionCls}-empty`);
    });

    it('filterTreeNode 配合 showFilteredOnly 显示正确的结果', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        await search('北');
        expect(getOptions()).toHaveLength(4);
        expect(getHighlights()).toHaveLength(2);
    });

    it('filterTreeNode 配合 showFilteredOnly 时只对可见的后代播放动画', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        await search('北');
        await userEvent.click(getExpandIcon(getNode('zhongguo')));

        // "上海" is hidden by the active filter; animating it would put the transition wrapper at the wrong position
        const motionWrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-collapsible-wrapper`);
        expect(motionWrapper).not.toBeNull();
        expect(getNode('zhongguo').nextElementSibling).toBe(motionWrapper);
        const animated = motionWrapper?.querySelectorAll('[role="treeitem"]') ?? [];
        expect(Array.from(animated, (node) => node.getAttribute('data-key'))).toEqual(['beijing']);
        expect(getNode('shanghai')).toBeNull();
    });

    it('filterTreeNode 为函数', async () => {
        renderTree({ filterTreeNode: (inputValue, treeNode) => treeNode === inputValue });
        await search('北');
        expect(getHighlights()).toHaveLength(0);
        await search('北京');
        const highlights = getHighlights();
        expect(highlights).toHaveLength(1);
        expect(highlights[0]).toHaveTextContent(/^北京$/);
    });

    it('受控：value 显示正确', () => {
        const { unmount } = renderTree({ modelValue: 'Beijing' });
        let selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        unmount();
        renderTree({ modelValue: ['Riben', 'Beijing'] });
        selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^日本$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const onChange = fn<'change'>();
        renderTree({ modelValue: '', defaultExpandAll: true, onChange });
        expect(getSelected()).toHaveLength(0);
        await userEvent.click(getNode('beijing'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('Beijing');
        expect(getSelected()).toHaveLength(0);
    });

    it('受控：value 配合 changeWithObject', () => {
        renderTree({
            modelValue: { label: '北京', value: 'Beijing', key: 'beijing' },
            defaultExpandAll: true,
            changeWithObject: true,
        });
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toBe(getNode('beijing'));
    });

    it('虚拟化：固定高度', () => {
        renderTree({ defaultExpandAll: true, virtualize: { itemSize: 28, height: 84 } });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
        expect(getOptions().length).toBeLessThan(10);
    });

    it('disabled 属性', async () => {
        const onChange = fn<'change'>();
        renderTree({ defaultExpandAll: true, disabled: true, onChange });
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(10);
        await userEvent.click(getNode('beijing'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getSelected()).toHaveLength(0);
    });

    it('JSON 格式的 treeData', async () => {
        const onChange = fn<'change'>();
        render(Tree, {
            props: {
                defaultExpandAll: true,
                treeDataSimpleJson: { Node1: { Child1: '0-0-1', Child2: '0-0-2' }, Node2: '0-1' },
                onChange,
            },
        });
        expect(getOptions()).toHaveLength(4);
        await userEvent.click(getLevelNodes(2)[0]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ Node1: { Child1: '0-0-1' } });
        expect(getSelected()).toHaveLength(1);
        expect(getSelected()[0]).toHaveTextContent(/^Child1$/);
    });

    it('onContextMenu', async () => {
        const onContextMenu = fn<'contextMenu'>((event) => event.type);
        renderTree({ onContextMenu });
        await fireEvent.contextMenu(getNode('yazhou'));
        expect(onContextMenu).toHaveBeenCalledTimes(1);
        expect(onContextMenu).toHaveReturnedWith('contextmenu');
        expect(onContextMenu).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(selectedCls);
        expect(getSelected()).toHaveLength(0);
    });

    it('onDoubleClick', async () => {
        const onDoubleClick = fn<'doubleClick'>((event) => event.type);
        renderTree({ onDoubleClick });
        await fireEvent.dblClick(getNode('yazhou'));
        expect(onDoubleClick).toHaveBeenCalledTimes(1);
        expect(onDoubleClick).toHaveReturnedWith('dblclick');
        expect(onDoubleClick).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(selectedCls);
        expect(getSelected()).toHaveLength(0);
    });

    it('treeDataSimpleJson 更新时的 expandedKeys', async () => {
        const treeJsonData1: TreeDataSimpleJson = {
            Node0: { 'Child Node0-0': '0-0', 'Child Node0-1': '0-1' },
            Node1: { 'Child Node1-0': '1-0', 'Child Node1-1': '1-1' },
        };
        const treeJsonData2: TreeDataSimpleJson = {
            'Updated Node0': {
                'Updated Child Node0-0': { 'Updated Child Node0-0-0': '0-0' },
                'Updated Child Node0-1': '0-1',
            },
            'Updated Node1': { 'Updated Child Node1-0': '1-0', 'Updated Child Node1-1': '1-1' },
        };
        const { rerender } = renderTree({
            treeData: undefined,
            motion: false,
            multiple: true,
            modelValue: '0-0',
            treeDataSimpleJson: treeJsonData1,
        });
        expect(getLevelNodes(1)[0]).not.toHaveClass(collapsedCls);
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Child Node0-0$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
        expect(getLevelNodes(1)[1]).toHaveClass(collapsedCls);
        await rerender({ treeDataSimpleJson: treeJsonData2 });
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Updated Child Node0-0$/);
        expect(getLevelNodes(2)[0]).not.toHaveClass(collapsedCls);
        expect(getLevelNodes(3)[0]).toHaveTextContent(/^Updated Child Node0-0-0$/);
        await rerender({ treeDataSimpleJson: treeJsonData1 });
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Child Node0-0$/);
    });

    it('expandAction 为 false 与默认行为', async () => {
        const onExpand = fn<'expand'>();
        renderTree({ onExpand });
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).not.toHaveBeenCalled();
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(0);
        expect(getOptions()).toHaveLength(2);
    });

    it('expandAction 为 click', async () => {
        const onExpand = fn<'expand'>();
        renderTree({ onExpand, expandAction: 'click' });
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('expandAction 为 doubleClick', async () => {
        const onExpand = fn<'expand'>();
        renderTree({ onExpand, expandAction: 'doubleClick' });
        await userEvent.click(getNode('yazhou'));
        expect(onExpand).not.toHaveBeenCalled();
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
        await fireEvent.dblClick(getNode('yazhou'));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toBe(getNode('yazhou'));
    });

    it('异步加载数据', async () => {
        const then = vi.fn<() => Promise<void>>(() => Promise.resolve());
        // a thenable: loadData's result must be treated by the Promise protocol
        const loadData = vi.fn<() => { then: typeof then }>(() => ({ then }));
        const data = { label: '亚洲', value: 'Asia', key: 'asia' };
        renderTree({ loadData: loadData as unknown as TreeProps['loadData'], treeData: [data] });
        await userEvent.click(getExpandIcon(getNode('asia')));
        expect(loadData).toHaveBeenCalledWith(data);
        expect(then).toHaveBeenCalled();
    });

    it('DND：dragStart 事件', async () => {
        const onDragStart = fn<'dragStart'>();
        renderTree({ draggable: true, onDragStart });
        await fireEvent.dragStart(getNode('yazhou'));
        expect(onDragStart).toHaveBeenCalledTimes(1);
        expect(onDragStart).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
    });

    it('DND：dragEnter 事件', async () => {
        const onDragEnter = fn<'dragEnter'>();
        renderTree({ draggable: true, onDragEnter });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('yazhou'));
        expect(onDragEnter).not.toHaveBeenCalled();

        await fireEvent.dragEnter(getNode('beimeizhou'));
        await waitFor(() => expect(onDragEnter).toHaveBeenCalledTimes(1));
        expect(onDragEnter).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData, expandedKeys: ['beimeizhou'] }));
        await nextTick();
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
    });

    it('DND：dragOver 事件', async () => {
        const onDragOver = fn<'dragOver'>();
        renderTree({ draggable: true, onDragOver });
        await fireEvent.dragOver(getNode('beimeizhou'));
        expect(onDragOver).toHaveBeenCalledTimes(1);
        expect(onDragOver).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
    });

    it('DND：dragLeave 事件', async () => {
        const onDragLeave = fn<'dragLeave'>();
        renderTree({ draggable: true, onDragLeave });
        await fireEvent.dragLeave(getNode('beimeizhou'));
        expect(onDragLeave).toHaveBeenCalledTimes(1);
        expect(onDragLeave).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
    });

    it('DND：drop 事件', async () => {
        const onDrop = fn<'drop'>();
        renderTree({ draggable: true, onDrop });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                node: dropNodeData,
                dragNode: dragNodeData,
                dragNodesKeys: ['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban'],
                dropPosition: 1,
            })
        );
    });

    it('DND：dragEnter 后 400ms 内 drop，目标节点不被自动展开，onDragEnter 也不再触发', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onDragEnter = fn<'dragEnter'>();
        renderTree({ draggable: true, onDragEnter, onDrop: fn<'drop'>() });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('beimeizhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        vi.advanceTimersByTime(400);
        await nextTick();
        expect(onDragEnter).not.toHaveBeenCalled();
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        vi.useRealTimers();
    });

    it('DND：dragEnd 事件', async () => {
        const onDragEnd = fn<'dragEnd'>();
        renderTree({ draggable: true, onDragEnd });
        await fireEvent.dragEnd(getNode('yazhou'));
        expect(onDragEnd).toHaveBeenCalledTimes(1);
        expect(onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
    });

    it('keyMaps 属性', async () => {
        const onChange = fn<'change'>();
        renderTree({
            treeData: specialTreeData,
            defaultValue: 'Beijing',
            onChange,
            defaultExpandAll: true,
            motion: false,
            keyMaps: defaultKeyMaps,
        });
        const disabledNode = document.querySelector(`.${optionCls}-disabled`);
        expect(disabledNode?.querySelector(`.${optionCls}-label-text`)).toHaveTextContent(/^中国$/);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        await userEvent.click(getNode('shanghai'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('Shanghai');
    });

    it('keyMaps 配合 changeWithObject', async () => {
        const onChange = fn<'change'>();
        renderTree({
            treeData: specialTreeData,
            defaultValue: { label1: '北京', value1: 'Beijing', key1: 'beijing' },
            changeWithObject: true,
            onChange,
            defaultExpandAll: true,
            keyMaps: defaultKeyMaps,
        });
        const disabledNode = document.querySelector(`.${optionCls}-disabled`);
        expect(disabledNode?.querySelector(`.${optionCls}-label-text`)).toHaveTextContent(/^中国$/);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        await userEvent.click(getNode('shanghai'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ label1: '上海', value1: 'Shanghai', key1: 'shanghai' }));
    });

    it('修复 #1124：受控 value 时，由 loadData 展开的节点保持展开', async () => {
        render(AsyncTree, { props: { initialValue: ['1'] } });
        await userEvent.click(getExpandIcon(getNode('0')));
        await waitFor(() => expect(getNode('0-0')).not.toBeNull());
        expect(getNode('0')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('0-1')).not.toBeNull();
    });

    it("修复 #1852：checkRelation='unRelated' 时，loadData 后保留已勾选的节点", async () => {
        const isChecked = (key: string) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
        render(AsyncTree, { attrs: { defaultValue: ['0'], checkRelation: 'unRelated' } });
        expect(isChecked('0')).toBe(true);
        await userEvent.click(getExpandIcon(getNode('0')));
        await waitFor(() => expect(getNode('0-0')).not.toBeNull());
        expect(isChecked('0')).toBe(true);
        expect(isChecked('0-0')).toBe(false);
    });
});

describe('非数字高度的 Tree virtualize', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('从父元素获取列表尺寸', async () => {
        const observer = mockResizeObserver();
        renderTree({ defaultExpandAll: true, virtualize: { itemSize: 28, height: '100%' } });
        await nextTick();
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-auto-wrapper`) as HTMLElement;
        const parent = wrapper.parentElement as HTMLElement;
        expect(observer.observed()).toContain(parent);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).toBeNull();

        Object.defineProperty(parent, 'offsetHeight', { configurable: true, value: 84 });
        await observer.fire(parent, [{ target: parent }]);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
    });
});

describe('Tree 拖拽事件类型', () => {
    it('拖拽事件载荷的 event 是 DragEvent', () => {
        expectTypeOf<TreeEmits['dragStart'][0]['event']>().toEqualTypeOf<DragEvent>();
        expectTypeOf<TreeEmits['drop'][0]['event']>().toEqualTypeOf<DragEvent>();
    });
});
