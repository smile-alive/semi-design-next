/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import DragMove from '..';
import Swap from './fixtures/swap.vue';

const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
const drag = (element: Element, from: number[], to: number[], pointerType: string) => {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
};

// toHaveStyle appends a probe node to the body, which would re-trigger waitFor's MutationObserver forever;
// expect.element polls on a timer instead.
const expectMovedBy = async (element: HTMLElement, start: { left: number; top: number }, dx: number, dy: number) => await expect.element(element).toHaveStyle({ left: `${start.left + dx}px`, top: `${start.top + dy}px` });

const box = (text: string, width = '40px', height = '20px') => <div style={{ width, height }}>{text}</div>;

describe('DragMove（浏览器）', () => {
    it('子元素布局完成后应用定位策略、move 光标和 touch-action', async () => {
        render({ render: () => <DragMove>{() => box('Drag me')}</DragMove> });
        const element = screen.getByText('Drag me');

        await expect.element(element).toHaveStyle({ position: 'absolute', cursor: 'move', touchAction: 'none' });
    });

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针移动元素', async (pointerType) => {
        render({ render: () => <DragMove>{() => box('Drag me')}</DragMove> });
        const element = screen.getByText('Drag me');
        await expect.element(element).toHaveStyle({ position: 'absolute' });
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], pointerType);

        await expectMovedBy(element, start, 30, 40);
    });

    // a real click (not a synthetic one): pointer capture on the dragged element would retarget it away from the button
    it('被拖拽元素内的按钮仍能接收点击', async () => {
        const onClick = vi.fn<() => void>();
        render({
            render: () => (
                <DragMove>
                    {() => (
                        <div style={{ width: '80px', height: '40px' }}>
                            <button type="button" onClick={onClick}>
                                inner
                            </button>
                        </div>
                    )}
                </DragMove>
            ),
        });
        await expect.element(screen.getByText('inner').parentElement as HTMLElement).toHaveStyle({ position: 'absolute' });

        await userEvent.click(screen.getByText('inner'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('子元素替换后仍可拖拽新元素', async () => {
        render(Swap);
        await userEvent.click(screen.getByText('swap'));
        const element = await screen.findByText('Second');
        await expect.element(element).toHaveStyle({ position: 'absolute' });
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], 'mouse');

        await expectMovedBy(element, start, 30, 40);
    });
});
