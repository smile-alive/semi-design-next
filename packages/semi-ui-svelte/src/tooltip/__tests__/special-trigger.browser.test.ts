import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import Fixture from './special-trigger.svelte';

type Store = NonNullable<Parameters<typeof Fixture>[1]>['store'];

function setup(init: Partial<Store>) {
    const store = createStore<Store>({ kind: 'button', tip: { wrapperClassName: 'wrapper' }, props: {}, after: true, ...init });
    render(Fixture, { props: { store } });
    flushSync();
    return store;
}

describe('Svelte Tooltip 的特殊触发器（浏览器）', () => {
    it.each([
        ['switch', 'switch', false],
        ['switch', 'switch', true],
        ['checkbox', 'checkbox', false],
        ['checkbox', 'checkbox', true],
    ] as const)('Tooltip 内的 %s（child=%s 起 child snippet）是单个 Tab 停靠点，输入框持有描述', async (kind, role, child) => {
        setup({ kind, child });
        const control = screen.getByRole(role);
        await userEvent.tab();
        expect(control).toHaveFocus();
        await waitFor(() => expect(control).toHaveAccessibleDescription('content'));
        expect(document.querySelector('.wrapper')?.hasAttribute('aria-describedby') ?? false).toBe(false);
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('禁用的 Button 在 click 触发下，真实点击落在 span 上并打开弹层', async () => {
        setup({ tip: { trigger: 'click', wrapperClassName: 'wrapper' }, props: { disabled: true } });
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }), { force: true });
        await expect.element(await screen.findByRole('tooltip')).toBeVisible();
    });

    it('loading 的 Button 在 hover 触发下，指针悬停在按钮位置（落在 span 上）也打开弹层', async () => {
        setup({ props: { loading: true } });
        const button = screen.getByRole('button', { name: 'trigger' });
        expect(document.elementFromPoint(button.getBoundingClientRect().x + 2, button.getBoundingClientRect().y + 2)).toBe(document.querySelector('.wrapper'));
        await userEvent.hover(document.querySelector('.wrapper') as HTMLElement);
        await expect.element(await screen.findByRole('tooltip')).toBeVisible();
    });

    it('loading 的 Button 与外层只占一个 Tab 停靠点，描述在按钮上', async () => {
        setup({ props: { loading: true } });
        const button = screen.getByRole('button', { name: 'trigger' });
        await userEvent.tab();
        expect(button).toHaveFocus();
        await waitFor(() => expect(button).toHaveAccessibleDescription('content'));
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });
});
