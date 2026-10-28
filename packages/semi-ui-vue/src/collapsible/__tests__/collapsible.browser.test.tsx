/** @jsxImportSource vue */
import { nextTick, reactive, type VNodeChild } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { tab } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Collapsible from '..';
import type { CollapsibleProps } from '../interface';

const inside = () => <button type="button">inside</button>;
const getWrapper = (container: Element) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
const getInside = () => [...document.querySelectorAll('button')].find((button) => button.textContent === 'inside');

const mount = (props: CollapsibleProps, children: () => VNodeChild = inside, attrs: Record<string, unknown> = {}) => render(Collapsible, { props, attrs, slots: { default: children } });

describe('Collapsible（浏览器）', () => {
    it('折叠到零高度时，内容无法通过 Tab 访问；展开后可以访问', async () => {
        const view = mount({ isOpen: false, keepDOM: true, motion: false });
        await tab();
        expect(getInside()).not.toHaveFocus();

        await view.rerender({ isOpen: true });
        await tab();
        expect(getInside()).toHaveFocus();
    });

    it('collapseHeight > 0 时保持可见的预览不是 inert，因此其内容仍可聚焦', async () => {
        mount({ collapseHeight: 40, isOpen: false, motion: false });
        await tab();
        expect(getInside()).toHaveFocus();
    });

    // height: auto lays out on every frame with no JS in between, so the wrapper must already show a new content
    // size right after the DOM mutation commits, with no observer round-trip to wait for
    it('展开态下内容高度变化时，外层高度在同一次更新中跟随，不滞后一个 ResizeObserver 回调', async () => {
        const state = reactive({ height: 50 });
        const { container } = render(() => (
            <Collapsible isOpen motion={false}>
                {() => <div style={{ height: `${state.height}px` }}>content</div>}
            </Collapsible>
        ));
        const wrapper = getWrapper(container) as HTMLElement;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(50);

        state.height = 120;
        await nextTick();
        // no observer tick awaited on purpose: the new height must already be in effect right after the patch
        expect(wrapper.getBoundingClientRect().height).toBe(120);
    });

    // resizing the content must not re-render Collapsible; a ResizeObserver created just for this assertion (not
    // Collapsible's own) confirms the resize actually happened before checking the update count
    it('内容尺寸变化不再触发 Collapsible 自身更新', async () => {
        const updated = vi.fn<() => void>();
        const { container } = render(() => (
            <Collapsible isOpen motion={false} onVnodeUpdated={updated}>
                {() => <div style={{ height: '50px' }}>content</div>}
            </Collapsible>
        ));
        const content = getWrapper(container)?.querySelector('[x-semi-prop="children"] > div') as HTMLElement;
        const resized = new Promise<void>((resolve) => {
            const observer = new ResizeObserver(() => {
                observer.disconnect();
                resolve();
            });
            observer.observe(content);
        });
        content.style.height = '120px';
        await resized;
        // extra macrotask margin: an update triggered by the resize would need at least one more tick to land
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(updated).not.toHaveBeenCalled();
    });

    // calc-size(auto, min(size, Npx)) reads the content's own auto height during layout; only a real layout
    // engine can prove the clamp
    it('collapseHeightAdaptive 下，收起高度被真实布局钳制到内容实际高度', async () => {
        const state = reactive({ height: 18 });
        const { container } = render(() => (
            <Collapsible collapseHeight={30} collapseHeightAdaptive>
                {() => <div style={{ height: `${state.height}px` }}>content</div>}
            </Collapsible>
        ));
        const wrapper = getWrapper(container) as HTMLElement;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(18);

        state.height = 60;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);
    });
});

// isOpen always moves height's computed value between a length/calc-size() and the auto keyword; these cases pick
// content sizes where the two sides resolve to the same laid-out pixels, to confirm a real browser still runs and
// ends the transition (and therefore still emits motionEnd) even when nothing visibly moves
describe('Collapsible（浏览器）- 用值高度不变时的过渡边界', () => {
    const duration = 50;

    it('collapseHeightAdaptive 且内容比 collapseHeight 矮：收起前后用值高度相同（计算值从 calc-size 变为 auto）', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ collapseHeight: 40, collapseHeightAdaptive: true, duration }, () => <div style={{ height: '20px' }}>content</div>, { onMotionEnd: motionEnd });
        const wrapper = getWrapper(view.container) as HTMLElement;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(20);

        await view.rerender({ isOpen: true });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        // motionEnd is emitted in the transitionend handler, before the patch that drops the class
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(20);
    });

    it('非 adaptive 且内容高度恰好等于 collapseHeight：收起前后用值高度相同（计算值从长度变为 auto）', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ collapseHeight: 30, duration }, () => <div style={{ height: '30px' }}>content</div>, {
            onMotionEnd: motionEnd,
        });
        const wrapper = getWrapper(view.container) as HTMLElement;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);

        await view.rerender({ isOpen: true });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(30);
    });

    it('fade 且 collapseHeight=0：height 与 opacity 同时过渡，motionEnd 只触发一次；keepDOM=false 时收起后卸载内容', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ duration, fade: true }, () => <div style={{ height: '40px' }}>content</div>, {
            onMotionEnd: motionEnd,
        });
        const wrapper = getWrapper(view.container) as HTMLElement;
        // lets the browser paint the closed state before the next patch starts the transition; otherwise two
        // patches in the same task may collapse into a single style recalc and no transition ever starts
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);

        await view.rerender({ isOpen: true });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        expect(wrapper.getBoundingClientRect().height).toBe(40);

        motionEnd.mockClear();
        await view.rerender({ isOpen: false });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => view.queryByText('content')).toBeNull();
    });

    it('内容为空（高度为 0）且 collapseHeight=0：计算值仍在 auto 与 0px 间变化，motionEnd 照常触发', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ duration }, () => [], { onMotionEnd: motionEnd });
        await expect.poll(() => (getWrapper(view.container) as HTMLElement).getBoundingClientRect().height).toBe(0);

        await view.rerender({ isOpen: true });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);

        motionEnd.mockClear();
        await view.rerender({ isOpen: false });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
    });
});

