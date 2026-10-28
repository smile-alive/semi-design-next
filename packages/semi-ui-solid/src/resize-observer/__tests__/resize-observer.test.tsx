import { createContext, createSignal, Show, type JSX } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserver } from '@test/utils/solid';
import SolidResizeObserver, { ObserverProperty, type ResizeEntry } from '..';

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
        render(() => (
            <SolidResizeObserver>
                <div>child</div>
            </SolidResizeObserver>
        ));

        expect(observed()).toEqual([screen.getByText('child')]);
    });

    it('把 observer entries 传给 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(() => (
            <SolidResizeObserver onResize={onResize}>
                <div>child</div>
            </SolidResizeObserver>
        ));
        const entries = [entry(screen.getByText('child'), 10, 20)];

        fire(entries);

        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith(entries);
    });

    it('设置 observeParent 时同时观察父元素', () => {
        render(() => (
            <section data-testid="parent">
                <SolidResizeObserver observeParent>
                    <div>child</div>
                </SolidResizeObserver>
            </section>
        ));

        expect(observed()).toEqual([screen.getByText('child'), screen.getByTestId('parent')]);
    });

    it('observeParent 打开时开始观察父元素', () => {
        const [observeParent, setObserveParent] = createSignal(false);
        render(() => (
            <section data-testid="parent">
                <SolidResizeObserver observeParent={observeParent()}>
                    <div>child</div>
                </SolidResizeObserver>
            </section>
        ));
        expect(observed()).toEqual([screen.getByText('child')]);

        setObserveParent(true);

        expect(observed()).toEqual([screen.getByText('child'), screen.getByTestId('parent')]);
    });

    it('observerProperty 为 all 时，每个 entry 都调用 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(() => (
            <SolidResizeObserver observerProperty={ObserverProperty.All} onResize={onResize}>
                <div>child</div>
            </SolidResizeObserver>
        ));
        const child = screen.getByText('child');

        fire([entry(child, 10, 20)]);
        fire([entry(child, 10, 20)]);

        expect(onResize).toHaveBeenCalledTimes(2);
    });

    it('observerProperty 为 width 时，只有宽度变化才调用 onResize', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(() => (
            <SolidResizeObserver observerProperty={ObserverProperty.Width} onResize={onResize}>
                <div>child</div>
            </SolidResizeObserver>
        ));
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
        render(() => (
            <SolidResizeObserver observerProperty={ObserverProperty.Height} onResize={onResize}>
                <div>child</div>
            </SolidResizeObserver>
        ));
        const child = screen.getByText('child');

        fire([entry(child, 10, 20)]);
        fire([entry(child, 40, 20)]);
        fire([entry(child, 40, 25)]);

        expect(onResize).toHaveBeenCalledTimes(2);
    });

    it('只传递被观察维度发生变化的 entries', () => {
        const onResize = vi.fn<(entries: ResizeEntry[]) => void>();
        render(() => (
            <section data-testid="parent">
                <SolidResizeObserver observeParent observerProperty={ObserverProperty.Width} onResize={onResize}>
                    <div>child</div>
                </SolidResizeObserver>
            </section>
        ));
        const child = screen.getByText('child');
        const parent = screen.getByTestId('parent');
        expect(mock.live()).toHaveLength(1);
        fire([entry(child, 10, 20), entry(parent, 100, 20)]);

        const parentWidened = entry(parent, 120, 20);
        fire([entry(child, 10, 50), parentWidened]);

        expect(onResize).toHaveBeenCalledTimes(2);
        expect(onResize).toHaveBeenLastCalledWith([parentWidened]);
    });

    it('onResize 变化后调用最新的回调', () => {
        const first = vi.fn<(entries: ResizeEntry[]) => void>();
        const second = vi.fn<(entries: ResizeEntry[]) => void>();
        const [onResize, setOnResize] = createSignal(first);
        render(() => (
            <SolidResizeObserver onResize={onResize()}>
                <div>child</div>
            </SolidResizeObserver>
        ));
        setOnResize(() => second);

        fire([entry(screen.getByText('child'), 10, 20)]);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('仍把节点交给子元素自己的 ref', () => {
        const ref = vi.fn<(node: HTMLDivElement) => void>();
        render(() => (
            <SolidResizeObserver>
                <div ref={ref}>child</div>
            </SolidResizeObserver>
        ));

        // compiled `ref={fn}` on an element calls fn(element, undefined), so only the first argument is compared
        expect(ref.mock.calls.map(([node]) => node)).toEqual([screen.getByText('child')]);
        expect(observed()).toEqual([screen.getByText('child')]);
    });

    it('替换子元素后观察目标随之切换', () => {
        const [swapped, setSwapped] = createSignal(false);
        render(() => (
            <SolidResizeObserver>
                <Show when={swapped()} fallback={<div>first</div>}>
                    <span>second</span>
                </Show>
            </SolidResizeObserver>
        ));
        expect(observed()).toEqual([screen.getByText('first')]);

        setSwapped(true);

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('卸载时断开连接', () => {
        const { unmount } = render(() => (
            <SolidResizeObserver>
                <div>child</div>
            </SolidResizeObserver>
        ));

        unmount();

        expect(observed()).toEqual([]);
    });

    it('观察组件子元素的根 DOM 节点', () => {
        const Box = (props: { children: JSX.Element }) => (
            <div class="outer">
                <div>{props.children}</div>
            </div>
        );
        const { container } = render(() => (
            <SolidResizeObserver>
                <Box>child</Box>
            </SolidResizeObserver>
        ));

        expect(observed()).toEqual([container.querySelector('.outer')]);
    });

    it('子元素有多个 DOM 节点时只观察第一个', () => {
        const Pair = () => (
            <>
                <span>first</span>
                <span>second</span>
            </>
        );
        render(() => (
            <SolidResizeObserver>
                <Pair />
            </SolidResizeObserver>
        ));

        expect(observed()).toEqual([screen.getByText('first')]);
    });

    it('子元素在第一个节点之前插入 DOM 节点时，观察目标切换到该节点', () => {
        const [prepended, setPrepended] = createSignal(false);
        const Pair = () => (
            <>
                <Show when={prepended()}>
                    <i>prepended</i>
                </Show>
                <button>first</button>
            </>
        );
        render(() => (
            <SolidResizeObserver>
                <Pair />
            </SolidResizeObserver>
        ));

        setPrepended(true);

        expect(observed()).toEqual([screen.getByText('prepended')]);
    });

    it('子元素移除第一个节点时，观察目标切换到下一个 DOM 节点', () => {
        const [removed, setRemoved] = createSignal(false);
        const Pair = () => (
            <>
                <Show when={!removed()}>
                    <button>first</button>
                </Show>
                <span>second</span>
            </>
        );
        render(() => (
            <SolidResizeObserver>
                <Pair />
            </SolidResizeObserver>
        ));

        setRemoved(true);

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('组件子元素自行替换根节点时，观察目标随之切换', () => {
        const [swapped, setSwapped] = createSignal(false);
        const Box = () => (
            <Show when={swapped()} fallback={<button>first</button>}>
                <span>second</span>
            </Show>
        );
        render(() => (
            <SolidResizeObserver>
                <Box />
            </SolidResizeObserver>
        ));

        setSwapped(true);

        expect(observed()).toEqual([screen.getByText('second')]);
    });

    it('观察 context provider 子元素下的第一个 DOM 节点', () => {
        const Context = createContext('default');
        render(() => (
            <SolidResizeObserver>
                <Context.Provider value="small">
                    <p data-testid="root">child</p>
                </Context.Provider>
            </SolidResizeObserver>
        ));

        expect(observed()).toEqual([screen.getByTestId('root')]);
    });

    it('跳过前导文本，观察第一个元素', () => {
        render(() => (
            <SolidResizeObserver>
                text
                <b>bold</b>
            </SolidResizeObserver>
        ));

        expect(observed()).toEqual([screen.getByText('bold')]);
    });
});
