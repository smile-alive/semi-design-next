import { Profiler, createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { Collapsible } from '@fibrae/semi-ui-react';
import { tab } from '@test/utils/browser';

const content = <button type="button">inside</button>;

describe('Collapsible（浏览器）', () => {
    it('折叠到零高度时，内容无法通过 Tab 访问；展开后可以访问', async () => {
        const { rerender } = render(
            <Collapsible isOpen={false} keepDOM motion={false}>
                {content}
            </Collapsible>
        );
        const inside = screen.getByText('inside');
        await tab();
        expect(inside).not.toHaveFocus();

        rerender(
            <Collapsible isOpen keepDOM motion={false}>
                {content}
            </Collapsible>
        );
        await tab();
        expect(inside).toHaveFocus();
    });

    it('collapseHeight > 0 时保持可见的预览不是 inert，因此其内容仍可聚焦', async () => {
        render(
            <Collapsible collapseHeight={40} isOpen={false} motion={false}>
                {content}
            </Collapsible>
        );
        await tab();
        expect(screen.getByText('inside')).toHaveFocus();
    });

    it('展开态下内容高度变化时，外层高度在同一次提交中跟随，不滞后一个 ResizeObserver 回调', async () => {
        const contentRef = createRef<HTMLDivElement>();
        const { container, rerender } = render(
            <Collapsible isOpen motion={false}>
                <div ref={contentRef} style={{ height: '50px' }}>
                    content
                </div>
            </Collapsible>
        );
        const wrapper = container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(50);

        rerender(
            <Collapsible isOpen motion={false}>
                <div ref={contentRef} style={{ height: '120px' }}>
                    content
                </div>
            </Collapsible>
        );
        expect(wrapper.getBoundingClientRect().height).toBe(120);
    });

    // a separate ResizeObserver confirms the resize happened before the render count is checked
    it('内容尺寸变化不再触发 Collapsible 自身重渲染', async () => {
        let renderCount = 0;
        const contentRef = createRef<HTMLDivElement>();
        render(
            <Profiler id="collapsible-probe" onRender={() => renderCount++}>
                <Collapsible isOpen motion={false}>
                    <div ref={contentRef} style={{ height: '50px' }}>
                        content
                    </div>
                </Collapsible>
            </Profiler>
        );
        expect(renderCount).toBe(1);

        const resized = new Promise<void>((resolve) => {
            const observer = new ResizeObserver(() => {
                observer.disconnect();
                resolve();
            });
            observer.observe(contentRef.current);
        });
        contentRef.current.style.height = '120px';
        await resized;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(renderCount).toBe(1);
    });

    // the calc-size() clamp reads the content's auto height during layout, so only a real browser proves it
    it('collapseHeightAdaptive 下，收起高度被真实布局钳制到内容实际高度', async () => {
        const { container, rerender } = render(
            <Collapsible collapseHeight={30} collapseHeightAdaptive>
                <div style={{ height: '18px' }}>content</div>
            </Collapsible>
        );
        const wrapper = container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(18);

        rerender(
            <Collapsible collapseHeight={30} collapseHeightAdaptive>
                <div style={{ height: '60px' }}>content</div>
            </Collapsible>
        );
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);
    });
});

