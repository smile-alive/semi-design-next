import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TreeProps } from '../interface';
import { getNode, optionCls, spyOn, treeData } from './data';
import TreeHost from './tree-host.svelte';

const manyRoots = Array.from({ length: 100 }, (_, i) => ({ label: `Node ${i}`, value: `${i}`, key: `${i}` }));

function renderTree(props: TreeProps) {
    const result = render(TreeHost, { props: { props: createStore<TreeProps>({ motion: false, ...props }) } });
    return { handle: () => result.component.handle() };
}

const activeRow = () => document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant') ?? '');

describe('Svelte Tree 键盘焦点（浏览器）', () => {
    it('树获得键盘焦点时，主题焦点环跟随当前行', async () => {
        renderTree({ treeData, expandAll: true });
        await tabTo(screen.getByRole('tree'));
        expectThemeFocusRing(activeRow() as HTMLElement);
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'zhongguo'));
        expectThemeFocusRing(activeRow() as HTMLElement);
        expect(screen.getByRole('tree')).toHaveFocus();
    });

    it('指针点击多选树的复选框后，树本身持焦，方向键仍然有效', async () => {
        renderTree({ treeData, multiple: true });
        await userEvent.click(getNode('yazhou').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(getNode('yazhou')).toHaveAttribute('aria-checked', 'true');
        (document.querySelector('input[type="checkbox"]') as HTMLInputElement).focus();
        expect(screen.getByRole('tree')).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', 'beimeizhou'));
    });
});

describe('Svelte Tree 虚拟滚动（浏览器）', () => {
    it('虚拟树将当前行滚动到可见区域，且只占一个 Tab 停留点', async () => {
        renderTree({ treeData: manyRoots, virtualize: { height: 200, width: 300, itemSize: 30 } });
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(activeRow()).toHaveAttribute('data-key', '99'));
        expect(activeRow()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(tree.getBoundingClientRect().bottom);
        expect(document.querySelectorAll('[role="treeitem"]').length).toBeLessThan(20);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(tree).not.toHaveFocus();
    });

    it('scrollTo 实例方法将虚拟化树滚动到指定节点', async () => {
        const { handle } = renderTree({ treeData, expandAll: true, virtualize: { itemSize: 30, height: 60 } });
        await waitFor(() => expect(getNode('yazhou')).not.toBeNull());
        expect(getNode('jianada')).toBeNull();
        handle().scrollTo({ key: 'jianada', align: 'start' });
        await waitFor(() => expect(getNode('jianada')).not.toBeNull());
    });

    it('Tab 进入虚拟树时，已选中的视口外行被渲染且 aria-activedescendant 指向它', async () => {
        renderTree({ treeData: manyRoots, value: '99', virtualize: { height: 200, width: 300, itemSize: 30 } });
        await tabTo(screen.getByRole('tree'));
        await waitFor(() => expect(getNode('99')).not.toBeNull());
        expect(activeRow()).toBe(getNode('99'));
    });

    it('用户滚动后渲染靠后的节点，指针点击靠后的行选中它且不滚动', async () => {
        renderTree({ treeData: manyRoots, virtualize: { height: 200, width: 300, itemSize: 30 } });
        await waitFor(() => expect(getNode('0')).not.toBeNull());
        const list = getNode('0').closest(`.${BASE_CLASS_PREFIX}-tree-virtual-list`) as HTMLElement;
        list.scrollTop = 30 * 80;
        await waitFor(() => expect(getNode('81')).not.toBeNull());
        expect(getNode('0')).toBeNull();
        const scrollTop = list.scrollTop;
        await userEvent.click(getNode('81'));
        await waitFor(() => expect(getNode('81')).toHaveAttribute('aria-selected', 'true'));
        expect(list.scrollTop).toBe(scrollTop);
    });
});

describe('Svelte Tree 拖拽（浏览器）', () => {
    const fire = (type: string, target: Element, dataTransfer: DataTransfer, position: 'top' | 'middle' | 'bottom') => {
        const rect = target.getBoundingClientRect();
        const clientY = position === 'top' ? rect.top + 1 : position === 'bottom' ? rect.bottom - 1 : rect.top + rect.height / 2;
        target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, clientX: rect.left + 10, clientY }));
        flushSync();
    };

    it('拖到目标行下缘时标出放置位置，drop 按真实布局上报位置并清除标记', async () => {
        const onDrop = spyOn('onDrop');
        renderTree({ treeData, draggable: true, onDrop });
        const dataTransfer = new DataTransfer();
        const label = () => getNode('beimeizhou').querySelector(`.${optionCls}-label`);
        fire('dragstart', getNode('yazhou'), dataTransfer, 'middle');
        fire('dragenter', getNode('beimeizhou'), dataTransfer, 'bottom');
        fire('dragover', getNode('beimeizhou'), dataTransfer, 'bottom');
        await waitFor(() => expect(label()).toHaveClass(`${optionCls}-drag-over-gap-bottom`));
        fire('drop', getNode('beimeizhou'), dataTransfer, 'bottom');
        expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ dropPosition: 2, dropToGap: true, dragNode: expect.objectContaining({ key: 'yazhou' }), node: expect.objectContaining({ key: 'beimeizhou' }) }));
        await waitFor(() => expect(label()).not.toHaveClass(`${optionCls}-drag-over-gap-bottom`));
    });

    it('拖到目标行中部时放进该节点', async () => {
        const onDrop = spyOn('onDrop');
        renderTree({ treeData, draggable: true, onDrop });
        const dataTransfer = new DataTransfer();
        fire('dragstart', getNode('yazhou'), dataTransfer, 'middle');
        fire('dragenter', getNode('beimeizhou'), dataTransfer, 'middle');
        await waitFor(() => expect(getNode('beimeizhou')).toHaveClass(`${optionCls}-drag-over`));
        fire('dragover', getNode('beimeizhou'), dataTransfer, 'middle');
        fire('drop', getNode('beimeizhou'), dataTransfer, 'middle');
        expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ dropToGap: false, node: expect.objectContaining({ key: 'beimeizhou' }) }));
    });
});
