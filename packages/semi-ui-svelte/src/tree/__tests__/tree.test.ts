import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockResizeObserverCore } from '@test/utils/dom/resize-observer-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TreeProps } from '../interface';
import { click, collapsedCls, getExpandIcon, getLevelNodes, getNode, getOptions, getSearchWrapper, getSelected, getTree, optionCls, press, search, selectedCls, spyOn, treeData, treeData2 } from './data';
import TreeHost from './tree-host.svelte';

function renderTree(props: TreeProps = {}, direction?: 'ltr' | 'rtl') {
    const store = createStore<TreeProps>({ treeData, motion: false, ...props });
    const result = render(TreeHost, { props: { props: store, direction } });
    return {
        container: result.container,
        handle: () => result.component.handle(),
        update: (next: TreeProps) => {
            Object.assign(store, next);
            flushSync();
        },
    };
}

const visibleKeys = () => screen.getAllByRole('treeitem').map((row) => row.getAttribute('data-key'));
const activeKey = () => document.getElementById(getTree().getAttribute('aria-activedescendant') ?? '')?.getAttribute('data-key');
const isChecked = (row: Element) => row.getAttribute('aria-checked') === 'true';
const isHalfChecked = (row: Element) => row.getAttribute('aria-checked') === 'mixed';

const dragNodeData = expect.objectContaining({ key: 'yazhou', expanded: false, pos: '0-0' });
const dropNodeData = expect.objectContaining({ key: 'beimeizhou', expanded: false, pos: '0-1' });

