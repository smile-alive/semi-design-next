import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, SideSheet } from '@fibrae/semi-ui-react';
import { keyboardClick, tab } from '@test/utils/browser';

function Page(props) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open</Button>
            <Button>Page</Button>
            <SideSheet title="Sheet" motion={false} visible={visible} onCancel={() => setVisible(false)} {...props}>
                <Button>Inside</Button>
            </SideSheet>
        </>
    );
}

// Tab and focus modality need a real browser; the jsdom suite covers the attributes and the focus calls
describe('SideSheet 焦点（浏览器）', () => {
    it('有遮罩时 Tab 保持在抽屉内，关闭后焦点回到触发元素', async () => {
        render(<Page />);
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
        render(<Page mask={false} />);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
        // backwards from the first control: past the document's end Firefox keeps the focus where it is
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        await tab({ shift: true });
        expect(screen.getByRole('button', { name: 'Page' })).toHaveFocus();

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
        const view = render(<Page getPopupContainer={() => mount} mask={false} />, { container: mount });
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
});
