import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import useMutationObserver from '../use-mutation-observer';

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useMutationObserver', () => {
    it('开始观察时以空记录调用一次，DOM 变化时再调用，卸载后不再调用', async () => {
        const onChange = vi.fn<(records: MutationRecord[]) => void>();
        function Probe() {
            const [el, setEl] = createSignal<HTMLElement>();
            useMutationObserver(el, onChange, { attributes: true });
            return <div data-testid="box" ref={setEl} />;
        }
        const view = render(() => <Probe />);
        expect(onChange.mock.calls).toEqual([[[]]]);

        const box = view.getByTestId('box');
        box.setAttribute('data-x', '1');
        await flushMutations();
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0][0].attributeName).toBe('data-x');

        view.unmount();
        box.setAttribute('data-x', '2');
        await flushMutations();
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('回调里读取的 signal 变化不会重启观察', () => {
        const [mode, setMode] = createSignal('light');
        const onChange = vi.fn<(records: MutationRecord[]) => void>();
        render(() => {
            useMutationObserver(
                () => document.body,
                (records) => {
                    mode();
                    onChange(records);
                },
                { attributeFilter: ['theme-mode'] }
            );
            return null;
        });
        setMode('dark');
        expect(onChange).toHaveBeenCalledOnce();
    });
});