describe('Tree', () => {
    it('class 和 style 落在根元素', () => {
        const { container } = renderTree({ class: 'test', style: 'height: 420px' });
        const wrapper = container.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`) as HTMLElement;
        expect(wrapper).toHaveClass('test');
        expect(wrapper).toHaveStyle({ height: '420px' });
    });

    it('blockNode 属性', () => {
        const { update } = renderTree({ value: 'Beijing' });
        expect(document.querySelector(`.${optionCls}-list-block`)).not.toBeNull();
        update({ blockNode: false });
        expect(document.querySelector(`.${optionCls}-list-block`)).toBeNull();
    });

    it('空数据显示语言包的空状态', () => {
        renderTree({ treeData: [] });
        const nodes = getOptions();
        expect(nodes).toHaveLength(1);
        expect(nodes[0]).toHaveClass(`${optionCls}-empty`);
        expect(nodes[0]).toHaveTextContent(en_US.Tree.emptyText);
    });

    it('单向 value 作为初值选中节点并展开祖先', () => {
        renderTree({ value: 'Beijing' });
        const selected = getSelected();
        expect(selected).toHaveLength(1);
        expect(selected[0]).toHaveTextContent(/^北京$/);
    });

    it('defaultExpandAll 只在首次展开全部', () => {
        const { update } = renderTree({ defaultExpandAll: true });
        expect(getOptions()).toHaveLength(10);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);
        update({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(2);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(2);
    });

    it('expandAll 在数据变化后仍展开全部', () => {
        const { update } = renderTree({ expandAll: true });
        expect(getOptions()).toHaveLength(10);
        update({ treeData: treeData2 });
        expect(getOptions()).toHaveLength(5);
        expect(document.querySelectorAll(`.${collapsedCls}`)).toHaveLength(0);
    });

    it('目录模式', () => {
        renderTree({ expandedKeys: ['beimeizhou'], directory: true });
        const topNode = getLevelNodes(1);
        expect(topNode[1].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder_open`)).not.toBeNull();
        expect(topNode[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-folder`)).not.toBeNull();
        expect(getLevelNodes(2)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-file`)).not.toBeNull();
    });

    it('expandedKeys 配合 autoExpandParent', () => {
        const { update } = renderTree({ expandedKeys: ['beimeizhou'] });
        let topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).not.toHaveClass(collapsedCls);
        update({ expandedKeys: ['riben'] });
        topNode = getLevelNodes(1);
        expect(topNode[0]).toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);
        update({ autoExpandParent: true });
        topNode = getLevelNodes(1);
        expect(topNode[0]).not.toHaveClass(collapsedCls);
        expect(topNode[1]).toHaveClass(collapsedCls);
    });

    it('展开行为与 onExpand', async () => {
        const onExpand = spyOn('onExpand');
        renderTree({ onExpand });
        await click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true, node: expect.objectContaining({ key: 'yazhou' }) }));
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(getNode('beimeizhou')).toHaveClass(collapsedCls);
        await click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onExpand).toHaveBeenLastCalledWith([], expect.objectContaining({ expanded: false }));
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('非受控展开播放动画：新出现的行包在 Collapsible 里', async () => {
        const wrapperCls = `${BASE_CLASS_PREFIX}-collapsible-wrapper`;
        renderTree({ motion: true });
        expect(document.querySelector(`.${wrapperCls}`)).toBeNull();
        await click(getExpandIcon(getNode('yazhou')));
        expect(document.querySelector(`.${wrapperCls}`)).not.toBeNull();
        await vi.waitFor(() => expect(getNode('zhongguo')).not.toBeNull());
        expect(getNode('zhongguo').closest(`.${wrapperCls}`)).not.toBeNull();
        expect(getNode('yazhou').closest(`.${wrapperCls}`)).toBeNull();
    });

    it('受控 expandedKeys 变化时，新增子节点同样播放动画', async () => {
        const wrapperCls = `${BASE_CLASS_PREFIX}-collapsible-wrapper`;
        const { update } = renderTree({ motion: true, expandedKeys: [] });
        update({ expandedKeys: ['yazhou'] });
        expect(document.querySelector(`.${wrapperCls}`)).not.toBeNull();
        await vi.waitFor(() => expect(getNode('zhongguo')).not.toBeNull());
        expect(getNode('zhongguo').closest(`.${wrapperCls}`)).not.toBeNull();
    });

    it('选择节点、onSelect 与 onChange', async () => {
        const onSelect = spyOn('onSelect');
        const onChange = spyOn('onChange');
        renderTree({ expandAll: true, onSelect, onChange });
        await click(getNode('beijing'));
        expect(onSelect).toHaveBeenCalledWith('beijing', true, expect.objectContaining({ key: 'beijing' }));
        expect(onChange).toHaveBeenCalledWith('Beijing');
        expect(getNode('beijing')).toHaveClass(selectedCls);
        expect(getNode('beijing')).toHaveAttribute('aria-selected', 'true');
        await click(getNode('yazhou'));
        expect(onChange).toHaveBeenLastCalledWith('Yazhou');
        expect(getNode('yazhou')).toHaveClass(selectedCls);
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
    });

    it('onChangeWithObject 时 onChange 收到节点', async () => {
        const onChange = spyOn('onChange');
        renderTree({ expandAll: true, onChangeWithObject: true, onChange });
        await click(getNode('beijing'));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ key: 'beijing', value: 'Beijing' }));
    });

    it('filterTreeNode 为 true 时显示搜索框，可访问名称来自语言包', () => {
        const { update } = renderTree({});
        expect(getSearchWrapper()).toBeNull();
        update({ filterTreeNode: true });
        expect(screen.getByRole('textbox', { name: en_US.Tree.filter })).toHaveAttribute('placeholder', en_US.Tree.searchPlaceholder);
    });

    it('onSearch 与搜索高亮', async () => {
        const onSearch = spyOn('onSearch');
        renderTree({ filterTreeNode: true, onSearch });
        await search('北京');
        expect(onSearch).toHaveBeenCalledWith('北京', expect.arrayContaining(['yazhou', 'zhongguo']));
        expect(document.querySelector(`.${optionCls}-highlight`)).toHaveTextContent('北京');
    });

    it('searchClassName、searchPlaceholder 和 searchStyle', () => {
        renderTree({ filterTreeNode: true, searchClassName: 'search', searchPlaceholder: 'placeholder', searchStyle: 'padding: 16px' });
        const wrapper = getSearchWrapper();
        expect(wrapper).toHaveClass('search');
        expect(wrapper).toHaveStyle({ padding: '16px' });
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'placeholder');
    });

    it('showFilteredOnly 只显示匹配项与祖先；无结果时显示空状态', async () => {
        renderTree({ filterTreeNode: true, showFilteredOnly: true });
        await search('东京');
        expect(visibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        await search('asd');
        expect(document.querySelector(`.${optionCls}-label-empty`)).toHaveTextContent(en_US.Tree.emptyText);
    });

    it('search 实例方法过滤树；search={false} 隐藏搜索框', () => {
        const onSearch = spyOn('onSearch');
        const { handle } = renderTree({ filterTreeNode: true, showFilteredOnly: true, search: false, onSearch });
        expect(getSearchWrapper()).toBeNull();
        handle().search('东京');
        flushSync();
        expect(onSearch).toHaveBeenCalledWith('东京', expect.arrayContaining(['yazhou', 'riben']));
        expect(visibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
    });

    it('disabled 的树不响应选择', async () => {
        const onChange = spyOn('onChange');
        renderTree({ disabled: true, onChange });
        await click(getNode('yazhou'));
        expect(onChange).not.toHaveBeenCalled();
        expect(getNode('yazhou')).toHaveClass(`${optionCls}-disabled`);
        expect(getNode('yazhou')).toHaveAttribute('aria-disabled', 'true');
    });

    it('onContextMenu 与 onDoubleClick', async () => {
        const onContextMenu = spyOn('onContextMenu');
        const onDoubleClick = spyOn('onDoubleClick');
        renderTree({ onContextMenu, onDoubleClick });
        await fireEvent.contextMenu(getNode('yazhou'));
        await fireEvent.dblClick(getNode('yazhou'));
        expect(onContextMenu).toHaveBeenCalledWith(expect.any(MouseEvent), expect.objectContaining({ key: 'yazhou' }));
        expect(onDoubleClick).toHaveBeenCalledWith(expect.any(MouseEvent), expect.objectContaining({ key: 'yazhou' }));
    });

    it('expandAction 为 click 时点击行展开', async () => {
        const onExpand = spyOn('onExpand');
        renderTree({ expandAction: 'click', onExpand });
        await click(getNode('yazhou'));
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
    });

    it('expandAction 为 doubleClick 时双击展开，紧随的单击不再选择', async () => {
        const onSelect = spyOn('onSelect');
        renderTree({ expandAction: 'doubleClick', onSelect });
        await click(getNode('yazhou'));
        await click(getNode('yazhou'));
        await fireEvent.dblClick(getNode('yazhou'));
        flushSync();
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
    });

    it('loadData 加载子节点，加载中行带 aria-busy', async () => {
        let resolve!: () => void;
        const loadData = vi.fn<() => Promise<void>>(() => new Promise<void>((done) => (resolve = done)));
        const onLoad = spyOn('onLoad');
        const data = { label: '亚洲', value: 'Asia', key: 'asia' };
        renderTree({ loadData, onLoad, treeData: [data] });
        await click(getExpandIcon(getNode('asia')));
        expect(loadData).toHaveBeenCalledWith(data);
        expect(getNode('asia')).toHaveAttribute('aria-busy', 'true');
        resolve();
        await vi.waitFor(() => expect(onLoad).toHaveBeenCalledWith(new Set(['asia']), data));
        flushSync();
        expect(getNode('asia')).not.toHaveAttribute('aria-busy');
    });

    it('keyMaps 属性', async () => {
        const onChange = spyOn('onChange');
        renderTree({
            treeData: [{ name: 'A', id: 'a', val: 'va', kids: [{ name: 'B', id: 'b', val: 'vb' }] }] as unknown as TreeProps['treeData'],
            keyMaps: { key: 'id', label: 'name', value: 'val', children: 'kids' },
            expandAll: true,
            onChange,
        });
        expect(visibleKeys()).toEqual(['a', 'b']);
        await click(getNode('b'));
        expect(onChange).toHaveBeenCalledWith('vb');
    });

    it('treeDataSimpleJson', async () => {
        const onChange = spyOn('onChange');
        renderTree({ treeData: undefined, treeDataSimpleJson: { 亚洲: { 中国: { 北京: 'beijing' } } }, expandAll: true, onChange });
        expect(screen.getAllByRole('treeitem').map((row) => row.querySelector(`.${optionCls}-label-text`)?.textContent)).toEqual(['亚洲', '中国', '北京']);
        await click(screen.getAllByRole('treeitem')[2]);
        expect(onChange).toHaveBeenCalledWith({ 亚洲: { 中国: { 北京: 'beijing' } } });
    });

    it('aria-setsize 和 aria-posinset 统计同级节点', () => {
        renderTree({ expandedKeys: ['yazhou'] });
        expect(getNode('riben')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('riben')).toHaveAttribute('aria-posinset', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-level', '1');
    });

    it('aria-* 与 tabindex 落在 role="tree"，data-* 落在根元素；树维护的 aria 不被覆盖', () => {
        const { container } = renderTree({ 'aria-label': '地区', 'data-test': 'x', tabindex: -1, 'aria-activedescendant': 'nope', 'aria-multiselectable': true } as TreeProps);
        const tree = screen.getByRole('tree', { name: '地区' });
        expect(tree).toHaveAttribute('tabindex', '-1');
        expect(tree).not.toHaveAttribute('aria-activedescendant', 'nope');
        expect(tree).toHaveAttribute('aria-multiselectable', 'false');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-tree-wrapper`)).toHaveAttribute('data-test', 'x');
    });

    it('节点数据不会作为属性落到行上', () => {
        renderTree({ treeData: [{ label: 'A', key: 'a', title: 'tip' } as never] });
        expect(getNode('a')).not.toHaveAttribute('title');
    });

    describe('全局默认值', () => {
        afterEach(() => {
            semiGlobal.config.overrideDefaultProps = {};
        });

        it('读取 semiGlobal.config.overrideDefaultProps.Tree', () => {
            semiGlobal.config.overrideDefaultProps = { Tree: { blockNode: false, multiple: true } };
            renderTree({});
            expect(document.querySelector(`.${optionCls}-list-block`)).toBeNull();
            expect(getTree()).toHaveAttribute('aria-multiselectable', 'true');
        });
    });
});

describe('Tree 多选', () => {
    it('勾选叶子：父节点半选；再勾选兄弟：父节点全选', async () => {
        const onChange = spyOn('onChange');
        renderTree({ multiple: true, expandAll: true, onChange });
        await click(getNode('beijing'));
        expect(onChange).toHaveBeenLastCalledWith(['Beijing']);
        expect(isChecked(getNode('beijing'))).toBe(true);
        expect(isHalfChecked(getNode('zhongguo'))).toBe(true);
        await click(getNode('shanghai'));
        expect(onChange).toHaveBeenLastCalledWith(['Zhongguo']);
        expect(isChecked(getNode('zhongguo'))).toBe(true);
        expect(isHalfChecked(getNode('yazhou'))).toBe(true);
        await click(getNode('beijing'));
        expect(onChange).toHaveBeenLastCalledWith(['Shanghai']);
    });

    it('点击复选框勾选父节点，后代全选', async () => {
        renderTree({ multiple: true, expandAll: true });
        await click(getNode('yazhou').querySelector('input[type="checkbox"]') as HTMLElement);
        expect(['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban'].every((key) => isChecked(getNode(key)))).toBe(true);
    });

    it('unRelated 关联模式', async () => {
        const onChange = spyOn('onChange');
        renderTree({ multiple: true, expandAll: true, checkRelation: 'unRelated', onChange });
        await click(getNode('zhongguo'));
        expect(onChange).toHaveBeenCalledWith(['Zhongguo']);
        expect(isChecked(getNode('zhongguo'))).toBe(true);
        expect(isChecked(getNode('beijing'))).toBe(false);
    });

    it('leafOnly 只上报叶子节点的值', async () => {
        const onChange = spyOn('onChange');
        renderTree({ multiple: true, expandAll: true, leafOnly: true, onChange });
        await click(getNode('zhongguo'));
        expect(onChange).toHaveBeenCalledWith(['Beijing', 'Shanghai']);
    });

    it('disableStrictly 时禁用节点的状态不随父节点改变', async () => {
        const data = [
            {
                label: 'A',
                value: 'a',
                key: 'a',
                children: [
                    { label: 'B', value: 'b', key: 'b', disabled: true },
                    { label: 'C', value: 'c', key: 'c' },
                ],
            },
        ];
        renderTree({ multiple: true, expandAll: true, disableStrictly: true, treeData: data });
        await click(getNode('a'));
        expect(isChecked(getNode('b'))).toBe(false);
        expect(isChecked(getNode('c'))).toBe(true);
    });
});

describe('Tree 拖拽（jsdom 事件序列）', () => {
    it('dragStart、dragOver、dragLeave、dragEnd 收到节点载荷', async () => {
        const onDragStart = spyOn('onDragStart');
        const onDragOver = spyOn('onDragOver');
        const onDragLeave = spyOn('onDragLeave');
        const onDragEnd = spyOn('onDragEnd');
        renderTree({ draggable: true, onDragStart, onDragOver, onDragLeave, onDragEnd });
        expect(getNode('yazhou')).toHaveAttribute('draggable', 'true');
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragOver(getNode('beimeizhou'));
        await fireEvent.dragLeave(getNode('beimeizhou'));
        await fireEvent.dragEnd(getNode('yazhou'));
        expect(onDragStart).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
        expect(onDragOver).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
        expect(onDragLeave).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData }));
        expect(onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ node: dragNodeData }));
    });

    it('dragEnter 自动展开收起的目标节点', async () => {
        const onDragEnter = spyOn('onDragEnter');
        renderTree({ draggable: true, onDragEnter });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('beimeizhou'));
        await vi.waitFor(() => expect(onDragEnter).toHaveBeenCalledTimes(1));
        expect(onDragEnter).toHaveBeenCalledWith(expect.objectContaining({ node: dropNodeData, expandedKeys: ['beimeizhou'] }));
        flushSync();
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
    });

    it('drop 上报拖拽节点、目标节点与位置', async () => {
        const onDrop = spyOn('onDrop');
        renderTree({ draggable: true, onDrop });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                node: dropNodeData,
                dragNode: dragNodeData,
                dragNodesKeys: ['yazhou', 'zhongguo', 'beijing', 'shanghai', 'riben', 'dongjing', 'daban'],
                dropPosition: 1,
            })
        );
    });

    it('树外拖入（没有 dragStart）的 drop 不触发 onDrop；未开启 draggable 时行不可拖', async () => {
        const onDrop = spyOn('onDrop');
        const { update } = renderTree({ draggable: true, onDrop });
        await fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).not.toHaveBeenCalled();
        update({ draggable: false });
        expect(getNode('yazhou')).not.toHaveAttribute('draggable');
    });
});

describe('Tree 键盘（APG tree view）', () => {
    it('树是唯一的 Tab 停靠点，并从已选行开始', () => {
        renderTree({ value: 'Shanghai', expandAll: true });
        expect(getTree()).toHaveAttribute('tabindex', '0');
        expect(screen.getAllByRole('treeitem').filter((row) => row.hasAttribute('tabindex'))).toHaveLength(0);
        expect(activeKey()).toBe('shanghai');
    });

    it('Up、Down、Home 和 End 在可见行之间移动', async () => {
        renderTree();
        expect(activeKey()).toBe('yazhou');
        await press('ArrowDown');
        expect(activeKey()).toBe('beimeizhou');
        await press('ArrowDown');
        expect(activeKey()).toBe('beimeizhou');
        await press('Home');
        expect(activeKey()).toBe('yazhou');
        await press('End');
        expect(activeKey()).toBe('beimeizhou');
        await press('ArrowUp');
        expect(activeKey()).toBe('yazhou');
    });

    it('Right 展开分支后进入其中；Left 先回到父级，再收起', async () => {
        const onExpand = spyOn('onExpand');
        renderTree({ onExpand });
        await press('ArrowRight');
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        expect(onExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true }));
        await press('ArrowRight');
        expect(activeKey()).toBe('zhongguo');
        await press('ArrowLeft');
        expect(activeKey()).toBe('yazhou');
        await press('ArrowLeft');
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
        expect(visibleKeys()).toEqual(['yazhou', 'beimeizhou']);
    });

    it('RTL 下 Left 展开分支，Right 收起', async () => {
        renderTree({}, 'rtl');
        await press('ArrowLeft');
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
        await press('ArrowRight');
        expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
    });

    it('Enter 选中当前行；多选树中 Space 勾选当前行', async () => {
        const onChange = spyOn('onChange');
        const { update } = renderTree({ onChange });
        await press('ArrowDown');
        await press('Enter');
        expect(onChange).toHaveBeenLastCalledWith('Beimeizhou');
        expect(getNode('beimeizhou')).toHaveClass(selectedCls);
        update({ multiple: true, value: undefined });
        await press('End');
        await press(' ');
        expect(onChange).toHaveBeenLastCalledWith(['Beimeizhou']);
        expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'true');
    });

    it('输入字符时移动到标签以输入内容开头的下一行', async () => {
        renderTree();
        await press('北');
        expect(activeKey()).toBe('beimeizhou');
    });

    it('指针点击、展开、右键的行成为键盘当前行', async () => {
        renderTree();
        await click(getNode('beimeizhou'));
        expect(activeKey()).toBe('beimeizhou');
        await click(getExpandIcon(getNode('yazhou')));
        expect(activeKey()).toBe('yazhou');
        await fireEvent.contextMenu(getNode('beimeizhou'));
        flushSync();
        expect(activeKey()).toBe('beimeizhou');
    });
});

describe('Tree 虚拟化（jsdom）', () => {
    it('固定高度时只渲染视口内的行，labelEllipsis 默认开启', () => {
        const data = Array.from({ length: 100 }, (_, i) => ({ label: `node ${i}`, key: `k${i}`, value: `v${i}` }));
        renderTree({ treeData: data, virtualize: { itemSize: 30, height: 150 } });
        const rows = screen.getAllByRole('treeitem');
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThan(20);
        expect(rows[0]).toHaveClass(`${optionCls}-ellipsis`);
        expect(rows[0].getAttribute('style')).toContain('position: absolute');
    });

    it('virtualize.height 不是数字时从父元素获取列表尺寸', () => {
        const observer = mockResizeObserverCore();
        try {
            renderTree({ expandAll: true, virtualize: { itemSize: 28, height: '100%' } });
            flushSync();
            const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-auto-wrapper`) as HTMLElement;
            const parent = wrapper.parentElement as HTMLElement;
            expect(observer.observed()).toContain(parent);
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).toBeNull();
            Object.defineProperty(parent, 'offsetHeight', { configurable: true, value: 84 });
            observer.fire(parent, [{ target: parent }]);
            flushSync();
            expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-virtual-list`)).toHaveStyle({ height: '84px' });
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
