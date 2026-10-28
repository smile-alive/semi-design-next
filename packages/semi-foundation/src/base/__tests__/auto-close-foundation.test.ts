import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import AutoCloseFoundation, { type AutoCloseAdapter } from '../auto-close-foundation';

function setup(duration?: number) {
    const notifyWrapperToRemove = vi.fn<(id: string) => void>();
    const notifyClose = vi.fn<() => void>();
    const props = { id: 'x', duration };
    const state: Record<string, never> = {};
    const adapter: AutoCloseAdapter = {
        getContext: () => undefined,
        getContexts: () => undefined,
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        getStates: () => state,
        setState: () => {},
        notifyWrapperToRemove,
        notifyClose,
    };
    const foundation = new AutoCloseFoundation(adapter);
    foundation.init();
    return { foundation, notifyWrapperToRemove, notifyClose };
}

describe('AutoCloseFoundation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('duration 秒后关闭一次', () => {
        const { notifyWrapperToRemove, notifyClose } = setup(1);
        vi.advanceTimersByTime(999);
        expect(notifyClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(notifyWrapperToRemove).toHaveBeenCalledWith('x');
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('离场后不再计时，恢复不会重启，更新后重新计时', () => {
        const { foundation, notifyClose } = setup(1);
        vi.advanceTimersByTime(900);
        foundation.leave();
        foundation.resumeCloseTimer();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.restartCloseTimer();
        vi.advanceTimersByTime(1000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('duration 为 0 或未设置时不自动关闭', () => {
        for (const duration of [0, undefined]) {
            const { notifyClose } = setup(duration);
            vi.advanceTimersByTime(60_000);
            expect(notifyClose).not.toHaveBeenCalled();
        }
    });

    it('暂停计时，恢复后重新计满 duration，且只有一个计时器', () => {
        const { foundation, notifyClose } = setup(1);
        vi.advanceTimersByTime(500);
        foundation.pauseCloseTimer();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.resumeCloseTimer();
        foundation.resumeCloseTimer();
        vi.advanceTimersByTime(999);
        expect(notifyClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('restartCloseTimer 重新计时，暂停中只清除不开启', () => {
        const { foundation, notifyClose } = setup(1);
        vi.advanceTimersByTime(800);
        foundation.restartCloseTimer();
        vi.advanceTimersByTime(999);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.pauseCloseTimer();
        foundation.restartCloseTimer();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
    });

    it('destroy 清除计时器', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.destroy();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
    });

    it('手动 close 清除计时器，计时到期后不再关闭第二次', () => {
        const { foundation, notifyClose } = setup(1);
        vi.advanceTimersByTime(500);
        foundation.close();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('close 阻止事件冒泡并通知移除与 onClose', () => {
        const { foundation, notifyWrapperToRemove, notifyClose } = setup(0);
        const stopPropagation = vi.fn<() => void>();
        foundation.close({ stopPropagation });
        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(notifyWrapperToRemove).toHaveBeenCalledWith('x');
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });
});
