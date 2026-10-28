import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { tab } from '@test/utils/browser';
import Collapsible from '..';

const content = <button type="button">inside</button>;
const getWrapper = (container: HTMLElement) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper') as HTMLElement;
const transitionClass = 'semi-collapsible-transition';

describe('Collapsible（浏览器）', () => {
    it('折叠到零高度时，内容无法通过 Tab 访问；展开后可以访问', async () => {
        const [open, setOpen] = createSignal(false);
        render(() => (
            <Collapsible isOpen={open()} keepDOM motion={false}>
                {content}
            </Collapsible>
        ));
        const inside = screen.getByText('inside');
        await tab();
        expect(inside).not.toHaveFocus();

        setOpen(true);
        await tab();
        expect(inside).toHaveFocus();
    });

    it('collapseHeight > 0 时保持可见的预览不是 inert，因此其内容仍可聚焦', async () => {
        render(() => (
            <Collapsible collapseHeight={40} isOpen={false} motion={false}>
                {content}
            </Collapsible>
        ));
        await tab();
        expect(screen.getByText('inside')).toHaveFocus();
    });

    it('展开态下内容高度变化时，外层高度在同一次更新中跟随', async () => {
        const [height, setHeight] = createSignal(50);
        const { container } = render(() => (
            <Collapsible isOpen motion={false}>
                <div style={{ height: `${height()}px` }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(50);
        setHeight(120);
        expect(wrapper.getBoundingClientRect().height).toBe(120);
    });

    // the calc-size() clamp reads the content's auto height during layout, so only a real browser proves it
    it('collapseHeightAdaptive 下，收起高度被真实布局钳制到内容实际高度', async () => {
        const [height, setHeight] = createSignal(18);
        const { container } = render(() => (
            <Collapsible collapseHeight={30} collapseHeightAdaptive>
                <div style={{ height: `${height()}px` }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(18);
        setHeight(60);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);
    });
});

// the computed height changes while the laid-out pixels do not; the transition must still end and call onMotionEnd
describe('Collapsible（浏览器）- 用值高度不变时的过渡边界', () => {
    const duration = 50;

    it('collapseHeightAdaptive 且内容比 collapseHeight 矮：收起前后用值高度相同', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible collapseHeight={40} collapseHeightAdaptive duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                <div style={{ height: '20px' }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(20);

        setOpen(true);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => wrapper.classList.contains(transitionClass)).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(20);
    });

    it('非 adaptive 且内容高度恰好等于 collapseHeight：收起前后用值高度相同', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible collapseHeight={30} duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                <div style={{ height: '30px' }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);

        setOpen(true);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => wrapper.classList.contains(transitionClass)).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(30);
    });

    it('fade 且 collapseHeight=0：height 与 opacity 同时过渡，onMotionEnd 只触发一次；收起后卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible duration={duration} fade isOpen={open()} onMotionEnd={onMotionEnd}>
                <div style={{ height: '40px' }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        // two updates in one task may collapse into one style recalc, so no transition would start
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);

        setOpen(true);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        expect(wrapper.getBoundingClientRect().height).toBe(40);

        onMotionEnd.mockClear();
        setOpen(false);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });

    it('内容为空（高度为 0）且 collapseHeight=0：计算值仍在 auto 与 0px 间变化，onMotionEnd 照常触发', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => <Collapsible duration={duration} isOpen={open()} onMotionEnd={onMotionEnd} />);
        await expect.poll(() => getWrapper(container).getBoundingClientRect().height).toBe(0);

        setOpen(true);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);

        onMotionEnd.mockClear();
        setOpen(false);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
    });
});

// a browser only starts a transition from an already computed style
describe('Collapsible（浏览器）- 切换前的状态还没有计算样式', () => {
    const duration = 50;
    const body = <div style={{ height: '50px' }}>content</div>;

    it('挂载为收起后在同一任务内展开：过渡照常结束', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                {body}
            </Collapsible>
        ));
        setOpen(true);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => getWrapper(container).classList.contains(transitionClass)).toBe(false);
        expect(getWrapper(container).getBoundingClientRect().height).toBe(50);
    });

    it('挂载为展开后在同一任务内收起：过渡照常结束并卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(true);
        render(() => (
            <Collapsible duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                {body}
            </Collapsible>
        ));
        setOpen(false);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });

    it('祖先 display: none 时展开，之后显示：过渡结束，高度为内容高度', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [hidden, setHidden] = createSignal(true);
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <div style={{ display: hidden() ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                    {body}
                </Collapsible>
            </div>
        ));
        setOpen(true);
        setHidden(false);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => getWrapper(container).classList.contains(transitionClass)).toBe(false);
        expect(getWrapper(container).getBoundingClientRect().height).toBe(50);
    });

    it('祖先 display: none 时收起，之后显示：过渡结束并卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const [hidden, setHidden] = createSignal(false);
        const [open, setOpen] = createSignal(true);
        const { container } = render(() => (
            <div style={{ display: hidden() ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={open()} onMotionEnd={onMotionEnd}>
                    {body}
                </Collapsible>
            </div>
        ));
        await expect.poll(() => getWrapper(container).getBoundingClientRect().height).toBe(50);
        setHidden(true);
        // the hidden subtree drops its computed style once a frame recalculates it
        await new Promise(requestAnimationFrame);
        setOpen(false);
        await new Promise(requestAnimationFrame);
        setHidden(false);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });
});

describe('Collapsible（浏览器）- 内容的样式', () => {
    it('展开时高度连续变化，不是一步跳到内容高度', async () => {
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible duration={1000} isOpen={open()}>
                <div style={{ height: '100px' }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);
        setOpen(true);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(wrapper.getBoundingClientRect().height).toBeLessThan(100);
    });

    // Firefox and Safari take this path natively; Chromium is forced onto it
    it('不支持 calc-size() 时在测得的高度之间播放动画，动画结束即结束过渡', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const onMotionEnd = vi.fn<() => void>();
        const [open, setOpen] = createSignal(false);
        const { container } = render(() => (
            <Collapsible collapseHeight={30} collapseHeightAdaptive duration={1000} isOpen={open()} onMotionEnd={onMotionEnd}>
                <div style={{ height: '60px' }}>content</div>
            </Collapsible>
        ));
        const wrapper = getWrapper(container);
        const heightAnimation = () => wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition)) as Animation;
        const heights = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes().map((keyframe) => keyframe.height);

        setOpen(true);
        const opening = heightAnimation();
        expect(heights(opening)).toEqual(['30px', '60px']);
        opening.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);

        setOpen(false);
        const closing = heightAnimation();
        expect(heights(closing)).toEqual(['60px', '30px']);
        closing.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(2);
        await expect.poll(() => wrapper.classList.contains(transitionClass)).toBe(false);
    });

    it('高度过渡不让内容里的元素也在 auto 与长度之间过渡', async () => {
        render(() => (
            <Collapsible isOpen motion={false}>
                <div style={{ height: 'auto', overflow: 'hidden', transition: 'height 10s linear' }} data-testid="inner">
                    <div style={{ height: '100px' }} />
                </div>
            </Collapsible>
        ));
        const inner = screen.getByTestId('inner');
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(100);
        inner.style.height = '0px';
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(0);
    });
});
