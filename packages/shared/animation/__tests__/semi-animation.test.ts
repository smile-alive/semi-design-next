import { describe, expect, it } from 'vite-plus/test';
import { easings, springs, type CubicBezier, type EasingFunction } from '../index';

const entries = Object.entries(easings);
const beziers = entries.filter(([, ease]) => typeof ease !== 'function') as [string, CubicBezier][];
const functions = entries.filter(([, ease]) => typeof ease === 'function') as [string, EasingFunction][];

describe('@fibrae/semi-animation', () => {
    it('包含 linear 与 27 种 Penner 缓动', () => {
        expect(entries).toHaveLength(28);
        expect(functions.map(([name]) => name)).toEqual(['easeInElastic', 'easeOutElastic', 'easeInOutElastic']);
    });

    it.each(beziers)('%s 是合法的三次 Bézier 曲线', (_name, ease) => {
        expect(ease).toHaveLength(4);
        // the x of both control points must stay in [0, 1] for a valid cubic-bezier()
        expect([ease[0], ease[2]].every((x) => x >= 0 && x <= 1)).toBe(true);
    });

    it.each(functions)('%s 从 0 运行到 1', (_name, ease) => {
        expect(ease(0)).toBe(0);
        expect(ease(1)).toBeCloseTo(1);
    });

    it('弹性缓动允许超出目标值', () => {
        const samples = Array.from({ length: 101 }, (_, i) => easings.easeOutElastic(i / 100));
        expect(Math.max(...samples)).toBeGreaterThan(1);
    });

    it('每个 spring 都输出为 Motion 的 spring transition', () => {
        for (const spring of Object.values(springs)) {
            expect(spring).toEqual({ type: 'spring', stiffness: expect.any(Number), damping: expect.any(Number) });
        }
        expect(springs.default).toEqual({ type: 'spring', stiffness: 170, damping: 26 });
    });
});
