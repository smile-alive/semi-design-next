import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { tab } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { CollapsibleProps } from '../interface';
import Host from './collapsible-host.svelte';

type Store = CollapsibleProps & { text?: string; height?: string; inside?: boolean; log?: string[] };

const getWrapper = (container: Element) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper') as HTMLElement;
const getInside = () => [...document.querySelectorAll('button')].find((button) => button.textContent === 'inside');

function mount(props: Store = {}) {
    const store = createStore<Store>({ log: [], ...props });
    const view = render(Host, { props: { store } });
    const wrapper = getWrapper(view.container);
    const ended = () => store.log?.filter((entry) => entry === 'motionEnd').length;
    const set = (next: Store) => {
        Object.assign(store, next);
        flushSync();
    };
    return { store, wrapper, ended, set, view };
}

describe('Svelte Collapsible（浏览器）', () => {
    it('折叠到零高度时，内容无法通过 Tab 访问；展开后可以访问', async () => {
        const { set } = mount({ isOpen: false, keepDOM: true, motion: false, inside: true });
        await tab();
        expect(getInside()).not.toHaveFocus();

        set({ isOpen: true });
        await tab();
        expect(getInside()).toHaveFocus();
    });

    it('collapseHeight > 0 时保持可见的预览不是 inert，因此其内容仍可聚焦', async () => {
        mount({ collapseHeight: 40, isOpen: false, motion: false, inside: true });
        await tab();
        expect(getInside()).toHaveFocus();
    });

    // height: auto lays out on every frame with no JS in between, so the wrapper must follow a new content size at once
    it('展开态下内容高度变化时，外层高度在同一次更新中跟随', async () => {
        const { store, wrapper } = mount({ isOpen: true, motion: false, height: '50px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(50);
        store.height = '120px';
        flushSync();
        expect(wrapper.getBoundingClientRect().height).toBe(120);
    });

    it('collapseHeightAdaptive 下，收起高度被真实布局钳制到内容实际高度', async () => {
        const { store, wrapper } = mount({ collapseHeight: 30, collapseHeightAdaptive: true, height: '18px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(18);
        store.height = '60px';
        flushSync();
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);
    });
});

// isOpen always moves height's computed value between a length/calc-size() and auto; these cases pick content sizes
// where both sides resolve to the same pixels, to confirm a real browser still ends the transition and emits motionEnd
describe('Svelte Collapsible（浏览器）- 过渡边界', () => {
    const duration = 50;

    it('collapseHeightAdaptive 且内容比 collapseHeight 矮：收起前后用值高度相同', async () => {
        const { wrapper, ended, set } = mount({ collapseHeight: 40, collapseHeightAdaptive: true, duration, height: '20px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(20);
        set({ isOpen: true });
        await expect.poll(ended).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(20);
    });

    it('非 adaptive 且内容高度恰好等于 collapseHeight：收起前后用值高度相同', async () => {
        const { wrapper, ended, set } = mount({ collapseHeight: 30, duration, height: '30px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);
        set({ isOpen: true });
        await expect.poll(ended).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(30);
    });

    it('fade 且 collapseHeight=0：motionEnd 只触发一次；keepDOM=false 时收起后卸载内容', async () => {
        const { wrapper, store, ended, set } = mount({ duration, fade: true, height: '40px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);
        set({ isOpen: true });
        await expect.poll(ended).toBe(1);
        expect(wrapper.getBoundingClientRect().height).toBe(40);

        store.log = [];
        set({ isOpen: false });
        await expect.poll(ended).toBe(1);
        await expect.poll(() => screen.queryByTestId('content')).toBeNull();
    });
});

// The browser only starts a transition from a style it has already computed; these toggles happen before the previous
// state ever got one
describe('Svelte Collapsible（浏览器）- 切换前的状态还没有计算样式', () => {
    const duration = 50;

    it('挂载为收起后在同一任务内展开：过渡照常结束', async () => {
        const { wrapper, ended, set } = mount({ duration, isOpen: false, height: '50px' });
        set({ isOpen: true });
        await expect.poll(ended).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(50);
    });

    it('挂载为展开后在同一任务内收起：过渡照常结束并卸载内容', async () => {
        const { ended, set } = mount({ duration, isOpen: true, height: '50px' });
        set({ isOpen: false });
        await expect.poll(ended).toBe(1);
        await expect.poll(() => screen.queryByTestId('content')).toBeNull();
    });
});

describe('Svelte Collapsible（浏览器）- 内容的样式', () => {
    it('展开时高度连续变化，不是一步跳到内容高度', async () => {
        const { wrapper, set } = mount({ duration: 1000, height: '100px' });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);
        set({ isOpen: true });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(wrapper.getBoundingClientRect().height).toBeLessThan(100);
    });

    // Firefox and Safari take this path natively; Chromium is forced onto it
    it('不支持 calc-size() 时在测得的高度之间播放动画，动画结束即结束过渡', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const { wrapper, ended, set } = mount({ collapseHeight: 30, collapseHeightAdaptive: true, duration: 1000, height: '60px' });
        const heightAnimation = () => wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition)) as Animation;
        const heights = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes().map((keyframe) => keyframe.height);

        set({ isOpen: true });
        const opening = heightAnimation();
        expect(heights(opening)).toEqual(['30px', '60px']);
        opening.finish();
        await expect.poll(ended).toBe(1);

        set({ isOpen: false });
        const closing = heightAnimation();
        expect(heights(closing)).toEqual(['60px', '30px']);
        closing.finish();
        await expect.poll(ended).toBe(2);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
    });
});
