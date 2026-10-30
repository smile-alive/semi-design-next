import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import ButtonCase from './button-case.svelte';
import GroupCase from './group-case.svelte';

type Handler = (event: MouseEvent) => void;
type Case = NonNullable<Parameters<typeof ButtonCase>[1]>['store'];

describe('Svelte Button 浏览器', () => {
    it.each([
        ['Button', { text: 'go' }, 'go'],
        ['IconButton', { kind: 'icon-button', icon: 'edit' }, 'edit'],
    ] as const)('%s：键盘焦点显示主题焦点环', async (_, initial, name) => {
        render(ButtonCase, { props: { store: createStore<Case>({ ...initial, props: { 'aria-label': name } }) } });
        const button = screen.getByRole('button', { name });
        await tabTo(button);
        expectThemeFocusRing(button);
    });

    it('禁用按钮不在 Tab 顺序中，且忽略键盘操作', async () => {
        const onclick = vi.fn<Handler>();
        render(ButtonCase, { props: { store: createStore<Case>({ props: { disabled: true, onclick }, text: 'off' }) } });
        await userEvent.keyboard('{Tab}');
        expect(screen.getByRole('button')).not.toHaveFocus();
        expect(onclick).not.toHaveBeenCalled();
    });

    it('加载中的按钮仍是 Tab 停靠点并显示加载动画；disabled 优先于 loading', async () => {
        const store = createStore<Case>({ props: { loading: true }, text: 'save' });
        const { container } = render(ButtonCase, { props: { store } });
        await tabTo(screen.getByRole('button', { name: 'save' }));
        expect(container.querySelector('[data-icon="spin"]')).toBeVisible();
        store.props = { loading: true, disabled: true };
        flushSync();
        expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
        expect(container.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('Enter 与 Space 激活 click，loading 时都不触发', async () => {
        const onclick = vi.fn<Handler>();
        const store = createStore<Case>({ props: { onclick }, text: 'go' });
        render(ButtonCase, { props: { store } });
        await tabTo(screen.getByRole('button'));
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onclick).toHaveBeenCalledTimes(2);
        store.props = { onclick, loading: true };
        flushSync();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onclick).toHaveBeenCalledTimes(2);
    });

    it('loading 切换后焦点仍在同一个按钮上', async () => {
        const store = createStore<Case>({ text: 'save' });
        render(ButtonCase, { props: { store } });
        const button = screen.getByRole('button');
        await tabTo(button);
        store.props = { loading: true };
        flushSync();
        expect(button).toHaveFocus();
        store.props = { loading: false };
        flushSync();
        expect(button).toHaveFocus();
    });

    it('ButtonGroup 内按钮按顺序获得焦点，分隔线不进入 Tab 顺序', async () => {
        render(GroupCase, { props: { store: createStore({ group: { 'aria-label': 'actions' }, items: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] }) } });
        const [a, b, c] = screen.getAllByRole('button');
        await tabTo(a);
        expectThemeFocusRing(a);
        await userEvent.keyboard('{Tab}');
        expect(b).toHaveFocus();
        await userEvent.keyboard('{Tab}');
        expect(c).toHaveFocus();
    });
});
