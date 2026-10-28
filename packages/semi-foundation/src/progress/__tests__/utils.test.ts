import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { calcCircleGeometry, calcPercent, createPercentAnimation } from '../utils';

describe('createPercentAnimation', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('percent 为 NaN 时抛出错误', () => {
        const animation = createPercentAnimation(() => {});
        expect(() => animation.update(NaN, 30, 30, true)).toThrow('[Semi Progress]:percent can not be NaN');
        expect(() => animation.update(30, NaN, 30, true)).toThrow('[Semi Progress]:percent can not be NaN');
    });

    it('关闭 motion 时直接显示新值，并取消正在进行的动画', () => {
        vi.useFakeTimers();
        const setShown = vi.fn<(value: number) => void>();
        const animation = createPercentAnimation(setShown);
        animation.update(100, 0, 0, true);
        vi.advanceTimersByTime(100);
        animation.update(20, 100, 50, false);
        expect(setShown).toHaveBeenLastCalledWith(20);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('动画逐帧靠近目标，结束时恰好是目标值', () => {
        vi.useFakeTimers();
        const setShown = vi.fn<(value: number) => void>();
        const animation = createPercentAnimation(setShown);
        animation.update(50, 30, 30, true);
        vi.advanceTimersByTime(150);
        const midway = setShown.mock.lastCall?.[0] as number;
        expect(midway).toBeGreaterThan(30);
        expect(midway).toBeLessThan(50);
        vi.advanceTimersByTime(300);
        expect(setShown).toHaveBeenLastCalledWith(50);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stop 取消待执行的帧', () => {
        vi.useFakeTimers();
        const animation = createPercentAnimation(() => {});
        animation.update(80, 0, 0, true);
        expect(vi.getTimerCount()).toBeGreaterThan(0);
        animation.stop();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('calcPercent', () => {
    it('将百分比限制在 0 到 100', () => {
        expect(calcPercent(-5)).toBe(0);
        expect(calcPercent(42)).toBe(42);
        expect(calcPercent(130)).toBe(100);
    });
});

describe('calcCircleGeometry', () => {
    it('半径为直径减描边宽度的一半，周长为 2πr', () => {
        const g = calcCircleGeometry(72, 4, 25, false);
        expect(g.center).toBe(36);
        expect(g.radius).toBe(34);
        expect(g.circumference).toBeCloseTo(68 * Math.PI);
        expect(g.strokeDasharray).toBe(`${g.circumference} ${g.circumference}`);
        expect(g.strokeDashoffset).toBeCloseTo(0.75 * g.circumference);
    });

    it('100% 时偏移为 0', () => {
        expect(calcCircleGeometry(72, 4, 100, false).strokeDashoffset).toBe(0);
    });

    it('indeterminate 使用固定 30% 弧长且忽略 percent', () => {
        const g = calcCircleGeometry(72, 4, 50, true);
        expect(g.strokeDashoffset).toBe(0);
        expect(g.strokeDasharray).toBe(`${g.circumference * 0.3} ${g.circumference}`);
    });
});
