import { startTransition, StrictMode, useLayoutEffect, useRef, type ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isEqual } from 'es-toolkit';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import semiGlobal, { type OverrideDefaultProps } from '@fibrae/semi-ui-react/_utils/semi-global';
import Select from '@fibrae/semi-ui-react/select';
import { mockResizeObserver } from '@test/utils/react';
import useCopied from '../use-copied';
import useDefaultProps from '../use-default-props';
import useDidUpdate from '../use-did-update';
import useEventListener, { getWindow } from '../use-event-listener';
import useFoundation from '../use-foundation';
import useResizeObserver from '../use-resize-observer';

interface CounterProps {
    label?: string;
    log: (entry: string) => void;
    onRender?: (foundation: CounterFoundation) => void;
    children?: (foundation: CounterFoundation) => ReactNode;
}

interface CounterState {
    count: number;
}

interface CounterAdapter extends DefaultAdapter<CounterProps, CounterState> {
    log: (entry: string) => void;
}

class CounterFoundation extends BaseFoundation<CounterAdapter, CounterProps, CounterState> {
    constructor(adapter: CounterAdapter) {
        super({ ...adapter });
    }

    override init() {
        this._adapter.log('init');
    }

    increment() {
        this.setState({ count: this.getState('count') + 1 }, () => this._adapter.log(`callback ${document.querySelector('button').textContent}`));
        this._adapter.log(`read ${this.getState('count')}`);
    }

    reportLabel() {
        this._adapter.log(`label ${this.getProp('label')}`);
    }

    override destroy() {
        this._adapter.log('destroy');
    }
}

function Counter(props: CounterProps) {
    const [foundation, state] = useFoundation(
        CounterFoundation,
        props,
        () => ({ count: 0 }),
        (base) => ({ log: (entry) => base.getProps().log(entry) })
    );
    props.onRender?.(foundation);
    return (
        <>
            <button onClick={() => foundation.increment()}>{state.count}</button>
            <button onClick={() => foundation.reportLabel()}>label</button>
            {props.children?.(foundation)}
        </>
    );
}

