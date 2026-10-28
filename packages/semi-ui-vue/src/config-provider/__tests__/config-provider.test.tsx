/** @jsxImportSource vue */
import { nextTick, toRaw } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockMatchMedia, render } from '@test/utils/vue';
import ConfigProvider, { ConfigConsumer, defaultResponsiveMap } from '../index';
import type { ContextValue } from '../interface';
import Probe from './fixtures/probe.vue';
import Tree from './fixtures/tree.vue';

const allFalse = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };

describe('ConfigProvider', () => {
    it('composable 与 ConfigConsumer 读取所有字段，且 value 不含插槽', () => {
        const getPopupContainer = () => document.body;
        const responsiveMap = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const view = render(ConfigProvider, {
            props: { direction: 'ltr', locale: en_US, timeZone: 'Asia/Tokyo', getPopupContainer, responsiveMap },
            slots: {
                default: () => (
                    <>
                        <Probe onSeen={onSeen} />
                        <ConfigConsumer>{{ default: (config: ContextValue) => <span>{config.timeZone}</span> }}</ConfigConsumer>
                    </>
                ),
            },
        });
        const value = onSeen.mock.calls[0][0];
        expect(value).toEqual({
            direction: 'ltr',
            locale: en_US,
            timeZone: 'Asia/Tokyo',
            getPopupContainer,
            responsiveMap,
            responsiveObserve: false,
            screens: allFalse,
            onBreakpoint: expect.any(Function),
        });
        expect(toRaw(value.responsiveMap)).toBe(responsiveMap);
        expect(value).not.toHaveProperty('children');
        expect(view.getByText('Asia/Tokyo')).toBeInTheDocument();
    });

    it('provider 外上下文为空，provider 内只填充配置默认值', () => {
        const outside = vi.fn<(value: ContextValue) => void>();
        render(Probe, { props: { onSeen: outside } });
        expect(outside).toHaveBeenCalledWith({});
        const inside = vi.fn<(value: ContextValue) => void>();
        render(Tree, { props: { onSeen: inside } });
        expect(inside.mock.calls[0][0]).toMatchObject({
            direction: 'ltr',
            responsiveObserve: false,
            responsiveMap: defaultResponsiveMap,
            screens: allFalse,
        });
        expect(inside.mock.calls[0][0].locale).toBeUndefined();
        expect(inside.mock.calls[0][0].timeZone).toBeUndefined();
        expect(ConfigProvider.defaultResponsiveMap).toBe(defaultResponsiveMap);
    });

    it('嵌套 provider 只覆盖已定义的字段，显式 null 清空语言', async () => {
        const getPopupContainer = () => document.body;
        const map = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const outer = {
            direction: 'rtl' as const,
            locale: en_US,
            timeZone: 'Asia/Tokyo',
            getPopupContainer,
            responsiveMap: map,
            responsiveObserve: true,
        };
        const view = render(Tree, { props: { outer, inner: { timeZone: 8 }, nested: true, onSeen } });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, timeZone: 8 });
        await view.rerender({ inner: { direction: 'ltr', locale: null, timeZone: undefined } });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, direction: 'ltr', locale: null });
        await view.rerender({ outer: { ...outer, timeZone: 9 }, inner: {} });
        expect(onSeen.mock.lastCall?.[0].timeZone).toBe(9);
    });

    it('嵌套 RTL 只生成一层包裹，切换方向时响应更新', async () => {
        const view = render(Tree, {
            props: { outer: { direction: 'rtl' }, inner: { direction: 'rtl' }, nested: true },
        });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        await view.rerender({ outer: { direction: 'ltr' }, inner: {} });
        expect(view.container.querySelector('[dir="rtl"]')).toBeNull();
        expect(view.getByTestId('config')).toHaveTextContent('"direction":"ltr"');
    });

    it('无根 DOM 的 provider 和 consumer 丢弃未声明属性', () => {
        const view = render(ConfigProvider, {
            props: { direction: 'rtl' },
            attrs: { id: 'provider', class: 'external', 'data-extra': 'extra' },
            slots: {
                default: () => (
                    <ConfigConsumer {...{ id: 'consumer' }}>
                        {{
                            default: () => <span>内容</span>,
                        }}
                    </ConfigConsumer>
                ),
            },
        });
        expect(view.container.querySelector('[id], .external, [data-extra]')).toBeNull();
        expect(view.getByText('内容').parentElement).toHaveAttribute('dir', 'rtl');
    });

    it('相同配置与同内容 responsiveMap 不改变上下文引用或重新注册', async () => {
        const media = mockMatchMedia([defaultResponsiveMap.md]);
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const callback = vi.fn<OnBreakpointScreensCallback>();
        const view = render(Tree, {
            props: {
                outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } },
                subscribers: [[callback]],
                onSeen,
            },
        });
        await nextTick();
        const value = onSeen.mock.lastCall?.[0];
        const count = onSeen.mock.calls.length;
        const queries = vi.mocked(window.matchMedia).mock.calls.length;
        await view.rerender({ outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } } });
        expect(onSeen.mock.lastCall?.[0]).toBe(value);
        expect(onSeen).toHaveBeenCalledTimes(count);
        expect(vi.mocked(window.matchMedia).mock.calls.length).toBe(queries);
        expect(media.totalHandlers()).toBe(6);
    });

    describe('断点', () => {
        it('关闭时不注册监听，订阅立即得到初始值，每个 provider 只告警一次', () => {
            const media = mockMatchMedia([defaultResponsiveMap.md]);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn<OnBreakpointScreensCallback>();
            render(Tree, { props: { subscribers: [[callback], [vi.fn<OnBreakpointScreensCallback>()]] } });
            expect(callback).toHaveBeenCalledExactlyOnceWith(allFalse);
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(media.totalHandlers()).toBe(0);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('responsiveObserve');
        });

        it('首个订阅者惰性注册并立即接收匹配，变化同时更新 screens', async () => {
            const media = mockMatchMedia([defaultResponsiveMap.sm, defaultResponsiveMap.md]);
            const view = render(Tree, { props: { outer: { responsiveObserve: true } } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            await view.rerender({ subscribers: [[callback]] });
            expect(callback).toHaveBeenCalledExactlyOnceWith({ ...allFalse, sm: true, md: true });
            for (const query of Object.values(defaultResponsiveMap)) expect(media.handlerCount(query)).toBe(1);
            await media.fire(defaultResponsiveMap.lg, true);
            expect(callback).toHaveBeenLastCalledWith({ ...allFalse, sm: true, md: true, lg: true });
            expect(view.getByTestId('config')).toHaveTextContent('"lg":true');
        });

        it('单项签名立即报告已选断点，并过滤其余变化', async () => {
            const media = mockMatchMedia([defaultResponsiveMap.md]);
            const callback = vi.fn<OnBreakpointChangeCallback>();
            render(Tree, { props: { outer: { responsiveObserve: true }, subscribers: [[['md', 'lg'], callback]] } });
            expect(callback.mock.calls).toEqual([
                ['md', true],
                ['lg', false],
            ]);
            callback.mockClear();
            await media.fire(defaultResponsiveMap.xs, true);
            expect(callback).not.toHaveBeenCalled();
            await media.fire(defaultResponsiveMap.lg, true);
            expect(callback).toHaveBeenCalledExactlyOnceWith('lg', true);
        });

        it('最后一个订阅者离开或 provider 卸载时清理，并支持重新订阅', async () => {
            const media = mockMatchMedia();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            const view = render(Tree, {
                props: {
                    outer: { responsiveObserve: true },
                    subscribers: [[callback], [['xs'], vi.fn<OnBreakpointChangeCallback>()]],
                },
            });
            expect(media.totalHandlers()).toBe(6);
            await view.rerender({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            await view.rerender({ subscribers: [] });
            expect(media.totalHandlers()).toBe(0);
            await view.rerender({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            view.unmount();
            expect(media.totalHandlers()).toBe(0);
        });

        it('responsiveMap 在订阅前不注册，订阅后换 map 才替换监听，并通知变化的匹配结果', async () => {
            const media = mockMatchMedia(['(min-width: 1px)']);
            const custom = { ...defaultResponsiveMap, xs: '(min-width: 1px)' };
            const view = render(Tree, { props: { outer: { responsiveObserve: true } } });
            await view.rerender({ outer: { responsiveObserve: true, responsiveMap: custom } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            await view.rerender({ subscribers: [[callback]] });
            expect(callback).toHaveBeenLastCalledWith({ ...allFalse, xs: true });
            await view.rerender({ outer: { responsiveObserve: true } });
            expect(media.handlerCount(custom.xs)).toBe(0);
            expect(media.handlerCount(defaultResponsiveMap.xs)).toBe(1);
            expect(media.totalHandlers()).toBe(6);
            // the new map no longer matches xs: subscribers hear it once
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenLastCalledWith(allFalse);
        });

        it('切换 responsiveObserve 对已有订阅者注销与重新注册', async () => {
            const media = mockMatchMedia([defaultResponsiveMap.xl]);
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn<OnBreakpointScreensCallback>();
            const view = render(Tree, { props: { subscribers: [[callback]] } });
            expect(media.totalHandlers()).toBe(0);
            await view.rerender({ outer: { responsiveObserve: true } });
            expect(media.totalHandlers()).toBe(6);
            expect(view.getByTestId('config')).toHaveTextContent('"xl":true');
            await view.rerender({ outer: { responsiveObserve: false } });
            expect(media.totalHandlers()).toBe(0);
        });

        it('换 map 同时挂载新订阅者时，新订阅者立即读取本次配置', async () => {
            const media = mockMatchMedia(['(min-width: 1px)']);
            const first = vi.fn<OnBreakpointScreensCallback>();
            const second = vi.fn<OnBreakpointScreensCallback>();
            const view = render(Tree, { props: { outer: { responsiveObserve: true }, subscribers: [[first]] } });
            await view.rerender({
                outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap, xs: '(min-width: 1px)' } },
                subscribers: [[first], [second]],
            });
            expect(second).toHaveBeenCalledExactlyOnceWith({ ...allFalse, xs: true });
            expect(media.totalHandlers()).toBe(6);
        });
    });
    // Vue has no class context API, React.memo or StrictMode effect replay; composable/slot and cleanup cases cover its lifecycle.
});
