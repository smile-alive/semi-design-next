import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import type { OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import { countLiveListeners } from '@test/utils/dom/common';
import { createStore } from '../../_base/__tests__/store.svelte';
import { defaultResponsiveMap } from '../index';
import PopupDirection from './popup-direction.svelte';
import RtlFixture from './rtl-fixture.svelte';
import Tree, { type TreeStore } from './tree.svelte';

function layoutOf(name: string) {
    const root = screen.getByRole('switch', { name }).closest('.semi-switch') as HTMLElement;
    const box = root.getBoundingClientRect();
    const knob = (root.querySelector('.semi-switch-knob') as HTMLElement).getBoundingClientRect();
    return { direction: getComputedStyle(root).direction, knobOnLeft: knob.left - box.left < box.right - knob.right };
}

describe('Svelte ConfigProvider（浏览器）', () => {
    it('真实 matchMedia 匹配会传给消费者，卸载后移除所有媒体监听', async () => {
        const add = vi.spyOn(MediaQueryList.prototype, 'addEventListener');
        const remove = vi.spyOn(MediaQueryList.prototype, 'removeEventListener');
        const callback = vi.fn<OnBreakpointScreensCallback>();
        const expected = Object.fromEntries(Object.entries(defaultResponsiveMap).map(([key, query]) => [key, window.matchMedia(query).matches]));
        const store = createStore<TreeStore>({ outer: { responsiveObserve: true }, subscribers: [[callback]] });
        const view = render(Tree, { props: { store } });
        await expect.poll(() => callback.mock.lastCall?.[0]).toEqual(expected);
        expect(countLiveListeners(add, remove, 'change')).toBe(6);
        store.outer = { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap, xs: '(min-width: 0px)' } };
        flushSync();
        await expect.poll(() => screen.getByTestId('config').textContent).toContain('"xs":true');
        expect(countLiveListeners(add, remove, 'change')).toBe(6);
        view.unmount();
        expect(countLiveListeners(add, remove, 'change')).toBe(0);
    });

    it('rtl 内嵌套 direction="ltr" 的 ConfigProvider 时，内层组件按 ltr 渲染', () => {
        render(RtlFixture, { props: { mode: 'nested' } });
        expect(layoutOf('outer')).toEqual({ direction: 'rtl', knobOnLeft: false });
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });

    it('页面为 dir="rtl" 时，最外层 direction="ltr" 的 ConfigProvider 内组件按 ltr 渲染', () => {
        render(RtlFixture, { props: { mode: 'page' } });
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });
});

describe('Svelte ConfigProvider 弹层方向（浏览器）', () => {
    const directionsOf = async (name: string) => {
        const tooltip = (await screen.findByText(`tip-${name}`)).closest('.semi-tooltip-wrapper') as HTMLElement;
        const modal = await screen.findByRole('dialog', { name: `modal-${name}` });
        return [tooltip.getAttribute('dir'), getComputedStyle(tooltip).direction, getComputedStyle(modal).direction];
    };

    it('纯 rtl 时弹层按 rtl 渲染', async () => {
        render(PopupDirection, { props: { mode: 'rtl' } });
        expect(await directionsOf('rtl')).toEqual(['rtl', 'rtl', 'rtl']);
    });

    it('rtl 页面内 rtl 嵌套 ltr 时，内层弹层按 ltr 渲染', async () => {
        document.documentElement.dir = 'rtl';
        onTestFinished(() => document.documentElement.removeAttribute('dir'));
        render(PopupDirection, { props: { mode: 'nested' } });
        expect(await directionsOf('outer')).toEqual(['rtl', 'rtl', 'rtl']);
        expect(await directionsOf('inner')).toEqual(['ltr', 'ltr', 'ltr']);
    });
});