describe('useFoundation', () => {
    it('setState 立即更新 foundation state，并在提交后执行回调', async () => {
        const log = vi.fn<(entry: string) => void>();
        render(<Counter log={log} />);
        await userEvent.click(screen.getByRole('button', { name: '0' }));
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(log.mock.calls.map(([entry]) => entry)).toEqual(['init', 'read 1', 'callback 1']);
    });

    it('foundation 方法读取最新的 props', async () => {
        const log = vi.fn<(entry: string) => void>();
        const { rerender } = render(<Counter label="a" log={log} />);
        rerender(<Counter label="b" log={log} />);
        await userEvent.click(screen.getByRole('button', { name: 'label' }));
        expect(log).toHaveBeenLastCalledWith('label b');
    });

    it('子组件的 layout effect 已能读取父组件的新 props', () => {
        const log = vi.fn<(entry: string) => void>();
        function Child({ foundation, label }: { foundation: CounterFoundation; label: string }) {
            useLayoutEffect(() => {
                foundation.reportLabel();
            }, [foundation, label]);
            return null;
        }
        const { rerender } = render(
            <Counter label="a" log={log}>
                {(foundation) => <Child foundation={foundation} label="a" />}
            </Counter>
        );
        rerender(
            <Counter label="b" log={log}>
                {(foundation) => <Child foundation={foundation} label="b" />}
            </Counter>
        );
        expect(log).toHaveBeenLastCalledWith('label b');
    });

    it('setState 总会重新渲染，与 class 组件一致', () => {
        const onRender = vi.fn<() => void>();
        let foundation: CounterFoundation;
        render(<Counter log={() => {}} onRender={(f) => ((foundation = f), onRender())} />);
        const renders = onRender.mock.calls.length;
        act(() => foundation.setState({}));
        expect(onRender.mock.calls.length).toBe(renders + 1);
    });

    it('transition 中的 setState 不会提前出现在紧急更新的渲染里', () => {
        interface PairState {
            a: number;
            b: number;
        }
        interface PairProps {
            onRender: (foundation: PairFoundation, state: PairState) => void;
        }
        class PairFoundation extends BaseFoundation<DefaultAdapter<PairProps, PairState>, PairProps, PairState> {}
        const renders: PairState[] = [];
        let foundation: PairFoundation;
        function Pair(props: PairProps) {
            const [f, state] = useFoundation(
                PairFoundation,
                props,
                () => ({ a: 0, b: 0 }),
                () => ({})
            );
            props.onRender(f, state);
            return null;
        }
        render(<Pair onRender={(f, state) => ((foundation = f), renders.push(state))} />);
        renders.length = 0;
        act(() => {
            startTransition(() => foundation.setState({ a: 1 }));
            foundation.setState({ b: 1 });
        });
        expect(renders).toEqual([
            { a: 0, b: 1 },
            { a: 1, b: 1 },
        ]);
        expect(foundation.getStates()).toEqual({ a: 1, b: 1 });
    });

    it('transition 中 setState 的回调等到该更新进入 DOM 才执行', () => {
        interface PairState {
            a: number;
            b: number;
        }
        interface PairProps {
            onRender: (foundation: PairFoundation) => void;
        }
        class PairFoundation extends BaseFoundation<DefaultAdapter<PairProps, PairState>, PairProps, PairState> {}
        let foundation: PairFoundation;
        function Pair(props: PairProps) {
            const [f, state] = useFoundation(
                PairFoundation,
                props,
                () => ({ a: 0, b: 0 }),
                () => ({})
            );
            props.onRender(f);
            return <span data-testid="pair">{`${state.a}-${state.b}`}</span>;
        }
        render(<Pair onRender={(f) => (foundation = f)} />);
        const seen: string[] = [];
        act(() => {
            startTransition(() => foundation.setState({ a: 1 }, () => seen.push(screen.getByTestId('pair').textContent)));
            foundation.setState({ b: 1 });
        });
        expect(seen).toEqual(['1-1']);
    });

    it('挂载、StrictMode 重新挂载与卸载期间保持同一实例', () => {
        const log = vi.fn<(entry: string) => void>();
        const instances = new Set<CounterFoundation>();
        const { unmount } = render(
            <StrictMode>
                <Counter log={log} onRender={(f) => instances.add(f)} />
            </StrictMode>
        );
        // StrictMode creates a throwaway instance; the one that gets init is reused for every later render
        const entries = () => log.mock.calls.map(([entry]) => entry);
        expect(entries()).toEqual(['init', 'destroy', 'init']);
        unmount();
        expect(entries()).toEqual(['init', 'destroy', 'init', 'destroy']);
        expect(instances.size).toBeLessThanOrEqual(2);
    });

    it('signal 在卸载时移除监听，StrictMode 重新挂载后是新的', () => {
        const onKey = vi.fn<() => void>();
        class KeyFoundation extends BaseFoundation<DefaultAdapter> {
            override init() {
                document.addEventListener('keydown', onKey, { signal: this.signal });
            }
        }
        function Keys() {
            useFoundation(
                KeyFoundation,
                {},
                () => ({}),
                () => ({})
            );
            return null;
        }
        const { unmount } = render(
            <StrictMode>
                <Keys />
            </StrictMode>
        );
        document.dispatchEvent(new KeyboardEvent('keydown'));
        expect(onKey).toHaveBeenCalledTimes(1);
        unmount();
        document.dispatchEvent(new KeyboardEvent('keydown'));
        expect(onKey).toHaveBeenCalledTimes(1);
    });

    it('在挂载生命周期之外访问 signal 会抛错', () => {
        class EarlyFoundation extends BaseFoundation<DefaultAdapter> {
            read() {
                return this.signal;
            }
        }
        expect(() => new EarlyFoundation({} as DefaultAdapter).read()).toThrow(/only available while the component is mounted/);
    });
});