// the computed height changes while the laid-out pixels do not; the transition must still end and call onMotionEnd
describe('Collapsible（浏览器）- 用值高度不变时的过渡边界', () => {
    const duration = 50;
    const getWrapper = (container: HTMLElement) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper');

    it('collapseHeightAdaptive 且内容比 collapseHeight 矮：收起前后用值高度相同（计算值从 calc-size 变为 auto）', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(
            <Collapsible collapseHeight={40} collapseHeightAdaptive duration={duration} onMotionEnd={onMotionEnd}>
                <div style={{ height: '20px' }}>content</div>
            </Collapsible>
        );
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(20);

        rerender(
            <Collapsible collapseHeight={40} collapseHeightAdaptive duration={duration} isOpen onMotionEnd={onMotionEnd}>
                <div style={{ height: '20px' }}>content</div>
            </Collapsible>
        );
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(20);
    });

    it('非 adaptive 且内容高度恰好等于 collapseHeight：收起前后用值高度相同（计算值从长度变为 auto）', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(
            <Collapsible collapseHeight={30} duration={duration} onMotionEnd={onMotionEnd}>
                <div style={{ height: '30px' }}>content</div>
            </Collapsible>
        );
        const wrapper = getWrapper(container);
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(30);

        rerender(
            <Collapsible collapseHeight={30} duration={duration} isOpen onMotionEnd={onMotionEnd}>
                <div style={{ height: '30px' }}>content</div>
            </Collapsible>
        );
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
        expect(wrapper.getBoundingClientRect().height).toBe(30);
    });

    it('fade 且 collapseHeight=0：height 与 opacity 同时过渡，onMotionEnd 只触发一次；keepDOM=false 时收起后卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const content = <div style={{ height: '40px' }}>content</div>;
        const { container, rerender } = render(
            <Collapsible duration={duration} fade onMotionEnd={onMotionEnd}>
                {content}
            </Collapsible>
        );
        const wrapper = getWrapper(container);
        // two renders in one task may collapse into one style recalc, so no transition would start
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);

        rerender(
            <Collapsible duration={duration} fade isOpen onMotionEnd={onMotionEnd}>
                {content}
            </Collapsible>
        );
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        expect(wrapper.getBoundingClientRect().height).toBe(40);

        onMotionEnd.mockClear();
        rerender(
            <Collapsible duration={duration} fade onMotionEnd={onMotionEnd}>
                {content}
            </Collapsible>
        );
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });

    it('内容为空（高度为 0）且 collapseHeight=0：计算值仍在 auto 与 0px 间变化，onMotionEnd 照常触发', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(<Collapsible duration={duration} onMotionEnd={onMotionEnd} />);
        await expect.poll(() => getWrapper(container).getBoundingClientRect().height).toBe(0);

        rerender(<Collapsible duration={duration} isOpen onMotionEnd={onMotionEnd} />);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);

        onMotionEnd.mockClear();
        rerender(<Collapsible duration={duration} onMotionEnd={onMotionEnd} />);
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
    });
});

// a browser only starts a transition from an already computed style
describe('Collapsible（浏览器）- 切换前的状态还没有计算样式', () => {
    const duration = 50;
    const getWrapper = (container: HTMLElement) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper');

    it('挂载为收起后在同一任务内展开：过渡照常结束', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const renderOpen = (isOpen: boolean) => (
            <Collapsible duration={duration} isOpen={isOpen} onMotionEnd={onMotionEnd}>
                <div style={{ height: '50px' }}>content</div>
            </Collapsible>
        );
        const { container, rerender } = render(renderOpen(false));
        rerender(renderOpen(true));
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        // onMotionEnd runs in the transitionend handler, before React commits the state that drops the class
        await expect.poll(() => getWrapper(container).classList.contains('semi-collapsible-transition')).toBe(false);
        expect(getWrapper(container).getBoundingClientRect().height).toBe(50);
    });

    it('挂载为展开后在同一任务内收起：过渡照常结束并卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const renderOpen = (isOpen: boolean) => (
            <Collapsible duration={duration} isOpen={isOpen} onMotionEnd={onMotionEnd}>
                <div style={{ height: '50px' }}>content</div>
            </Collapsible>
        );
        const { rerender } = render(renderOpen(true));
        rerender(renderOpen(false));
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });

    it('祖先 display: none 时展开，之后显示：过渡结束，高度为内容高度', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const renderIn = (hidden: boolean, isOpen: boolean) => (
            <div style={{ display: hidden ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={isOpen} onMotionEnd={onMotionEnd}>
                    <div style={{ height: '50px' }}>content</div>
                </Collapsible>
            </div>
        );
        const { container, rerender } = render(renderIn(true, false));
        rerender(renderIn(true, true));
        rerender(renderIn(false, true));
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => getWrapper(container).classList.contains('semi-collapsible-transition')).toBe(false);
        expect(getWrapper(container).getBoundingClientRect().height).toBe(50);
    });

    it('祖先 display: none 时收起，之后显示：过渡结束并卸载内容', async () => {
        const onMotionEnd = vi.fn<() => void>();
        const renderIn = (hidden: boolean, isOpen: boolean) => (
            <div style={{ display: hidden ? 'none' : 'block' }}>
                <Collapsible duration={duration} isOpen={isOpen} onMotionEnd={onMotionEnd}>
                    <div style={{ height: '50px' }}>content</div>
                </Collapsible>
            </div>
        );
        const { container, rerender } = render(renderIn(false, true));
        await expect.poll(() => getWrapper(container).getBoundingClientRect().height).toBe(50);
        rerender(renderIn(true, true));
        // the hidden subtree drops its computed style once a frame recalculates it
        await new Promise(requestAnimationFrame);
        rerender(renderIn(true, false));
        await new Promise(requestAnimationFrame);
        rerender(renderIn(false, false));
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);
        await expect.poll(() => screen.queryByText('content')).toBeNull();
    });
});

