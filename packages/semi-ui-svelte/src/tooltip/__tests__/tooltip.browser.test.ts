import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TooltipProps } from '../interface';
import TooltipFixture from './tooltip-fixture.svelte';
import TooltipFocusInput from './tooltip-focus-input.svelte';
import TooltipStyle from './tooltip-style.svelte';

type Store = { value?: boolean; accept: boolean; log: string[]; shown: boolean; child: boolean; focus: boolean; arrow: boolean };

function popup() {
    const element = document.querySelector<HTMLElement>('.semi-tooltip-wrapper');
    if (!element) throw new Error('Tooltip 尚未挂载');
    return element;
}

const settled = () => waitFor(() => expect(popup().getAnimations()).toHaveLength(0));
function center(element: Element) {
    const rect = element.getBoundingClientRect();
    return rect.left + rect.width / 2;
}

function setup(props: Omit<TooltipProps, 'visible' | 'children' | 'child' | 'content' | 'arrow'> = {}, init: Partial<Store> = {}) {
    const store = createStore<Store>({ accept: true, log: [], shown: true, child: true, focus: false, arrow: false, ...init });
    render(TooltipFixture, { props: { mode: 'bind', store, props } });
    flushSync();
    return store;
}

describe('Svelte Tooltip 浏览器', () => {
    it('悬停显示在触发器上方并居中对齐，离开后卸载', async () => {
        setup();
        const button = screen.getByRole('button', { name: 'trigger' });
        button.style.margin = '120px';
        await userEvent.hover(button);
        await expect.element(await screen.findByRole('tooltip')).toBeVisible();
        expect(popup().matches(':popover-open')).toBe(true);
        expect(popup()).toHaveAttribute('x-placement', 'top');
        expect(popup().getBoundingClientRect().bottom).toBeLessThanOrEqual(button.getBoundingClientRect().top);
        expect(Math.abs(center(popup()) - center(button))).toBeLessThan(1);
        await userEvent.unhover(button);
        await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    });

    it('进出场是 keyframes 动画：出场期间弹层仍在顶层可见，结束后才隐藏并只通知一次 afterClose', async () => {
        const store = setup({ trigger: 'custom', keepDOM: true }, { value: true });
        await waitFor(() => expect(popup().matches(':popover-open')).toBe(true));
        const element = popup();
        expect(element.getAnimations().map((animation) => (animation as CSSAnimation).animationName)).toEqual(['semi-tooltip-zoom-in']);
        await settled();

        store.value = false;
        flushSync();
        const [exit] = element.getAnimations() as CSSAnimation[];
        expect(exit.animationName).toBe('semi-tooltip-zoom-out');
        exit.pause();
        exit.currentTime = 0;
        expect(element.matches(':popover-open')).toBe(true);
        expect(element.checkVisibility()).toBe(true);
        expect(store.log).not.toContain('afterClose');
        exit.finish();
        await waitFor(() => expect(element.matches(':popover-open')).toBe(false));
        expect(element.checkVisibility()).toBe(false);
        expect(store.log.filter((entry) => entry === 'afterClose')).toHaveLength(1);
    });

    it('hover 触发且延迟为 0 时，初始焦点从触发器移入弹层后弹层保持打开，Escape 把焦点还给触发器', async () => {
        setup({ mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false, returnFocusOnClose: true }, { focus: true });
        const button = screen.getByRole('button', { name: 'trigger' });
        button.focus();
        const inner = await screen.findByRole('textbox', { name: 'inner' });
        await waitFor(() => expect(inner).toHaveFocus());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(popup().matches(':popover-open')).toBe(true);
        expect(inner).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(document.querySelector('.semi-tooltip-wrapper')).toBeNull());
        expect(button).toHaveFocus();
    });

    it('initialFocusRef 收到 Input 组件句柄时，焦点落在它内部的 input，而不是弹层里第一个按钮', async () => {
        render(TooltipFocusInput);
        await userEvent.click(screen.getByText('trigger'));
        const inner = await screen.findByRole('textbox', { name: 'inner' });
        await waitFor(() => expect(inner).toHaveFocus());
    });

    it('弹层打开时改变 style，定位声明保留且弹层仍在触发器上方', async () => {
        const store = createStore({ style: 'background-color: red' });
        render(TooltipStyle, { props: { store } });
        flushSync();
        await waitFor(() => expect(popup().matches(':popover-open')).toBe(true));
        const button = screen.getByText('trigger');
        const placed = () => ({ position: popup().style.position, top: popup().style.top, left: popup().style.left });
        await waitFor(() => expect(placed().top).not.toBe(''));
        // the content mounts after the first placement and the resize observer places it again
        await new Promise((resolve) => setTimeout(resolve, 100));
        const before = placed();
        store.style = 'background-color: blue; color: white';
        flushSync();
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(popup().style.backgroundColor).toBe('blue');
        expect(placed()).toEqual(before);
        expect(popup().getBoundingClientRect().bottom).toBeLessThanOrEqual(button.getBoundingClientRect().top);
    });

    it('淡出期间重新打开保留同一弹层', async () => {
        const store = setup({ trigger: 'custom' }, { value: true });
        await waitFor(() => expect(popup().matches(':popover-open')).toBe(true));
        await settled();
        const element = popup();
        store.value = false;
        flushSync();
        expect(element.getAnimations().length).toBeGreaterThan(0);
        store.value = true;
        flushSync();
        await settled();
        expect(popup()).toBe(element);
        expect(element.matches(':popover-open')).toBe(true);
    });
});
