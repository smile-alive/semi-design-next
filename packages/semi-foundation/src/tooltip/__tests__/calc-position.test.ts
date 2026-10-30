import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseProps } from '../foundation';

const VIEWPORT = { width: 1000, height: 800 };

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function createFoundation(props: TooltipBaseProps, triggerRect: DOMRect, popupSize = { width: 100, height: 40 }, trigger: Element | null = null, insetTop = '') {
    const popup = document.createElement('div');
    if (insetTop) {
        popup.style.setProperty('--semi-tooltip-viewport-inset-top', insetTop);
        document.body.append(popup);
    }
    Object.defineProperty(popup, 'offsetWidth', { value: popupSize.width });
    Object.defineProperty(popup, 'offsetHeight', { value: popupSize.height });
    const observers: (ResizeObserver | IntersectionObserver)[] = [];
    const adapter = {
        getProp: (key: string) => props[key],
        getProps: () => props,
        getPortalContainer: () => popup,
        getTriggerRect: () => triggerRect,
        getTriggerElement: () => trigger,
        observeTrigger: (observer: ResizeObserver | IntersectionObserver) => observers.push(observer),
        unobserveTrigger: vi.fn<(observer: ResizeObserver | IntersectionObserver) => void>(),
        getState: () => undefined,
        unregisterClickOutsideHandler: () => {},
    };
    const foundation = new TooltipFoundation(adapter as unknown as TooltipAdapter);
    foundation.handleShown();
    return { foundation, popup, adapter, observers };
}

