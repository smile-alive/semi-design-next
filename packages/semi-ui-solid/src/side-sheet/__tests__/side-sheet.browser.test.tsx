import { createSignal } from 'solid-js';
import { render, screen, waitFor, within } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { keyboardClick, tab } from '@test/utils/browser';
import SideSheet, { type SideSheetProps } from '..';
import Button from '../../button';

function Page(props: SideSheetProps) {
    const [visible, setVisible] = createSignal(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open</Button>
            <Button>Page</Button>
            <SideSheet title="Sheet" motion={false} visible={visible()} onCancel={() => setVisible(false)} {...props}>
                {props.children ?? <Button>Inside</Button>}
            </SideSheet>
        </>
    );
}

// Tab and focus modality need a real browser; the jsdom suite covers the attributes and the focus calls
describe('SideSheet 焦点（浏览器）', () => {
    it('有遮罩时 Tab 保持在抽屉内，关闭后焦点回到触发元素', async () => {
        render(() => <Page />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);

        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        const inside = screen.getByRole('button', { name: 'Inside' });
        close.focus();
        await tab();
        expect(inside).toHaveFocus();
        await tab();
        expect(close).toHaveFocus();
        await tab({ shift: true });
        expect(inside).toHaveFocus();

        close.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('无遮罩时抽屉获得焦点但 Tab 可以离开，关闭后焦点回到触发元素', async () => {
        render(() => <Page mask={false} />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        // backwards from the first control: past the document's end Firefox keeps the focus where it is
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        await tab({ shift: true });
        expect(dialog).not.toContainElement(document.activeElement as HTMLElement);

        close.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('ShadowRoot 内无遮罩的抽屉关闭后焦点回到触发元素', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(() => <Page getPopupContainer={() => mount} mask={false} />, { container: mount });
        try {
            const page = within(mount);
            const opener = page.getByRole('button', { name: 'Open' });
            await keyboardClick(opener);
            await page.findByRole('dialog', { name: 'Sheet' });
            expect(shadow.activeElement).not.toBe(opener);
            page.getByRole('button', { name: zh_CN.SideSheet.close }).focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
            expect(shadow.activeElement).toBe(opener);
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('autofocus 的元素在打开时获得焦点', async () => {
        render(() => (
            <Page>
                <input aria-label="name" autofocus />
            </Page>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'Open' }));
        await screen.findByRole('dialog', { name: 'Sheet' });
        expect(screen.getByLabelText('name')).toHaveFocus();
    });
});

describe('SideSheet 离场动画（浏览器）', () => {
    it('离场动画结束后卸载，期间保留 DOM，焦点回到触发元素', async () => {
        render(() => <Page motion />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
        expect(dialog).toBeInTheDocument();
        expect(opener).toHaveFocus();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
    });

    it('页面取消所有动画时，离场也会卸载', async () => {
        const style = document.head.appendChild(document.createElement('style'));
        style.textContent = '*, *::before, *::after { animation: none !important; }';
        try {
            render(() => <Page motion />);
            await userEvent.click(screen.getByRole('button', { name: 'Open' }));
            await screen.findByRole('dialog', { name: 'Sheet' });
            await userEvent.click(screen.getByRole('button', { name: zh_CN.SideSheet.close }));
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        } finally {
            style.remove();
        }
    });
});
