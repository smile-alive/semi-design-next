/** @jsxImportSource vue */
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import { Resizable, ResizeGroup, ResizeHandler, ResizeItem } from '..';
import Group from './fixtures/group.vue';

const query = <T extends Element = HTMLElement>(container: Element, selector: string) => container.querySelector<T>(selector) as T;

describe('Resizable（浏览器）', () => {
    it('拖动手柄时，即使指针移出盒子也继续缩放，松开后结束', async () => {
        const { container } = render({
            render: () => (
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Resizable defaultSize={{ width: 200, height: 100 }} />
                    <div style={{ width: '200px', height: '100px' }} data-testid="outside" />
                </div>
            ),
        });
        const box = query(container, '.semi-resizable-resizable');
        const handle = query(container, '.semi-resizable-resizableHandler-right');
        expect(getComputedStyle(handle).touchAction).toBe('none');

        // forced: the drop target moves or is covered by the cursor layer while the drag is in progress
        await userEvent.dragAndDrop(handle, query(container, '[data-testid="outside"]'), { force: true });
        const width = box.offsetWidth;
        expect(width).toBeGreaterThan(200);

        await userEvent.hover(handle);
        expect(box.offsetWidth).toBe(width);
    });

    it('拖动分组手柄时，即使指针移出分组也继续缩放，松开后结束', async () => {
        const { container } = render({
            render: () => (
                <div style={{ display: 'flex' }}>
                    <div style={{ width: '400px', height: '100px' }}>
                        <ResizeGroup>
                            {() => (
                                <>
                                    <ResizeItem />
                                    <ResizeHandler />
                                    <ResizeItem />
                                </>
                            )}
                        </ResizeGroup>
                    </div>
                    <div style={{ width: '200px', height: '100px' }} data-testid="outside" />
                </div>
            ),
        });
        const [first, second] = container.querySelectorAll<HTMLElement>('.semi-resizable-item');
        const handler = query(container, '.semi-resizable-handler');
        expect(getComputedStyle(handler).touchAction).toBe('none');

        await userEvent.dragAndDrop(handler, query(container, '[data-testid="outside"]'), { force: true });
        expect(second?.offsetWidth).toBe(0);
        const width = first?.offsetWidth;

        await userEvent.hover(query(container, '.semi-resizable-item'));
        expect(first?.offsetWidth).toBe(width);
    });
});

describe('Resizable 边界（浏览器）', () => {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    it('boundsByDirection 下拖动左手柄时，边界在整个拖动中保持按起点计算，ResizeObserver 不会放宽它', async () => {
        // synthetic pointers are unknown to the browser, which would refuse to capture them
        vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {});
        const { container } = render({
            render: () => (
                <div style={{ width: '800px', paddingLeft: '300px' }} data-testid="parent">
                    <Resizable boundElement="parent" boundsByDirection defaultSize={{ width: 100, height: 50 }} enable={{ left: true }} />
                </div>
            ),
        });
        const box = query(container, '.semi-resizable-resizable');
        const handle = query(container, '.semi-resizable-resizableHandler-left');
        const fire = (type: string, clientX: number) => handle.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, clientX, clientY: 10, button: 0 }));
        const startX = handle.getBoundingClientRect().left;
        const parentLeft = query(container, '[data-testid="parent"]').getBoundingClientRect().left;
        const limit = box.getBoundingClientRect().right - parentLeft;

        fire('pointerdown', startX);
        for (let step = 1; step <= 6; step++) {
            fire('pointermove', startX - step * 100);
            await nextFrame();
            await nextFrame();
        }
        fire('pointerup', startX - 600);
        handle.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }));

        expect(box.offsetWidth).toBeLessThanOrEqual(limit);
    });
});

describe('ResizeGroup 键盘（浏览器）', () => {
    const renderGroup = () => {
        const { container } = render({
            render: () => (
                <div style={{ width: '1010px', height: '200px' }}>
                    <ResizeGroup>
                        {() => (
                            <>
                                <ResizeItem>{() => 'left'}</ResizeItem>
                                <ResizeHandler />
                                <ResizeItem>{() => 'right'}</ResizeItem>
                            </>
                        )}
                    </ResizeGroup>
                </div>
            ),
        });
        return {
            handler: query(container, '[role="separator"]'),
            items: [...container.querySelectorAll<HTMLElement>('.semi-resizable-item')],
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
        const first = items[0] as HTMLElement;
        const before = first.getBoundingClientRect().width;
        await userEvent.keyboard('{ArrowRight}');
        expect(first.getBoundingClientRect().width - before).toBeCloseTo(10.1, 0);
        expect(handler.getAttribute('aria-valuenow')).toBe('51');
        await userEvent.keyboard('{End}');
        expect(handler.getAttribute('aria-valuenow')).toBe(handler.getAttribute('aria-valuemax'));
    });
});

describe('Resizable 键盘（浏览器）', () => {
    const renderBox = () => {
        const { container } = render({
            render: () => (
                <div style={{ width: '1000px', height: '800px' }}>
                    <Resizable defaultSize={{ width: 200, height: 100 }} />
                </div>
            ),
        });
        return {
            root: query(container, '.semi-resizable-resizable'),
            right: query(container, '.semi-resizable-resizableHandler-right'),
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
        await expect.poll(() => right.getAttribute('aria-valuenow')).toBe('200');
        await userEvent.keyboard('{ArrowRight}');
        await expect.poll(() => root.getBoundingClientRect().width).toBe(210);
        await expect.poll(() => right.getAttribute('aria-valuenow')).toBe('210');
    });
});

describe('ResizeGroup 方向切换（浏览器）', () => {
    it('切到 vertical 后，各项与手柄的高度之和等于分组高度，键盘调整后仍然相等', async () => {
        const view = render(Group, {
            props: {
                direction: 'horizontal',
                width: '1000px',
                height: '500px',
                handler: { style: { width: '8px', height: '20px' } },
            },
        });
        await view.rerender({ direction: 'vertical' });
        const [first, second] = view.container.querySelectorAll<HTMLElement>('.semi-resizable-item');
        const handler = query(view.container, '.semi-resizable-handler');
        const total = () => (first?.offsetHeight ?? 0) + handler.offsetHeight + (second?.offsetHeight ?? 0);
        expect(first?.offsetHeight).toBe(240);
        expect(total()).toBe(500);

        await tabTo(handler);
        await userEvent.keyboard('{ArrowDown}');
        expect(first?.offsetHeight).toBe(245);
        expect(total()).toBe(500);
    });
});
