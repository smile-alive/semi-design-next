import { StrictMode, createRef, useLayoutEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Collapsible } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';

function getCollapsible(props?, children?) {
    return <Collapsible {...(props || {})}>{children ? children : <div>hello</div>}</Collapsible>;
}

const queryContent = () => screen.queryByText('hello');
const getWrapper = (container: HTMLElement) => container.querySelector<HTMLElement>('.semi-collapsible-wrapper');
const getInner = (container: HTMLElement) => container.querySelector<HTMLElement>('[x-semi-prop="children"]');
const heightVar = '--semi-collapsible-height';
const openHeight = 'calc-size(auto, size)';

describe('collapsible', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('keepDOM = true、lazyRender = false', () => {
        const { rerender } = render(getCollapsible({ keepDOM: true, motion: false, lazyRender: false }));
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ keepDOM: true, motion: false, lazyRender: false, isOpen: true }));
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ keepDOM: true, motion: false, lazyRender: false, isOpen: false }));
        expect(queryContent()).toBeInTheDocument();
    });

    it('keepDOM、lazyRender = false', () => {
        const { rerender } = render(getCollapsible({ keepDOM: false, motion: false, lazyRender: false }));
        expect(queryContent()).toBeNull();
        rerender(getCollapsible({ isOpen: true, motion: false, keepDOM: false, lazyRender: false }));
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ isOpen: false, motion: false, keepDOM: false, lazyRender: false }));
        expect(queryContent()).toBeNull();
    });

    it('除非 collapseHeight 留出预览区域，关闭的 keepDOM 内容为 inert', () => {
        const { container, rerender } = render(getCollapsible({ keepDOM: true, motion: false }));
        expect(getInner(container)).toHaveAttribute('inert');
        rerender(getCollapsible({ keepDOM: true, motion: false, isOpen: true }));
        expect(getInner(container)).not.toHaveAttribute('inert');
        rerender(getCollapsible({ keepDOM: true, motion: false, collapseHeight: 40 }));
        expect(getInner(container)).not.toHaveAttribute('inert');
    });

    it('服务端以自然高度渲染展开内容', () => {
        const html = renderToString(getCollapsible({ isOpen: true }));
        expect(html).toContain(`${heightVar}:${openHeight}`);
        expect(html).toContain('hello');
    });

    it('服务端渲染折叠的关闭内容', () => {
        const html = renderToString(getCollapsible({ isOpen: false, keepDOM: true }));
        expect(html).toContain(`${heightVar}:0px`);
    });

    it('展开时高度直接变为内容的自然高度，不需要先测量内容高度', () => {
        const { container, rerender } = render(getCollapsible({ isOpen: false }));
        rerender(getCollapsible({ isOpen: true }));
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe(openHeight);
    });

    it('首次挂载时默认展开不播放动画', () => {
        const { container } = render(getCollapsible({ isOpen: true }));
        const wrapper = getWrapper(container);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(queryContent()).toBeInTheDocument();
    });

    it('默认渲染折叠的外层容器，overflow 隐藏且不渲染 children', () => {
        const { container } = render(getCollapsible());
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
        const { container } = render(getCollapsible({ isOpen: true }));
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
    });

    it('展开动画持续到过渡结束', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(getCollapsible({ onMotionEnd }));
        rerender(getCollapsible({ isOpen: true, onMotionEnd }));
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
        const { container, rerender } = render(getCollapsible({ isOpen: true, duration: 400, onMotionEnd }));
        rerender(getCollapsible({ isOpen: false, duration: 400, onMotionEnd }));
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
        const { container, rerender } = render(getCollapsible({ motion: false, onMotionEnd }));
        rerender(getCollapsible({ motion: false, isOpen: true, onMotionEnd }));
        const wrapper = getWrapper(container);
        expect(wrapper).not.toHaveClass('semi-collapsible-transition');
        expect(wrapper.style.transitionDuration).toBe('0ms');
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ motion: false, isOpen: false, onMotionEnd }));
        expect(wrapper.style.getPropertyValue(heightVar)).toBe('0px');
        expect(queryContent()).toBeNull();
        expect(onMotionEnd).not.toHaveBeenCalled();
    });

    it('duration 为 0 时与无动效相同：关闭后立即卸载，不留过渡类', () => {
        const { container, rerender } = render(getCollapsible({ isOpen: true, duration: 0 }));
        rerender(getCollapsible({ isOpen: false, duration: 0 }));
        expect(getWrapper(container)).not.toHaveClass('semi-collapsible-transition');
        expect(queryContent()).toBeNull();
    });

    it('懒渲染内容首次展开后保持挂载', () => {
        const { rerender } = render(getCollapsible({ keepDOM: true, lazyRender: true, motion: false }));
        expect(queryContent()).toBeNull();
        rerender(getCollapsible({ keepDOM: true, lazyRender: true, motion: false, isOpen: true }));
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ keepDOM: true, lazyRender: true, motion: false, isOpen: false }));
        expect(queryContent()).toBeInTheDocument();
    });

    it('关闭时以 collapseHeight 渲染 children', () => {
        const { container } = render(getCollapsible({ collapseHeight: 30 }));
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe('30px');
        expect(queryContent()).toBeInTheDocument();
    });

    it('collapseHeightAdaptive 关闭时以 calc-size 钳制到内容高度', () => {
        const { container } = render(getCollapsible({ collapseHeight: 30, collapseHeightAdaptive: true }));
        expect(getWrapper(container).style.getPropertyValue(heightVar)).toBe('calc-size(auto, min(size, 30px))');
    });

    it('仅当 collapseHeight 为 0 时，关闭内容淡出', () => {
        const { container, rerender } = render(getCollapsible({ fade: true }));
        expect(getWrapper(container).style.opacity).toBe('0');
        rerender(getCollapsible({ fade: true, isOpen: true }));
        expect(getWrapper(container).style.opacity).toBe('1');
        rerender(getCollapsible({ fade: true, collapseHeight: 10 }));
        expect(getWrapper(container).style.opacity).toBe('1');
    });

    it('StrictMode 下 onMotionEnd 只调用一次', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(<StrictMode>{getCollapsible({ onMotionEnd })}</StrictMode>);
        rerender(<StrictMode>{getCollapsible({ isOpen: true, onMotionEnd })}</StrictMode>);
        const wrapper = getWrapper(container);
        expect(wrapper.style.getPropertyValue(heightVar)).toBe(openHeight);
        fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('仅在外层 height 过渡结束时结束动效，冒泡事件与 opacity 过渡不结束', () => {
        const onMotionEnd = vi.fn<() => void>();
        const content = (
            <div>
                <span data-testid="child">hello</span>
            </div>
        );
        const { container, rerender } = render(getCollapsible({ isOpen: true, fade: true, onMotionEnd }, content));
        rerender(getCollapsible({ isOpen: false, fade: true, onMotionEnd }, content));
        const wrapper = getWrapper(container);
        fireEvent.transitionEnd(screen.getByTestId('child'), { propertyName: 'height' });
        fireEvent.transitionEnd(wrapper, { propertyName: 'opacity' });
        expect(onMotionEnd).not.toHaveBeenCalled();
        expect(screen.getByTestId('child')).toBeInTheDocument();
        fireEvent.transitionEnd(wrapper, { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('child')).toBeNull();
    });

    it('收起时 fade 以 height 过渡结束，而不是 opacity', () => {
        const onMotionEnd = vi.fn<() => void>();
        const { container, rerender } = render(getCollapsible({ fade: true, onMotionEnd }));
        rerender(getCollapsible({ isOpen: true, fade: true, onMotionEnd }));
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'opacity' });
        expect(onMotionEnd).not.toHaveBeenCalled();
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'height' });
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('id 放在内容元素上，data 属性、className 与 style 传到外层', () => {
        const { container } = render(getCollapsible({ id: 'panel', className: 'custom', style: { height: 5, color: 'red' }, 'data-foo': 'bar' }));
        const wrapper = getWrapper(container);
        expect(getInner(container)).toHaveAttribute('id', 'panel');
        expect(wrapper).not.toHaveAttribute('id');
        expect(wrapper).toHaveClass('custom');
        expect(wrapper).toHaveAttribute('data-foo', 'bar');
        expect(wrapper.style.height).toBe('5px');
        expect(wrapper.style.color).toBe('red');
    });

    it('未声明的属性传到外层', () => {
        const { container } = render(getCollapsible({ 'aria-label': 'details', title: 'tip' }));
        expect(getWrapper(container)).toHaveAttribute('aria-label', 'details');
        expect(getWrapper(container)).toHaveAttribute('title', 'tip');
    });

    it('使用方的 onTransitionEnd 与内部的过渡结束处理都会执行', () => {
        const onMotionEnd = vi.fn<() => void>();
        const onTransitionEnd = vi.fn<() => void>();
        const { container, rerender } = render(getCollapsible({ onMotionEnd, onTransitionEnd }));
        rerender(getCollapsible({ isOpen: true, onMotionEnd, onTransitionEnd }));
        fireEvent.transitionEnd(getWrapper(container), { propertyName: 'height' });
        expect(onTransitionEnd).toHaveBeenCalledTimes(1);
        expect(onMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('ref 指向外层容器', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(getCollapsible({ ref }));
        expect(ref.current).toBe(getWrapper(container));
    });

    it('在改变高度的提交中添加过渡', () => {
        const seen: string[][] = [];
        function Probe() {
            useLayoutEffect(() => {
                const wrapper = document.querySelector<HTMLElement>('.semi-collapsible-wrapper');
                seen.push([wrapper.style.getPropertyValue(heightVar), wrapper.style.transitionDuration]);
            });
            return null;
        }
        const { rerender } = render(
            <>
                {getCollapsible()}
                <Probe />
            </>
        );
        seen.length = 0;
        rerender(
            <>
                {getCollapsible({ isOpen: true })}
                <Probe />
            </>
        );
        expect(seen[0]).toEqual([openHeight, '250ms']);
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { motion: false, keepDOM: true } };
        const { container, rerender } = render(getCollapsible());
        expect(queryContent()).toBeInTheDocument();
        rerender(getCollapsible({ isOpen: true }));
        expect(getWrapper(container)).not.toHaveClass('semi-collapsible-transition');
    });
});
