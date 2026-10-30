/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import type { OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import { countLiveListeners, render } from '@test/utils/vue';
import Modal from '../../modal';
import Switch from '../../switch';
import Tooltip from '../../tooltip';
import ConfigProvider, { defaultResponsiveMap } from '../index';
import Tree from './fixtures/tree.vue';

function layoutOf(name: string) {
    const root = screen.getByRole('switch', { name }).closest('.semi-switch') as HTMLElement;
    const box = root.getBoundingClientRect();
    const knob = (root.querySelector('.semi-switch-knob') as HTMLElement).getBoundingClientRect();
    return { direction: getComputedStyle(root).direction, knobOnLeft: knob.left - box.left < box.right - knob.right };
}

describe('ConfigProvider（浏览器）', () => {
    it('真实 matchMedia 匹配会传给消费者，卸载后移除所有媒体监听', async () => {
        // Testing Library also listens for `change` on the root element, so only media query lists are counted.
        const add = vi.spyOn(MediaQueryList.prototype, 'addEventListener');
        const remove = vi.spyOn(MediaQueryList.prototype, 'removeEventListener');
        const callback = vi.fn<OnBreakpointScreensCallback>();
        const expected = Object.fromEntries(Object.entries(defaultResponsiveMap).map(([key, query]) => [key, window.matchMedia(query).matches]));
        const view = render(Tree, { props: { outer: { responsiveObserve: true }, subscribers: [[callback]] } });
        await expect.poll(() => callback.mock.lastCall?.[0]).toEqual(expected);
        expect(countLiveListeners(add, remove, 'change')).toBe(6);
        const customMap = { ...defaultResponsiveMap, xs: '(min-width: 0px)' };
        await view.rerender({ outer: { responsiveObserve: true, responsiveMap: customMap } });
        await expect.poll(() => view.getByTestId('config').textContent).toContain('"xs":true');
        expect(countLiveListeners(add, remove, 'change')).toBe(6);
        view.unmount();
        expect(countLiveListeners(add, remove, 'change')).toBe(0);
    });

    it('嵌套方向切换只在首次进入 RTL 时增加包裹', async () => {
        const view = render(Tree, { props: { outer: { direction: 'rtl' }, inner: {}, nested: true } });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        await view.rerender({ inner: { direction: 'rtl' } });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        await view.rerender({ outer: { direction: 'ltr' }, inner: { direction: 'ltr' } });
        expect(view.container.querySelector('[dir="rtl"]')).toBeNull();
    });

    it('rtl 内嵌套 direction="ltr" 的 ConfigProvider 时，内层组件按 ltr 渲染', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                {() => (
                    <>
                        <Switch aria-label="outer" />
                        <ConfigProvider direction="ltr">{() => <Switch aria-label="inner" />}</ConfigProvider>
                    </>
                )}
            </ConfigProvider>
        ));
        expect(layoutOf('outer')).toEqual({ direction: 'rtl', knobOnLeft: false });
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });

    it('页面为 dir="rtl" 时，最外层 direction="ltr" 的 ConfigProvider 内组件按 ltr 渲染', () => {
        render(() => (
            <div dir="rtl">
                <ConfigProvider direction="ltr">{() => <Switch aria-label="inner" />}</ConfigProvider>
            </div>
        ));
        expect(layoutOf('inner')).toEqual({ direction: 'ltr', knobOnLeft: true });
    });
});

describe('弹层方向（浏览器）', () => {
    const popups = (name: string) => (
        <>
            <Tooltip visible trigger="custom">
                {{ default: () => <span>{name}</span>, content: () => `tip-${name}` }}
            </Tooltip>
            <Modal title={`modal-${name}`} visible motion={false} mask={false} />
        </>
    );
    const directionsOf = async (name: string) => {
        const tooltip = (await screen.findByText(`tip-${name}`)).closest('.semi-tooltip-wrapper') as HTMLElement;
        const modal = await screen.findByRole('dialog', { name: `modal-${name}` });
        return [getComputedStyle(tooltip).direction, getComputedStyle(modal).direction];
    };

    it('纯 rtl 时弹层按 rtl 渲染', async () => {
        render(() => <ConfigProvider direction="rtl">{() => popups('rtl')}</ConfigProvider>);
        expect(await directionsOf('rtl')).toEqual(['rtl', 'rtl']);
    });

    it('rtl 页面内 rtl 嵌套 ltr 时，内层弹层按 ltr 渲染', async () => {
        document.documentElement.dir = 'rtl';
        onTestFinished(() => document.documentElement.removeAttribute('dir'));
        render(() => (
            <ConfigProvider direction="rtl">
                {() => (
                    <>
                        {popups('outer')}
                        <ConfigProvider direction="ltr">{() => popups('inner')}</ConfigProvider>
                    </>
                )}
            </ConfigProvider>
        ));
        expect(await directionsOf('outer')).toEqual(['rtl', 'rtl']);
        expect(await directionsOf('inner')).toEqual(['ltr', 'ltr']);
    });
});
