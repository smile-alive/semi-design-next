import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import AnimationProbe from './animation-probe.svelte';
import { createStore } from './store.svelte';

const content = () => document.querySelector<HTMLElement>('[data-testid="content"]');
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('cssAnimation 复用 foundation SCSS 的动画类', () => {
    it('进场挂上 show 类并读到 SCSS 的时长，结束后移除类；出场期间节点保留并挂 hide 类，结束后移除节点', async () => {
        const store = createStore({ visible: false });
        render(AnimationProbe, { props: { store } });

        store.visible = true;
        flushSync();
        const node = content() as HTMLElement;
        expect(node.classList.contains('semi-modal-content-animate-show')).toBe(true);
        const { animationName, animationDuration } = getComputedStyle(node);
        expect(animationName).toBe('semi-modal-content-keyframe-show');
        const duration = parseFloat(animationDuration) * (animationDuration.endsWith('ms') ? 1 : 1000);
        expect(duration).toBeGreaterThan(0);
        await wait(duration + 100);
        expect(node.classList.contains('semi-modal-content-animate-show')).toBe(false);

        store.visible = false;
        flushSync();
        expect(content()).toBe(node);
        expect(node.classList.contains('semi-modal-content-animate-hide')).toBe(true);
        expect(getComputedStyle(node).animationName).toBe('semi-modal-content-keyframe-hide');
        await wait(duration + 100);
        expect(content()).toBe(null);
    });
});
