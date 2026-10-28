import { Index, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockMatchMedia } from '@test/utils/solid';
import ConfigProvider, { ConfigConsumer, type ConfigConsumerProps, type ConfigProviderProps, type ContextValue, defaultResponsiveMap, useConfig } from '../index';

const allFalse = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };

type SubscribeArgs = [OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback];
type ProviderConfig = Omit<ConfigProviderProps, 'children'>;

interface TreeProps {
    outer?: ProviderConfig;
    inner?: ProviderConfig;
    nested?: boolean;
    subscribers?: SubscribeArgs[];
    onSeen?: (value: ContextValue) => void;
}

function Probe(props: { onSeen?: (value: ContextValue) => void }) {
    const config = useConfig();
    createEffect(() => props.onSeen?.(config()));
    return <span data-testid="config">{JSON.stringify({ ...config(), getPopupContainer: undefined, onBreakpoint: undefined })}</span>;
}

function Subscriber(props: { args: SubscribeArgs }) {
    const config = useConfig();
    onMount(() => {
        const subscribe = config().onBreakpoint;
        const args = props.args;
        const unsubscribe = args.length === 1 ? subscribe?.(args[0]) : subscribe?.(args[0], args[1]);
        onCleanup(() => unsubscribe?.());
    });
    return null;
}

function renderTree(initial: TreeProps = {}) {
    const [tree, setTree] = createSignal(initial);
    const content = () => (
        <>
            <Probe onSeen={initial.onSeen} />
            <Index each={tree().subscribers}>{(args) => <Subscriber args={args()} />}</Index>
        </>
    );
    const view = render(() => (
        <ConfigProvider {...tree().outer}>
            <Show when={tree().nested} fallback={content()}>
                <ConfigProvider {...tree().inner}>{content()}</ConfigProvider>
            </Show>
        </ConfigProvider>
    ));
    return { ...view, update: (patch: Omit<TreeProps, 'onSeen'>) => setTree((prev) => ({ ...prev, ...patch })) };
}

