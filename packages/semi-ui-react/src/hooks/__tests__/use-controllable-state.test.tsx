import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import useControllableState from '../use-controllable-state';

function Counter({ value, onChange }: { value?: number; onChange?: (value: number) => void }) {
    const [count, setCount] = useControllableState({ value, defaultValue: 0, onChange });
    return (
        <button
            type="button"
            onClick={() => {
                setCount((prev) => prev + 1);
                setCount((prev) => prev + 1);
            }}
        >
            {count}
        </button>
    );
}

describe('useControllableState', () => {
    it('非受控时自己保存值，连续的 updater 看到前一次的结果', () => {
        const onChange = vi.fn<(value: number) => void>();
        render(<Counter onChange={onChange} />);
        act(() => screen.getByRole('button').click());
        expect(screen.getByRole('button')).toHaveTextContent('2');
        expect(onChange.mock.calls).toEqual([[1], [2]]);
    });

    it('受控时只通知 onChange，显示父组件给的值', () => {
        const onChange = vi.fn<(value: number) => void>();
        const { rerender } = render(<Counter value={5} onChange={onChange} />);
        act(() => screen.getByRole('button').click());
        expect(screen.getByRole('button')).toHaveTextContent('5');
        expect(onChange).toHaveBeenLastCalledWith(7);
        rerender(<Counter value={7} onChange={onChange} />);
        expect(screen.getByRole('button')).toHaveTextContent('7');
    });

    it('值不变时不调用 onChange', () => {
        const onChange = vi.fn<(value: number) => void>();
        function Same() {
            const [value, setValue] = useControllableState({ defaultValue: 1, onChange });
            return (
                <button type="button" onClick={() => setValue(1)}>
                    {value}
                </button>
            );
        }
        render(<Same />);
        act(() => screen.getByRole('button').click());
        expect(onChange).not.toHaveBeenCalled();
    });
});
