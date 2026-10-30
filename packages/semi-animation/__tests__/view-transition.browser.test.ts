import { describe, expect, it } from 'vite-plus/test';
import '../src/styles/viewTransition.scss';

const runningAnimations = () =>
    document.documentElement
        .getAnimations({ subtree: true })
        .map((animation) => (animation as CSSAnimation).animationName)
        .filter(Boolean);

// Animations of a view transition exist from `ready` until `finished`
async function animationsOf(update) {
    const transition = document.startViewTransition(update);
    await transition.ready;
    const names = runningAnimations();
    await transition.finished;
    return names;
}

describe('不依赖框架的 View Transition 类', () => {
    it.each(['fade', 'zoom', 'slide-up', 'slide-down', 'slide-left', 'slide-right'])('semi-%s 通过 view-transition-class 对元素进行进入和退出动画', async (name) => {
        const panel = document.createElement('div');
        panel.style.cssText = `width: 100px; height: 100px; background: tomato; view-transition-name: panel; view-transition-class: semi-${name}`;

        expect(await animationsOf(() => document.body.append(panel))).toContain(`semi-view-transition-${name}-in`);
        expect(await animationsOf(() => panel.remove())).toContain(`semi-view-transition-${name}-out`);
    });
});
