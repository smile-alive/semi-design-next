/** @jsxImportSource vue */
import { defineComponent, ref } from 'vue';
import { screen, waitFor, within } from '@testing-library/vue';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { keyboardClick, tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Button from '../../button';
import SideSheet from '../side-sheet.vue';
import Page from './fixtures/page.vue';

const focusInside = (element: HTMLElement) => element.contains(document.activeElement);

describe('SideSheet 焦点（浏览器）', () => {
    it('有遮罩时 Tab 保持在抽屉内，关闭后焦点回到触发元素', async () => {
        render(Page);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await waitFor(() => expect(focusInside(dialog)).toBe(true));

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
        render(Page, { props: { mask: false } });
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await waitFor(() => expect(focusInside(dialog)).toBe(true));
        // backwards from the first control: past the document's end Firefox keeps the focus where it is
        const close = screen.getByRole('button', { name: zh_CN.SideSheet.close });
        close.focus();
        await tab({ shift: true });
        expect(focusInside(dialog)).toBe(false);

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
        const Demo = defineComponent(() => {
            const visible = ref(false);
            return () => (
                <>
                    <Button onClick={() => (visible.value = true)}>{() => 'Open'}</Button>
                    <SideSheet closeOnEsc getPopupContainer={() => mount} mask={false} motion={false} title="Sheet" visible={visible.value} onUpdate:visible={(value: boolean) => (visible.value = value)}>
                        {() => <Button>{() => 'Inside'}</Button>}
                    </SideSheet>
                </>
            );
        });
        const view = render(Demo, { container: mount });
        try {
            const page = within(mount);
            const opener = page.getByRole('button', { name: 'Open' });
            await keyboardClick(opener);
            await page.findByRole('dialog');
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

    it('Esc 关闭后焦点回到触发元素', async () => {
        render(Page);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        await screen.findByRole('dialog', { name: 'Sheet' });
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(opener).toHaveFocus();
        expect(screen.getByLabelText('visible').textContent).toBe('false');
    });

    it('keepDOM 有动画时关闭再重开，焦点落在对话框内', async () => {
        const opener = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => opener.remove());
        opener.focus();
        const view = render(SideSheet, {
            props: { visible: true, keepDOM: true, motion: true, title: 'Sheet' },
            slots: { default: () => <Button>{() => 'Inside'}</Button> },
        });
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await waitFor(() => expect(focusInside(dialog)).toBe(true));

        await view.rerender({ visible: false });
        await waitFor(() => expect(document.querySelector('div.semi-sidesheet')).toHaveClass('semi-sidesheet-hidden'));
        expect(opener).toHaveFocus();
        await view.rerender({ visible: true });
        await waitFor(() => expect(focusInside(dialog)).toBe(true));
    });
});
