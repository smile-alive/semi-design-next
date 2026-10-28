import { useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import type { TreeDataSimpleJson } from '@fibrae/semi-foundation/tree/tree-util';
import { IconMapPin } from '@fibrae/semi-icons-react';
import { Tree, Button } from '@fibrae/semi-ui-react';
import type { DragProps, OnDragProps, TreeProps } from '../interface';

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
        newLabel: '亚洲#1#yazhou',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                newLabel: '中国#2#zhongguo',
                children: [
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: '0-0-0',
                        newLabel: '北京#3#beijing',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: '0-0-1',
                        newLabel: '上海#4#shanghai',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        newLabel: '北美洲#5#beimeizhou',
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

const defaultKeyMaps = {
    value: 'value1',
    key: 'key1',
    label: 'label1',
    children: 'children1',
    disabled: 'disabled1',
};

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

const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
const collapsedCls = `${optionCls}-collapsed`;
const selectedCls = `${optionCls}-selected`;

function renderTree(props) {
    return render(<Tree motion treeData={treeData} {...props} />);
}

const getOptions = () => document.querySelectorAll(`.${optionCls}`);
const getLevelNodes = (level) => document.querySelectorAll(`.${optionCls}.${optionCls}-level-${level}`);
const getNode = (key) => document.querySelector(`[role="treeitem"][data-key="${key}"]`);
const getHighlights = () => document.querySelectorAll(`.${optionCls}-highlight`);
const getExpandIcon = (node) => node.querySelector(`.${optionCls}-expand-icon`);
const getSelected = () => document.querySelectorAll(`.${selectedCls}`);
const getSearchWrapper = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`);
const search = (value) => fireEvent.change(screen.getByRole('textbox'), { target: { value } });

const asyncTreeData = [
    { label: 'Expand to load0', value: '0', key: '0' },
    { label: 'Expand to load1', value: '1', key: '1' },
    { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
];

// Appends two children to the expanded node, the way the docs' loadData demo does
function AsyncTree(props) {
    const [data, setData] = useState(asyncTreeData);
    const loadData = ({ key, children }) => {
        if (!children) {
            setData((origin) =>
                origin.map((node) =>
                    node.key === key
                        ? {
                              ...node,
                              children: [0, 1].map((i) => ({
                                  label: `Child Node${key}-${i}`,
                                  value: `${key}-${i}`,
                                  key: `${key}-${i}`,
                              })),
                          }
                        : node
                )
            );
        }
        return Promise.resolve();
    };
    return <Tree multiple loadData={loadData} motion={false} treeData={data} {...props} />;
}

describe('Tree', () => {
    it('className 和 style', () => {
        const { container } = renderTree({
            className: 'test',
            style: { height: 420 },
        });
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-tree-wrapper`, 'test');
        expect(wrapper).toHaveStyle({ height: '420px' });
    });

    it('blockNode 属性', () => {
        const { rerender } = renderTree({
            defaultValue: 'Beijing',
        });
        expect(document.querySelector(`.${optionCls}-list-block`)).not.toBeNull();
        rerender(<Tree defaultValue="Beijing" blockNode={false} motion treeData={treeData} />);
        expect(document.querySelector(`.${optionCls}-list-block`)).toBeNull();
    });

    it('空数据', () => {
        renderTree({
            treeData: [],
        });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${optionCls}-empty`);
    });

    it('defaultValue 属性', () => {
        const { unmount } = renderTree({
            defaultValue: 'Beijing',
        });
        let selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        unmount();
        renderTree({
            defaultValue: ['Riben', 'Beijing'],
        });
        selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^日本$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
    });

    it('defaultExpandedKeys 属性', () => {
        renderTree({
            defaultExpandedKeys: ['zhongguo', 'beimeizhou'],
        });
        const topNode = getLevelNodes(1);
        expect(topNode[0]).not.toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);
        const children = getLevelNodes(2);
        expect(children[0]).not.toHaveClass(collapsedCls);
        expect(children[1]).toHaveClass(collapsedCls);
    });

    it('defaultExpandAll 属性', () => {
        const { rerender } = renderTree({
            defaultExpandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);

        rerender(<Tree defaultExpandAll motion treeData={treeData2} />);
        expect(getOptions()).toHaveLength(2);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(2);
    });

    it('expandAll 属性', () => {
        const { rerender } = renderTree({
            expandAll: true,
        });
        expect(getOptions()).toHaveLength(10);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);

        rerender(<Tree expandAll motion treeData={treeData2} />);
        expect(getOptions()).toHaveLength(5);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);
    });

    it('目录模式', () => {
        renderTree({
            defaultExpandedKeys: ['beimeizhou'],
            directory: true,
        });
        const topNode = getLevelNodes(1);
        expect(topNode[1].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder_open`)).not.toBeNull();
        expect(topNode[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder`)).not.toBeNull();
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-file`)).not.toBeNull();
    });

    it('自定义图标', () => {
        renderTree({
            defaultExpandAll: true,
            icon: <IconMapPin />,
        });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-map_pin`)).toHaveLength(10);
    });

    it('expandedKeys 的值生效', () => {
        const { rerender } = renderTree({
            expandedKeys: ['beimeizhou'],
        });
        const topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);
        rerender(<Tree expandedKeys={['yazhou', 'zhongguo', 'beimeizhou']} motion treeData={treeData} />);
        const children = getLevelNodes(2);
        expect(children[0]).not.toHaveClass(collapsedCls);
        expect(children[1]).toHaveClass(collapsedCls);
    });

    it('expandedKeys 配合 autoExpandParent', () => {
        const { rerender } = renderTree({
            expandedKeys: ['beimeizhou'],
        });
        let topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);

        rerender(<Tree expandedKeys={['riben']} motion treeData={treeData} />);
        topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);

        rerender(<Tree autoExpandParent expandedKeys={['riben']} motion treeData={treeData} />);
        topNode = getLevelNodes(1);
        expect(topNode[0]).not.toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);
    });

    it('展开行为与 onExpand', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            onExpand: spyOnExpand,
        });
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(spyOnExpand).toHaveBeenCalledTimes(1);
        expect(spyOnExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(spyOnExpand).toHaveBeenCalledTimes(2);
        expect(spyOnExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('受控 expandedKeys 与 onExpand', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            expandedKeys: ['beimeizhou'],
            onExpand: spyOnExpand,
        });
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(spyOnExpand).toHaveBeenCalledWith(['beimeizhou', 'yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('选择节点、onSelect 与 onChange', async () => {
        const spyOnSelect = vi.fn<NonNullable<TreeProps['onSelect']>>();
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onSelect: spyOnSelect,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('beijing'));
        expect(spyOnSelect).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(spyOnChange).toHaveBeenCalledWith('Beijing');
        expect(getNode('beijing')).toHaveClass(selectedCls);
        expect(getNode('beijing')).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(getNode('yazhou'));
        expect(spyOnSelect).toHaveBeenLastCalledWith('yazhou', true, expect.objectContaining({ key: 'yazhou' }));
        expect(spyOnChange).toHaveBeenLastCalledWith('Yazhou');
        expect(getNode('yazhou')).toHaveClass(selectedCls);
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
    });

    it('onChange 与 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            onChangeWithObject: true,
            onChange: spyOnChange,
        });
        await userEvent.click(getNode('beijing'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beijing', value: 'Beijing' }));
    });

    it('filterTreeNode 为 true 时显示输入框', () => {
        const { rerender } = renderTree({});
        expect(getSearchWrapper()).toBeNull();
        rerender(<Tree filterTreeNode motion treeData={treeData} />);
        expect(getSearchWrapper()).not.toBeNull();
        expect(screen.getByRole('textbox', { name: zh_CN.Tree.filter })).toBeInTheDocument();
    });

    it('onSearch', () => {
        const spyOnSearch = vi.fn<NonNullable<TreeProps['onSearch']>>();
        renderTree({
            filterTreeNode: true,
            onSearch: spyOnSearch,
        });
        search('semi');
        expect(spyOnSearch).toHaveBeenCalledTimes(1);
        expect(spyOnSearch).toHaveBeenCalledWith('semi', expect.anything());
        expect(screen.getByRole('textbox')).toHaveValue('semi');
    });

    it('搜索结果延后渲染，aria-activedescendant 指向已渲染的行', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        search('东京');
        expect(screen.getByRole('textbox')).toHaveValue('东京');
        await waitFor(() => expect(screen.getAllByRole('treeitem').map((row) => row.textContent)).toContain('东京'));
        const activeId = screen.getByRole('tree').getAttribute('aria-activedescendant');
        expect(document.getElementById(activeId)).toBe(screen.getAllByRole('treeitem')[0]);
    });

    it('不搜索时点击节点，选中状态在同一次 act 后立即可见', () => {
        renderTree({ filterTreeNode: true, defaultExpandAll: true });
        fireEvent.click(getNode('beijing'));
        expect(getNode('beijing')).toHaveAttribute('aria-selected', 'true');
    });

    it('emptyContent 属性', () => {
        renderTree({
            filterTreeNode: true,
            emptyContent: 'diy empty',
            showFilteredOnly: true,
        });
        search('asd');
        expect(document.querySelector(`.${optionCls}-label-empty`)).toHaveTextContent(/^diy empty$/);
    });

    it('searchClassName、searchPlaceholder 和 searchStyle', () => {
        renderTree({
            filterTreeNode: true,
            searchClassName: 'search',
            searchPlaceholder: 'placeholder',
            searchStyle: { padding: 16 },
            showClear: true,
        });
        const searchWrapper = getSearchWrapper();
        expect(searchWrapper).toHaveClass('search');
        expect(searchWrapper).toHaveStyle({ padding: '16px' });
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'placeholder');
    });

    it('filterTreeNode 显示正确的结果', () => {
        const { unmount } = renderTree({
            filterTreeNode: true,
        });
        search('北');
        expect(getOptions()).toHaveLength(6);
        let highlights = getHighlights();
        expect(highlights).toHaveLength(2);
        expect(highlights[0]).toHaveTextContent(/^北$/);
        expect(highlights[1]).toHaveTextContent(/^北$/);
        unmount();

        renderTree({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
        });
        search('an');
        expect(getOptions()).toHaveLength(10);
    });

    it('filterTreeNode 无结果', () => {
        const { unmount } = renderTree({
            filterTreeNode: true,
        });
        search('Bei');
        expect(getOptions()).toHaveLength(2);
        expect(getHighlights()).toHaveLength(0);
        unmount();

        renderTree({
            filterTreeNode: true,
            treeNodeFilterProp: 'value',
        });
        search('北京');
        expect(getOptions()).toHaveLength(2);
    });

    it('filterTreeNode 配合 treeNodeFilterProp 时高亮正确', () => {
        renderTree({
            treeData: treeData3,
            filterTreeNode: true,
            treeNodeFilterProp: 'newLabel',
        });
        search('中');
        expect(getOptions()).toHaveLength(3);
        const highlights = getHighlights();
        expect(highlights).toHaveLength(1);
        expect(highlights[0]).toHaveTextContent(/^中$/);
    });

    it('filterTreeNode 配合 showFilteredOnly 无结果', () => {
        renderTree({
            filterTreeNode: true,
            showFilteredOnly: true,
        });
        search('Bei');
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${optionCls}-empty`);
    });

    it('filterTreeNode 配合 showFilteredOnly 显示正确的结果', () => {
        renderTree({
            filterTreeNode: true,
            showFilteredOnly: true,
        });
        search('北');
        expect(getOptions()).toHaveLength(4);
        expect(getHighlights()).toHaveLength(2);
    });

    it('filterTreeNode 配合 showFilteredOnly 时只对可见的后代播放动画', async () => {
        renderTree({
            filterTreeNode: true,
            showFilteredOnly: true,
        });
        search('北');
        await userEvent.click(getExpandIcon(getNode('zhongguo')));

        // the filtered-out descendant must stay out of the animation, or the wrapper lands at the wrong position
        const motionWrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-collapsible-wrapper`);
        expect(motionWrapper).not.toBeNull();
        expect(getNode('zhongguo').nextElementSibling).toBe(motionWrapper);
        const animated = motionWrapper.querySelectorAll('[role="treeitem"]');
        expect(Array.from(animated, (node) => node.getAttribute('data-key'))).toEqual(['beijing']);
        expect(getNode('shanghai')).toBeNull();
    });

    it('filterTreeNode 为函数', () => {
        renderTree({
            filterTreeNode: (inputValue, treeNode) => treeNode === inputValue,
        });
        search('北');
        expect(getHighlights()).toHaveLength(0);
        search('北京');
        const highlights = getHighlights();
        expect(highlights).toHaveLength(1);
        expect(highlights[0]).toHaveTextContent(/^北京$/);
    });

    it('受控：value 显示正确', () => {
        const { unmount } = renderTree({
            value: 'Beijing',
        });
        let selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        unmount();
        renderTree({
            value: ['Riben', 'Beijing'],
        });
        selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^日本$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
    });

    it('受控：触发 onChange 但界面不更新', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            value: '',
            defaultExpandAll: true,
            onChange: spyOnChange,
        });
        expect(getSelected()).toHaveLength(0);
        await userEvent.click(getNode('beijing'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith('Beijing');
        expect(getSelected()).toHaveLength(0);
    });

    it('受控：value 配合 onChangeWithObject', () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            value: {
                label: '北京',
                value: 'Beijing',
                key: 'beijing',
            },
            defaultExpandAll: true,
            onChange: spyOnChange,
            onChangeWithObject: true,
        });
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toBe(getNode('beijing'));
    });

    it('虚拟化：固定高度', () => {
        renderTree({
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
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            defaultExpandAll: true,
            disabled: true,
            onChange: spyOnChange,
        });
        expect(document.querySelectorAll(`.${optionCls}-disabled`)).toHaveLength(10);
        await userEvent.click(getNode('beijing'));
        expect(spyOnChange).not.toHaveBeenCalled();
        expect(getSelected()).toHaveLength(0);
    });

    it('JSON 格式的 treeData', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        render(
            <Tree
                defaultExpandAll
                treeDataSimpleJson={{
                    Node1: {
                        Child1: '0-0-1',
                        Child2: '0-0-2',
                    },
                    Node2: '0-1',
                }}
                onChange={spyOnChange}
            />
        );
        expect(getOptions()).toHaveLength(4);
        await userEvent.click(getLevelNodes(2)[0]);
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith({
            Node1: {
                Child1: '0-0-1',
            },
        });
        expect(getSelected()).toHaveLength(1);
        expect(getSelected()[0]).toHaveTextContent(/^Child1$/);
    });

    it('onContextMenu', () => {
        const spyOnContextMenu = vi.fn<NonNullable<TreeProps['onContextMenu']>>((e) => e.type);
        renderTree({
            onContextMenu: spyOnContextMenu,
        });
        fireEvent.contextMenu(getNode('yazhou'));
        expect(spyOnContextMenu).toHaveBeenCalledTimes(1);
        expect(spyOnContextMenu).toHaveReturnedWith('contextmenu');
        expect(spyOnContextMenu).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(selectedCls);
        expect(getSelected()).toHaveLength(0);
    });

    it('onDoubleClick', () => {
        const spyOnDoubleClick = vi.fn<NonNullable<TreeProps['onDoubleClick']>>((e) => e.type);
        renderTree({
            onDoubleClick: spyOnDoubleClick,
        });
        fireEvent.doubleClick(getNode('yazhou'));
        expect(spyOnDoubleClick).toHaveBeenCalledTimes(1);
        expect(spyOnDoubleClick).toHaveReturnedWith('dblclick');
        expect(spyOnDoubleClick).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ key: 'yazhou' }));
        expect(getNode('yazhou')).not.toHaveClass(selectedCls);
        expect(getSelected()).toHaveLength(0);
    });

    /**
     * Expansion follows value or treeData changes while expandedKeys is uncontrolled
     */
    const treeJsonData1 = {
        Node0: {
            'Child Node0-0': '0-0',
            'Child Node0-1': '0-1',
        },
        Node1: {
            'Child Node1-0': '1-0',
            'Child Node1-1': '1-1',
        },
    };
    const treeJsonData2 = {
        'Updated Node0': {
            'Updated Child Node0-0': {
                'Updated Child Node0-0-0': '0-0',
            },
            'Updated Child Node0-1': '0-1',
        },
        'Updated Node1': {
            'Updated Child Node1-0': '1-0',
            'Updated Child Node1-1': '1-1',
        },
    };

    it('treeDataSimpleJson 更新时的 expandedKeys', async () => {
        function Demo() {
            const [json, setJson] = useState<TreeDataSimpleJson>(treeJsonData1);
            return (
                <>
                    <Tree multiple value="0-0" treeDataSimpleJson={json} />
                    <Button onClick={() => setJson(json === treeJsonData1 ? treeJsonData2 : treeJsonData1)}>update treeData</Button>
                </>
            );
        }
        render(<Demo />);
        expect(getLevelNodes(1)[0]).not.toHaveClass(collapsedCls);
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Child Node0-0$/);
        expect(getLevelNodes(2)[0]).toHaveClass(collapsedCls);
        expect(getLevelNodes(1)[1]).toHaveClass(collapsedCls);
        await userEvent.click(screen.getByRole('button', { name: 'update treeData' }));
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Updated Child Node0-0$/);
        expect(getLevelNodes(2)[0]).not.toHaveClass(collapsedCls);
        expect(getLevelNodes(3)[0]).toHaveTextContent(/^Updated Child Node0-0-0$/);
        await userEvent.click(screen.getByRole('button', { name: 'update treeData' }));
        expect(getLevelNodes(2)[0]).toHaveTextContent(/^Child Node0-0$/);
    });

    it('expandAction 为 false 与默认行为', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            onExpand: spyOnExpand,
        });
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).not.toHaveBeenCalled();
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
        expect(document.querySelectorAll('[role="treeitem"][aria-expanded="true"]')).toHaveLength(0);
        expect(getOptions()).toHaveLength(2);
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
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('expandAction 为 doubleClick', async () => {
        const spyOnExpand = vi.fn<NonNullable<TreeProps['onExpand']>>();
        renderTree({
            onExpand: spyOnExpand,
            expandAction: 'doubleClick',
        });
        await userEvent.click(getNode('yazhou'));
        expect(spyOnExpand).not.toHaveBeenCalled();
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
        fireEvent.doubleClick(getNode('yazhou'));
        expect(spyOnExpand).toHaveBeenCalledTimes(1);
        expect(spyOnExpand).toHaveBeenCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toBe(getNode('yazhou'));
    });

    it('异步加载数据', async () => {
        const then = vi.fn<() => Promise<void>>(() => Promise.resolve());
        // Deliberately returns a thenable: the component must treat loadData's result by the Promise protocol
        const loadData = vi.fn<() => { then: typeof then }>(() => ({ then }));
        const data = {
            label: '亚洲',
            value: 'Asia',
            key: 'asia',
        };
        renderTree({
            loadData,
            treeData: [data],
        });
        await userEvent.click(getExpandIcon(getNode('asia')));
        expect(loadData).toHaveBeenCalledWith(data);
        expect(then).toHaveBeenCalled();
    });

    it('DND：dragStart 事件', () => {
        const spyOnDragStart = vi.fn<NonNullable<TreeProps['onDragStart']>>();
        renderTree({
            draggable: true,
            onDragStart: spyOnDragStart,
        });
        fireEvent.dragStart(getNode('yazhou'));
        expect(spyOnDragStart).toHaveBeenCalledTimes(1);
        expect(spyOnDragStart).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
    });

    it('DND：dragEnter 事件', async () => {
        const spyOnDragEnter = vi.fn<NonNullable<TreeProps['onDragEnter']>>();
        renderTree({
            draggable: true,
            onDragEnter: spyOnDragEnter,
        });
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('yazhou'));
        expect(spyOnDragEnter).not.toHaveBeenCalled();

        fireEvent.dragEnter(getNode('beimeizhou'));
        // the drop target is auto expanded after a delay, then onDragEnter fires
        await waitFor(() => expect(spyOnDragEnter).toHaveBeenCalledTimes(1));
        expect(spyOnDragEnter).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData, expandedKeys: ['beimeizhou'] }));
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
    });

    it('DND：dragOver 事件', () => {
        const spyOnDragOver = vi.fn<NonNullable<TreeProps['onDragOver']>>();
        renderTree({
            draggable: true,
            onDragOver: spyOnDragOver,
        });
        fireEvent.dragOver(getNode('beimeizhou'));
        expect(spyOnDragOver).toHaveBeenCalledTimes(1);
        expect(spyOnDragOver).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
    });

    it('DND：dragLeave 事件', () => {
        const spyOnDragLeave = vi.fn<NonNullable<TreeProps['onDragLeave']>>();
        renderTree({
            draggable: true,
            onDragLeave: spyOnDragLeave,
        });
        fireEvent.dragLeave(getNode('beimeizhou'));
        expect(spyOnDragLeave).toHaveBeenCalledTimes(1);
        expect(spyOnDragLeave).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
    });

    it('DND：drop 事件', () => {
        const spyOnDrop = vi.fn<NonNullable<TreeProps['onDrop']>>();
        renderTree({
            draggable: true,
            onDrop: spyOnDrop,
        });
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.drop(getNode('beimeizhou'));
        expect(spyOnDrop).toHaveBeenCalledTimes(1);
        expect(spyOnDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                node: dropNodeData,
                dragNode: dragNodeData,
                dragNodesKeys: ['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban'],
                dropPosition: 1,
            })
        );
    });

    it('DND：dragEnter 后 400ms 内 drop，目标节点不被自动展开，onDragEnter 也不再触发', () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const onDragEnter = vi.fn<NonNullable<TreeProps['onDragEnter']>>();
        renderTree({ draggable: true, onDragEnter, onDrop: vi.fn<NonNullable<TreeProps['onDrop']>>() });
        fireEvent.dragStart(getNode('yazhou'));
        fireEvent.dragEnter(getNode('beimeizhou'));
        fireEvent.drop(getNode('beimeizhou'));
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(onDragEnter).not.toHaveBeenCalled();
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        vi.useRealTimers();
    });

    it('DND：dragEnd 事件', () => {
        const spyOnDragEnd = vi.fn<NonNullable<TreeProps['onDragEnd']>>();
        renderTree({
            draggable: true,
            onDragEnd: spyOnDragEnd,
        });
        fireEvent.dragEnd(getNode('yazhou'));
        expect(spyOnDragEnd).toHaveBeenCalledTimes(1);
        expect(spyOnDragEnd).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
    });

    it('keyMaps 属性', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
            treeData: specialTreeData,
            defaultValue: 'Beijing',
            onChange: spyOnChange,
            defaultExpandAll: true,
            motion: false,
            keyMaps: defaultKeyMaps,
        });
        const disabledNode = document.querySelector(`.${optionCls}-disabled`);
        expect(disabledNode.querySelector(`.${optionCls}-label-text`)).toHaveTextContent(/^中国$/);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        await userEvent.click(getNode('shanghai'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith('Shanghai');
    });

    it('keyMaps 配合 onChangeWithObject', async () => {
        const spyOnChange = vi.fn<NonNullable<TreeProps['onChange']>>();
        renderTree({
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
        const disabledNode = document.querySelector(`.${optionCls}-disabled`);
        expect(disabledNode.querySelector(`.${optionCls}-label-text`)).toHaveTextContent(/^中国$/);
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
        await userEvent.click(getNode('shanghai'));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(spyOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
                label1: '上海',
                value1: 'Shanghai',
                key1: 'shanghai',
            })
        );
    });

    it('修复 #1124：受控 value 时，由 loadData 展开的节点保持展开', async () => {
        function Demo() {
            const [value, setValue] = useState(['1']);
            return <AsyncTree value={value} onChange={setValue} />;
        }
        render(<Demo />);
        await userEvent.click(getExpandIcon(getNode('0')));
        await waitFor(() => expect(getNode('0-0')).not.toBeNull());
        expect(getNode('0')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('0-1')).not.toBeNull();
    });

    it("修复 #1852：checkRelation='unRelated' 时，loadData 后保留已勾选的节点", async () => {
        const isChecked = (key) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
        render(<AsyncTree defaultValue={['0']} checkRelation="unRelated" />);
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

    it('从 auto-sizer 包裹元素的父元素获取列表尺寸', () => {
        const observers = [];
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: (entries: { target: Element }[]) => void;
                targets: Element[];
                constructor(callback: (entries: { target: Element }[]) => void) {
                    this.callback = callback;
                    this.targets = [];
                    observers.push(this);
                }
                observe(target: Element) {
                    this.targets.push(target);
                }
                unobserve(target: Element) {
                    this.targets = this.targets.filter((item) => item !== target);
                }
                disconnect() {
                    this.targets = [];
                }
            }
        );
        render(
            <div>
                <Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 28, height: '100%' }} />
            </div>
        );
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-auto-wrapper`);
        const parent = wrapper.parentElement;
        const observer = observers.find((item) => item.targets.length);
        expect(observer.targets).toEqual([wrapper, parent]);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).toBeNull();

        Object.defineProperty(parent, 'offsetHeight', { configurable: true, value: 84 });
        void act(() => observer.callback([{ target: wrapper }, { target: parent }]));

        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
    });

    it('按 target 而非位置读取父级条目', () => {
        const observers = [];
        vi.stubGlobal(
            'ResizeObserver',
            class {
                callback: (entries: { target: Element }[]) => void;
                targets: Element[];
                constructor(callback: (entries: { target: Element }[]) => void) {
                    this.callback = callback;
                    this.targets = [];
                    observers.push(this);
                }
                observe(target: Element) {
                    this.targets.push(target);
                }
                unobserve(target: Element) {
                    this.targets = this.targets.filter((item) => item !== target);
                }
                disconnect() {
                    this.targets = [];
                }
            }
        );
        render(
            <div>
                <Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 28, height: '100%' }} />
            </div>
        );
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-auto-wrapper`);
        const parent = wrapper.parentElement;
        const observer = observers.find((item) => item.targets.length);
        Object.defineProperty(parent, 'offsetHeight', { configurable: true, value: 84 });

        // only the parent resized: ResizeObserver delivers just that entry
        void act(() => observer.callback([{ target: parent }]));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).not.toBeNull();
    });
});

describe('Tree 拖拽回调类型', () => {
    it('拖拽回调的 event 是 DragEvent', () => {
        expectTypeOf<DragProps['event']>().toEqualTypeOf<React.DragEvent>();
        expectTypeOf<OnDragProps['event']>().toEqualTypeOf<React.DragEvent>();
        expectTypeOf<Parameters<NonNullable<TreeProps['onDrop']>>[0]['event']>().toEqualTypeOf<React.DragEvent>();
    });
});