describe('ConfigProvider', () => {
    it('useConfig 与 ConfigConsumer 读取所有字段，且 value 不含 children', () => {
        const getPopupContainer = () => document.body;
        const responsiveMap = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const onSeen = vi.fn<(value: ContextValue) => void>();
        render(() => (
            <ConfigProvider direction="ltr" getPopupContainer={getPopupContainer} locale={en_US} responsiveMap={responsiveMap} timeZone="Asia/Tokyo">
                <Probe onSeen={onSeen} />
                <ConfigConsumer>{(config) => <span>{config.timeZone}</span>}</ConfigConsumer>
            </ConfigProvider>
        ));
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
        expect(value.responsiveMap).toBe(responsiveMap);
        expect(value).not.toHaveProperty('children');
        expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
    });

    it('provider 外上下文为空，provider 内只填充配置默认值', () => {
        const outside = vi.fn<(value: ContextValue) => void>();
        render(() => <Probe onSeen={outside} />);
        expect(outside).toHaveBeenCalledWith({});
        const inside = vi.fn<(value: ContextValue) => void>();
        renderTree({ onSeen: inside });
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

    it('嵌套 provider 只覆盖已定义的字段，显式 null 清空语言，外层变化时响应更新', () => {
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
        const view = renderTree({ outer, inner: { timeZone: 8 }, nested: true, onSeen });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, timeZone: 8 });
        view.update({ inner: { direction: 'ltr', locale: null, timeZone: undefined } });
        expect(onSeen.mock.lastCall?.[0]).toMatchObject({ ...outer, direction: 'ltr', locale: null });
        view.update({ outer: { ...outer, timeZone: 9 }, inner: {} });
        expect(onSeen.mock.lastCall?.[0].timeZone).toBe(9);
    });

    it('ConfigConsumer 随 provider 的配置变化更新，子树不重建', () => {
        const [timeZone, setTimeZone] = createSignal<string | number>('GMT+08:00');
        const children = vi.fn<ConfigConsumerProps['children']>((config) => <span data-testid="tz">{config.timeZone}</span>);
        render(() => (
            <ConfigProvider timeZone={timeZone()}>
                <ConfigConsumer>{children}</ConfigConsumer>
            </ConfigProvider>
        ));
        const span = screen.getByTestId('tz');
        expect(span).toHaveTextContent('GMT+08:00');
        setTimeZone(9);
        expect(screen.getByTestId('tz')).toHaveTextContent('9');
        expect(screen.getByTestId('tz')).toBe(span);
        expect(children).toHaveBeenCalledTimes(1);
    });

    it('direction 设置时 children 包裹在带 dir 的 div 中，切换方向时响应更新', () => {
        const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('rtl');
        const view = render(() => (
            <ConfigProvider direction={direction()}>
                <span>Semi</span>
            </ConfigProvider>
        ));
        const wrapper = view.container.firstElementChild;
        expect(wrapper?.tagName).toBe('DIV');
        expect(wrapper).toHaveAttribute('dir', 'rtl');
        setDirection('ltr');
        expect(view.container.firstElementChild).toHaveAttribute('dir', 'ltr');
        expect(screen.getByText('Semi').parentElement).toBe(view.container.firstElementChild);
    });

    it('嵌套 RTL 只生成一层包裹，切换方向时响应更新', () => {
        const view = renderTree({ outer: { direction: 'rtl' }, inner: { direction: 'rtl' }, nested: true });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        view.update({ outer: { direction: 'ltr' }, inner: {} });
        expect(view.container.querySelector('[dir="rtl"]')).toBeNull();
        expect(screen.getByTestId('config')).toHaveTextContent('"direction":"ltr"');
    });

    it('嵌套方向切换只在首次进入 RTL 时增加包裹', () => {
        const view = renderTree({ outer: { direction: 'rtl' }, inner: {}, nested: true });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        view.update({ inner: { direction: 'rtl' } });
        expect(view.container.querySelectorAll('[dir="rtl"]')).toHaveLength(1);
        view.update({ outer: { direction: 'ltr' }, inner: { direction: 'ltr' } });
        expect(view.container.querySelector('[dir="rtl"]')).toBeNull();
    });

    it('direction 继承或重复设置时，嵌套 provider 只保留一个 dir 包裹层', () => {
        const view = render(() => (
            <ConfigProvider direction="rtl">
                <ConfigProvider>
                    <ConfigProvider direction="rtl">
                        <span />
                    </ConfigProvider>
                </ConfigProvider>
            </ConfigProvider>
        ));
        expect(view.container.querySelectorAll('[dir]')).toHaveLength(1);
    });

    it('无根 DOM 的 provider 和 consumer 丢弃未声明属性', () => {
        const view = render(() => (
            <ConfigProvider direction="rtl" {...{ id: 'provider', class: 'external', 'data-extra': 'extra' }}>
                <ConfigConsumer {...{ id: 'consumer' }}>{() => <span>内容</span>}</ConfigConsumer>
            </ConfigProvider>
        ));
        expect(view.container.querySelector('[id], .external, [data-extra]')).toBeNull();
        expect(screen.getByText('内容').parentElement).toHaveAttribute('dir', 'rtl');
    });

    it('相同配置与同内容 responsiveMap 不改变上下文引用或重新注册', () => {
        const media = mockMatchMedia([defaultResponsiveMap.md]);
        const onSeen = vi.fn<(value: ContextValue) => void>();
        const callback = vi.fn<OnBreakpointScreensCallback>();
        const view = renderTree({
            outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } },
            subscribers: [[callback]],
            onSeen,
        });
        const value = onSeen.mock.lastCall?.[0];
        const count = onSeen.mock.calls.length;
        const queries = vi.mocked(window.matchMedia).mock.calls.length;
        view.update({ outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap } } });
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
            renderTree({ subscribers: [[callback], [vi.fn<OnBreakpointScreensCallback>()]] });
            expect(callback).toHaveBeenCalledExactlyOnceWith(allFalse);
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(media.totalHandlers()).toBe(0);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('responsiveObserve');
        });

        it('首个订阅者惰性注册并立即接收匹配，变化同时更新 screens', () => {
            const media = mockMatchMedia([defaultResponsiveMap.sm, defaultResponsiveMap.md]);
            const view = renderTree({ outer: { responsiveObserve: true } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(screen.getByTestId('config')).toHaveTextContent(`"screens":${JSON.stringify(allFalse)}`);
            const callback = vi.fn<OnBreakpointScreensCallback>();
            view.update({ subscribers: [[callback]] });
            const expected = { ...allFalse, sm: true, md: true };
            expect(callback).toHaveBeenCalledExactlyOnceWith(expected);
            expect(screen.getByTestId('config')).toHaveTextContent(`"screens":${JSON.stringify(expected)}`);
            for (const query of Object.values(defaultResponsiveMap)) expect(media.handlerCount(query)).toBe(1);
            media.fire(defaultResponsiveMap.lg, true);
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenLastCalledWith({ ...expected, lg: true });
            expect(screen.getByTestId('config')).toHaveTextContent('"lg":true');
        });

        it('单项签名立即报告已选断点，并过滤其余变化', () => {
            const media = mockMatchMedia([defaultResponsiveMap.md]);
            const callback = vi.fn<OnBreakpointChangeCallback>();
            renderTree({ outer: { responsiveObserve: true }, subscribers: [[['md', 'lg'], callback]] });
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
            const media = mockMatchMedia();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            const view = renderTree({
                outer: { responsiveObserve: true },
                subscribers: [[callback], [['xs'], vi.fn<OnBreakpointChangeCallback>()]],
            });
            expect(media.totalHandlers()).toBe(6);
            view.update({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            view.update({ subscribers: [] });
            expect(media.totalHandlers()).toBe(0);
            view.update({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(6);
            view.unmount();
            expect(media.totalHandlers()).toBe(0);
        });

        it('responsiveMap 在订阅前不注册，订阅后换 map 才替换监听，并通知变化的匹配结果', () => {
            const media = mockMatchMedia(['(min-width: 1px)']);
            const custom = { ...defaultResponsiveMap, xs: '(min-width: 1px)' };
            const view = renderTree({ outer: { responsiveObserve: true } });
            view.update({ outer: { responsiveObserve: true, responsiveMap: custom } });
            expect(window.matchMedia).not.toHaveBeenCalled();
            const callback = vi.fn<OnBreakpointScreensCallback>();
            view.update({ subscribers: [[callback]] });
            expect(callback).toHaveBeenLastCalledWith({ ...allFalse, xs: true });
            expect(media.handlerCount(custom.xs)).toBe(1);
            view.update({ outer: { responsiveObserve: true } });
            expect(media.handlerCount(custom.xs)).toBe(0);
            expect(media.handlerCount(defaultResponsiveMap.xs)).toBe(1);
            expect(media.totalHandlers()).toBe(6);
            // the new map no longer matches xs: subscribers hear it once
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenLastCalledWith(allFalse);
        });

        it('切换 responsiveObserve 对已有订阅者注销与重新注册', () => {
            const media = mockMatchMedia([defaultResponsiveMap.xl]);
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const callback = vi.fn<OnBreakpointScreensCallback>();
            const view = renderTree({ subscribers: [[callback]] });
            expect(media.totalHandlers()).toBe(0);
            view.update({ outer: { responsiveObserve: true } });
            expect(media.totalHandlers()).toBe(6);
            expect(screen.getByTestId('config')).toHaveTextContent('"xl":true');
            view.update({ outer: { responsiveObserve: false } });
            expect(media.totalHandlers()).toBe(0);
        });

        it('换 map 同时挂载新订阅者时，新订阅者立即读取本次配置', () => {
            const media = mockMatchMedia(['(min-width: 1px)']);
            const first = vi.fn<OnBreakpointScreensCallback>();
            const second = vi.fn<OnBreakpointScreensCallback>();
            const view = renderTree({ outer: { responsiveObserve: true }, subscribers: [[first]] });
            view.update({
                outer: { responsiveObserve: true, responsiveMap: { ...defaultResponsiveMap, xs: '(min-width: 1px)' } },
                subscribers: [[first], [second]],
            });
            expect(second).toHaveBeenCalledExactlyOnceWith({ ...allFalse, xs: true });
            expect(media.totalHandlers()).toBe(6);
        });
    });
});