describe('useEventListener', () => {
    type ListenerArgs = Parameters<typeof useEventListener>;
    function Listener({ target, type, listener, options }: { target: ListenerArgs[0]; type: ListenerArgs[1]; listener: ListenerArgs[2]; options?: ListenerArgs[3] }) {
        useEventListener(target, type, listener, options);
        return null;
    }
    // an array literal is inferred as string[], not as the hook's event name type
    const resize = ['resize'] as unknown as ListenerArgs[1];

    it('监听所有给定事件，卸载时全部移除', () => {
        const listener = vi.fn<(e: Event) => void>();
        const { unmount } = render(<Listener type={['pointerup', 'pointercancel']} listener={listener} target={window} />);
        window.dispatchEvent(new Event('pointerup'));
        window.dispatchEvent(new Event('pointercancel'));
        expect(listener.mock.calls.map(([e]) => e.type)).toEqual(['pointerup', 'pointercancel']);
        unmount();
        window.dispatchEvent(new Event('pointerup'));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('enabled 切换时移除并重新添加监听', () => {
        const listener = vi.fn<() => void>();
        const { rerender } = render(<Listener type="keydown" listener={listener} options={{ enabled: false }} target={document} />);
        document.dispatchEvent(new Event('keydown'));
        expect(listener).not.toHaveBeenCalled();
        rerender(<Listener type="keydown" listener={listener} options={{ enabled: true }} target={document} />);
        document.dispatchEvent(new Event('keydown'));
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('调用最新一次渲染的监听函数，且不重新订阅', () => {
        const add = vi.spyOn(window, 'addEventListener');
        const first = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        const { rerender } = render(<Listener type={resize} listener={first} target={window} />);
        rerender(<Listener type={resize} listener={second} target={window} />);
        window.dispatchEvent(new Event('resize'));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
        add.mockRestore();
    });

    it('挂载后读取 ref 目标', () => {
        const listener = vi.fn<() => void>();
        function Box() {
            const ref = useRef<HTMLDivElement>(null);
            useEventListener(ref, 'scroll', listener);
            return <div ref={ref} data-testid="box" />;
        }
        render(<Box />);
        screen.getByTestId('box').dispatchEvent(new Event('scroll'));
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('getWindow 目标接受 window 专有事件，监听函数收到对应事件类型', () => {
        const listener = vi.fn<(e: PopStateEvent) => void>();
        function History() {
            useEventListener(getWindow, 'popstate', listener);
            return null;
        }
        render(<History />);
        window.dispatchEvent(new PopStateEvent('popstate', { state: 1 }));
        expect(listener.mock.calls[0][0].state).toBe(1);
    });

    it('页面有 name 为 current 的 form 时，document 目标仍是 document', () => {
        document.body.insertAdjacentHTML('beforeend', '<form name="current"></form>');
        const listener = vi.fn<() => void>();
        try {
            render(<Listener type="keydown" listener={listener} target={document} />);
            document.dispatchEvent(new Event('keydown'));
            expect(listener).toHaveBeenCalledTimes(1);
        } finally {
            document.querySelector('form[name="current"]')?.remove();
        }
    });
});

describe('useResizeObserver', () => {
    type ObserverArgs = Parameters<typeof useResizeObserver>;
    function Observer({ target, onResize, options }: { target: ObserverArgs[0]; onResize: ObserverArgs[1]; options?: ObserverArgs[2] }) {
        useResizeObserver(target, onResize, options);
        return null;
    }

    it('观察 ref 指向的元素，回调收到条目，卸载时停止观察', () => {
        const resize = mockResizeObserver();
        const onResize = vi.fn<(entries: ResizeObserverEntry[]) => void>();
        function Box() {
            const ref = useRef<HTMLDivElement>(null);
            useResizeObserver(ref, onResize);
            return <div ref={ref} data-testid="box" />;
        }
        const { unmount } = render(<Box />);
        const box = screen.getByTestId('box');
        expect(resize.observed()).toEqual([box]);
        resize.fire(box, [{ target: box }]);
        expect(onResize).toHaveBeenCalledWith([{ target: box }]);
        unmount();
        expect(resize.observed()).toEqual([]);
    });

    it('目标为 null 时不观察', () => {
        const resize = mockResizeObserver();
        render(<Observer target={null} onResize={() => {}} />);
        expect(resize.observed()).toEqual([]);
    });

    it('ref 尚未挂到元素上时不观察', () => {
        const resize = mockResizeObserver();
        render(<Observer target={{ current: null }} onResize={() => {}} />);
        expect(resize.observed()).toEqual([]);
    });

    it('enabled 切换时停止并重新观察', () => {
        const resize = mockResizeObserver();
        const element = document.createElement('div');
        const { rerender } = render(<Observer options={{ enabled: false }} target={element} onResize={() => {}} />);
        expect(resize.observed()).toEqual([]);
        rerender(<Observer options={{ enabled: true }} target={element} onResize={() => {}} />);
        expect(resize.observed()).toEqual([element]);
        rerender(<Observer options={{ enabled: false }} target={element} onResize={() => {}} />);
        expect(resize.observed()).toEqual([]);
    });

    it('目标元素更换时改为观察新元素', () => {
        const resize = mockResizeObserver();
        const first = document.createElement('div');
        const second = document.createElement('div');
        const { rerender } = render(<Observer target={first} onResize={() => {}} />);
        rerender(<Observer target={second} onResize={() => {}} />);
        expect(resize.observed()).toEqual([second]);
    });

    it('调用最新一次渲染的回调，且不重新观察', () => {
        const resize = mockResizeObserver();
        const element = document.createElement('div');
        const first = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        const { rerender } = render(<Observer target={element} onResize={first} />);
        rerender(<Observer target={element} onResize={second} />);
        resize.fire(element, []);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        expect(resize.observers).toHaveLength(1);
    });
});

describe('useDefaultProps', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    interface ProbeProps {
        size?: string | null;
        onClick?: () => void;
        defaultChecked?: boolean;
        onMerged: (merged: ProbeProps) => void;
    }
    function Probe(props: ProbeProps) {
        const merged = useDefaultProps('Switch', props, { size: 'default', onClick: undefined });
        props.onMerged(merged);
        return null;
    }
    const mergedOf = (props: Omit<ProbeProps, 'onMerged'>) => {
        let merged: ProbeProps;
        render(<Probe {...props} onMerged={(m) => (merged = m)} />);
        return merged;
    };

    it('填充 undefined 的属性，保留显式传入的值（包括 null）', () => {
        expect(mergedOf({}).size).toBe('default');
        expect(mergedOf({ size: undefined }).size).toBe('default');
        expect(mergedOf({ size: 'small' }).size).toBe('small');
        expect(mergedOf({ size: null }).size).toBe(null);
    });

    it('优先使用全局覆盖值，包括组件没有默认值的键', () => {
        // the Probe's own props only borrow a key of the global defaults type; the cast keeps Switch's prop types out
        semiGlobal.config.overrideDefaultProps = {
            Switch: { size: 'large', defaultChecked: true },
        };
        const merged = mergedOf({});
        expect(merged.size).toBe('large');
        expect(merged.defaultChecked).toBe(true);
        expect(mergedOf({ size: 'small' }).size).toBe('small');
    });

    it('全局值为 undefined 时回退组件默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            Switch: { size: undefined },
        };
        expect(mergedOf({}).size).toBe('default');
    });

    it('默认值里的键都出现在合并结果中', () => {
        expect('onClick' in mergedOf({})).toBe(true);
    });

    // the global type excludes per-instance ids; the cast stands for an untyped app that sets them anyway
    const setGlobal = (value: object) => {
        semiGlobal.config.overrideDefaultProps = value as OverrideDefaultProps;
    };

    it('忽略全局默认值里的 id 类属性，其余键照常填充', () => {
        setGlobal({
            Switch: { size: 'large', id: 'g', insetLabelId: 'g', wrapperId: 'g', addonId: 'g', extraId: 'g' },
        });
        const merged = mergedOf({});
        expect(merged.size).toBe('large');
        for (const key of ['id', 'insetLabelId', 'wrapperId', 'addonId', 'extraId']) {
            expect(merged).not.toHaveProperty(key);
        }
    });

    it('全局默认值的类型不含 id 类属性', () => {
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().not.toHaveProperty('insetLabelId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Tooltip']>>().not.toHaveProperty('wrapperId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Radio']>>().not.toHaveProperty('addonId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Checkbox']>>().not.toHaveProperty('extraId');
        expectTypeOf<NonNullable<OverrideDefaultProps['Select']>>().toHaveProperty('size');
    });

    it('全局设 id 时两个实例 id 不同', () => {
        setGlobal({ Select: { id: 'dup' } });
        render(
            <>
                <Select aria-label="a" />
                <Select aria-label="b" />
            </>
        );
        expect(document.querySelectorAll('#dup')).toHaveLength(0);
        const [first, second] = screen.getAllByRole('combobox');
        expect(first.id).not.toBe('');
        expect(first.id).not.toBe(second.id);
    });
});

describe('useDidUpdate', () => {
    function Watch({ value, onChange }: { value: number; onChange: (value: number, previous: number) => void }) {
        useDidUpdate(value, onChange);
        return null;
    }

    it('值变化后以旧值触发，挂载或 StrictMode 重新挂载时从不触发', () => {
        const onChange = vi.fn<(value: number, previous: number) => void>();
        const { rerender } = render(
            <StrictMode>
                <Watch value={1} onChange={onChange} />
            </StrictMode>
        );
        expect(onChange).not.toHaveBeenCalled();
        rerender(
            <StrictMode>
                <Watch value={1} onChange={onChange} />
            </StrictMode>
        );
        expect(onChange).not.toHaveBeenCalled();
        rerender(
            <StrictMode>
                <Watch value={2} onChange={onChange} />
            </StrictMode>
        );
        expect(onChange.mock.calls).toEqual([[2, 1]]);
    });

    it('自定义比较会跳过内容相同的新对象', () => {
        const onChange = vi.fn<(value: { a: number[] }, previous: { a: number[] }) => void>();
        function DeepWatch({ value }: { value: { a: number[] } }) {
            useDidUpdate(value, onChange, isEqual);
            return null;
        }
        const { rerender } = render(<DeepWatch value={{ a: [1] }} />);
        rerender(<DeepWatch value={{ a: [1] }} />);
        expect(onChange).not.toHaveBeenCalled();
        rerender(<DeepWatch value={{ a: [2] }} />);
        expect(onChange.mock.calls).toEqual([[{ a: [2] }, { a: [1] }]]);
    });
});

describe('useCopied', () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    beforeEach(() => {
        // jsdom has no Clipboard API
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function CopyButton() {
        const [copied, copy] = useCopied(1000);
        return <button onClick={() => void copy('text')}>{copied ? 'copied' : 'copy'}</button>;
    }

    it('在指定时长内显示已复制，卸载时取消重置', async () => {
        const { unmount } = render(<CopyButton />);
        const button = screen.getByRole('button');
        await act(async () => button.click());
        expect(writeText).toHaveBeenCalledWith('text');
        expect(button).toHaveTextContent('copied');
        await act(async () => vi.advanceTimersByTime(1000));
        expect(button).toHaveTextContent('copy');

        await act(async () => button.click());
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('复制在卸载后才完成时不再启动重置定时器', async () => {
        const { promise, resolve } = Promise.withResolvers<void>();
        writeText.mockReturnValueOnce(promise);
        const { unmount } = render(<CopyButton />);
        act(() => screen.getByRole('button').click());
        unmount();
        await act(async () => resolve());
        expect(vi.getTimerCount()).toBe(0);
    });
});
