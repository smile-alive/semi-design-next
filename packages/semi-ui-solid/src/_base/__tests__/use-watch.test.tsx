import { createSignal, onMount } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useWatch from '../use-watch';

describe('useWatch', () => {
    it('不报告初始值，之后每次变化报告一次，并带上一次的值', () => {
        const [value, setValue] = createSignal(1);
        const fn = vi.fn<(value: number, previous: number) => void>();
        render(() => {
            useWatch(value, fn);
            return null;
        });
        expect(fn).not.toHaveBeenCalled();

        setValue(2);
        setValue(2);
        setValue(3);
        expect(fn.mock.calls).toEqual([
            [2, 1],
            [3, 2],
        ]);
    });

    it('在 effect 首次运行前发生的变化也会报告', () => {
        const fn = vi.fn<(value: boolean) => void>();
        function Child(props: { checked: boolean }) {
            useWatch(() => props.checked, fn);
            return null;
        }
        render(() => {
            const [checked, setChecked] = createSignal(false);
            onMount(() => setChecked(true));
            return <Child checked={checked()} />;
        });
        expect(fn.mock.calls).toEqual([[true, false]]);
    });

    it('NaN 重复出现不算变化', () => {
        const [value, setValue] = createSignal(Number.NaN, { equals: false });
        const fn = vi.fn<(value: number) => void>();
        render(() => {
            useWatch(value, fn);
            return null;
        });
        setValue(Number.NaN);
        expect(fn).not.toHaveBeenCalled();
    });

    it('回调不订阅其中读取的 signal', () => {
        const [value, setValue] = createSignal(1);
        const [other, setOther] = createSignal(0);
        const fn = vi.fn<(value: number) => void>();
        render(() => {
            useWatch(value, (next) => {
                other();
                fn(next);
            });
            return null;
        });
        setValue(2);
        setOther(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
