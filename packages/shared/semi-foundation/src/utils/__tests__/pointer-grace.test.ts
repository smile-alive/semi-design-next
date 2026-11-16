import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { getGraceArea, getGraceSide, isPointInTriangle, POINTER_GRACE_TIMEOUT, trackPointerGrace, type GracePoint, type GraceRect, type GraceTriangle } from '../pointer-grace';

const rect = (left: number, top: number, right: number, bottom: number): GraceRect => ({ left, top, right, bottom });

// a menu item at 0..100 × 0..30 and its submenu to the right
const trigger = rect(0, 0, 100, 30);
const popup = rect(102, 0, 202, 200);

const move = (x: number, y: number, pointerType = 'mouse') => {
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType, bubbles: true }));
};

describe('isPointInTriangle', () => {
    const triangle: GraceTriangle = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
    ];

    it.each<[GracePoint, boolean]>([
        [{ x: 2, y: 2 }, true],
        [{ x: 5, y: 5 }, true],
        [{ x: 4.9, y: 5.05 }, true],
        [{ x: 5.05, y: 5 }, false],
        [{ x: 6, y: 6 }, false],
        [{ x: -1, y: 2 }, false],
        [{ x: 2, y: 11 }, false],
    ])('%o 在三角形内为 %s', ({ x, y }, expected) => {
        expect(isPointInTriangle(x, y, triangle)).toBe(expected);
    });
});

describe('getGraceSide', () => {
    it.each<[GraceRect, string | null]>([
        [rect(102, 0, 202, 200), 'right'],
        [rect(-150, 0, -2, 200), 'left'],
        [rect(-20, 34, 120, 80), 'bottom'],
        [rect(-20, -60, 120, -4), 'top'],
        [rect(90, 20, 200, 80), null],
    ])('弹层 %o 位于触发器的 %s 侧', (to, expected) => {
        expect(getGraceSide(trigger, to)).toBe(expected);
    });
});

describe('getGraceArea', () => {
    it('三角形顶点从离开点向反方向外扩，底边是弹层近侧的两个角', () => {
        expect(getGraceArea({ x: 60, y: 30 }, popup, 'right')).toEqual([
            { x: 55, y: 30 },
            { x: 102, y: 0 },
            { x: 102, y: 200 },
        ]);
        expect(getGraceArea({ x: 50, y: 0 }, rect(0, -80, 100, -4), 'top')).toEqual([
            { x: 50, y: 5 },
            { x: 0, y: -4 },
            { x: 100, y: -4 },
        ]);
    });
});

describe('trackPointerGrace', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('弹层没有面积、与触发器重叠、已包含离开点，或从远离弹层的一侧离开时不建立宽限', () => {
        const onEnd = vi.fn<(reached: boolean, last: GracePoint) => void>();
        expect(trackPointerGrace({ x: 60, y: 30 }, trigger, rect(102, 0, 102, 0), onEnd)).toBeNull();
        expect(trackPointerGrace({ x: 60, y: 30 }, trigger, rect(90, 20, 200, 80), onEnd)).toBeNull();
        expect(trackPointerGrace({ x: 150, y: 10 }, trigger, popup, onEnd)).toBeNull();
        expect(trackPointerGrace({ x: -1, y: 10 }, trigger, popup, onEnd)).toBeNull();
        const cancel = trackPointerGrace({ x: 0, y: 31 }, trigger, popup, onEnd);
        expect(cancel).not.toBeNull();
        cancel?.();
    });

    it('斜着移向弹层并进入时以 reached 结束', () => {
        const onEnd = vi.fn<(reached: boolean, last: GracePoint) => void>();
        trackPointerGrace({ x: 60, y: 30 }, trigger, popup, onEnd);
        move(70, 38);
        move(85, 45);
        expect(onEnd).not.toHaveBeenCalled();
        move(110, 52);
        expect(onEnd).toHaveBeenCalledExactlyOnceWith(true, { x: 110, y: 52 });
        vi.advanceTimersByTime(POINTER_GRACE_TIMEOUT);
        expect(onEnd).toHaveBeenCalledOnce();
    });

    it('离开三角形、反向移动或超时都以失败结束', () => {
        const outside = vi.fn<(reached: boolean, last: GracePoint) => void>();
        trackPointerGrace({ x: 60, y: 30 }, trigger, popup, outside);
        move(62, 90);
        expect(outside).toHaveBeenCalledExactlyOnceWith(false, { x: 62, y: 90 });

        const away = vi.fn<(reached: boolean, last: GracePoint) => void>();
        trackPointerGrace({ x: 60, y: 30 }, trigger, popup, away);
        move(58, 31);
        expect(away).toHaveBeenCalledExactlyOnceWith(false, { x: 58, y: 31 });

        const timeout = vi.fn<(reached: boolean, last: GracePoint) => void>();
        trackPointerGrace({ x: 60, y: 30 }, trigger, popup, timeout);
        move(70, 36);
        vi.advanceTimersByTime(POINTER_GRACE_TIMEOUT - 1);
        expect(timeout).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(timeout).toHaveBeenCalledExactlyOnceWith(false, { x: 70, y: 36 });
    });

    it('沿轴零位移不算方向错误，非鼠标指针被忽略', () => {
        const onEnd = vi.fn<(reached: boolean, last: GracePoint) => void>();
        trackPointerGrace({ x: 60, y: 30 }, trigger, popup, onEnd);
        move(60, 31);
        move(10, 30, 'touch');
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('取消后不再回调，也不再监听', () => {
        const onEnd = vi.fn<(reached: boolean, last: GracePoint) => void>();
        const cancel = trackPointerGrace({ x: 60, y: 30 }, trigger, popup, onEnd);
        cancel?.();
        move(62, 90);
        vi.advanceTimersByTime(POINTER_GRACE_TIMEOUT);
        expect(onEnd).not.toHaveBeenCalled();
    });
});
