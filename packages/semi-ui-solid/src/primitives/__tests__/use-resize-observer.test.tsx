import { createSignal, Show } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { mockResizeObserver } from '@test/utils/solid';
import useResizeObserver from '../use-resize-observer';

describe('useResizeObserver', () => {
    it('观察目标元素，回调收到尺寸通知，卸载后释放', () => {
        const mock = mockResizeObserver();
        const onResize = vi.fn<(entries: ResizeObserverEntry[]) => void>();
        function Probe() {
            const [el, setEl] = createSignal<HTMLElement>();
            useResizeObserver(el, onResize);
            return <div data-testid="box" ref={setEl} />;
        }
        const view = render(() => <Probe />);
        const box = view.getByTestId('box');
        expect(mock.observed()).toEqual([box]);

        mock.fire(box, [{ contentRect: { width: 10 } }]);
        expect(onResize).toHaveBeenCalledWith([{ contentRect: { width: 10 } }]);

        view.unmount();
        expect(mock.live()).toHaveLength(0);
    });

    it('没有目标时不创建观察器，目标之后出现再开始观察', () => {
        const mock = mockResizeObserver();
        const [shown, setShown] = createSignal(false);
        function Probe() {
            const [el, setEl] = createSignal<HTMLElement>();
            useResizeObserver(el, () => {});
            return (
                <Show when={shown()}>
                    <div data-testid="late" ref={setEl} />
                </Show>
            );
        }
        const view = render(() => <Probe />);
        expect(mock.observers).toHaveLength(0);

        setShown(true);
        expect(mock.observed()).toEqual([view.getByTestId('late')]);
    });
});