describe('calcPosition', () => {
    let restore: () => void;
    const setViewport = () => {
        const clientWidth = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT.width);
        const clientHeight = vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT.height);
        restore = () => {
            clientWidth.mockRestore();
            clientHeight.mockRestore();
        };
    };
    afterEach(() => restore?.());

    it('居中放在触发器上方，间距为 spacing', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'top', spacing: 8 }, new DOMRect(400, 300, 80, 20));
        expect(popup.getAttribute('x-placement')).toBe('top');
        // centered on 440, 40 tall above 300 - 8
        expect(popup.style.left).toBe('390px');
        expect(popup.style.top).toBe('252px');
        expect(popup.style.transformOrigin).toBe('50% 100%');
        expect(popup.style.getPropertyValue('--semi-tooltip-trigger-width')).toBe('80px');
    });

    it('autoAdjustOverflow 时上方放不下翻到下方，x-placement 是翻转后的方位', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'top', spacing: 8, autoAdjustOverflow: true }, new DOMRect(400, 10, 80, 20));
        expect(popup.getAttribute('x-placement')).toBe('bottom');
        expect(popup.style.top).toBe('38px');
    });

    it('autoAdjustOverflow 为 false 时不翻转', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'top', spacing: 8, autoAdjustOverflow: false }, new DOMRect(400, 10, 80, 20));
        expect(popup.getAttribute('x-placement')).toBe('top');
    });

    it('{ x, y } 间距：沿方位的是间隔，另一轴平移', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'bottomLeft', spacing: { x: 3, y: 5 } }, new DOMRect(400, 300, 80, 20));
        expect(popup.style.left).toBe('403px');
        expect(popup.style.top).toBe('325px');
    });

    it('放得下时夹在视口内', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'rightTopOver', spacing: 4 }, new DOMRect(900, 300, 100, 20));
        // trigger.right + 4 - 100 would end 4px past the viewport's right edge
        expect(popup.style.left).toBe('900px');
    });

    it('居中箭头指向触发器中心，箭头留在弹层内', () => {
        setViewport();
        const { popup } = createFoundation({ position: 'top', spacing: 8, showArrow: true, arrowPointAtCenter: true }, new DOMRect(0, 300, 20, 20));
        // the popup is clamped to the left edge, so the arrow moves left of its middle, but not past the inset (18px)
        expect(popup.style.left).toBe('0px');
        expect(popup.style.getPropertyValue('--semi-tooltip-arrow-offset-x')).toBe('18%');
    });

    it('视口顶部内边距：翻转、夹取都避开顶栏，隐藏判断排除顶栏覆盖的区域', () => {
        setViewport();
        const options: (IntersectionObserverInit | undefined)[] = [];
        const Original = globalThis.IntersectionObserver;
        globalThis.IntersectionObserver = class extends Original {
            constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
                super(callback, init);
                options.push(init);
            }
        };
        try {
            // 40px above the trigger fits under the viewport's top but not under a 60px header, so it flips
            const flipped = createFoundation({ position: 'top', spacing: 8, autoAdjustOverflow: true }, new DOMRect(400, 70, 80, 20), undefined, null, '60px');
            expect(flipped.popup.getAttribute('x-placement')).toBe('bottom');
            expect(options[0]?.rootMargin).toBe('-60px 0px 0px 0px');
            // an "Over" placement reaching above the header is clamped to its lower edge
            const clamped = createFoundation({ position: 'rightTopOver', spacing: 4 }, new DOMRect(400, 62, 80, 20), undefined, null, '60px');
            expect(clamped.popup.style.top).toBe('60px');
            flipped.popup.remove();
            clamped.popup.remove();
        } finally {
            globalThis.IntersectionObserver = Original;
        }
    });

    it('触发器移出可见区域时隐藏弹层，回来后恢复', () => {
        setViewport();
        const callbacks: IntersectionObserverCallback[] = [];
        const Original = globalThis.IntersectionObserver;
        globalThis.IntersectionObserver = class extends Original {
            constructor(callback: IntersectionObserverCallback) {
                super(callback);
                callbacks.push(callback);
            }
        };
        try {
            const trigger = document.createElement('span');
            const { popup } = createFoundation({ position: 'top', spacing: 8 }, new DOMRect(400, 300, 80, 20));
            const report = (isIntersecting: boolean) => callbacks[0]([{ target: trigger, isIntersecting } as unknown as IntersectionObserverEntry], null);
            report(false);
            expect(popup.style.visibility).toBe('hidden');
            report(true);
            expect(popup.style.visibility).toBe('');
        } finally {
            globalThis.IntersectionObserver = Original;
        }
    });

    it('位移观察的首次回调到达前触发器已移动时重新定位', () => {
        setViewport();
        const moveWatches: IntersectionObserverCallback[] = [];
        const Original = globalThis.IntersectionObserver;
        globalThis.IntersectionObserver = class extends Original {
            constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
                super(callback, init);
                if (init?.threshold !== undefined) {
                    moveWatches.push(callback);
                }
            }
        };
        const trigger = document.body.appendChild(document.createElement('span'));
        try {
            const rect = new DOMRect(400, 300, 80, 20);
            const { foundation, popup } = createFoundation({ position: 'top', spacing: 8 }, rect, undefined, trigger);
            expect(popup.style.left).toBe('390px');
            rect.x = 200;
            // the first report already describes the moved trigger: outside the root built around its old rect
            moveWatches[0]([{ intersectionRatio: 0 } as IntersectionObserverEntry], null as unknown as IntersectionObserver);
            expect(popup.style.left).toBe('190px');
            foundation.destroy();
        } finally {
            globalThis.IntersectionObserver = Original;
            trigger.remove();
        }
    });

    it('触发器所在区域滚动或视口变化时下一帧重定位，无关区域滚动不重算', async () => {
        setViewport();
        const scroller = document.createElement('div');
        const other = document.createElement('div');
        const trigger = scroller.appendChild(document.createElement('span'));
        document.body.append(scroller, other);
        const rect = new DOMRect(400, 300, 80, 20);
        const { foundation, popup } = createFoundation({ position: 'top', spacing: 8 }, rect, undefined, trigger);
        rect.y = 200;
        other.dispatchEvent(new Event('scroll'));
        await nextFrame();
        expect(popup.style.top).toBe('252px');
        scroller.dispatchEvent(new Event('scroll'));
        expect(popup.style.top).toBe('252px');
        await nextFrame();
        expect(popup.style.top).toBe('152px');
        rect.y = 100;
        window.dispatchEvent(new Event('resize'));
        await nextFrame();
        expect(popup.style.top).toBe('52px');
        foundation.destroy();
        scroller.remove();
        other.remove();
    });

    it('同一帧内多个弹层先全部读取再全部写入', async () => {
        setViewport();
        const log: string[] = [];
        const opened = [new DOMRect(100, 300, 80, 20), new DOMRect(400, 300, 80, 20)].map((rect) => {
            const created = createFoundation({ position: 'top', spacing: 8 }, rect, undefined, document.body);
            created.adapter.getTriggerRect = () => {
                log.push('read');
                return rect;
            };
            const setAttribute = created.popup.setAttribute.bind(created.popup);
            created.popup.setAttribute = (name: string, value: string) => {
                log.push('write');
                setAttribute(name, value);
            };
            rect.y = 200;
            return created;
        });
        document.dispatchEvent(new Event('scroll'));
        await nextFrame();
        expect(log).toEqual(['read', 'read', 'write', 'write']);
        for (const { foundation } of opened) {
            foundation.destroy();
        }
    });

    it('destroy 之后停止跟随，不再写入位置', () => {
        setViewport();
        const { foundation, popup, adapter } = createFoundation({ position: 'top', spacing: 8 }, new DOMRect(400, 300, 80, 20));
        foundation.destroy();
        expect(adapter.unobserveTrigger).toHaveBeenCalledTimes(2);
        popup.style.left = '';
        foundation.calcPosition();
        expect(popup.style.left).toBe('');
    });
});
