import { Component, StrictMode, memo, use, useEffect, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Breakpoint, OnBreakpointChangeCallback, OnBreakpointScreensCallback } from '@fibrae/semi-foundation/config-provider/responsive-types';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import Badge from '@fibrae/semi-ui-react/badge';
import { mockMatchMedia } from '@test/utils/react';
import { ConfigContext, type ContextValue } from '../context';
import ConfigProvider, { ConfigConsumer, defaultResponsiveMap } from '../index';

const allFalse = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false };

interface ConsumerProps {
    onRender: (value: ContextValue) => unknown;
}

class ClassConsumer extends Component<ConsumerProps> {
    static override contextType = ConfigContext;
    override render() {
        this.props.onRender(this.context);
        return null;
    }
}

function FunctionConsumer({ onRender }: ConsumerProps) {
    onRender(use(ConfigContext));
    return null;
}

type SubscribeArgs = [OnBreakpointScreensCallback] | [Breakpoint[], OnBreakpointChangeCallback];

function Subscriber({ args }: { args: SubscribeArgs }) {
    const { onBreakpoint } = use(ConfigContext);
    useEffect(() => (args.length === 1 ? onBreakpoint(args[0]) : onBreakpoint(args[0], args[1])), [onBreakpoint, args]);
    return null;
}

function ScreensText() {
    const { screens } = use(ConfigContext);
    return <span data-testid="screens">{JSON.stringify(screens)}</span>;
}

