import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ResetTimer } from '../reset-timer';

describe('ResetTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('时间到后调用 onEnd', () => {
        const timer = new ResetTimer();
        const onEnd = vi.fn<() => void>();
        timer.mount();
        timer.start(100, onEnd);
        vi.advanceTimersByTime(99);
        expect(onEnd).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('重复 start 重新计时，只触发最后一次', () => {
        const timer = new ResetTimer();
        const first = vi.fn<() => void>();
        const second = vi.fn<() => void>();
        timer.mount();
        timer.start(100, first);
        vi.advanceTimersByTime(60);
        timer.start(100, second);
        vi.advanceTimersByTime(100);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('卸载后取消计时，并忽略之后的 start', () => {
        const timer = new ResetTimer();
        const onEnd = vi.fn<() => void>();
        timer.mount();
        timer.start(100, onEnd);
        timer.unmount();
        timer.start(100, onEnd);
        vi.advanceTimersByTime(200);
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('卸载后再挂载可以重新使用', () => {
        const timer = new ResetTimer();
        const onEnd = vi.fn<() => void>();
        timer.mount();
        timer.unmount();
        timer.mount();
        timer.start(100, onEnd);
        vi.advanceTimersByTime(100);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });
});