describe('Collapsible（浏览器）- 内容的样式', () => {
    it('展开时高度连续变化，不是一步跳到内容高度', async () => {
        const content = <div style={{ height: '100px' }}>content</div>;
        const { container, rerender } = render(<Collapsible duration={1000}>{content}</Collapsible>);
        const wrapper = container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBe(0);
        rerender(
            <Collapsible duration={1000} isOpen>
                {content}
            </Collapsible>
        );
        await expect.poll(() => wrapper.getBoundingClientRect().height).toBeGreaterThan(0);
        expect(wrapper.getBoundingClientRect().height).toBeLessThan(100);
    });

    // Firefox and Safari take this path natively; Chromium is forced onto it
    it('不支持 calc-size() 时在测得的高度之间播放动画，动画结束即结束过渡', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const onMotionEnd = vi.fn<() => void>();
        const view = (isOpen: boolean) => (
            <Collapsible collapseHeight={30} collapseHeightAdaptive duration={1000} isOpen={isOpen} onMotionEnd={onMotionEnd}>
                <div style={{ height: '60px' }}>content</div>
            </Collapsible>
        );
        const { container, rerender } = render(view(false));
        const wrapper = container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
        const heightAnimation = () => wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition));
        const heights = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes().map((keyframe) => keyframe.height);

        rerender(view(true));
        const opening = heightAnimation();
        expect(heights(opening)).toEqual(['30px', '60px']);
        opening.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(1);

        rerender(view(false));
        const closing = heightAnimation();
        expect(heights(closing)).toEqual(['60px', '30px']);
        closing.finish();
        await expect.poll(() => onMotionEnd.mock.calls.length).toBe(2);
        await expect.poll(() => wrapper.classList.contains('semi-collapsible-transition')).toBe(false);
    });

    it('不支持 calc-size() 时中途反向从当前高度开始', async () => {
        vi.spyOn(CSS, 'supports').mockReturnValue(false);
        const view = (isOpen: boolean) => (
            <Collapsible duration={1000} isOpen={isOpen}>
                <div style={{ height: '100px' }}>content</div>
            </Collapsible>
        );
        const { container, rerender } = render(view(false));
        const wrapper = container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
        rerender(view(true));
        const opening = wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition));
        opening.pause();
        opening.currentTime = 500;
        const midway = wrapper.offsetHeight;
        expect(midway).toBeGreaterThan(0);
        expect(midway).toBeLessThan(100);
        rerender(view(false));
        expect(opening.playState).toBe('idle');
        const closing = wrapper.getAnimations().find((animation) => !(animation instanceof CSSTransition));
        expect((closing.effect as KeyframeEffect).getKeyframes().map((keyframe) => keyframe.height)).toEqual([`${midway}px`, '0px']);
    });

    it('高度过渡不让内容里的元素也在 auto 与长度之间过渡', async () => {
        render(
            <Collapsible isOpen motion={false}>
                <div style={{ height: 'auto', overflow: 'hidden', transition: 'height 10s linear' }} data-testid="inner">
                    <div style={{ height: '100px' }} />
                </div>
            </Collapsible>
        );
        const inner = screen.getByTestId('inner');
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(100);
        inner.style.height = '0px';
        await expect.poll(() => inner.getBoundingClientRect().height).toBe(0);
    });
});
