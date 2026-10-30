import { flushSync } from 'svelte';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { keyboardClick, tab } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { SideSheetProps } from '../interface';
import Page from './page.svelte';
import ShadowFixture from './shadow-fixture.svelte';
import SideSheetFixture from './side-sheet-fixture.svelte';
import StackFixture from './stack-fixture.svelte';

type Store = NonNullable<Parameters<typeof SideSheetFixture>[1]>['store'];

const focusInside = (element: HTMLElement) => element.contains(document.activeElement);

describe('Svelte SideSheet 焦点（浏览器）', () => {
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
        onTestFinished(() => host.remove());
        render(ShadowFixture, { target: mount, props: { mount } });
        const page = within(mount);
        const opener = page.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        await page.findByRole('dialog');
        expect(shadow.activeElement).not.toBe(opener);
        page.getByRole('button', { name: zh_CN.SideSheet.close }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
        expect(shadow.activeElement).toBe(opener);
    });

    it('Esc 关闭后焦点回到触发元素，bind:visible 写回 false', async () => {
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
        const store = createStore<Store>({ props: { visible: true, keepDOM: true, motion: true, title: 'Sheet' } satisfies SideSheetProps });
        render(SideSheetFixture, { props: { store } });
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await waitFor(() => expect(focusInside(dialog)).toBe(true));

        store.props.visible = false;
        flushSync();
        await waitFor(() => expect(document.querySelector('div.semi-sidesheet')).toHaveClass('semi-sidesheet-hidden'));
        expect(opener).toHaveFocus();
        store.props.visible = true;
        flushSync();
        await waitFor(() => expect(focusInside(dialog)).toBe(true));
    });
});

describe('Svelte SideSheet 遮罩与浮层栈（浏览器）', () => {
    it('带遮罩时页面其余部分 inert，关闭后恢复', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        onTestFinished(() => page.remove());
        render(Page);
        const opener = screen.getByRole('button', { name: 'Open' });
        await keyboardClick(opener);
        await screen.findByRole('dialog', { name: 'Sheet' });
        expect(page.inert).toBe(true);
        expect(opener.closest('[inert]')).not.toBeNull();
        expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(page.inert).toBe(false);
        expect(opener.closest('[inert]')).toBeNull();
    });

    it('无遮罩时页面保持可用', async () => {
        const page = document.body.appendChild(document.createElement('main'));
        onTestFinished(() => page.remove());
        render(Page, { props: { mask: false } });
        await keyboardClick(screen.getByRole('button', { name: 'Open' }));
        await screen.findByRole('dialog', { name: 'Sheet' });
        expect(page.inert).toBe(false);
        expect(screen.getByRole('button', { name: 'Open' }).closest('[inert]')).toBeNull();
    });

    it('Esc 只关闭栈顶的抽屉，外层抽屉随后再关，焦点逐层归还', async () => {
        render(StackFixture);
        const opener = screen.getByRole('button', { name: 'Open outer' });
        await keyboardClick(opener);
        const outer = await screen.findByRole('dialog', { name: 'Outer' });
        await waitFor(() => expect(focusInside(outer)).toBe(true));
        const openInner = screen.getByRole('button', { name: 'Open inner' });
        await keyboardClick(openInner);
        const inner = await screen.findByRole('dialog', { name: 'Inner' });
        await waitFor(() => expect(focusInside(inner)).toBe(true));
        // the layer below a modal layer is inert while the top one is open
        expect(outer.closest('[inert]')).not.toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull());
        expect(screen.getByLabelText('inner').textContent).toBe('false');
        expect(screen.getByLabelText('outer').textContent).toBe('true');
        expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
        await waitFor(() => expect(openInner).toHaveFocus());
        expect(outer.closest('[inert]')).toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(screen.getByLabelText('outer').textContent).toBe('false');
        expect(opener).toHaveFocus();
    });

    it('真实 CSS 动画：关闭后离场动画结束才卸载', async () => {
        render(Page, { props: { motion: true } });
        await keyboardClick(screen.getByRole('button', { name: 'Open' }));
        const dialog = await screen.findByRole('dialog', { name: 'Sheet' });
        await waitFor(() => expect(dialog).not.toHaveClass('semi-sidesheet-animation-content_show_right'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog).toHaveClass('semi-sidesheet-animation-content_hide_right'));
        expect(dialog.isConnected).toBe(true);
        await waitFor(() => expect(dialog.isConnected).toBe(false));
    });
});