describe('ConfigProvider', () => {
    let mm: ReturnType<typeof mockMatchMedia>;

    it('class 与函数式消费者都能读取所有已提供的字段', () => {
        const getPopupContainer = () => document.body;
        const responsiveMap = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        const seen: ContextValue[] = [];
        render(
            <ConfigProvider direction="ltr" getPopupContainer={getPopupContainer} locale={en_US} responsiveMap={responsiveMap} timeZone="Asia/Tokyo">
                <ClassConsumer onRender={(v) => seen.push(v)} />
                <FunctionConsumer onRender={(v) => seen.push(v)} />
            </ConfigProvider>
        );
        expect(seen).toHaveLength(2);
        for (const value of seen) {
            expect(value.locale).toBe(en_US);
            expect(value.timeZone).toBe('Asia/Tokyo');
            expect(value.direction).toBe('ltr');
            expect(value.getPopupContainer).toBe(getPopupContainer);
            expect(value.responsiveObserve).toBe(false);
            expect(value.responsiveMap).toBe(responsiveMap);
            expect(value.screens).toEqual(allFalse);
            expect(typeof value.onBreakpoint).toBe('function');
            expect(value).not.toHaveProperty('children');
        }
    });

    it('填充默认值，且在 provider 外上下文为空', () => {
        let inside: ContextValue = {};
        let outside: ContextValue = {};
        render(
            <>
                <FunctionConsumer onRender={(v) => (outside = v)} />
                <ConfigProvider>
                    <FunctionConsumer onRender={(v) => (inside = v)} />
                </ConfigProvider>
            </>
        );
        expect(outside).toEqual({});
        expect(inside.locale).toBeUndefined();
        expect(inside.direction).toBe('ltr');
        expect(inside.responsiveObserve).toBe(false);
        expect(inside.responsiveMap).toBe(defaultResponsiveMap);
        expect(inside.timeZone).toBeUndefined();
        expect(ConfigProvider).toHaveProperty('defaultResponsiveMap', defaultResponsiveMap);
    });

    it('嵌套 provider 只覆盖传入的字段，其余继承', () => {
        const outerContainer = () => document.body;
        const outerMap = { ...defaultResponsiveMap, xs: '(max-width: 100px)' };
        let inner: ContextValue = {};
        render(
            <ConfigProvider direction="rtl" getPopupContainer={outerContainer} locale={en_US} responsiveMap={outerMap} responsiveObserve timeZone="Asia/Tokyo">
                <ConfigProvider timeZone={8}>
                    <FunctionConsumer onRender={(v) => (inner = v)} />
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(inner.timeZone).toBe(8);
        expect(inner.locale).toBe(en_US);
        expect(inner.direction).toBe('rtl');
        expect(inner.getPopupContainer).toBe(outerContainer);
        expect(inner.responsiveObserve).toBe(true);
        expect(inner.responsiveMap).toBe(outerMap);
    });

    it('属性传 undefined 时继承，传 null 或其他值时覆盖', () => {
        let inner: ContextValue = {};
        render(
            <ConfigProvider direction="rtl" locale={en_US} timeZone="Asia/Tokyo">
                <ConfigProvider direction="ltr" locale={null} timeZone={undefined}>
                    <FunctionConsumer onRender={(v) => (inner = v)} />
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(inner.locale).toBeNull();
        expect(inner.timeZone).toBe('Asia/Tokyo');
        expect(inner.direction).toBe('ltr');
    });

    it('direction 继承或重复设置时，嵌套 provider 只保留一个 dir 包裹层', () => {
        const { container } = render(
            <ConfigProvider direction="rtl">
                <ConfigProvider>
                    <ConfigProvider direction="rtl">
                        <span />
                    </ConfigProvider>
                </ConfigProvider>
            </ConfigProvider>
        );
        expect(container.querySelectorAll('[dir]')).toHaveLength(1);
    });

    it('父组件重新渲染时，嵌套 provider 的 value 保持稳定', () => {
        const seen: ContextValue[] = [];
        const MemoConsumer = memo(FunctionConsumer);
        const onRender = (v) => seen.push(v);
        function Parent() {
            const [, setTick] = useState(0);
            return (
                <>
                    <button onClick={() => setTick((t) => t + 1)}>tick</button>
                    <ConfigProvider locale={en_US}>
                        <ConfigProvider timeZone={8}>
                            <MemoConsumer onRender={onRender} />
                        </ConfigProvider>
                    </ConfigProvider>
                </>
            );
        }
        render(<Parent />);
        act(() => screen.getByText('tick').click());
        expect(seen).toHaveLength(1);
    });

    it('ConfigConsumer 为上下文消费者', () => {
        render(
            <ConfigProvider timeZone="GMT+08:00">
                <ConfigConsumer>{({ timeZone }) => <span data-testid="tz">{timeZone}</span>}</ConfigConsumer>
            </ConfigProvider>
        );
        expect(screen.getByTestId('tz')).toHaveTextContent('GMT+08:00');
    });

    it('direction="rtl" 时 children 包裹在 dir="rtl" 中并传到组件', () => {
        const { container, rerender } = render(
            <ConfigProvider direction="rtl">
                <Badge count={5}>Semi</Badge>
            </ConfigProvider>
        );
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.tagName).toBe('DIV');
        expect(wrapper).toHaveAttribute('dir', 'rtl');
        expect(wrapper.querySelector('.semi-badge-leftTop')).not.toBeNull();

        rerender(
            <ConfigProvider direction="ltr">
                <Badge count={5}>Semi</Badge>
            </ConfigProvider>
        );
        expect(container.firstChild).toHaveAttribute('dir', 'ltr');
        expect(container.querySelector('.semi-badge-rightTop')).not.toBeNull();
    });

    describe('断点（breakpoints）', () => {
        it('responsiveObserve 关闭时，订阅会告警、不注册任何监听，并返回初始屏幕', () => {
            mm = mockMatchMedia([defaultResponsiveMap.md]);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const cb = vi.fn<OnBreakpointScreensCallback>();
            const args: SubscribeArgs = [cb];
            render(
                <ConfigProvider>
                    <Subscriber args={args} />
                    <Subscriber args={[vi.fn<OnBreakpointScreensCallback>()]} />
                </ConfigProvider>
            );
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(allFalse);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('responsiveObserve');
        });

        it('首个订阅者出现时才惰性注册，并立即返回当前匹配结果', () => {
            mm = mockMatchMedia([defaultResponsiveMap.sm, defaultResponsiveMap.md]);
            const { rerender } = render(
                <ConfigProvider responsiveObserve>
                    <ScreensText />
                </ConfigProvider>
            );
            expect(window.matchMedia).not.toHaveBeenCalled();
            expect(screen.getByTestId('screens')).toHaveTextContent(JSON.stringify(allFalse));

            const cb = vi.fn<OnBreakpointScreensCallback>();
            const args: SubscribeArgs = [cb];
            rerender(
                <ConfigProvider responsiveObserve>
                    <ScreensText />
                    <Subscriber args={args} />
                </ConfigProvider>
            );
            const expected = { ...allFalse, sm: true, md: true };
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenLastCalledWith(expected);
            expect(screen.getByTestId('screens')).toHaveTextContent(JSON.stringify(expected));
            for (const media of Object.values(defaultResponsiveMap)) {
                expect(mm.handlerCount(media)).toBe(1);
            }

            mm.fire(defaultResponsiveMap.lg, true);
            const next = { ...expected, lg: true };
            expect(cb).toHaveBeenCalledTimes(2);
            expect(cb).toHaveBeenLastCalledWith(next);
            expect(screen.getByTestId('screens')).toHaveTextContent(JSON.stringify(next));
        });

        it('breakpoint 列表签名会报告并过滤单项变化', () => {
            mm = mockMatchMedia([defaultResponsiveMap.md]);
            const cb = vi.fn<OnBreakpointChangeCallback>();
            const args: SubscribeArgs = [['md', 'lg'], cb];
            render(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={args} />
                </ConfigProvider>
            );
            expect(cb.mock.calls).toEqual([
                ['md', true],
                ['lg', false],
            ]);
            cb.mockClear();
            mm.fire(defaultResponsiveMap.xs, true);
            expect(cb).not.toHaveBeenCalled();
            mm.fire(defaultResponsiveMap.lg, true);
            expect(cb.mock.calls).toEqual([['lg', true]]);
        });

        it('最后一个订阅者离开或卸载时注销监听', () => {
            mm = mockMatchMedia();
            const a: SubscribeArgs = [vi.fn<OnBreakpointScreensCallback>()];
            const b: SubscribeArgs = [['xs'], vi.fn<OnBreakpointChangeCallback>()];
            const { rerender, unmount } = render(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={a} />
                    <Subscriber args={b} />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(6);
            rerender(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={a} />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(6);
            rerender(<ConfigProvider responsiveObserve />);
            expect(mm.totalHandlers()).toBe(0);

            rerender(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={a} />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(6);
            unmount();
            expect(mm.totalHandlers()).toBe(0);
        });

        it('responsiveMap 变化时仅在已注册状态下重新注册', () => {
            mm = mockMatchMedia(['(min-width: 1px)']);
            const custom = { ...defaultResponsiveMap, xs: '(min-width: 1px)' };
            const { rerender } = render(<ConfigProvider responsiveObserve />);
            rerender(<ConfigProvider responsiveMap={custom} responsiveObserve />);
            expect(window.matchMedia).not.toHaveBeenCalled();

            const cb = vi.fn<OnBreakpointScreensCallback>();
            const args: SubscribeArgs = [cb];
            rerender(
                <ConfigProvider responsiveMap={custom} responsiveObserve>
                    <Subscriber args={args} />
                </ConfigProvider>
            );
            expect(cb).toHaveBeenLastCalledWith({ ...allFalse, xs: true });
            expect(mm.handlerCount('(min-width: 1px)')).toBe(1);

            rerender(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={args} />
                </ConfigProvider>
            );
            expect(mm.handlerCount('(min-width: 1px)')).toBe(0);
            expect(mm.handlerCount(defaultResponsiveMap.xs)).toBe(1);
            expect(mm.totalHandlers()).toBe(6);
            // the new map no longer matches xs: subscribers hear it once
            expect(cb).toHaveBeenCalledTimes(2);
            expect(cb).toHaveBeenLastCalledWith(allFalse);
        });

        it('内联 responsiveMap 内容不变时，父组件重渲染不重新注册，也不让消费者重渲染', () => {
            mm = mockMatchMedia([defaultResponsiveMap.md]);
            const args: SubscribeArgs = [vi.fn<OnBreakpointScreensCallback>()];
            const consumerRenders = vi.fn<() => void>();
            const Consumer = memo(function Consumer() {
                use(ConfigContext);
                consumerRenders();
                return null;
            });
            const tree = () => (
                <ConfigProvider responsiveMap={{ ...defaultResponsiveMap }} responsiveObserve>
                    <Subscriber args={args} />
                    <Consumer />
                </ConfigProvider>
            );
            const { rerender } = render(tree());
            const queries = vi.mocked(window.matchMedia).mock.calls.length;
            const renders = consumerRenders.mock.calls.length;
            rerender(tree());
            rerender(tree());
            expect(vi.mocked(window.matchMedia).mock.calls.length).toBe(queries);
            expect(consumerRenders.mock.calls.length).toBe(renders);
            expect(mm.totalHandlers()).toBe(6);
        });

        it('切换 responsiveObserve 时，对已有订阅者注销并重新注册', () => {
            mm = mockMatchMedia([defaultResponsiveMap.xl]);
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const cb = vi.fn<OnBreakpointScreensCallback>();
            const args: SubscribeArgs = [cb];
            const { rerender } = render(
                <ConfigProvider>
                    <Subscriber args={args} />
                    <ScreensText />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(0);
            rerender(
                <ConfigProvider responsiveObserve>
                    <Subscriber args={args} />
                    <ScreensText />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(6);
            expect(screen.getByTestId('screens')).toHaveTextContent(JSON.stringify({ ...allFalse, xl: true }));
            rerender(
                <ConfigProvider responsiveObserve={false}>
                    <Subscriber args={args} />
                    <ScreensText />
                </ConfigProvider>
            );
            expect(mm.totalHandlers()).toBe(0);
        });

        it('StrictMode 下每个查询只保留一个监听，卸载后不残留', () => {
            mm = mockMatchMedia([defaultResponsiveMap.md]);
            const cb = vi.fn<OnBreakpointScreensCallback>();
            const args: SubscribeArgs = [cb];
            const { unmount } = render(
                <StrictMode>
                    <ConfigProvider responsiveObserve>
                        <Subscriber args={args} />
                    </ConfigProvider>
                </StrictMode>
            );
            for (const media of Object.values(defaultResponsiveMap)) {
                expect(mm.handlerCount(media)).toBe(1);
            }
            expect(cb).toHaveBeenLastCalledWith({ ...allFalse, md: true });
            mm.fire(defaultResponsiveMap.md, false);
            expect(cb).toHaveBeenLastCalledWith(allFalse);
            unmount();
            expect(mm.totalHandlers()).toBe(0);
        });
    });

    it('父组件以相同 props 重新渲染时保持上下文 value', () => {
        const getPopupContainer = () => document.body;
        const seen: ContextValue[] = [];
        const MemoConsumer = memo(FunctionConsumer);
        const onRender = (v) => seen.push(v);
        function Parent() {
            const [, setTick] = useState(0);
            return (
                <>
                    <button onClick={() => setTick((t) => t + 1)}>tick</button>
                    <ConfigProvider getPopupContainer={getPopupContainer} locale={en_US} timeZone={8}>
                        <MemoConsumer onRender={onRender} />
                    </ConfigProvider>
                </>
            );
        }
        render(<Parent />);
        act(() => screen.getByText('tick').click());
        act(() => screen.getByText('tick').click());
        expect(seen).toHaveLength(1);
    });
});
