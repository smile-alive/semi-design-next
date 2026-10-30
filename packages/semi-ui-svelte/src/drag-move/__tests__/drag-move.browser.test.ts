import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { mouse } from '@test/utils/browser';
import type { DragMoveOptions } from '../interface';
import DragLayout from './drag-layout.svelte';

const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
function drag(element: Element, from: number[], to: number[], pointerType: string) {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
}

function setup(options: DragMoveOptions = {}, onInnerClick?: () => void) {
    render(DragLayout, { props: { options, onInnerClick } });
    return screen.getByTestId('drag');
}

// toHaveStyle appends a probe node to the body, which would re-trigger waitFor's MutationObserver forever;
// expect.element polls on a timer instead.
const expectLeftTop = async (element: HTMLElement, left: number, top: number) => await expect.element(element).toHaveStyle({ left: `${left}px`, top: `${top}px` });

describe('Svelte dragMove（浏览器）', () => {
    it('挂载后应用定位策略、move 光标和 touch-action', async () => {
        const element = setup();

        await expect.element(element).toHaveStyle({ position: 'absolute', cursor: 'move', touchAction: 'none' });
    });

    it.each(['mouse', 'touch', 'pen'])('使用 %s 指针移动元素', async (pointerType) => {
        const element = setup();
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], pointerType);

        await expectLeftTop(element, start.left + 30, start.top + 40);
    });

    it('真实鼠标按下、移动、抬起会移动元素，抬起后不再跟随', async () => {
        const element = setup();
        const start = { left: element.offsetLeft, top: element.offsetTop };
        const { left, top } = element.getBoundingClientRect();

        await mouse('move', left + 10, top + 10);
        await mouse('down', left + 10, top + 10);
        await mouse('move', left + 40, top + 50);
        await mouse('up', left + 40, top + 50);
        await expectLeftTop(element, start.left + 30, start.top + 40);

        await mouse('move', left + 100, top + 100);
        await expectLeftTop(element, start.left + 30, start.top + 40);
    });

    // a real click (not a synthetic one): pointer capture on the dragged element would retarget it away from the button
    it('被拖拽元素内的按钮仍能接收点击', async () => {
        const onClick = vi.fn<() => void>();
        const element = setup({}, onClick);
        await expect.element(element).toHaveStyle({ position: 'absolute' });

        await userEvent.click(screen.getByText('inner'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('absolute 位置被限制在父级 constrainer 的布局边界内', async () => {
        const element = setup({ constrainer: 'parent' });
        await expect.element(element).toHaveStyle({ position: 'absolute' });

        drag(element, [100, 100], [900, 900], 'mouse');
        // the box is 200 × 100 and the element 80 × 40
        await expectLeftTop(element, 120, 60);

        drag(element, [100, 100], [-900, -900], 'mouse');
        await expectLeftTop(element, 0, 0);
    });

    it('relative 位置被限制在 constrainer 的屏幕边界内，且元素保留在文档流中', async () => {
        const element = setup({ constrainer: 'parent', positionStrategy: 'relative' });
        await expect.element(element).toHaveStyle({ position: 'relative' });
        const box = screen.getByTestId('box').getBoundingClientRect();

        drag(element, [100, 100], [900, 900], 'mouse');
        await expectLeftTop(element, box.width - 80, box.height - 40);
        expect(element.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    });

    it('allowMove 返回 false 时元素不移动', async () => {
        const allowMove = vi.fn<NonNullable<DragMoveOptions['allowMove']>>(() => false);
        const element = setup({ allowMove });
        await expect.element(element).toHaveStyle({ position: 'absolute' });
        const start = { left: element.offsetLeft, top: element.offsetTop };

        drag(element, [100, 100], [130, 140], 'mouse');

        expect(allowMove).toHaveBeenCalledTimes(1);
        expect(element.offsetLeft).toBe(start.left);
        expect(element.offsetTop).toBe(start.top);
    });
});
