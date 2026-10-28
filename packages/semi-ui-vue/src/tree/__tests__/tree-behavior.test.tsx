/** @jsxImportSource vue */
import { nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Tree, { type TreeDraggingNodeSlotProps, type TreeExpandIconSlotProps, type TreeFullLabelSlotProps, type TreeLabelSlotProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Tooltip from '../../tooltip';
import { collapsedCls, getExpandIcon, getNode, optionCls, renderTree, selectedCls, spyOn, treeData } from './fixtures/data';

const prefix = `${BASE_CLASS_PREFIX}-tree`;

const getVisibleKeys = () => [...document.querySelectorAll('[role="treeitem"]')].map((node) => node.getAttribute('data-key'));
const isChecked = (key: string) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-inner-checked`) !== null;
const isHalfChecked = (key: string) => getNode(key).querySelector(`.${BASE_CLASS_PREFIX}-checkbox-indeterminate`) !== null;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Tree 行为', () => {
    it('#label 收到节点数据、标签和搜索词', async () => {
        const label = vi.fn<(scope: TreeLabelSlotProps) => string>(({ item, label: text, searchWord }) => `${text}|${item.value}|${searchWord}`);
        const { handle } = renderTree({ filterTreeNode: true }, { label });
        expect(getNode('yazhou')).toHaveTextContent('亚洲|Yazhou|');
        handle().search('北');
        await nextTick();
        expect(getNode('beijing')).toHaveTextContent('北京|Beijing|北');
        expect(label).toHaveBeenCalledWith(
            expect.objectContaining({
                label: '北京',
                item: expect.objectContaining({ key: 'beijing' }),
                searchWord: '北',
            })
        );
    });

    it('#fullLabel 渲染自定义行，其回调驱动选择和展开', async () => {
        const onChange = spyOn<'change'>();
        const fullLabel = ({ class: cls, onClick, onExpand, data, level, expandStatus }: TreeFullLabelSlotProps) => (
            <div class={cls} data-expanded={String(expandStatus.expanded)} data-level={level} onClick={onClick}>
                <button type="button" onClick={onExpand}>{`toggle ${data.key}`}</button>
                {data.label}
            </div>
        );
        renderTree({ motion: false, onChange }, { fullLabel });
        const content = (key: string) => getNode(key).firstElementChild;
        expect(content('yazhou')).toHaveClass(`${optionCls}-fullLabel-level-1`);
        expect(content('yazhou')).toHaveAttribute('data-expanded', 'false');
        await userEvent.click(screen.getByRole('button', { name: 'toggle yazhou' }));
        expect(content('yazhou')).toHaveAttribute('data-expanded', 'true');
        expect(content('zhongguo')).toHaveAttribute('data-level', '1');
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(content('zhongguo') as HTMLElement);
        expect(onChange).toHaveBeenCalledWith('Zhongguo');
    });

    it('#fullLabel 保留自身样式，行获取虚拟行位置', () => {
        const fullLabel = ({ class: cls, data, onClick }: TreeFullLabelSlotProps) => (
            <div class={cls} style={{ color: 'red' }} onClick={onClick}>
                {data.label}
            </div>
        );
        renderTree({ defaultExpandAll: true, virtualize: { itemSize: 30, height: 300 } }, { fullLabel });
        const node = getNode('zhongguo');
        expect((node.firstElementChild as HTMLElement).style.color).toBe('red');
        expect(node.style.position).toBe('absolute');
        expect(node.style.top).toBe('30px');
    });

    describe('键盘操作（APG tree view）', () => {
        const activeKey = () => {
            const tree = screen.getByRole('tree');
            return document.getElementById(tree.getAttribute('aria-activedescendant') ?? '')?.getAttribute('data-key');
        };
        const focusTree = async () => {
            screen.getByRole('tree').focus();
            await nextTick();
        };

        it('树是唯一的 Tab 停靠点，并从已选行开始', () => {
            renderTree({ defaultValue: 'Shanghai', defaultExpandAll: true });
            expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
            expect(screen.getAllByRole('treeitem').filter((row) => row.hasAttribute('tabindex'))).toHaveLength(0);
            expect(activeKey()).toBe('shanghai');
        });

        it('Up、Down、Home 和 End 在可见行之间移动', async () => {
            renderTree();
            await focusTree();
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('beimeizhou');
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).toBe('beimeizhou');
            await userEvent.keyboard('{Home}');
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{End}');
            expect(activeKey()).toBe('beimeizhou');
        });

        it('Right 展开分支后进入其中；Left 先回到父级，再收起', async () => {
            const onExpand = spyOn<'expand'>();
            renderTree({ motion: false, onExpand });
            await focusTree();
            await userEvent.keyboard('{ArrowRight}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
            expect(onExpand).toHaveBeenLastCalledWith(['yazhou'], expect.objectContaining({ expanded: true }));
            await userEvent.keyboard('{ArrowRight}');
            expect(activeKey()).toBe('zhongguo');
            await userEvent.keyboard('{ArrowLeft}');
            expect(activeKey()).toBe('yazhou');
            await userEvent.keyboard('{ArrowLeft}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
            expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
        });

        it('RTL 下 Left 展开分支，Right 收起', async () => {
            renderTree({ motion: false }, {}, { direction: 'rtl' });
            await focusTree();
            await userEvent.keyboard('{ArrowLeft}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(getNode('yazhou')).toHaveAttribute('aria-expanded', 'false');
        });

        it('Enter 选中当前行；多选树中 Space 勾选当前行', async () => {
            const onChange = spyOn<'change'>();
            const { rerender } = renderTree({ onChange });
            await focusTree();
            await userEvent.keyboard('{ArrowDown}{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('Beimeizhou');
            expect(getNode('beimeizhou')).toHaveClass(selectedCls);

            await rerender({ multiple: true });
            await focusTree();
            await userEvent.keyboard('{End} ');
            expect(onChange).toHaveBeenLastCalledWith(['Beimeizhou']);
            expect(getNode('beimeizhou')).toHaveAttribute('aria-checked', 'true');
        });

        it('输入字符时移动到标签以输入内容开头的下一行', async () => {
            renderTree();
            await focusTree();
            await userEvent.keyboard('北');
            expect(activeKey()).toBe('beimeizhou');
        });

        it('行内可聚焦控件保留自身的 Enter 和 Space', async () => {
            const onSelect = spyOn<'select'>();
            // a click would bubble to the row and select it; stopping it isolates the key handling
            const onClick = vi.fn<(event: MouseEvent) => void>((event) => event.stopPropagation());
            renderTree({ onSelect }, { label: ({ label }: TreeLabelSlotProps) => <button type="button" onClick={onClick}>{`open ${label}`}</button> });
            screen.getByRole('button', { name: 'open 亚洲' }).focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(onClick).toHaveBeenCalledTimes(2);
            expect(onSelect).not.toHaveBeenCalled();
        });

        it('指针点击多选树的复选框或虚拟树的行后，树本身持焦，方向键仍然有效', async () => {
            const { unmount } = renderTree({ defaultExpandAll: true, virtualize: { itemSize: 30, height: 300 } });
            await userEvent.click(getNode('zhongguo'));
            expect(screen.getByRole('tree')).toHaveFocus();
            unmount();
            renderTree({ multiple: true });
            const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
            await userEvent.click(checkbox);
            expect(screen.getByRole('tree')).toHaveFocus();
            const before = activeKey();
            await userEvent.keyboard('{ArrowDown}');
            expect(activeKey()).not.toBe(before);
        });
    });

    it('aria-setsize 和 aria-posinset 统计同级节点', () => {
        renderTree({ defaultExpandAll: true });
        expect(getNode('shanghai')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('shanghai')).toHaveAttribute('aria-posinset', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-setsize', '2');
        expect(getNode('beimeizhou')).toHaveAttribute('aria-posinset', '2');
    });

    it('showFilteredOnly 搜索时 aria-setsize 和 aria-posinset 只统计可见的同级节点', async () => {
        const { handle } = renderTree({ filterTreeNode: true, showFilteredOnly: true });
        handle().search('东京');
        await nextTick();
        for (const key of ['yazhou', 'riben', 'dongjing']) {
            expect(getNode(key)).toHaveAttribute('aria-setsize', '1');
            expect(getNode(key)).toHaveAttribute('aria-posinset', '1');
        }
    });

    it('多选树把勾选状态报告在行上；箭头和复选框是隐藏的图片', () => {
        renderTree({ defaultValue: ['Beijing'], multiple: true });
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
        expect(getNode('yazhou')).not.toHaveAttribute('aria-selected');
        expect(getExpandIcon(getNode('yazhou'))).toHaveAttribute('aria-hidden', 'true');
        // Vue Checkbox puts aria-hidden and tabindex on its input
        const input = getNode('yazhou').querySelector(`.${BASE_CLASS_PREFIX}-checkbox input`);
        expect(input).toHaveAttribute('aria-hidden', 'true');
        expect(input).toHaveAttribute('tabindex', '-1');
    });

    it('ref.search 过滤树并触发 search；空 #search 插槽隐藏搜索框', async () => {
        const onSearch = spyOn<'search'>();
        const { handle } = renderTree({ filterTreeNode: true, showFilteredOnly: true, onSearch }, { search: () => [] });
        expect(document.querySelector(`.${prefix}-search-wrapper`)).toBeNull();
        handle().search('东京');
        await nextTick();
        expect(onSearch).toHaveBeenCalledWith('东京', ['riben', 'yazhou']);
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        handle().search('');
        await nextTick();
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
    });

    it('data-* 透传到根元素，aria-label 与 aria-labelledby 落在被命名的树', () => {
        const { container } = renderTree({
            'data-testid': 'tree',
            'aria-label': 'Regions',
            'aria-describedby': 'hint',
        });
        expect(container.firstElementChild).toHaveAttribute('data-testid', 'tree');
        expect(container.firstElementChild).toHaveClass(`${prefix}-wrapper`);
        expect(container.firstElementChild).not.toHaveAttribute('aria-label');
        const tree = screen.getByRole('tree', { name: 'Regions' });
        expect(tree).toHaveAttribute('aria-describedby', 'hint');
    });

    it('节点数据不会作为属性落到行上', async () => {
        const { container } = renderTree({
            multiple: true,
            defaultExpandAll: true,
            draggable: true,
            filterTreeNode: true,
            hideDraggingNode: true,
            keyMaps: {},
        });
        await userEvent.click(getNode('beijing'));
        const own = /^(id|role|class|style|draggable|data-key|aria-.+)$/;
        for (const row of screen.getAllByRole('treeitem')) {
            expect(row.getAttributeNames().filter((name) => !own.test(name))).toEqual([]);
        }
        expect(container.firstElementChild?.getAttributeNames()).toEqual(['class']);
        expect(screen.getByRole('tree').getAttributeNames().sort()).toEqual(['aria-activedescendant', 'aria-multiselectable', 'class', 'role', 'tabindex'].sort());
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Tree: { defaultExpandAll: true, blockNode: false } };
        try {
            renderTree();
            expect(getNode('beijing')).not.toBeNull();
            expect(document.querySelector(`.${prefix}-option-list`)).not.toHaveClass(`${prefix}-option-list-block`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('loadData 失败时停止显示加载状态，并允许重试', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('load failed')));
        const rejections: unknown[] = [];
        const onRejection = (reason: unknown) => rejections.push(reason);
        // loadData rejections are rethrown to the caller by design; catch it so the test does not fail
        process.on('unhandledRejection', onRejection);
        try {
            renderTree({ loadData, motion: false, treeData: [{ label: 'Async', value: 'async', key: 'async' }] });
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(1));
            await waitFor(() => expect(getNode('async').querySelector(`.${optionCls}-spin-icon`)).toBeNull());
            await userEvent.click(getExpandIcon(getNode('async')));
            await userEvent.click(getExpandIcon(getNode('async')));
            await waitFor(() => expect(loadData).toHaveBeenCalledTimes(2));
        } finally {
            await settle();
            process.off('unhandledRejection', onRejection);
        }
    });

    it('leafOnly 只上报叶子节点的值', async () => {
        const onChange = spyOn<'change'>();
        renderTree({ multiple: true, defaultExpandAll: true, leafOnly: true, onChange });
        await userEvent.click(getNode('zhongguo').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai']);
        await userEvent.click(getNode('riben').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(onChange).toHaveBeenLastCalledWith(['Beijing', 'Shanghai', 'Dongjing', 'Daban']);
        expect(isChecked('yazhou')).toBe(true);
    });

    it('受控 value 在重新渲染时更新选中状态', async () => {
        const { rerender } = renderTree({ modelValue: 'Beijing', defaultExpandAll: true });
        expect(getNode('beijing')).toHaveClass(selectedCls);
        await rerender({ modelValue: 'Meiguo' });
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
        expect(getNode('meiguo')).toHaveClass(selectedCls);
    });

    it('受控多选值在重新渲染时更新勾选状态', async () => {
        const { rerender } = renderTree({ multiple: true, modelValue: ['Beijing'], defaultExpandAll: true });
        expect(isChecked('beijing')).toBe(true);
        expect(isHalfChecked('zhongguo')).toBe(true);
        await rerender({ modelValue: ['Beijing', 'Shanghai'] });
        expect(isChecked('zhongguo')).toBe(true);
        expect(isHalfChecked('yazhou')).toBe(true);
    });

    it('受控 expandedKeys 变化时，新增子节点在同一次 nextTick 中播放动画', async () => {
        const wrapperCls = `${BASE_CLASS_PREFIX}-collapsible-wrapper`;
        const { rerender } = renderTree({ expandedKeys: [] });
        expect(document.querySelector(`.${wrapperCls}`)).toBeNull();
        await rerender({ expandedKeys: ['yazhou'] });
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
        expect(document.querySelector(`.${wrapperCls}`)).not.toBeNull();
        await waitFor(() => expect(getNode('zhongguo')).not.toBeNull());
        expect(getNode('zhongguo').closest(`.${wrapperCls}`)).not.toBeNull();
        expect(getNode('yazhou').closest(`.${wrapperCls}`)).toBeNull();
    });

    it('搜索时受控 expandedKeys 跟随 prop', async () => {
        const { handle, rerender } = renderTree({ expandedKeys: ['beimeizhou'], filterTreeNode: true });
        handle().search('东京');
        await nextTick();
        expect(getNode('beimeizhou')).not.toHaveClass(collapsedCls);
        expect(getNode('meiguo')).not.toBeNull();
        expect(getNode('riben')).toBeNull();
        await rerender({ autoExpandParent: true, expandedKeys: ['riben'] });
        expect(getNode('dongjing')).not.toBeNull();
        expect(getNode('meiguo')).toBeNull();
    });

    it('搜索时 treeData 变化，保留搜索过滤', async () => {
        const { handle, rerender } = renderTree({ filterTreeNode: true, showFilteredOnly: true });
        handle().search('东京');
        await nextTick();
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing']);
        await rerender({ treeData: [...treeData, { label: '东京湾', value: 'Bay', key: 'bay' }] });
        expect(getVisibleKeys()).toEqual(['yazhou', 'riben', 'dongjing', 'bay']);
    });

    it('搜索中收起祖先后，以新引用传入同结构的 treeData，祖先保持收起', async () => {
        const { handle, rerender } = renderTree({ filterTreeNode: true, motion: false });
        handle().search('北京');
        await nextTick();
        expect(getNode('beijing')).not.toBeNull();
        await userEvent.click(getExpandIcon(getNode('zhongguo')));
        expect(getNode('beijing')).toBeNull();
        await rerender({ treeData: treeData.map((node) => ({ ...node })) });
        expect(getNode('beijing')).toBeNull();
        expect(getNode('zhongguo')).toHaveAttribute('aria-expanded', 'false');
    });

    it('受控 expandedKeys 加 showFilteredOnly 时，搜索中 treeData 新增的匹配项会显示', async () => {
        const data = [
            { label: 'Apple', value: 'a', key: 'a' },
            { label: 'Banana', value: 'b', key: 'b' },
        ];
        const { handle, rerender } = renderTree({ filterTreeNode: true, showFilteredOnly: true, expandedKeys: [], motion: false, treeData: data });
        handle().search('Ban');
        await nextTick();
        expect(getVisibleKeys()).toEqual(['b']);
        await rerender({ treeData: [...data, { label: 'Banner', value: 'c', key: 'c' }] });
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('labelEllipsis、showLine 和 #expandIcon', async () => {
        const first = renderTree({ defaultExpandAll: true, labelEllipsis: true, showLine: true });
        expect(getNode('yazhou')).toHaveClass(`${optionCls}-ellipsis`);
        expect(document.querySelector(`.${optionCls}-indent-show-line`)).not.toBeNull();
        expect(getNode('beijing').querySelector(`.${optionCls}-switcher-leaf-line`)).not.toBeNull();
        first.unmount();

        const onExpand = spyOn<'expand'>();
        const second = renderTree(
            { defaultExpandAll: true, motion: false, onExpand },
            {
                expandIcon: ({ onClick, class: cls, expanded }: TreeExpandIconSlotProps) => (
                    <button type="button" class={cls} onClick={onClick}>
                        {expanded ? 'close' : 'open'}
                    </button>
                ),
            }
        );
        expect(getExpandIcon(getNode('yazhou'))).toHaveTextContent('close');
        await userEvent.click(getExpandIcon(getNode('beimeizhou')));
        expect(onExpand).toHaveBeenLastCalledWith(expect.not.arrayContaining(['beimeizhou']), expect.objectContaining({ expanded: false, node: expect.objectContaining({ key: 'beimeizhou' }) }));
        expect(getExpandIcon(getNode('beimeizhou'))).toHaveTextContent('open');
        second.unmount();

        renderTree({ defaultExpandAll: true, motion: false }, { expandIcon: () => <span class="custom">v</span> });
        const icon = getExpandIcon(getNode('yazhou'));
        expect(icon).toHaveClass('custom');
        await userEvent.click(icon);
        expect(getNode('yazhou')).toHaveClass(collapsedCls);
    });

    it('keyMaps.key 加 loadData 时依次展开两个节点，各加载一次', async () => {
        const loadData = vi.fn<(node: unknown) => Promise<void>>(() => Promise.resolve());
        const onLoad = spyOn<'load'>();
        const data = [
            { name: 'A', id: 'a' },
            { name: 'B', id: 'b' },
        ];
        renderTree({ keyMaps: { key: 'id', value: 'id', label: 'name' }, loadData, motion: false, treeData: data, onLoad });
        await userEvent.click(getExpandIcon(getNode('a')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
        expect(loadData.mock.calls.map(([node]) => node)).toEqual(data);
        expect(onLoad).toHaveBeenLastCalledWith(new Set(['a', 'b']), data[1]);
    });

    it('受控 loadedKeys 配合 load', async () => {
        const loadData = vi.fn<() => Promise<void>>(() => Promise.resolve());
        const onLoad = spyOn<'load'>();
        const onUpdate = spyOn<'update:loadedKeys'>();
        const data = [
            { label: 'A', value: 'a', key: 'a' },
            { label: 'B', value: 'b', key: 'b' },
        ];
        renderTree({
            loadData,
            loadedKeys: ['a'],
            motion: false,
            treeData: data,
            onLoad,
            'onUpdate:loadedKeys': onUpdate,
        });
        expect(getExpandIcon(getNode('a'))).toBeNull();
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
        expect(onLoad).toHaveBeenCalledWith(new Set(['a', 'b']), expect.objectContaining({ key: 'b' }));
        expect(onUpdate).toHaveBeenCalledWith(['a', 'b']);
        expect(loadData).toHaveBeenCalledTimes(1);
        await nextTick();
        expect(getExpandIcon(getNode('b'))).not.toBeNull();
    });

    it('列表标记为 tree，并带有多选状态；为空时不带多选状态', async () => {
        const { rerender } = renderTree({ multiple: true });
        const list = document.querySelector(`.${prefix}-option-list`);
        expect(list).toHaveAttribute('role', 'tree');
        expect(list).toHaveAttribute('aria-multiselectable', 'true');
        await rerender({ treeData: [] });
        const empty = document.querySelector(`.${prefix}-option-list`);
        expect(empty).toHaveAttribute('role', 'none');
        expect(empty).not.toHaveAttribute('aria-multiselectable');
    });

    it('即使更新仍被节流，drop 也上报最后一次 dragover 的位置', async () => {
        const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            bottom: 30,
            height: 30,
            left: 0,
            right: 100,
            width: 100,
            x: 0,
            y: 0,
        } as DOMRect);
        try {
            // jsdom has no DragEvent, so the coordinate is set on the generic event
            const drag = async (type: 'dragEnter' | 'dragOver' | 'drop', key: string, clientY: number) => {
                const event = createEvent[type](getNode(key));
                Object.defineProperty(event, 'clientY', { value: clientY });
                await fireEvent(getNode(key), event);
            };
            const onDrop = spyOn<'drop'>();
            renderTree({ draggable: true, onDrop });
            await fireEvent.dragStart(getNode('yazhou'));
            await drag('dragEnter', 'beimeizhou', 15);
            await settle();
            await drag('dragOver', 'beimeizhou', 1);
            await drag('dragOver', 'beimeizhou', 29);
            await drag('drop', 'beimeizhou', 29);
            expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ dropPosition: 2, dropToGap: true }));
        } finally {
            rect.mockRestore();
        }
    });

    it('拖入节点时该行标出放置位置，drop 后移除', async () => {
        // jsdom's generic drag event has no clientY, which compares false with both edges and drops onto the node
        renderTree({ draggable: true });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('beimeizhou'));
        await settle();
        expect(getNode('beimeizhou')).toHaveClass(`${optionCls}-drag-over`);
        expect(getNode('yazhou')).not.toHaveClass(`${optionCls}-drag-over`);
        await fireEvent.drop(getNode('beimeizhou'));
        expect(getNode('beimeizhou')).not.toHaveClass(`${optionCls}-drag-over`);
    });

    it('收起非受控节点时，以剩余的 key 触发 expand', async () => {
        const onExpand = spyOn<'expand'>();
        renderTree({ motion: false, onExpand });
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        await userEvent.click(getExpandIcon(getNode('riben')));
        expect(onExpand).toHaveBeenLastCalledWith(['yazhou', 'riben'], expect.anything());
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(onExpand).toHaveBeenLastCalledWith(['riben'], expect.anything());
        expect(getNode('riben')).toBeNull();
    });
});

describe('Tree 审计修复', () => {
    it('keyMaps.label 下搜索期间 treeData 变化后仍按映射的字段过滤', async () => {
        const data = [
            { label1: 'Apple', value: 'a', key: 'a' },
            { label1: 'Banana', value: 'b', key: 'b' },
        ];
        const { handle, rerender } = renderTree({
            filterTreeNode: true,
            showFilteredOnly: true,
            keyMaps: { label: 'label1' },
            motion: false,
            treeData: data,
        });
        handle().search('Ban');
        await nextTick();
        expect(getVisibleKeys()).toEqual(['b']);
        await rerender({ treeData: [...data, { label1: 'Banner', value: 'c', key: 'c' }] });
        expect(getVisibleKeys()).toEqual(['b', 'c']);
    });

    it('逐个勾选兄弟节点后，全选的父节点 aria-checked 为 true', async () => {
        renderTree({ multiple: true, defaultExpandAll: true, motion: false });
        await userEvent.click(getNode('beijing'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'mixed');
        await userEvent.click(getNode('shanghai'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(isHalfChecked('zhongguo')).toBe(false);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('点击半选的父节点后，父节点变为全选而不再半选', async () => {
        renderTree({ multiple: true, defaultExpandAll: true, motion: false });
        await userEvent.click(getNode('beijing'));
        await userEvent.click(getNode('zhongguo'));
        expect(getNode('zhongguo')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('beijing')).toHaveAttribute('aria-checked', 'true');
        expect(getNode('shanghai')).toHaveAttribute('aria-checked', 'true');
    });

    it('受控 expandedKeys 的树在搜索后清空，保持控制方给出的展开状态', async () => {
        const onExpand = spyOn<'expand'>();
        const { handle } = renderTree({
            modelValue: 'Beijing',
            expandedKeys: [],
            filterTreeNode: true,
            motion: false,
            onExpand,
        });
        handle().search('北');
        await nextTick();
        handle().search('');
        await nextTick();
        expect(getVisibleKeys()).toEqual(['yazhou', 'beimeizhou']);
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('非受控树选中分支节点后搜索再清空，该分支保持收起', async () => {
        const { handle } = renderTree({ defaultValue: 'Zhongguo', filterTreeNode: true, motion: false });
        handle().search('北');
        await nextTick();
        handle().search('');
        await nextTick();
        expect(getVisibleKeys()).not.toContain('beijing');
    });

    it('拖过收起的节点后立即 drop，自动展开不会在拖拽结束后触发', async () => {
        const onDragEnter = spyOn<'dragEnter'>();
        renderTree({ draggable: true, motion: false, onDragEnter });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('beimeizhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        await new Promise((resolve) => setTimeout(resolve, 600));
        await nextTick();
        expect(getNode('meiguo')).toBeNull();
        expect(onDragEnter).not.toHaveBeenCalled();
    });

    it('拖过收起的节点后拖出树，该节点不会被自动展开', async () => {
        renderTree({ draggable: true, motion: false });
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.dragEnter(getNode('beimeizhou'));
        await settle();
        await fireEvent.dragLeave(getNode('beimeizhou'));
        // the auto-expand delay is 400ms
        await new Promise((resolve) => setTimeout(resolve, 450));
        await nextTick();
        expect(getNode('meiguo')).toBeNull();
    });

    it('#renderDraggingNode 的内容作为拖拽图像，拖拽开始后移除', async () => {
        const setDragImage = vi.fn<(image: Element, x: number, y: number) => void>();
        const renderDraggingNode = ({ nodeInstance, node }: TreeDraggingNodeSlotProps) => <span data-row={nodeInstance.dataset.key}>{`dragging ${node.label}`}</span>;
        renderTree({ draggable: true }, { renderDraggingNode });
        await fireEvent.dragStart(getNode('yazhou'), { dataTransfer: { setDragImage } });
        expect(setDragImage).toHaveBeenCalledTimes(1);
        const [image] = setDragImage.mock.calls[0];
        expect(image).toHaveTextContent('dragging 亚洲');
        expect(image.querySelector('[data-row="yazhou"]')).not.toBeNull();
        expect(document.body).toContainElement(image as HTMLElement);
        await settle();
        expect(screen.queryByText('dragging 亚洲')).toBeNull();
    });

    it('renderDraggingNode 不再是 prop', () => {
        expect(Object.keys(Tree.props)).not.toContain('renderDraggingNode');
    });

    it('treeDataSimpleJson 的键含点号时 change 收到嵌套对象', async () => {
        const onChange = spyOn<'change'>();
        renderTree({
            treeData: undefined,
            defaultExpandAll: true,
            motion: false,
            treeDataSimpleJson: { 'v1.2': { a: 'x' } },
            onChange,
        });
        await userEvent.click(getNode('v1.2_SEMI_TREE_SPLIT_a'));
        expect(onChange).toHaveBeenCalledWith({ 'v1.2': { a: 'x' } });
    });
});

describe('Tree 节点数据与行状态', () => {
    it('节点数据带 expanded、checked 字段时仍能展开、勾选', async () => {
        const onExpand = spyOn<'expand'>();
        const onChange = spyOn<'change'>();
        const data = [
            {
                key: 'a',
                label: 'A',
                value: 'a',
                expanded: true,
                children: [
                    { key: 'b', label: 'B', value: 'b', checked: true },
                    { key: 'c', label: 'C', value: 'c' },
                ],
            },
        ];
        renderTree({ multiple: true, motion: false, treeData: data, onExpand, onChange });
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(onExpand).toHaveBeenCalledWith(['a'], expect.objectContaining({ expanded: true }));
        await userEvent.click(getNode('b'));
        expect(onChange).toHaveBeenLastCalledWith(['b']);
    });

    it('节点数据的 level、loading 字段不改变行的层级与加载状态', () => {
        renderTree({ treeData: [{ key: 'a', label: 'A', value: 'a', level: 3, loading: true }] });
        const row = screen.getByRole('treeitem', { name: 'A' });
        expect(row).toHaveAttribute('aria-level', '1');
        expect(row).not.toHaveAttribute('aria-busy');
    });

    it('keyMaps.children 映射到其他字段时，节点自带的 children 业务字段不让叶子变成分支', () => {
        renderTree({ keyMaps: { children: 'items' }, treeData: [{ key: 'a', label: 'A', value: 'a', children: [{ key: 'x', label: 'X', value: 'x' }] }] });
        expect(getNode('a')).not.toHaveAttribute('aria-expanded');
        expect(getExpandIcon(getNode('a'))).toBeNull();
    });

    it('单选树 defaultValue 为 0 时选中值为 0 的节点并展开其祖先', () => {
        renderTree({ defaultValue: 0, treeData: [{ key: 'p', label: 'P', value: 'p', children: [{ key: 'c', label: 'C', value: 0 }] }] });
        expect(getNode('c')).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Tree 拖拽、展开与属性落点', () => {
    it('树外拖入（没有 dragStart）的 drop 不触发 drop 事件', async () => {
        const onDrop = spyOn<'drop'>();
        renderTree({ draggable: true, onDrop });
        await fireEvent.dragOver(getNode('beimeizhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).not.toHaveBeenCalled();
    });

    it('expandAction="click" 加 loadData 时，点击 isLeaf 叶子不加载、不触发 expand', async () => {
        const loadData = vi.fn<(node?: unknown) => Promise<void>>(() => Promise.resolve());
        const onExpand = spyOn<'expand'>();
        renderTree({ expandAction: 'click', loadData, treeData: [{ key: 'a', label: 'A', value: 'a', isLeaf: true }], onExpand });
        await userEvent.click(getNode('a'));
        expect(loadData).not.toHaveBeenCalled();
        expect(onExpand).not.toHaveBeenCalled();
    });

    it('加载中的节点名称不含加载图标的名称，并标为 aria-busy', async () => {
        const loadData = vi.fn<(node?: unknown) => Promise<void>>(() => new Promise(() => {}));
        renderTree({ loadData, treeData: [{ key: 'a', label: 'A', value: 'a' }] });
        await userEvent.click(getExpandIcon(getNode('a')));
        expect(screen.getByRole('treeitem', { name: 'A' })).toHaveAttribute('aria-busy', 'true');
    });

    it('tabindex 落在 role="tree" 元素上，Tooltip 包裹时不多出 Tab 停留点', async () => {
        const { container } = renderTree({ tabindex: -1 });
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
        render(() => <Tooltip>{{ default: () => <Tree treeData={treeData} aria-label="wrapped" />, content: () => 'tip' }}</Tooltip>);
        await nextTick();
        const wrapped = screen.getByRole('tree', { name: 'wrapped' });
        expect(wrapped).toHaveAttribute('tabindex', '0');
        expect(wrapped.closest(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
    });

    it('驼峰写法的 tabIndex 同样落在 role="tree" 元素上', () => {
        const { container } = renderTree({ tabIndex: -1 });
        expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '-1');
        expect(container.querySelector(`.${prefix}-wrapper`)).not.toHaveAttribute('tabindex');
    });

    it('使用方传的 aria-activedescendant、aria-multiselectable 不覆盖树自己维护的值', () => {
        renderTree({ multiple: true, 'aria-multiselectable': 'false', 'aria-activedescendant': 'outside' });
        const tree = screen.getByRole('tree');
        expect(tree).toHaveAttribute('aria-multiselectable', 'true');
        expect(tree).not.toHaveAttribute('aria-activedescendant', 'outside');
    });
});
