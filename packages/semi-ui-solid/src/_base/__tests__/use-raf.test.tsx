import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import useRaf from '../use-raf';

describe('useRaf', () => {
    afterEach(() => vi.useRealTimers());

    it('新的调用替换待执行的回调，卸载后不再执行', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        let schedule!: (callback: FrameRequestCallback) => void;
        const view = render(() => {
            schedule = useRaf();
            return null;
        });
        const first = vi.fn<FrameRequestCallback>();
        const second = vi.fn<FrameRequestCallback>();
        schedule(first);
        schedule(second);
        vi.advanceTimersToNextFrame();
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();

        const late = vi.fn<FrameRequestCallback>();
        schedule(late);
        view.unmount();
        vi.advanceTimersToNextFrame();
        expect(late).not.toHaveBeenCalled();
    });
});
