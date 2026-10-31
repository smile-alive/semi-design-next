import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { cdp, userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Transfer from '..';
import Button from '../../button';
import Popover from '../../popover';

const prefixCls = `${BASE_CLASS_PREFIX}-transfer`;
const overlaySelector = `.${prefixCls}-right-item-drag-item-move`;
const data = Array.from({ length: 6 }, (_v, i) => ({ label: `选项名称 ${i}`, value: i, key: i }));
const getHandles = () => screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });

async function openTransferInPopover() {
    render(() => (
        // motionless: a scaling popup offsets the item measured before the transition ends from dnd-kit's overlay
        <Popover aria-label="Details" content={<Transfer style={{ width: '400px', height: '300px' }} defaultValue={[2, 4]} dataSource={data} draggable />} motion={false} position="bottomLeft" trigger="click">
            {(t) => <Button {...t()}>Transfer In Popover</Button>}
        </Popover>
    ));
    await userEvent.click(screen.getByRole('button', { name: 'Transfer In Popover' }));
    await waitFor(() => expect(getHandles()[0].getBoundingClientRect().top).toBeGreaterThan(0));
    // the sortable list loads lazily; until then the handles belong to a static stand-in without drag listeners
    await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-right-item-sortable-item`)).toHaveLength(2));
}

describe('Transfer（浏览器）', () => {
    it('修复 #1226：点击可拖拽项时外层 Popover 保持打开', async () => {
        await openTransferInPopover();
        await userEvent.click(getHandles()[0]);
        await userEvent.click(screen.getByText('选项名称 4', { selector: `.${prefixCls}-right-item-text` }));
        expect(screen.getByRole('dialog')).toBeVisible();
        expect(getHandles()).toHaveLength(2);
    });

    it('修复 #1149：被拖拽项绘制在所在 Popover 之上', async () => {
        await openTransferInPopover();
        const item = (document.querySelector(`.${prefixCls}-right-item-sortable-item`) as HTMLElement).getBoundingClientRect();
        getHandles()[0].focus();
        await userEvent.keyboard(' ');

        const overlay = await waitFor(() => {
            const node = document.querySelector<HTMLElement>(overlaySelector);
            expect(node).toHaveTextContent('选项名称 2');
            return node as HTMLElement;
        });
        // dnd-kit makes the overlay click-through; the inline important outranks its stylesheet so it can be hit-tested
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        const rect = overlay.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        expect(overlay.contains(hit)).toBe(true);
        expect(Math.abs(rect.left - item.left)).toBeLessThan(1);
        expect(Math.abs(rect.top - item.top)).toBeLessThan(1);

        await userEvent.keyboard('{Escape}');
        // the overlay element exists only while dragging
        await waitFor(() => expect(document.querySelector(overlaySelector)).toBeNull());
        expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('搜索容器是原生 search 元素，可按名称取得 search 角色', async () => {
        render(() => <Transfer dataSource={data} />);
        expect(document.querySelector('search')).not.toBeNull();
        // neither dom-testing-library nor the vitest locator maps <search> to a role, so read Chrome's accessibility tree
        const { frameTree } = await cdp().send('Page.getFrameTree');
        const frameId = frameTree.childFrames?.[0]?.frame.id;
        const { nodes } = await cdp().send('Accessibility.getFullAXTree', { frameId });
        expect(nodes.some((node) => node.role?.value === 'search' && node.name?.value === zh_CN.Transfer.filter && !node.ignored)).toBe(true);
    });

    it('左侧滚动列表获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(() => <Transfer style={{ width: '400px', height: '150px' }} dataSource={data.map((item) => ({ ...item, disabled: true }))} />);
        const list = container.querySelector(`.${prefixCls}-left-list`) as HTMLElement;
        await tabTo(list);
        expectThemeFocusRing(list);
    });

    it('可排序手柄获得键盘焦点时显示主题焦点环', async () => {
        const { container } = render(() => <Transfer style={{ width: '400px', height: '300px' }} defaultValue={[2, 4]} dataSource={data} draggable />);
        await waitFor(() => expect(container.querySelectorAll(`.${prefixCls}-right-item-sortable-item`)).toHaveLength(2));
        const handle = container.querySelector(`.${prefixCls}-right-item-sortable-handle`) as HTMLElement;
        await tabTo(handle);
        expectThemeFocusRing(handle);
    });

    it('滚动已选虚拟列表后渲染靠后的已选项', async () => {
        const many = Array.from({ length: 50 }, (_v, i) => ({ label: `条目 ${i}`, value: i, key: i }));
        const { container } = render(() => <Transfer defaultValue={many.map((item) => item.value)} dataSource={many} virtualize={{ height: 100, itemSize: 30 }} />);
        const list = container.querySelector(`.${prefixCls}-right-virtual-list`) as HTMLElement;
        expect(screen.queryByText('条目 40', { selector: `.${prefixCls}-right-item-text` })).toBeNull();
        list.scrollTop = 30 * 40;
        await waitFor(() => expect(screen.getByText('条目 40', { selector: `.${prefixCls}-right-item-text` })).toBeInTheDocument());
        expect(screen.queryByText('条目 0', { selector: `.${prefixCls}-right-item-text` })).toBeNull();
    });

    it('virtualize 的 height 不是数字时，虚拟列表填满已选面板', async () => {
        const many = Array.from({ length: 50 }, (_v, i) => ({ label: `条目 ${i}`, value: i, key: i }));
        const { container } = render(() => <Transfer style={{ width: '400px', height: '300px' }} defaultValue={many.map((item) => item.value)} dataSource={many} virtualize={{ height: '100%', itemSize: 30 }} />);
        const list = await waitFor(() => {
            const node = container.querySelector<HTMLElement>(`.${prefixCls}-right-virtual-list`);
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });
        const panel = (container.querySelector(`.${prefixCls}-right`) as HTMLElement).getBoundingClientRect();
        expect(list.getBoundingClientRect().height).toBeGreaterThan(100);
        expect(list.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.bottom + 1);
        expect(screen.getByText('条目 0', { selector: `.${prefixCls}-right-item-text` })).toBeInTheDocument();
    });

    it('面板窄于表头整行时个数文字保持单行，放不下的以省略号截断，不按字换行', () => {
        const { container } = render(() => (
            <>
                <Transfer style={{ width: '600px' }} dataSource={data} />
                <Transfer style={{ 'min-width': 0, width: '260px' }} dataSource={data} />
            </>
        ));
        const totals = [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-header-total`)];
        const [roomy, narrow] = [totals.slice(0, 2), totals.slice(2)];
        expect(narrow.map((el) => el.getBoundingClientRect().height)).toEqual(roomy.map((el) => el.getBoundingClientRect().height));
        // only the source panel's header is too narrow for its count
        expect(narrow[0].scrollWidth).toBeGreaterThan(narrow[0].clientWidth);
    });
});
