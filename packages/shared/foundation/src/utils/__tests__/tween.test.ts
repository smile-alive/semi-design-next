import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { easeInOutCubic, linear, tween } from '../tween';

describe('tween', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('经过 duration 后到达 to，并只调用一次 onEnd', () => {
        const values = [];
        const onEnd = vi.fn<() => void>();
        tween({ from: 0, to: 100, duration: 100, onFrame: (v) => values.push(v), onEnd });
        vi.advanceTimersByTime(200);
        expect(values[0]).toBe(0);
        expect(values.at(-1)).toBe(100);
        expect(values).toEqual([...values].toSorted((a, b) => a - b));
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('取消时停止', () => {
        const onFrame = vi.fn<(value: number) => void>();
        const onEnd = vi.fn<() => void>();
        const cancel = tween({ from: 0, to: 1, duration: 1000, onFrame, onEnd });
        vi.advanceTimersByTime(50);
        cancel();
        const frames = onFrame.mock.calls.length;
        vi.advanceTimersByTime(2000);
        expect(onFrame).toHaveBeenCalledTimes(frames);
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('duration 为 0 时直接跳到 to', () => {
        const onFrame = vi.fn<(value: number) => void>();
        tween({ from: 5, to: 9, duration: 0, onFrame });
        vi.advanceTimersByTime(20);
        expect(onFrame).toHaveBeenCalledWith(9);
    });

    it('缓动从 0 开始，到 1 结束', () => {
        for (const easing of [linear, easeInOutCubic]) {
            expect(easing(0)).toBe(0);
            expect(easing(1)).toBe(1);
        }
        expect(easeInOutCubic(0.5)).toBe(0.5);
    });
});
