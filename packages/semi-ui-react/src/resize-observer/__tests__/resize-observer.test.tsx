import { Component, StrictMode, createContext, createRef, useState, type ReactElement, type Ref, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserver } from '@test/utils/react';
import ReactResizeObserver, { ObserverProperty, type ResizeEntry } from '../index';

let mock: ReturnType<typeof mockResizeObserver>;
const observed = () => mock.observed();
const fire = (entries: ResizeEntry[]) => mock.fire(entries[0].target, entries);

// a rect with only the members the tests read
const entry = (target: Element, width: number, height: number): ResizeEntry => ({
    target,
    contentRect: { width, height } as DOMRectReadOnly,
});

describe('ResizeObserver', () => {
    beforeEach(() => {
        mock = mockResizeObserver();
    });

    it('观察原生子元素的 DOM 节点', () => {
        render(
            <ReactResizeObserver>
                <div>child</div>
            </ReactResizeObserver>
        );

        expect(observed()).toEqual([screen.getByText('child')]);
    });

    it('把 observer entries 传给 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(
            <ReactResizeObserver onResize={onResize}>
                <div>child</div>
            </ReactResizeObserver>
        );
        const entries = [entry(screen.getByText('child'), 10, 20)];

        fire(entries);

        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith(entries);
    });

    it('设置 observeParent 时同时观察父元素', () => {
        render(
            <section data-testid="parent">
                <ReactResizeObserver observeParent>
                    <div>child</div>
                </ReactResizeObserver>
            </section>
        );

        expect(observed()).toEqual([screen.getByText('child'), screen.getByTestId('parent')]);
    });

    it('observeParent 打开时开始观察父元素', () => {
        const ui = (observeParent) => (
            <section data-testid="parent">
                <ReactResizeObserver observeParent={observeParent}>
                    <div>child</div>
                </ReactResizeObserver>
            </section>
        );
        const { rerender } = render(ui(false));
        expect(observed()).toEqual([screen.getByText('child')]);

        rerender(ui(true));

        expect(observed()).toEqual([screen.getByText('child'), screen.getByTestId('parent')]);
    });

    it('observerProperty 为 all 时，每个 entry 都调用 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(
            <ReactResizeObserver observerProperty={ObserverProperty.All} onResize={onResize}>
                <div>child</div>
            </ReactResizeObserver>
        );
        const child = screen.getByText('child');

        fire([entry(child, 10, 20)]);
        fire([entry(child, 10, 20)]);

        expect(onResize).toHaveBeenCalledTimes(2);
    });

    it('observerProperty 为 width 时，只有宽度变化才调用 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(
            <ReactResizeObserver observerProperty={ObserverProperty.Width} onResize={onResize}>
                <div>child</div>
            </ReactResizeObserver>
        );
        const child = screen.getByText('child');

        fire([entry(child, 10, 20)]);
        fire([entry(child, 10, 30)]);
        const widened = [entry(child, 15, 30)];
        fire(widened);

        expect(onResize).toHaveBeenCalledTimes(2);
        expect(onResize).toHaveBeenLastCalledWith(widened);
    });

    it('observerProperty 为 height 时，只有高度变化才调用 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(
            <ReactResizeObserver observerProperty={ObserverProperty.Height} onResize={onResize}>
                <div>child</div>
            </ReactResizeObserver>
        );
        const child = screen.getByText('child');

        fire([entry(child, 10, 20)]);
        fire([entry(child, 40, 20)]);
        fire([entry(child, 40, 25)]);

        expect(onResize).toHaveBeenCalledTimes(2);
    });

    it('只传递被观察维度发生变化的 entries', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(
            <section data-testid="parent">
                <ReactResizeObserver observeParent observerProperty={ObserverProperty.Width} onResize={onResize}>
                    <div>child</div>
                </ReactResizeObserver>
            </section>
        );
        const child = screen.getByText('child');
        const parent = screen.getByTestId('parent');
        fire([entry(child, 10, 20), entry(parent, 100, 20)]);

        const parentWidened = entry(parent, 120, 20);
        fire([entry(child, 10, 50), parentWidened]);

        expect(onResize).toHaveBeenCalledTimes(2);
        expect(onResize).toHaveBeenLastCalledWith([parentWidened]);
    });

    it('重新渲染后调用最新的 onResize', () => {
        const first = vi.fn<(entries: ResizeEntry[]) => void>();
        const second = vi.fn<(entries: ResizeEntry[]) => void>();
        const { rerender } = render(
            <ReactResizeObserver onResize={first}>
                <div>child</div>
            </ReactResizeObserver>
        );
        rerender(
            <ReactResizeObserver onResize={second}>
                <div>child</div>
            </ReactResizeObserver>
        );

        fire([entry(screen.getByText('child'), 10, 20)]);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('仍把节点交给子元素自己的函数 ref', () => {
        const ref = vi.fn<(node: HTMLDivElement | null) => void>();
        render(
            <ReactResizeObserver>
                <div ref={ref}>child</div>
            </ReactResizeObserver>
        );

        expect(ref).toHaveBeenLastCalledWith(screen.getByText('child'));
        expect(observed()).toEqual([screen.getByText('child')]);
    });

    it('重新渲染时不解绑再重新绑定子元素自己的 ref', () => {
        const ref = vi.fn<(node: HTMLDivElement | null) => void>();
        const ui = (onResize: () => void) => (
            <ReactResizeObserver onResize={onResize}>
                <div ref={ref}>child</div>
            </ReactResizeObserver>
        );
        const { rerender } = render(ui(() => {}));

        rerender(ui(() => {}));

        expect(ref.mock.calls).toEqual([[screen.getByText('child')]]);
    });

    it('仍把节点交给子元素自己的对象 ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <ReactResizeObserver>
                <div ref={ref}>child</div>
            </ReactResizeObserver>
        );

        expect(ref.current).toBe(screen.getByText('child'));
        expect(observed()).toEqual([screen.getByText('child')]);
    });

    it('替换子元素后观察目标随之切换', () => {
        const { rerender } = render(
            <ReactResizeObserver>
                <div key="a">first</div>
            </ReactResizeObserver>
        );
        rerender(
            <ReactResizeObserver>
                <span key="b">second</span>
            </ReactResizeObserver>
        );

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('卸载时断开连接', () => {
        const { unmount } = render(
            <ReactResizeObserver>
                <div>child</div>
            </ReactResizeObserver>
        );

        unmount();

        expect(observed()).toEqual([]);
    });

    it('StrictMode 下只观察子元素一次', () => {
        // React logs an error when unobserveUsing gets an observer it never received through observeUsing
        const error = vi.spyOn(console, 'error');
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        const { unmount } = render(
            <StrictMode>
                <ReactResizeObserver onResize={onResize}>
                    <div>child</div>
                </ReactResizeObserver>
            </StrictMode>
        );
        const child = screen.getByText('child');
        expect(observed()).toEqual([child]);

        fire([entry(child, 10, 20)]);
        unmount();

        expect(onResize).toHaveBeenCalledTimes(1);
        expect(observed()).toEqual([]);
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('观察组件子元素的根 DOM 节点，即使该组件把 ref 放在内部节点上', () => {
        const Box = ({ ref, children }: { ref: Ref<HTMLDivElement>; children: ReactNode }) => (
            <div className="outer">
                <div ref={ref}>{children}</div>
            </div>
        );
        const ref = createRef<HTMLDivElement>();
        const { container } = render(
            <ReactResizeObserver>
                <Box ref={ref}>child</Box>
            </ReactResizeObserver>
        );

        expect(ref.current).toBe(screen.getByText('child'));
        expect(observed()).toEqual([container.querySelector('.outer')]);
    });

    it('子元素有多个 DOM 节点时只观察第一个', () => {
        const Pair = () => (
            <>
                <span>first</span>
                <span>second</span>
            </>
        );
        render(
            <ReactResizeObserver>
                <Pair />
            </ReactResizeObserver>
        );

        expect(observed()).toEqual([screen.getByText('first')]);
    });

    it('子元素在第一个节点之前插入 DOM 节点时，观察目标切换到该节点', () => {
        const Pair = () => {
            const [prepended, setPrepended] = useState(false);
            return (
                <>
                    {prepended ? <i>prepended</i> : null}
                    <button onClick={() => setPrepended(true)}>first</button>
                </>
            );
        };
        render(
            <ReactResizeObserver>
                <Pair />
            </ReactResizeObserver>
        );

        fireEvent.click(screen.getByText('first'));

        expect(observed()).toEqual([screen.getByText('prepended')]);
    });

    it('子元素移除第一个节点时，观察目标切换到下一个 DOM 节点', () => {
        const Pair = () => {
            const [removed, setRemoved] = useState(false);
            return (
                <>
                    {removed ? null : <button onClick={() => setRemoved(true)}>first</button>}
                    <span>second</span>
                </>
            );
        };
        render(
            <ReactResizeObserver>
                <Pair />
            </ReactResizeObserver>
        );

        fireEvent.click(screen.getByText('first'));

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('观察忽略 ref 的函数组件子元素的第一个 DOM 节点', () => {
        const Box = ({ children }) => <div data-testid="root">{children}</div>;
        render(
            <ReactResizeObserver>
                <Box>child</Box>
            </ReactResizeObserver>
        );

        expect(observed()).toEqual([screen.getByTestId('root')]);
    });

    it('观察 context provider 子元素下的第一个 DOM 节点', () => {
        // Typography passes a SizeContext provider, which never attaches the ref
        const Context = createContext('default');
        render(
            <ReactResizeObserver>
                <Context value="small">
                    <p data-testid="root">child</p>
                </Context>
            </ReactResizeObserver>
        );

        expect(observed()).toEqual([screen.getByTestId('root')]);
    });

    it('重新渲染时跟随 context provider 子元素的第一个 DOM 节点', () => {
        const Context = createContext('default');
        const ui = (inner: ReactElement) => (
            <ReactResizeObserver>
                <Context value="small">{inner}</Context>
            </ReactResizeObserver>
        );
        const { rerender } = render(ui(<p>first</p>));

        rerender(ui(<span>second</span>));

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('组件子元素自行替换根节点时，观察目标随之切换', () => {
        const Box = ({ ref }: { ref?: Ref<HTMLButtonElement> & Ref<HTMLSpanElement> }) => {
            const [swapped, setSwapped] = useState(false);
            return swapped ? (
                <span ref={ref}>second</span>
            ) : (
                <button ref={ref} onClick={() => setSwapped(true)}>
                    first
                </button>
            );
        };
        render(
            <ReactResizeObserver>
                <Box />
            </ReactResizeObserver>
        );

        fireEvent.click(screen.getByText('first'));

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('观察 class 组件子元素的 DOM 节点', () => {
        class Box extends Component<{ children: ReactNode }> {
            override render() {
                return <div data-testid="root">{this.props.children}</div>;
            }
        }
        const ref = createRef<Box>();
        render(
            <ReactResizeObserver>
                <Box ref={ref}>child</Box>
            </ReactResizeObserver>
        );

        expect(ref.current).toBeInstanceOf(Box);
        expect(observed()).toEqual([screen.getByTestId('root')]);
    });
});
