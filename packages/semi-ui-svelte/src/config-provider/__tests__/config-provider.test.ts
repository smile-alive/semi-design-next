import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockMatchMediaCore } from '@test/utils/dom/match-media-core';
import { createStore } from '../../_base/__tests__/store.svelte';
import { defaultResponsiveMap } from '../index';
import type { ContextValue } from '../interface';
import ConsumerFixture from './consumer-fixture.svelte';
import Tree, { type TreeStore } from './tree.svelte';

const allFalse = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };

function setup(initial: TreeStore = {}) {
    const store = createStore<TreeStore>(initial);
    const view = render(Tree, { props: { store } });
    const update = (next: Partial<TreeStore>) => {
        Object.assign(store, next);
        flushSync();
    };
    return { store, view, update };
}

// the mock's fire is synchronous; Svelte needs a flush for the screens state to reach readers
function mockMedia(matching: string[] = []) {
    const mock = mockMatchMediaCore(matching);
    return {
        ...mock,
        fire(media: string, matches: boolean) {
            mock.fire(media, matches);
            flushSync();
        },
    };
}

describe('Svelte ConfigProvider', () => {
    it('useConfig 与 ConfigConsumer 读取所有字段，且 value 不含 children', () => {
        const getPopupContainer = () => document.body;
        const responsiveMap = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const consumerStore = createStore({ props: { direction: 'ltr' as const, locale: en_US, timeZone: 'Asia/Tokyo', getPopupContainer, responsiveMap }, onSeen });
        render(ConsumerFixture, { props: { store: consumerStore } });
        expect(onSeen.mock.calls[0][0]).toEqual({
            direction: 'ltr',
            locale: en_US,
            timeZone: 'Asia/Tokyo',
            getPopupContainer,
            responsiveMap,
            responsiveObserve: false,
            screens: allFalse,
            onBreakpoint: expect.any(Function),
        });
        expect(onSeen.mock.calls[0][0]).not.toHaveProperty('children');
        expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
    });

    it('provider 外上下文为空，provider 内只填充配置默认值', () => {
        const outside = vi.fn<(value: ContextValue) => void>();
        // Tree always wraps in a provider, so the outside case renders the probe through ConsumerFixture's bare mode
        render(ConsumerFixture, { props: { store: createStore({ props: undefined, onSeen: outside }) } });
        expect(outside.mock.calls[0][0]).toEqual({});
        const inside = vi.fn<(value: ContextValue) => void>();
        setup({ onSeen: inside });
        expect(inside.mock.calls[0][0]).toMatchObject({
            direction: 'ltr',
            responsiveObserve: false,
            responsiveMap: defaultResponsiveMap,
            screens: allFalse,
        });
        expect(inside.mock.calls[0][0].locale).toBeUndefined();
        expect(inside.mock.calls[0][0].timeZone).toBeUndefined();
    });

    it('嵌套 provider 只覆盖已定义的字段，显式 null 清空语言', () => {
        const getPopupContainer = () => document.body;
        const map = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const outer = { direction: 'rtl' as const, locale: en_US, timeZone: 'Asia/Tokyo', getPopupContainer, responsiveMap: map, responsiveObserve: true };
        const { update } = setup({ outer, inner: { timeZone: 8 }, nested: true, onSeen });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, timeZone: 8 });
        update({ inner: { direction: 'ltr', locale: null, timeZone: undefined } });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, direction: 'ltr', locale: null });
        update({ outer: { ...outer, timeZone: 9 }, inner: {} });
        expect(onSeen.mock.lastCall?.[0].timeZone).toBe(9);
    });

    it('嵌套 RTL 只生成一层包裹，切换方向时响应更新', () => {
        const { view, update } = setup({ outer: { direction: 'rtl' }, inner: {}, nested: true });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        update({ inner: { direction: 'rtl' } });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        update({ outer: { direction: 'ltr' }, inner: {} });
        expect(view.container.querySelector('[dir="rtl"]')).toBeNull();
        expect(screen.getByTestId('config')).toHaveTextContent('"direction":"ltr"');
    });

    it('无根 DOM 的 provider 和 consumer 丢弃未声明属性', () => {
        const store = createStore({ props: { direction: 'rtl' as const, id: 'provider', class: 'external', 'data-extra': 'extra' } });
        const view = render(ConsumerFixture, { props: { store } });
        expect(view.container.querySelector('[id], .external, [data-extra]')).toBeNull();
        expect(screen.getByText('内容').parentElement).toHaveAttribute('dir', 'rtl');
    });

    it('同内容 responsiveMap 的新字面量不重新注册、不重复通知订阅者', () => {
        const media = mockMedia([defaultResponsiveMap.md]);
        const callback = vi.fn<OnBreakpointScreensCallback>();
        const { update } = setup({ outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } }, subscribers: [[callback]] });
        const calls = callback.mock.calls.length;
        const queries = vi.mocked(window.matchMedia).mock.calls.length;
        update({ outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } } });
        expect(callback).toHaveBeenCalledTimes(calls);
        expect(vi.mocked(window.matchMedia).mock.calls.length).toBe(queries);
        expect(media.totalHandlers()).toBe(6);
    });

    describe('断点', () => {
        it('关闭时不注册监听，订阅立即得到初始值，每个 provider 只告警一次', () => {
            const media = mockMedia([defaultResponsiveMap.md]);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn<OnBreakpointScreensCallback>();
            setup({ subscribers: [[callback], [vi.fn<OnBreakpointScreensCallback>()]] });
            expect(callback).toHaveBeenCalledExactlyOnceWith(allFalse);
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(media.totalHandlers()).toBe(0);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('responsiveObserve');
        });

        it('首个订阅者惰性注册并立即接收匹配，变化同时更新 screens', () => {
            const media = mockMedia([defaultResponsiveMap.sm, defaultResponsiveMap.md]);
            const { update } = setup({ outer: { responsiveObserve: true } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            update({ subscribers: [[callback]] });
            expect(callback).toHaveBeenCalledExactlyOnceWith({ ...allFalse, sm: true, md: true });
            for (const query of Object.values(defaultResponsiveMap)) expect(media.handlerCount(query)).toBe(1);
            media.fire(defaultResponsiveMap.lg, true);
            expect(callback).toHaveBeenLastCalledWith({ ...allFalse, sm: true, md: true, lg: true });
            expect(screen.getByTestId('config')).toHaveTextContent('"lg":true');
        });

        it('单项签名立即报告已选断点，并过滤其余变化', () => {
            const media = mockMedia([defaultResponsiveMap.md]);
            const callback = vi.fn<OnBreakpointChangeCallback>();
            setup({ outer: { responsiveObserve: true }, subscribers: [[['md', 'lg'], callback]] });
            expect(callback.mock.calls).toEqual([
                ['md', true],
                ['lg', false],
            ]);
            callback.mockClear();
            media.fire(defaultResponsiveMap.xs, true);
            expect(callback).not.toHaveBeenCalled();
            media.fire(defaultResponsiveMap.lg, true);
            expect(callback).toHaveBeenCalledExactlyOnceWith('lg', true);
        });

        it('最后一个订阅者离开或 provider 卸载时清理，并支持重新订阅', () => {
            const media = mockMedia();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            const { view, update } = setup({ outer: { responsiveObserve: true }, subscribers: [[callback], [['xs'], vi.fn<OnBreakpointChangeCallback>()]] });
            expect(media.totalHandlers()).toBe(6);
            update({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            update({ subscribers: [] });
            expect(media.totalHandlers()).toBe(0);
            update({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            view.unmount();
            expect(media.totalHandlers()).toBe(0);
        });

        it('responsiveMap 在订阅前不注册，订阅后换 map 才替换监听，并通知变化的匹配结果', () => {
            const media = mockMedia(['(min-width: 1px)']);
            const custom = { ...defaultResponsiveMap, xs: '(min-width: 1px)' };
            const { update } = setup({ outer: { responsiveObserve: true } });
            update({ outer: { responsiveObserve: true, responsiveMap: custom } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            update({ subscribers: [[callback]] });
            expect(callback).toHaveBeenLastCalledWith({ ...allFalse, xs: true });
            update({ outer: { responsiveObserve: true } });
            expect(media.handlerCount(custom.xs)).toBe(0);
            expect(media.handlerCount(defaultResponsiveMap.xs)).toBe(1);
            expect(media.totalHandlers()).toBe(6);
            // the default map no longer matches xs: subscribers hear it once
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenLastCalledWith(allFalse);
        });

        it('切换 responsiveObserve 对已有订阅者注销与重新注册', () => {
            const media = mockMedia([defaultResponsiveMap.xl]);
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { update } = setup({ subscribers: [[vi.fn<OnBreakpointScreensCallback>()]] });
            expect(media.totalHandlers()).toBe(0);
            update({ outer: { responsiveObserve: true } });
            expect(media.totalHandlers()).toBe(6);
            expect(screen.getByTestId('config')).toHaveTextContent('"xl":true');
            update({ outer: { responsiveObserve: false } });
            expect(media.totalHandlers()).toBe(0);
        });

        it('换 map 同时挂载新订阅者时，新订阅者立即读取本次配置', () => {
            const media = mockMedia(['(min-width: 1px)']);
            const first = vi.fn<OnBreakpointScreensCallback>();
            const second = vi.fn<OnBreakpointScreensCallback>();
            const { update } = setup({ outer: { responsiveObserve: true }, subscribers: [[first]] });
            update({
                outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap, xs: '(min-width: 1px)' } },
                subscribers: [[first], [second]],
            });
            expect(second).toHaveBeenCalledExactlyOnceWith({ ...allFalse, xs: true });
            expect(media.totalHandlers()).toBe(6);
        });
    });
});
