import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useControllableState from '../use-controllable-state';

function Counter(props: { value?: number; onChange?: (value: number) => void }) {
    const [count, setCount] = useControllableState({
        value: () => props.value,
        defaultValue: 0,
        get onChange() {
            return props.onChange;
        },
    });
    return (
        <button
            type="button"
            onClick={() => {
                setCount((prev) => prev + 1);
                setCount((prev) => prev + 1);
            }}
        >
            {count()}
        </button>
    );
}

describe('useControllableState', () => {
    it('非受控时自己保存值，连续的 updater 看到前一次的结果', () => {
        const onChange = vi.fn<(value: number) => void>();
        render(() => <Counter onChange={onChange} />);
        screen.getByRole('button').click();
        expect(screen.getByRole('button')).toHaveTextContent('2');
        expect(onChange.mock.calls).toEqual([[1], [2]]);
    });

    it('受控时只通知 onChange，显示父组件给的值，连续的 updater 仍看到前一次的结果', () => {
        const onChange = vi.fn<(value: number) => void>();
        const [value, setValue] = createSignal(5);
        render(() => <Counter value={value()} onChange={onChange} />);
        screen.getByRole('button').click();
        expect(screen.getByRole('button')).toHaveTextContent('5');
        expect(onChange.mock.calls).toEqual([[6], [7]]);
        setValue(7);
        expect(screen.getByRole('button')).toHaveTextContent('7');
    });

    it('值不变时不调用 onChange', () => {
        const onChange = vi.fn<(value: number) => void>();
        function Same() {
            const [value, setValue] = useControllableState({ value: () => undefined, defaultValue: 1, onChange });
            return (
                <button type="button" onClick={() => setValue(1)}>
                    {value()}
                </button>
            );
        }
        render(() => <Same />);
        screen.getByRole('button').click();
        expect(onChange).not.toHaveBeenCalled();
    });
});
