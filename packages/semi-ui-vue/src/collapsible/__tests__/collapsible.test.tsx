/** @jsxImportSource vue */
import { createSSRApp, nextTick, shallowRef, type ComponentPublicInstance } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Collapsible from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { CollapsibleProps } from '../interface';
import Probe from './fixtures/probe.vue';

const content = { default: () => <div>hello</div> };
const queryContent = () => screen.queryByText('hello');
const getWrapper = (container: Element) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
const getInner = (container: Element) => container.querySelector<HTMLElement>('[x-semi-prop="children"]');
// the wrapper's height goes through this custom property (collapsible.scss)
const heightVar = '--semi-collapsible-height';
const openHeight = 'calc-size(auto, size)';

const renderCollapsible = (props: CollapsibleProps = {}, attrs: Record<string, unknown> = {}) => render(Collapsible, { props, attrs, slots: content });

describe('Collapsible', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('keepDOM = true、lazyRender = false', async () => {
        const view = renderCollapsible({ keepDOM: true, motion: false, lazyRender: false });
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('keepDOM、lazyRender = false', async () => {
        const view = renderCollapsible({ keepDOM: false, motion: false, lazyRender: false });
        expect(queryContent()).toBeNull();
        await view.rerender({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: false });
        expect(queryContent()).toBeNull();
    });

    it('除非 collapseHeight 留出预览区域，关闭的 keepDOM 内容为 inert', async () => {
        const view = renderCollapsible({ keepDOM: true, motion: false });
        expect(getInner(view.container)).toHaveAttribute('inert');
        await view.rerender({ isOpen: true });
        expect(getInner(view.container)).not.toHaveAttribute('inert');
        await view.rerender({ isOpen: false, collapseHeight: 40 });
        expect(getInner(view.container)).not.toHaveAttribute('inert');
    });

    // Server output has no DOM to measure: an open Collapsible must still show its content
    it('服务端以自然高度渲染展开内容', async () => {
        const html = await renderToString(createSSRApp({ render: () => <Collapsible isOpen>{() => <div>hello</div>}</Collapsible> }));
        expect(html).toContain(`${heightVar}:${openHeight}`);
        expect(html).toContain('hello');
    });

    it('服务端渲染折叠的关闭内容', async () => {
        const html = await renderToString(
            createSSRApp({
                render: () => (
                    <Collapsible isOpen={false} keepDOM>
                        {() => <div>hello</div>}
                    </Collapsible>
                ),
            })
        );
        expect(html).toContain(`${heightVar}:0px`);
        expect(html).toContain('inert');
    });

    // calc-size(auto, size) interpolates with a length directly, with no measured pixel value in between
    it('展开时高度直接变为内容的自然高度，不需要先测量内容高度', async () => {
        const view = renderCollapsible({ isOpen: false });
        await view.rerender({ isOpen: true });
        expect(getWrapper(view.container)?.style.getPropertyValue(heightVar)).toBe(openHeight);
    });

    it('首次挂载时默认展开不播放动画', () => {
        const { container } = renderCollapsible({ isOpen: true });
        const wrapper = getWrapper(container) as HTMLElement;
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('默认渲染折叠的外层容器，overflow 隐藏且不渲染 children', () => {
        const { container } = renderCollapsible();
        const wrapper = getWrapper(container) as HTMLElement;
        expect(container.firstElementChild).toBe(wrapper);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(wrapper.style.overflow).toBe('hidden');
        expect(wrapper.style.opacity).toBe('1');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect((getInner(container) as HTMLElement).style.overflow).toBe('hidden');
        expect(queryContent()).toBeNull();
    });

    it('展开到 auto 高度', () => {
        const { container } = renderCollapsible({ isOpen: true });
        expect(getWrapper(container)?.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
    });

    it('展开动画持续到过渡结束', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = renderCollapsible({}, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: true });
        const wrapper = getWrapper(view.container) as HTMLElement;
        expect(wrapper).toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('250ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        expect(motionEnd).not.toHaveBeenCalled();

        await fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledTimes(1);
        // the emit is synchronous and the DOM patch follows in a microtask, as in React
        await nextTick();
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭内容在过渡结束前保持挂载', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = renderCollapsible({ isOpen: true, duration: 400 }, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: false });
        const wrapper = getWrapper(view.container) as HTMLElement;
        expect(wrapper).toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('400ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeInTheDocument();

        await fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledTimes(1);
        await nextTick();
        expect(queryContent()).toBeNull();
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
    });

    it('无动效时立即完成，且从不触发 motionEnd', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = renderCollapsible({ motion: false }, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: true });
        const wrapper = getWrapper(view.container) as HTMLElement;
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: false });
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeNull();
        expect(motionEnd).not.toHaveBeenCalled();
    });

    it('duration 为 0 时与无动效相同：关闭后立即卸载，不留过渡类', async () => {
        const view = renderCollapsible({ isOpen: true, duration: 0 });
        await view.rerender({ isOpen: false });
        expect(getWrapper(view.container)).not.toHaveClass('semi-collapsible-transition');
        expect(queryContent()).toBeNull();
    });

    it('懒渲染内容首次展开后保持挂载', async () => {
        const view = renderCollapsible({ keepDOM: true, lazyRender: true, motion: false });
        expect(queryContent()).toBeNull();
        await view.rerender({ isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭时以 collapseHeight 渲染 children', () => {
        const { container } = renderCollapsible({ collapseHeight: 30 });
        expect(getWrapper(container)?.style.getPropertyValue(heightVar)).toBe('30px');
        expect(queryContent()).toBeInTheDocument();
    });

    it('collapseHeightAdaptive 关闭时以 calc-size 钳制到内容高度', () => {
        const { container } = renderCollapsible({ collapseHeight: 30, collapseHeightAdaptive: true });
        expect(getWrapper(container)?.style.getPropertyValue(heightVar)).toBe('calc-size(auto, min(size, 30px))');
    });

    it('仅当 collapseHeight 为 0 时，关闭内容淡出', async () => {
        const view = renderCollapsible({ fade: true });
        expect(getWrapper(view.container)?.style.opacity).toBe('0');
        await view.rerender({ isOpen: true });
        expect(getWrapper(view.container)?.style.opacity).toBe('1');
        await view.rerender({ isOpen: false, collapseHeight: 10 });
        expect(getWrapper(view.container)?.style.opacity).toBe('1');
    });

    it('仅在外层 height 过渡结束时结束动效，冒泡事件与 opacity 过渡不结束', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = render(Collapsible, {
            props: { isOpen: true, fade: true },
            attrs: { onMotionEnd: motionEnd },
            slots: {
                default: () => (
                    <div>
                        <span data-testid="child">hello</span>
                    </div>
                ),
            },
        });
        await view.rerender({ isOpen: false });
        const wrapper = getWrapper(view.container) as HTMLElement;
        await fireEvent.transitionEnd(screen.getByTestId('child'), { propertyName: 'height' });
        await fireEvent.transitionEnd(wrapper, { propertyName: 'opacity' });
        expect(motionEnd).not.toHaveBeenCalled();
        expect(screen.getByTestId('child')).toBeInTheDocument();
        await fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledTimes(1);
        await nextTick();
        expect(screen.queryByTestId('child')).toBeNull();
    });

    // isOpen always flips height between a length and auto/calc-size(), two different computed values, so a
    // height transition always runs and ends the motion
    it('展开时 fade 以 height 过渡结束，而不是 opacity', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = renderCollapsible({ fade: true }, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: true });
        const wrapper = getWrapper(view.container) as HTMLElement;
        await fireEvent.transitionEnd(wrapper, { propertyName: 'opacity' });
        expect(motionEnd).not.toHaveBeenCalled();
        await fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledTimes(1);
    });

    it('id 放在内容元素上，data 属性、class 与 style 传到外层', () => {
        const { container } = renderCollapsible({ id: 'panel' }, { class: 'custom', style: { height: '5px', color: 'red' }, 'data-foo': 'bar' });
        const wrapper = getWrapper(container) as HTMLElement;
        expect(getInner(container)).toHaveAttribute('id', 'panel');
        expect(wrapper).not.toHaveAttribute('id');
        expect(wrapper).toHaveClass('custom');
        expect(wrapper).toHaveAttribute('data-foo', 'bar');
        expect(wrapper.style.height).toBe('5px');
        expect(wrapper.style.color).toBe('red');
    });

    it('未声明的属性传到外层', () => {
        const { container } = renderCollapsible({}, { 'aria-label': 'details', title: 'tip' });
        expect(getWrapper(container)).toHaveAttribute('aria-label', 'details');
        expect(getWrapper(container)).toHaveAttribute('title', 'tip');
    });

    it('模板 ref 的 $el 是外层容器', () => {
        const target = shallowRef<ComponentPublicInstance | null>(null);
        const { container } = render(() => <Collapsible ref={target}>{content}</Collapsible>);
        expect(target.value?.$el).toBe(getWrapper(container));
    });

    // the opening transition must be on the element in the same patch that changes its height
    it('在改变高度的更新中添加过渡，且只更新一次', async () => {
        const updated = vi.fn<(height: string, duration: string) => void>();
        const view = render(Probe, { props: { isOpen: false }, attrs: { onUpdated: updated } });
        await view.rerender({ isOpen: true });
        // a second update would mean the view was written back after the patch
        expect(updated).toHaveBeenCalledTimes(1);
        expect(updated).toHaveBeenCalledWith(openHeight, '250ms');
    });

    it('motionEnd 没有载荷', async () => {
        const motionEnd = vi.fn<() => void>();
        const view = renderCollapsible({}, { onMotionEnd: motionEnd });
        await view.rerender({ isOpen: true });
        await fireEvent.transitionEnd(getWrapper(view.container) as HTMLElement, { propertyName: 'height' });
        expect(motionEnd).toHaveBeenCalledWith();
    });

    it('使用方的 onTransitionend 与组件自身处理同时触发', async () => {
        const motionEnd = vi.fn<() => void>();
        const transitionend = vi.fn<(event: Event) => void>();
        const view = renderCollapsible({}, { onMotionEnd: motionEnd, onTransitionend: transitionend });
        await view.rerender({ isOpen: true });
        await fireEvent.transitionEnd(getWrapper(view.container) as HTMLElement, { propertyName: 'height' });
        expect(transitionend).toHaveBeenCalledTimes(1);
        expect(motionEnd).toHaveBeenCalledTimes(1);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { motion: false, keepDOM: true } };
        const view = renderCollapsible();
        expect(queryContent()).toBeInTheDocument();
        await view.rerender({ isOpen: true });
        expect(getWrapper(view.container)).not.toHaveClass('semi-collapsible-transition');
    });

    it('应用注入的 semiGlobal 默认值与全局单例隔离', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Collapsible: { keepDOM: true, collapseHeight: 20 } };
        const { container } = render(Collapsible, {
            slots: content,
            global: { provide: { [semiGlobalKey as symbol]: semi } },
        });
        expect(queryContent()).toBeInTheDocument();
        expect(getWrapper(container)?.style.getPropertyValue(heightVar)).toBe('20px');
    });

    it('全局默认值里的 id 不影响 Collapsible', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { Collapsible: { id: 'from-global' } } as object;
        const view = renderCollapsible();
        expect(getInner(view.container)).not.toHaveAttribute('id');
        view.unmount();
        const explicit = renderCollapsible({ id: 'own' });
        expect(getInner(explicit.container)).toHaveAttribute('id', 'own');
    });

    it('显式传 undefined 的 prop 回落全局值，再回落兜底值', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { collapseHeight: 20 } };
        const first = renderCollapsible({ collapseHeight: undefined, duration: undefined });
        expect(getWrapper(first.container)?.style.getPropertyValue(heightVar)).toBe('20px');
        first.unmount();
        semiGlobal.config.overrideDefaultProps = {};
        const second = renderCollapsible({ collapseHeight: undefined, duration: undefined });
        expect(getWrapper(second.container)?.style.getPropertyValue(heightVar)).toBe('0px');
    });
});
