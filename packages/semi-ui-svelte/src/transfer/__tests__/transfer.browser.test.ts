import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { TransferDataItem, TransferValue } from '../interface';
import Transfer from '../transfer.svelte';
import TransferBrowser from './transfer-browser.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-transfer`;
const overlaySelector = `.${prefixCls}-right-item-drag-item-move`;
const data = Array.from({ length: 6 }, (_, i) => ({ label: `选项名称 ${i}`, value: i, key: i }));
const many = Array.from({ length: 50 }, (_, i) => ({ label: `条目 ${i}`, value: i, key: i }));
const getHandles = () => screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
const getSortableItems = () => document.querySelectorAll(`.${prefixCls}-right-item-sortable-item`);
const getRightText = (text: string) => screen.getByText(text, { selector: `.${prefixCls}-right-item-text` });
const queryRightText = (text: string) => screen.queryByText(text, { selector: `.${prefixCls}-right-item-text` });

describe('Svelte Transfer（浏览器）', () => {
    it('修复 #1226：点击可拖拽项时外层 Popover 保持打开', async () => {
        render(TransferBrowser, { props: { kind: 'popover', dataSource: data } });
        await userEvent.click(screen.getByRole('button', { name: 'Transfer In Popover' }));
        await waitFor(() => expect(getHandles()[0].getBoundingClientRect().top).toBeGreaterThan(0));
        await waitFor(() => expect(getSortableItems()).toHaveLength(2));

        await userEvent.click(getHandles()[0]);
        await userEvent.click(getRightText('选项名称 4'));
        expect(screen.getByRole('dialog')).toBeVisible();
        expect(getHandles()).toHaveLength(2);
    });

    it('修复 #1149：被拖拽项绘制在所在 Popover 之上', async () => {
        render(TransferBrowser, { props: { kind: 'popover', dataSource: data } });
        await userEvent.click(screen.getByRole('button', { name: 'Transfer In Popover' }));
        await waitFor(() => expect(getHandles()[0].getBoundingClientRect().top).toBeGreaterThan(0));
        await waitFor(() => expect(getSortableItems()).toHaveLength(2));
        const item = getSortableItems()[0].getBoundingClientRect();
        getHandles()[0].focus();
        await userEvent.keyboard(' ');

        const overlay = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(overlaySelector);
            expect(node).toHaveTextContent('选项名称 2');
            return node as HTMLElement;
        });
        // The Popover content is in the top layer; dnd-kit makes the overlay click-through with an inline !important
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        const rect = overlay.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(overlay.contains(hit)).toBe(true);
        expect(Math.abs(rect.left - item.left)).toBeLessThan(1);
        expect(Math.abs(rect.top - item.top)).toBeLessThan(1);

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector(overlaySelector)?.textContent?.trim()).toBe(''));
        expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('搜索容器是原生 search 元素，可按名称取得 search 角色', async () => {
        render(Transfer, { props: { dataSource: data } });
        expect(document.querySelector('search')).not.toBeNull();
        // no testing library maps <search> to a role, so read Chrome's accessibility tree
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frameId = frameTree.childFrames?.[0]?.frame.id;
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId });
        expect(nodes.some((node) => node.role?.value === 'search' && node.name?.value === zh_CN.Transfer.filter && !node.ignored)).toBe(true);
    });

    it('左侧滚动列表获得键盘焦点时显示主题焦点环', async () => {
        render(Transfer, {
            props: { dataSource: data.map((item) => ({ ...item, disabled: true })), style: 'width: 400px; height: 150px' },
        });
        const list = document.querySelector(`.${prefixCls}-left-list`) as HTMLElement;
        await tabTo(list);
        expectThemeFocusRing(list);
    });

    it('可排序手柄获得键盘焦点时显示主题焦点环', async () => {
        render(Transfer, { props: { value: [2, 4], dataSource: data, draggable: true, style: 'width: 400px; height: 300px' } });
        await waitFor(() => expect(getSortableItems()).toHaveLength(2));
        const handle = document.querySelector(`.${prefixCls}-right-item-sortable-handle`) as HTMLElement;
        await tabTo(handle);
        expectThemeFocusRing(handle);
    });

    it('键盘拖动已选项排序后触发 onChange', async () => {
        const onChange = vi.fn<(values: TransferValue, items: TransferDataItem[]) => void>();
        render(Transfer, { props: { value: [2, 4], dataSource: data, draggable: true, onChange } });
        await waitFor(() => expect(getSortableItems()).toHaveLength(2));
        getHandles()[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith([4, 2], expect.any(Array)));
        await waitFor(() => expect([...getSortableItems()].map((node) => node.textContent?.trim())).toEqual(['选项名称 4', '选项名称 2']));
    });

    it('滚动已选虚拟列表后渲染靠后的已选项', async () => {
        render(Transfer, { props: { value: many.map((item) => item.value), dataSource: many, virtualize: { height: 100, itemSize: 30 } } });
        const list = document.querySelector(`.${prefixCls}-right-virtual-list`) as HTMLElement;
        expect(queryRightText('条目 40')).toBeNull();
        list.scrollTop = 30 * 40;
        await waitFor(() => expect(getRightText('条目 40')).toBeInTheDocument());
        expect(queryRightText('条目 0')).toBeNull();
    });

    it('virtualize.height 不是像素数时由 AutoSizer 按面板测量虚拟列表的高度', async () => {
        render(Transfer, {
            props: { value: many.map((item) => item.value), dataSource: many, virtualize: { height: '100%', itemSize: 30 }, style: 'width: 600px; height: 300px' },
        });
        const list = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(`.${prefixCls}-right-virtual-list`);
            expect(node?.getBoundingClientRect().height).toBeGreaterThan(0);
            return node as HTMLElement;
        });
        expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual((document.querySelector(`.${prefixCls}-right`) as HTMLElement).getBoundingClientRect().bottom + 1);
        expect(getRightText('条目 0')).toBeInTheDocument();
        expect(queryRightText('条目 40')).toBeNull();
    });

    it('treeList 中 Tab 从搜索框到达树，Space 勾选当前行', async () => {
        const onChange = vi.fn<(values: TransferValue, items: TransferDataItem[]) => void>();
        render(Transfer, {
            props: {
                type: 'treeList',
                dataSource: [{ label: 'Asia', value: 'Asia', key: '0', children: [{ label: 'Osaka', value: 'Osaka', key: '0-0' }] }],
                onChange,
            },
        });
        const tree = screen.getByRole('tree');
        await tabTo(tree);
        expect(tree).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onChange).toHaveBeenCalledWith(['Osaka'], expect.any(Array)));
        expect(getRightText('Osaka')).toBeInTheDocument();
    });

    it('虚拟列表中 Tab 依次到达左侧勾选框与已选项的删除按钮', async () => {
        render(Transfer, { props: { value: [0], dataSource: data.slice(0, 2), virtualize: { height: 100, itemSize: 30 } } });
        const remove = screen.getByRole('button', { name: zh_CN.Transfer.remove });
        await tabTo(screen.getAllByRole('checkbox')[1]);
        expect(screen.getAllByRole('checkbox')[1]).toHaveFocus();
        await tabTo(remove);
        expect(remove).toHaveFocus();
    });

    it('排序列表加载前后已选项的位置不变', async () => {
        render(Transfer, { props: { value: [2, 4], dataSource: data, draggable: true, style: 'width: 400px; height: 300px' } });
        const textRect = () => getRightText('选项名称 4').getBoundingClientRect();
        const before = textRect();
        await waitFor(() => expect(getSortableItems()).toHaveLength(2));
        const after = textRect();
        expect(Math.abs(after.top - before.top)).toBeLessThan(1);
        expect(Math.abs(after.left - before.left)).toBeLessThan(1);
    });

    it('面板窄于表头整行时个数文字保持单行，放不下的以省略号截断，不按字换行', () => {
        const { container } = render(TransferBrowser, { props: { kind: 'pair', dataSource: data } });
        const totals = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-header-total`)];
        const [roomy, narrow] = [totals.slice(0, 2), totals.slice(2)];
        expect(narrow.map((el) => el.getBoundingClientRect().height)).toEqual(roomy.map((el) => el.getBoundingClientRect().height));
        // only the source panel's header is too narrow for its count
        expect(narrow[0].scrollWidth).toBeGreaterThan(narrow[0].clientWidth);
    });
});
