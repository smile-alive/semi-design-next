import { describe, expect, it, vi } from 'vite-plus/test';
import CollapsibleFoundation, { type CollapsibleAdapter, type CollapsibleBaseProps } from '../foundation';

const { getInitialView, deriveView, shouldRender, getWrapperStyle, getCollapsedHeight } = CollapsibleFoundation;

const defaults: CollapsibleBaseProps = {
    isOpen: false,
    duration: 250,
    motion: true,
    keepDOM: false,
    lazyRender: false,
    collapseHeight: 0,
    collapseHeightAdaptive: false,
    fade: false,
};
const p = (props: Partial<CollapsibleBaseProps> = {}) => ({ ...defaults, ...props });

describe('CollapsibleFoundation 视图推导', () => {
    it('isOpen 不变时返回同一个 view', () => {
        const view = deriveView(p(), getInitialView(p()));
        expect(deriveView(p(), view)).toBe(view);
    });

    it('有动效时展开立即显示并进入过渡', () => {
        const view = deriveView(p({ isOpen: true }), getInitialView(p()));
        expect(view).toEqual({ isOpen: true, visible: true, isTransitioning: true, rendered: true });
    });

    it('有动效时关闭保持显示到过渡结束', () => {
        const props = p({ isOpen: false });
        const view = deriveView(props, getInitialView(p({ isOpen: true })));
        expect(view).toMatchObject({ isOpen: false, visible: true, isTransitioning: true });
        expect(shouldRender(props, view)).toBe(true);
    });

    it('无动效时关闭立即隐藏且不进入过渡', () => {
        const props = p({ motion: false });
        const view = deriveView(props, getInitialView(p({ isOpen: true, motion: false })));
        expect(view).toMatchObject({ isOpen: false, visible: false, isTransitioning: false });
        expect(shouldRender(props, view)).toBe(false);
    });

    it('duration 为 0 时与无动效相同：关闭立即隐藏且不进入过渡', () => {
        const props = p({ duration: 0 });
        const view = deriveView(props, getInitialView(p({ isOpen: true, duration: 0 })));
        expect(view).toMatchObject({ isOpen: false, visible: false, isTransitioning: false });
        expect(CollapsibleFoundation.isInTransition(props, { ...view, isTransitioning: true })).toBe(false);
    });

    it('keepDOM 加 lazyRender 只在首次展开后保持渲染', () => {
        const closed = p({ keepDOM: true, lazyRender: true, motion: false });
        let view = deriveView(closed, getInitialView(closed));
        expect(shouldRender(closed, view)).toBe(false);
        view = deriveView({ ...closed, isOpen: true }, view);
        view = deriveView(closed, view);
        expect(view.rendered).toBe(true);
        expect(shouldRender(closed, view)).toBe(true);
    });

    it('collapseHeight > 0 时关闭也渲染内容', () => {
        const props = p({ collapseHeight: 30 });
        expect(shouldRender(props, deriveView(props, getInitialView(props)))).toBe(true);
    });
});

describe('CollapsibleFoundation 收起高度表达式', () => {
    it('非自适应时为字面高度', () => {
        expect(getCollapsedHeight(p({ collapseHeight: 30 }))).toBe('30px');
    });

    it('自适应时为 calc-size，收起高度不超过内容实际高度（由 CSS 在真实布局中求值，这里只验证表达式本身）', () => {
        expect(getCollapsedHeight(p({ collapseHeight: 30, collapseHeightAdaptive: true }))).toBe('calc-size(auto, min(size, 30px))');
    });
});

describe('CollapsibleFoundation 外层样式', () => {
    const view = getInitialView(p());

    it('展开时高度为内容的自然高度，收起时为收起高度表达式；起始高度是另一侧', () => {
        const open = getWrapperStyle(p({ isOpen: true }), getInitialView(p({ isOpen: true })));
        expect(open['--semi-collapsible-height']).toBe('calc-size(auto, size)');
        expect(open['--semi-collapsible-from-height']).toBe('0px');
        const closed = getWrapperStyle(p(), view);
        expect(closed['--semi-collapsible-height']).toBe('0px');
        expect(closed['--semi-collapsible-from-height']).toBe('calc-size(auto, size)');
        expect(getWrapperStyle(p({ collapseHeight: 30, collapseHeightAdaptive: true }), view)['--semi-collapsible-height']).toBe('calc-size(auto, min(size, 30px))');
    });

    it('fade 只在收起高度为 0 时把关闭内容的 opacity 设为 0', () => {
        expect(getWrapperStyle(p({ fade: true }), view).opacity).toBe(0);
        expect(getWrapperStyle(p({ fade: true, collapseHeight: 10 }), view).opacity).toBe(1);
        expect(getWrapperStyle(p({ fade: true, isOpen: true }), view).opacity).toBe(1);
    });

    it('只有动效开启且在过渡中时才有过渡时长', () => {
        const transitioning = { ...view, isTransitioning: true };
        expect(getWrapperStyle(p({ duration: 400 }), transitioning).transitionDuration).toBe('400ms');
        expect(getWrapperStyle(p({ duration: 400, motion: false }), transitioning).transitionDuration).toBe('0ms');
        expect(getWrapperStyle(p({ duration: 400 }), view).transitionDuration).toBe('0ms');
    });
});

describe('CollapsibleFoundation 过渡结束', () => {
    const create = (props: CollapsibleBaseProps) => {
        const adapter: CollapsibleAdapter = {
            getContext: () => undefined,
            getContexts: () => undefined,
            getProp: (key) => props[key],
            getProps: () => props,
            getState: () => undefined,
            getStates: () => ({}),
            setState: () => {},
            getWrapper: () => null,
            setVisible: vi.fn<CollapsibleAdapter['setVisible']>(),
            setIsTransitioning: vi.fn<CollapsibleAdapter['setIsTransitioning']>(),
            notifyMotionEnd: vi.fn<CollapsibleAdapter['notifyMotionEnd']>(),
        };
        return { adapter, foundation: new CollapsibleFoundation(adapter) };
    };

    it('关闭时外层 height 过渡结束后隐藏内容并通知', () => {
        const { adapter, foundation } = create(p());
        foundation.handleTransitionEnd({ isSelf: true, propertyName: 'height' });
        expect(adapter.setVisible).toHaveBeenCalledWith(false);
        expect(adapter.setIsTransitioning).toHaveBeenCalledWith(false);
        expect(adapter.notifyMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('展开时结束过渡但不隐藏内容', () => {
        const { adapter, foundation } = create(p({ isOpen: true }));
        foundation.handleTransitionEnd({ isSelf: true, propertyName: 'height' });
        expect(adapter.setVisible).not.toHaveBeenCalled();
        expect(adapter.notifyMotionEnd).toHaveBeenCalledTimes(1);
    });

    it('忽略子元素冒泡的过渡，以及 fade 时 wrapper 自身的 opacity 过渡', () => {
        const { adapter, foundation } = create(p({ fade: true }));
        foundation.handleTransitionEnd({ isSelf: false, propertyName: 'height' });
        foundation.handleTransitionEnd({ isSelf: true, propertyName: 'opacity' });
        expect(adapter.notifyMotionEnd).not.toHaveBeenCalled();
    });
});