// The browser only starts a transition from a style it has already computed; these toggles happen before the
// previous state ever got one
describe('Collapsible（浏览器）- 切换前的状态还没有计算样式', () => {
    const duration = 50;
    const fifty = () => <div style={{ height: '50px' }}>content</div>;

    // e.g. a panel inserted by a click handler and opened from a watcher flushed in the same task
    it('挂载为收起后在同一任务内展开：过渡照常结束', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ duration, isOpen: false }, fifty, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: true });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        // motionEnd is emitted in the transitionend handler, before the patch that drops the class
        await expect.poll(() => (getWrapper(view.container) as HTMLElement).classList.contains('semi-collapsible-transition')).toBe(false);
        expect((getWrapper(view.container) as HTMLElement).getBoundingClientRect().height).toBe(50);
    });

    it('挂载为展开后在同一任务内收起：过渡照常结束并卸载内容', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = mount({ duration, isOpen: true }, fifty, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: false });
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => view.queryByText('content')).toBeNull();
    });

    it('祖先 display: none 时展开，之后显示：过渡结束，高度为内容高度', async () => {
        const motionEnd = vi.fn<() => void>();
        const state = reactive({ hidden: true, isOpen: false });
        const { container } = render(() => (
            <div style={{ display: state.hidden ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={state.isOpen} onMotionEnd={motionEnd}>
                    {fifty}
                </Collapsible>
            </div>
        ));
        state.isOpen = true;
        await nextTick();
        state.hidden = false;
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => (getWrapper(container) as HTMLElement).classList.contains('semi-collapsible-transition')).toBe(false);
        expect((getWrapper(container) as HTMLElement).getBoundingClientRect().height).toBe(50);
    });

    it('祖先 display: none 时收起，之后显示：过渡结束并卸载内容', async () => {
        const motionEnd = vi.fn<() => void>();
        const state = reactive({ hidden: false, isOpen: true });
        const view = render(() => (
            <div style={{ display: state.hidden ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={state.isOpen} onMotionEnd={motionEnd}>
                    {fifty}
                </Collapsible>
            </div>
        ));
        await expect.poll(() => (getWrapper(view.container) as HTMLElement).getBoundingClientRect().height).toBe(50);
        state.hidden = true;
        await nextTick();
        // the hidden subtree drops its computed style once a frame recalculates it
        await new Promise(requestAnimationFrame);
        state.isOpen = false;
        await nextTick();
        await new Promise(requestAnimationFrame);
        state.hidden = false;
        await expect.poll(() => motionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => view.queryByText('content')).toBeNull();
    });
});

describe('Collapsible（浏览器）- 内容的样式', () => {
    it('展开时高度连续变化，不是一步跳到内容高度', async () => {
        const view = mount({ duration: 1000 }, () => <div style={{ height: '100px' }}>content</div>);
        const wrapper = getWrapper(view.container) as HTMLElement;
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);
        await view.rerender({ isOpen: true });
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(wrapper.getBoundingClientRect().height).toBeLessThan(100);
    });

    // Firefox and Safari take this path natively; Chromium is forced onto it
    it('不支持 calc-size() 时在测得的高度之间播放动画，动画结束即结束过渡', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const onMotionEnd = vi.fn<() => void>();
        const view = mount({ collapseHeight: 30, collapseHeightAdaptive: true, duration: 1000 }, () => <div style={{ height: '60px' }}>content</div>, { onMotionEnd });
        const wrapper = getWrapper(view.container) as HTMLElement;
        const heightAnimation = () => wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition)) as Animation;
        const heights = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes().map((keyframe) => keyframe.height);

        await view.rerender({ isOpen: true });
        const opening = heightAnimation();
        expect(heights(opening)).toEqual(['30px', '60px']);
        opening.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);

        await view.rerender({ isOpen: false });
        const closing = heightAnimation();
        expect(heights(closing)).toEqual(['60px', '30px']);
        closing.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(2);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
    });

    it('高度过渡不让内容里的元素也在 auto 与长度之间过渡', async () => {
        mount({ isOpen: true, motion: false }, () => (
            <div style={{ height: 'auto', overflow: 'hidden', transition: 'height 10s linear' }} data-testid="inner">
                <div style={{ height: '100px' }} />
            </div>
        ));
        const inner = document.querySelector<HTMLElement>('[data-testid="inner"]') as HTMLElement;
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(100);
        inner.style.height = '0px';
        // without interpolation the change is discrete and lands at once; with it, 10s of linear motion barely moves
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(0);
    });
});
