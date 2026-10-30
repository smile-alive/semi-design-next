import type { ComponentProps, ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Resizable, ResizeGroup as TypedResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';

// The tests render groups without `direction` to cover its runtime default, which the props type marks as required
const ResizeGroup = TypedResizeGroup as unknown as ComponentType<Partial<ComponentProps<typeof TypedResizeGroup>>>;

describe('Resizable', () => {
    it('拖动手柄时，即使指针移出盒子也继续缩放，松开后结束', async () => {
        const { container } = render(
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Resizable defaultSize={{ width: 200, height: 100 }} />
                <div style={{ width: 200, height: 100 }} data-testid="outside" />
            </div>
        );
        const box = container.querySelector<HTMLElement>('.semi-resizable-resizable');
        const handle = container.querySelector('.semi-resizable-resizableHandler-right');
        expect(getComputedStyle(handle).touchAction).toBe('none');

        // forced: the drop target moves or is covered by the cursor layer while the drag is in progress
        await userEvent.dragAndDrop(handle, container.querySelector('[data-testid="outside"]'), { force: true });
        const width = box.offsetWidth;
        expect(width).toBeGreaterThan(200);

        await userEvent.hover(handle);
        expect(box.offsetWidth).toBe(width);
    });

    it('拖动分组手柄时，即使指针移出分组也继续缩放，松开后结束', async () => {
        const { container } = render(
            <div style={{ display: 'flex' }}>
                <div style={{ width: 400, height: 100 }}>
                    <ResizeGroup>
                        <ResizeItem />
                        <ResizeHandler />
                        <ResizeItem />
                    </ResizeGroup>
                </div>
                <div style={{ width: 200, height: 100 }} data-testid="outside" />
            </div>
        );
        const [first, second] = container.querySelectorAll<HTMLElement>('.semi-resizable-item');
        const handler = container.querySelector('.semi-resizable-handler');
        expect(getComputedStyle(handler).touchAction).toBe('none');

        // released past the group's right end: the next item shrinks to nothing
        await userEvent.dragAndDrop(handler, container.querySelector('[data-testid="outside"]'), { force: true });
        expect(second.offsetWidth).toBe(0);
        const width = first.offsetWidth;

        await userEvent.hover(container.querySelector('.semi-resizable-item'));
        expect(first.offsetWidth).toBe(width);
    });
});

describe('Resizable 边界', () => {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    it('boundsByDirection 下拖动左手柄时，边界在整个拖动中保持按起点计算，ResizeObserver 不会放宽它', async () => {
        // synthetic pointers are unknown to the browser, which would refuse to capture them
        const capture = vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {});
        try {
            const { container } = render(
                <div style={{ width: 800, paddingLeft: 300 }} data-testid="parent">
                    <Resizable boundElement="parent" boundsByDirection defaultSize={{ width: 100, height: 50 }} enable={{ left: true }} />
                </div>
            );
            const box = container.querySelector<HTMLElement>('.semi-resizable-resizable');
            const handle = container.querySelector<HTMLElement>('.semi-resizable-resizableHandler-left');
            const fire = (type: string, clientX: number) => handle.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, clientX, clientY: 10, button: 0 }));
            const startX = handle.getBoundingClientRect().left;
            const parentLeft = container.querySelector('[data-testid="parent"]').getBoundingClientRect().left;
            // the box's right edge, measured from the parent's left edge: the widest the box may become
            const limit = box.getBoundingClientRect().right - parentLeft;

            fire('pointerdown', startX);
            // a frame between the moves lets the box's ResizeObserver run, as in a real drag
            for (let step = 1; step <= 6; step++) {
                fire('pointermove', startX - step * 100);
                await nextFrame();
                await nextFrame();
            }
            fire('pointerup', startX - 600);
            handle.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }));

            expect(box.offsetWidth).toBeLessThanOrEqual(limit);
        } finally {
            capture.mockRestore();
        }
    });
});

describe('ResizeGroup 键盘', () => {
    const renderGroup = () => {
        const result = render(
            <div style={{ width: 1010, height: 200 }}>
                <ResizeGroup>
                    <ResizeItem>left</ResizeItem>
                    <ResizeHandler />
                    <ResizeItem>right</ResizeItem>
                </ResizeGroup>
            </div>
        );
        return {
            handler: result.container.querySelector('[role="separator"]'),
            items: [...result.container.querySelectorAll('.semi-resizable-item')],
        };
    };

    it('Tab 可以到达分隔条，并显示主题焦点环', async () => {
        const { handler } = renderGroup();
        await tabTo(handler);
        expectThemeFocusRing(handler);
    });

    it('方向键在已布局的分组中移动分隔条，并同步 aria-valuenow', async () => {
        const { handler, items } = renderGroup();
        await tabTo(handler);
        const before = items[0].getBoundingClientRect().width;
        await userEvent.keyboard('{ArrowRight}');
        expect(items[0].getBoundingClientRect().width - before).toBeCloseTo(10.1, 0);
        expect(handler.getAttribute('aria-valuenow')).toBe('51');
        await userEvent.keyboard('{End}');
        expect(handler.getAttribute('aria-valuenow')).toBe(handler.getAttribute('aria-valuemax'));
    });
});

describe('Resizable 键盘', () => {
    const renderBox = () => {
        const result = render(
            <div style={{ width: 1000, height: 800 }}>
                <Resizable defaultSize={{ width: 200, height: 100 }} />
            </div>
        );
        return {
            root: result.container.querySelector('.semi-resizable-resizable'),
            right: result.container.querySelector('.semi-resizable-resizableHandler-right'),
        };
    };

    it('Tab 可以到达右侧手柄，并显示主题焦点环', async () => {
        const { right } = renderBox();
        await tabTo(right);
        expectThemeFocusRing(right);
    });

    it('方向键改变宽度，aria-valuenow 跟随布局后的尺寸', async () => {
        const { root, right } = renderBox();
        await tabTo(right);
        expect(right.getAttribute('aria-valuenow')).toBe('200');
        await userEvent.keyboard('{ArrowRight}');
        expect(root.getBoundingClientRect().width).toBe(210);
        await expect.poll(() => right.getAttribute('aria-valuenow')).toBe('210');
    });
});

describe('ResizeGroup 方向切换', () => {
    it('切到 vertical 后，各项与手柄的高度之和等于分组高度，键盘调整后仍然相等', async () => {
        const items = (
            <>
                <ResizeItem />
                <ResizeHandler style={{ width: 8, height: 20 }} />
                <ResizeItem />
            </>
        );
        const tree = (direction: 'horizontal' | 'vertical') => (
            <div style={{ width: 1000, height: 500 }}>
                <ResizeGroup direction={direction}>{items}</ResizeGroup>
            </div>
        );
        const { container, rerender } = render(tree('horizontal'));
        rerender(tree('vertical'));
        const [first, second] = container.querySelectorAll<HTMLElement>('.semi-resizable-item');
        const handler = container.querySelector<HTMLElement>('.semi-resizable-handler');
        const total = () => first.offsetHeight + handler.offsetHeight + second.offsetHeight;
        expect(first.offsetHeight).toBe(240);
        expect(total()).toBe(500);

        await tabTo(handler);
        await userEvent.keyboard('{ArrowDown}');
        expect(first.offsetHeight).toBe(245);
        expect(total()).toBe(500);
    });
});
