import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import CalendarFoundation from '../foundation';

describe('CalendarFoundation.getTodayRefreshDelay', () => {
    it('距离午夜不足一分钟时等到午夜', () => {
        expect(CalendarFoundation.getTodayRefreshDelay(new Date(2026, 0, 1, 23, 59, 30))).toBe(30_000);
    });

    it('距离午夜超过一分钟时最多等一分钟', () => {
        expect(CalendarFoundation.getTodayRefreshDelay(new Date(2026, 0, 1, 12, 0, 0))).toBe(60_000);
    });
});

describe('CalendarFoundation.watchToday', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('定时、页面可见和窗口聚焦时通知，取消后不再通知', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
        const onChange = vi.fn<() => void>();
        const stop = CalendarFoundation.watchToday(onChange);

        vi.advanceTimersByTime(60_000);
        expect(onChange).toHaveBeenCalledTimes(1);
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
        expect(onChange).toHaveBeenCalledTimes(3);

        stop();
        vi.advanceTimersByTime(120_000);
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
        expect(onChange).toHaveBeenCalledTimes(3);
    });
});
