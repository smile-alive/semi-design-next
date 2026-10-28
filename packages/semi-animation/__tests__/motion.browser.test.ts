import { animate } from 'motion';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { easings, springs } from '../index';

const boxes = [];
const box = () => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 20px; height: 20px; background: tomato';
    document.body.append(el);
    boxes.push(el);
    return el;
};

afterEach(() => {
    for (const el of boxes.splice(0)) {
        el.remove();
    }
});

// The presets are data for Motion; these check Motion takes them as they are
describe('Motion 中的 semi-animation 预设', () => {
    it('通过浏览器对元素运行 Bézier 缓动', async () => {
        const el = box();
        const controls = animate(el, { opacity: [0, 1] }, { duration: 1, ease: easings.easeInOutCubic });
        // Motion resolves keyframes in a batch before it hands the animation to the browser
        await new Promise(requestAnimationFrame);
        expect(el.getAnimations()).toHaveLength(1);
        controls.time = 0.5;
        expect(Number(getComputedStyle(el).opacity)).toBeCloseTo(0.5, 1);
        controls.complete();
        await controls.finished;
        expect(getComputedStyle(el).opacity).toBe('1');
    });

    it('运行 elastic 缓动函数', async () => {
        const el = box();
        await animate(el, { opacity: [0, 1] }, { duration: 0.05, ease: easings.easeOutElastic }).finished;
        expect(getComputedStyle(el).opacity).toBe('1');
    });

    it('每个 spring 预设都会稳定到目标值', async () => {
        await Promise.all(
            Object.values(springs).map(async (spring) => {
                const el = box();
                await animate(el, { opacity: [0, 1] }, spring).finished;
                expect(getComputedStyle(el).opacity).toBe('1');
            })
        );
    });

    it('使用预设对数值做动画', async () => {
        const updates = [];
        await animate(0, 100, { ...springs.stiff, onUpdate: (v) => updates.push(v) }).finished;
        expect(updates.at(-1)).toBe(100);
    });
});
