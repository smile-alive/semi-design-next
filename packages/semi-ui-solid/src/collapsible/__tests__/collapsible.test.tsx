import { type JSX, createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import Collapsible, { type CollapsibleProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const queryContent = () => screen.queryByText('hello');
const getWrapper = (container: HTMLElement) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper') as HTMLElement;
const getInner = (container: HTMLElement) => container.querySelector<HTMLElement>('[x-semi-prop="children"]') as HTMLElement;
const heightVar = '--semi-collapsible-height';
const openHeight = 'calc-size(auto, size)';

/** Renders Collapsible with props a test can change through the returned setter */
function setup(initial: CollapsibleProps = {}, content: JSX.Element = <div>hello</div>) {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <Collapsible {...props()}>{content}</Collapsible>);
    return { ...view, set: (next: CollapsibleProps) => setProps(next) };
}

describe('Collapsible', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('keepDOM = true、lazyRender = false', () => {
        const { set } = setup({ keepDOM: true, motion: false, lazyRender: false });
        expect(queryContent()).toBeInTheDocument();
        set({ keepDOM: true, motion: false, lazyRender: false, isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        set({ keepDOM: true, motion: false, lazyRender: false, isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('keepDOM、lazyRender = false', () => {
        const { set } = setup({ keepDOM: false, motion: false, lazyRender: false });
        expect(queryContent()).toBeNull();
        set({ isOpen: true, motion: false });
        expect(queryContent()).toBeInTheDocument();
        set({ isOpen: false, motion: false });
        expect(queryContent()).toBeNull();
    });

    it('除非 collapseHeight 留出预览区域，关闭的 keepDOM 内容为 inert', () => {
        // Solid writes inert as a property, which jsdom does not reflect to the attribute
        const { container, set } = setup({ keepDOM: true, motion: false });
        expect(getInner(container).inert).toBe(true);
        set({ keepDOM: true, motion: false, isOpen: true });
        expect(getInner(container).inert).toBe(false);
        set({ keepDOM: true, motion: false, collapseHeight: 40 });
        expect(getInner(container).inert).toBe(false);
    });

    it('展开时高度直接变为内容的自然高度，不需要先测量内容高度', () => {
        const { container, set } = setup({ isOpen: false });
        set({ isOpen: true });
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe(openHeight);
    });

    it('首次挂载时默认展开不播放动画', () => {
        const { container } = setup({ isOpen: true });
        const wrapper = getWrapper(container);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('默认渲染折叠的外层容器，overflow 隐藏且不渲染 children', () => {
        const { container } = setup();
        const wrapper = getWrapper(container);
        expect(container.firstChild).toBe(wrapper);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(wrapper.style.overflow).toBe('hidden');
        expect(wrapper.style.opacity).toBe('1');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(getInner(container).style.overflow).toBe('hidden');
        expect(queryContent()).toBeNull();
    });

    it('展开到 auto 高度', () => {
        const { container } = setup({ isOpen: true });
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
    });

    it('展开动画持续到过渡结束', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, set } = setup({ onMotionEnd });
        set({ isOpen: true, onMotionEnd });
        const wrapper = getWrapper(container);
        expect(wrapper).toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('250ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        expect(onMotionEnd).not.toHaveBeenCalled();

        fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭内容在过渡结束前保持挂载', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, set } = setup({ isOpen: true, duration: 400, onMotionEnd });
        set({ isOpen: false, duration: 400, onMotionEnd });
        const wrapper = getWrapper(container);
        expect(wrapper).toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('400ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeInTheDocument();

        fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
        expect(queryContent()).toBeNull();
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
    });

    it('无动效时立即完成，且从不调用 onMotionEnd', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, set } = setup({ motion: false, onMotionEnd });
        set({ motion: false, isOpen: true, onMotionEnd });
        const wrapper = getWrapper(container);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        set({ motion: false, isOpen: false, onMotionEnd });
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeNull();
        expect(onMotionEnd).not.toHaveBeenCalled();
    });

    it('duration 为 0 时与无动效相同：关闭后立即卸载，不留过渡类', () => {
        const { container, set } = setup({ isOpen: true, duration: 0 });
        set({ isOpen: false, duration: 0 });
        expect(getWrapper(container)).not.toHaveClass('semi-collapsible-transition');
        expect(queryContent()).toBeNull();
    });

    it('懒渲染内容首次展开后保持挂载', () => {
        const { set } = setup({ keepDOM: true, lazyRender: true, motion: false });
        expect(queryContent()).toBeNull();
        set({ keepDOM: true, lazyRender: true, motion: false, isOpen: true });
        expect(queryContent()).toBeInTheDocument();
        set({ keepDOM: true, lazyRender: true, motion: false, isOpen: false });
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭时以 collapseHeight 渲染 children', () => {
        const { container } = setup({ collapseHeight: 30 });
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe('30px');
        expect(queryContent()).toBeInTheDocument();
    });

    it('collapseHeightAdaptive 关闭时以 calc-size 钳制到内容高度', () => {
        const { container } = setup({ collapseHeight: 30, collapseHeightAdaptive: true });
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe('calc-size(auto, min(size, 30px))');
    });

    it('仅当 collapseHeight 为 0 时，关闭内容淡出', () => {
        const { container, set } = setup({ fade: true });
        expect(getWrapper(container).style.opacity).toBe('0');
        set({ fade: true, isOpen: true });
        expect(getWrapper(container).style.opacity).toBe('1');
        set({ fade: true, collapseHeight: 10 });
        expect(getWrapper(container).style.opacity).toBe('1');
    });

    it('仅在外层 height 过渡结束时结束动效，冒泡事件与 opacity 过渡不结束', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, set } = setup(
            { isOpen: true, fade: true, onMotionEnd },
            <div>
                <span data-testid="child">hello</span>
            </div>
        );
        set({ isOpen: false, fade: true, onMotionEnd });
        const wrapper = getWrapper(container);
        fireEvent.transitionEnd(screen.getByTestId('child'), { propertyName: 'height' });
        fireEvent.transitionEnd(wrapper, { propertyName: 'opacity' });
        expect(onMotionEnd).not.toHaveBeenCalled();
        expect(screen.getByTestId('child')).toBeInTheDocument();
        fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('child')).toBeNull();
    });

    it('展开时 fade 以 height 过渡结束，而不是 opacity', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, set } = setup({ fade: true, onMotionEnd });
        set({ isOpen: true, fade: true, onMotionEnd });
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'opacity' });
        expect(onMotionEnd).not.toHaveBeenCalled();
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('id 放在内容元素上，data 属性、class 与 style 传到外层', () => {
        const { container } = setup({ id: 'panel', class: 'custom', style: { height: '5px', color: 'red' }, 'data-foo': 'bar' } as CollapsibleProps);
        const wrapper = getWrapper(container);
        expect(getInner(container)).toHaveAttribute('id', 'panel');
        expect(wrapper).not.toHaveAttribute('id');
        expect(wrapper).toHaveClass('custom');
        expect(wrapper).toHaveAttribute('data-foo', 'bar');
        expect(wrapper.style.height).toBe('5px');
        expect(wrapper.style.color).toBe('red');
    });

    it('字符串形式的 style 与内部样式合并', () => {
        const { container } = setup({ style: 'color: red', isOpen: true });
        const wrapper = getWrapper(container);
        expect(wrapper.style.color).toBe('red');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
    });

    it('未声明的属性传到外层', () => {
        const { container } = setup({ 'aria-label': 'details', title: 'tip' });
        expect(getWrapper(container)).toHaveAttribute('aria-label', 'details');
        expect(getWrapper(container)).toHaveAttribute('title', 'tip');
    });

    it('使用方的 onTransitionEnd 与动效结束都会触发', () => {
        const onMotionEnd = vi.fn<() => void>();
        const onTransitionEnd = vi.fn<(event: TransitionEvent) => void>();
        const { container, set } = setup({ onMotionEnd, onTransitionEnd });
        set({ isOpen: true, onMotionEnd, onTransitionEnd });
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'height' });
        expect(onTransitionEnd).toHaveBeenCalledTimes(1);
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('ref 指向外层容器', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = setup({ ref: (node: HTMLDivElement) => (ref = node) });
        expect(ref).toBe(getWrapper(container));
    });

    it('在改变高度的同一次更新中添加过渡', () => {
        const { container, set } = setup();
        set({ isOpen: true });
        const wrapper = getWrapper(container);
        expect([wrapper.style.getPropertyValue(heightVar), wrapper.style.transitionDuration]).toEqual([openHeight, '250ms']);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { motion: false, keepDOM: true } };
        const { container, set } = setup();
        expect(queryContent()).toBeInTheDocument();
        set({ isOpen: true });
        expect(getWrapper(container)).not.toHaveClass('semi-collapsible-transition');
    });
});
