import { Show, createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import DragMove from '..';

const drag = (element: Element, from: number[], to: number[], pointerType: string) => {
    fireEvent.pointerDown(element, { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    fireEvent.pointerMove(document, { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    fireEvent.pointerUp(document, { pointerId: 1, pointerType });
};

// toHaveStyle appends a probe node to the body, re-triggering waitFor's MutationObserver forever; expect.element polls.
// The element keeps its pre-drag layout position, so the expectation is that position plus the delta.
const expectMovedBy = async (element: HTMLElement, start: { left: number; top: number }, dx: number, dy: number) => await expect.element(element).toHaveStyle({ left: `${start.left + dx}px`, top: `${start.top + dy}px` });

describe('DragMove（浏览器）', () => {
    it('子元素布局完成后应用定位策略、move 光标和 touch-action', async () => {
        render(() => (
            <DragMove>
                <div style={{ width: '40px', height: '20px' }}>Drag me</div>
            </DragMove>
        ));
        const element = screen.getByText('Drag me');

        await expect.element(element).toHaveStyle({ position: 'absolute', cursor: 'move', touchAction: 'none' });
    });

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针移动元素', async (pointerType) => {
        render(() => (
            <DragMove>
                <div style={{ width: '40px', height: '20px' }}>Drag me</div>
            </DragMove>
        ));
        const element = screen.getByText('Drag me');
        await expect.element(element).toHaveStyle({ position: 'absolute' });
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], pointerType);

        await expectMovedBy(element, start, 30, 40);
    });

    // a real click (not a synthetic one): pointer capture on the dragged element would retarget it away from the button
    it('被拖拽元素内的按钮仍能接收点击', async () => {
        const onClick = vi.fn<() => void>();
        render(() => (
            <DragMove>
                <div style={{ width: '80px', height: '40px' }}>
                    <button onClick={onClick}>inner</button>
                </div>
            </DragMove>
        ));
        await expect.element(screen.getByText('inner').parentElement as HTMLElement).toHaveStyle({ position: 'absolute' });

        await userEvent.click(screen.getByText('inner'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('子元素替换后仍可拖拽新元素', async () => {
        const [first, setFirst] = createSignal(true);
        render(() => (
            <div>
                <button onClick={() => setFirst(false)}>swap</button>
                <DragMove>
                    <Show when={first()} fallback={<div style={{ width: '40px', height: '20px' }}>Second</div>}>
                        <div style={{ width: '40px', height: '20px' }}>First</div>
                    </Show>
                </DragMove>
            </div>
        ));
        fireEvent.click(screen.getByText('swap'));
        const element = screen.getByText('Second');
        await expect.element(element).toHaveStyle({ position: 'absolute' });
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], 'mouse');

        await expectMovedBy(element, start, 30, 40);
    });
});
