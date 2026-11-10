import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import AutoCloseFoundation, { type AutoCloseAdapter } from '../auto-close-foundation';

function setup(duration?: number, { init = true } = {}) {
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
    if (init) {
        foundation.init();
    }
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
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: true, removedItems: [{ id: 'x' }], updatedItems: [] });
        foundation.handleListChange({ paused: false, removedItems: [{ id: 'x' }], updatedItems: [] });
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'x' }] });
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

    it('暂停后恢复重新计满 duration', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        vi.advanceTimersByTime(500);
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        vi.advanceTimersByTime(999);
        expect(notifyClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
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

    it('列表暂停时停止计时，恢复后重新计时', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [] });
        vi.advanceTimersByTime(2000);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        vi.advanceTimersByTime(1000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('挂载时列表已在暂停，init 前后收到都不开始倒计时', () => {
        const paused = { paused: true, removedItems: [], updatedItems: [] };
        const before = setup(1, { init: false });
        before.foundation.handleListChange(paused);
        before.foundation.init();
        const after = setup(1);
        after.foundation.handleListChange(paused);
        vi.advanceTimersByTime(5000);
        expect(before.notifyClose).not.toHaveBeenCalled();
        expect(after.notifyClose).not.toHaveBeenCalled();
    });

    it('列表移除本条后不再倒计时关闭；移除其他条无影响', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: false, removedItems: [{ id: 'other' }], updatedItems: [] });
        vi.advanceTimersByTime(500);
        foundation.handleListChange({ paused: false, removedItems: [{ id: 'x' }], updatedItems: [] });
        vi.advanceTimersByTime(2000);
        expect(notifyClose).not.toHaveBeenCalled();
    });

    it('init 前收到的移除同样生效', () => {
        const { foundation, notifyClose } = setup(1, { init: false });
        foundation.handleListChange({ paused: false, removedItems: [{ id: 'x' }], updatedItems: [] });
        foundation.init();
        vi.advanceTimersByTime(2000);
        expect(notifyClose).not.toHaveBeenCalled();
    });

    it('列表就地更新本条时重启倒计时；首次调用只同步挂载时的状态', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'x' }] });
        vi.advanceTimersByTime(600);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'other' }] });
        vi.advanceTimersByTime(400);
        expect(notifyClose).toHaveBeenCalledTimes(1);

        const updated = setup(1);
        updated.foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        vi.advanceTimersByTime(600);
        updated.foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'x' }] });
        vi.advanceTimersByTime(600);
        expect(updated.notifyClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(400);
        expect(updated.notifyClose).toHaveBeenCalledTimes(1);
    });

    it('暂停中的更新不开始倒计时，恢复后才计时', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [] });
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [{ id: 'x' }] });
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'x' }] });
        vi.advanceTimersByTime(1000);
        expect(notifyClose).toHaveBeenCalledTimes(1);
    });

    it('destroy 之后列表的变化不再开始倒计时', () => {
        const { foundation, notifyClose } = setup(1);
        foundation.handleListChange({ paused: true, removedItems: [], updatedItems: [] });
        foundation.destroy();
        foundation.handleListChange({ paused: false, removedItems: [], updatedItems: [{ id: 'x' }] });
        vi.advanceTimersByTime(5000);
        expect(notifyClose).not.toHaveBeenCalled();
    });
});
