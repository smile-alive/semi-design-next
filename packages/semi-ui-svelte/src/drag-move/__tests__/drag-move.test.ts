import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { DragMoveOptions } from '../interface';
import DragFixture from './drag-fixture.svelte';

type PointerHandler = (e: PointerEvent) => void;
type Variant = 'plain' | 'inputs' | 'handler' | 'swap-handler';
type Store = { options: DragMoveOptions; show: boolean; second: boolean; variant: Variant };

const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
function drag(element: Element, from: number[], to: number[], pointerType = 'mouse') {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
}

// flushes effects, then lets the handler MutationObserver callback run
async function settle() {
    flushSync();
    await Promise.resolve();
}

async function setup(options: DragMoveOptions = {}, init: Partial<Omit<Store, 'options'>> = {}) {
    const store = createStore<Store>({ options, show: true, second: false, variant: 'plain', ...init });
    const view = render(DragFixture, { props: { store } });
    await settle();
    return { store, ...view };
}

// jsdom has no layout; give elements the offset sizes the absolute strategy reads
function setSize(element: Element, width: number, height: number) {
    Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width });
    Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
}

describe('Svelte dragMove', () => {
    beforeEach(() => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback(0);
            return 0;
        });
    });

    it('默认使用 absolute 定位策略', async () => {
        await setup();
        expect(screen.getByText('Drag me')).toHaveStyle({ position: 'absolute' });
    });

    it('使用 relative 偏移且不让元素脱离文档流', async () => {
        await setup({ positionStrategy: 'relative' });
        const element = screen.getByText('Drag me');
        element.style.left = '12px';
        element.style.top = '8px';

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ position: 'relative', left: '42px', top: '48px' });
    });

    it('relative 偏移被限制在 constrainer 边界内', async () => {
        await setup({ constrainer: 'parent', positionStrategy: 'relative' });
        const element = screen.getByText('Drag me');
        element.style.left = '10px';
        element.style.top = '5px';
        element.getBoundingClientRect = () => ({ left: 40, top: 30, right: 140, bottom: 80, width: 100, height: 50 }) as DOMRect;
        (element.parentNode as HTMLElement).getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect;

        drag(element, [100, 100], [300, 300]);

        expect(element).toHaveStyle({ left: '70px', top: '25px' });
    });

    it('按指针位移移动元素，并显示 move 光标', async () => {
        await setup();
        const element = screen.getByText('Drag me');
        expect(element.style.cursor).toBe('move');

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('absolute 偏移被限制在父级 constrainer 内', async () => {
        await setup({ constrainer: 'parent' });
        const element = screen.getByText('Drag me');
        setSize(screen.getByTestId('box'), 200, 100);
        setSize(element, 50, 20);

        drag(element, [100, 100], [400, 400]);
        expect(element).toHaveStyle({ left: '150px', top: '80px' });

        drag(element, [100, 100], [0, 0]);
        expect(element).toHaveStyle({ left: '0px', top: '0px' });
    });

    it('限制在 constrainer 函数返回的元素内', async () => {
        const box = document.createElement('div');
        setSize(box, 300, 200);
        await setup({ constrainer: () => box });
        const element = screen.getByText('Drag me');
        setSize(element, 100, 100);

        drag(element, [0, 0], [500, 500]);

        expect(element).toHaveStyle({ left: '200px', top: '100px' });
    });

    it('allowMove 返回 false 时不拖动，但仍发出 onMouseDown', async () => {
        const allowMove = vi.fn<NonNullable<DragMoveOptions['allowMove']>>(() => false);
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        await setup({ allowMove, onMouseDown, onMouseMove });
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(allowMove).toHaveBeenCalledWith(expect.any(PointerEvent), element);
        expect(onMouseMove).not.toHaveBeenCalled();
        expect(element.style.left).toBe('');
    });

    it('只从 handler 元素开始拖动', async () => {
        await setup({}, { variant: 'handler' });
        const handle = screen.getByText('Handle');
        const element = screen.getByTestId('drag');
        expect(handle.style.cursor).toBe('move');
        expect(element.style.cursor).toBe('');

        drag(screen.getByText('Body'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        drag(handle, [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('handler 可以直接是元素，该元素不在被拖动元素内时不会开始拖动', async () => {
        const outside = document.createElement('div');
        await setup({ handler: outside });
        const element = screen.getByText('Drag me');
        expect(outside.style.cursor).toBe('move');

        drag(element, [100, 100], [130, 140]);

        expect(element.style.left).toBe('');
    });

    it('除非设置 allowInputDrag，否则不从 input 或 textarea 开始拖动', async () => {
        const store = (await setup({}, { variant: 'inputs' })).store;
        const element = screen.getByTestId('drag');

        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        drag(screen.getByLabelText('note'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        store.options = { allowInputDrag: true };
        await settle();
        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('把原生事件传给 mouse 系回调，pointerup 后停止', async () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        await setup({ onMouseDown, onMouseMove, onMouseUp });
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledWith(expect.any(PointerEvent));
        expect(onMouseDown.mock.calls[0]?.[0].clientX).toBe(100);
        expect(onMouseMove).toHaveBeenCalledWith(expect.any(PointerEvent));
        expect(onMouseMove.mock.calls[0]?.[0].clientX).toBe(130);
        expect(onMouseUp).toHaveBeenCalledWith(expect.any(PointerEvent));

        pointer(document, 'pointermove', { pointerId: 1, clientX: 200, clientY: 200 });
        expect(onMouseMove).toHaveBeenCalledTimes(1);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('笔按 mouse 系回调发出', async () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        const onTouchStart = vi.fn<PointerHandler>();
        await setup({ onMouseDown, onMouseUp, onTouchStart });

        drag(screen.getByText('Drag me'), [100, 100], [130, 140], 'pen');

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(onTouchStart).not.toHaveBeenCalled();
    });

    it('新位置交给 customMove，而不是写入样式', async () => {
        const customMove = vi.fn<NonNullable<DragMoveOptions['customMove']>>();
        await setup({ customMove });
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(customMove).toHaveBeenCalledWith(element, 40, 30);
        expect(element.style.left).toBe('');
        expect(element.style.top).toBe('');
    });

    it('支持触摸拖动，只发出 touch 系回调，并在结束时停止', async () => {
        const onTouchStart = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        const onTouchEnd = vi.fn<PointerHandler>();
        const onMouseDown = vi.fn<PointerHandler>();
        await setup({ onMouseDown, onTouchEnd, onTouchMove, onTouchStart });
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140], 'touch');

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
        expect(onTouchStart).toHaveBeenCalledTimes(1);
        expect(onTouchMove).toHaveBeenCalledTimes(1);
        expect(onTouchEnd).toHaveBeenCalledTimes(1);
        expect(onMouseDown).not.toHaveBeenCalled();

        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'touch', clientX: 200, clientY: 200 });
        expect(onTouchMove).toHaveBeenCalledTimes(1);
    });

    it('触摸取消时发出 onTouchCancel 并停止拖动', async () => {
        const onTouchCancel = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        await setup({ onTouchCancel, onTouchMove });
        pointer(screen.getByText('Drag me'), 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });

        pointer(document, 'pointercancel', { pointerId: 1, pointerType: 'touch' });
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });

        expect(onTouchCancel).toHaveBeenCalledTimes(1);
        expect(onTouchMove).not.toHaveBeenCalled();
    });

    it('拖动中忽略第二个指针', async () => {
        await setup();
        const element = screen.getByText('Drag me');
        pointer(element, 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
        pointer(element, 'pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 500, clientY: 500 });

        pointer(document, 'pointermove', { pointerId: 2, pointerType: 'touch', clientX: 900, clientY: 900 });
        expect(element.style.left).toBe('');
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('右键和中键按下不启动拖拽，触屏与笔不受影响', async () => {
        await setup();
        const element = screen.getByText('Drag me');

        for (const button of [1, 2]) {
            pointer(element, 'pointerdown', { pointerId: 1, pointerType: 'mouse', button, clientX: 100, clientY: 100 });
            pointer(document, 'pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 130, clientY: 140 });
            pointer(document, 'pointerup', { pointerId: 1, pointerType: 'mouse' });
        }
        expect(element.style.left).toBe('');

        for (const pointerType of ['touch', 'pen']) {
            pointer(element, 'pointerdown', { pointerId: 2, pointerType, button: 0, clientX: 100, clientY: 100 });
            pointer(document, 'pointermove', { pointerId: 2, pointerType, clientX: 130, clientY: 140 });
            pointer(document, 'pointerup', { pointerId: 2, pointerType });
        }
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('document 监听共用一个 AbortController signal，拖动结束时 abort', async () => {
        const addListener = vi.spyOn(document, 'addEventListener');
        await setup();
        pointer(screen.getByText('Drag me'), 'pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 });

        const signalOf = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal;
        const dragCalls = addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls.map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel', 'selectstart', 'dragstart']);
        const signals = dragCalls.map(([, , options]) => signalOf(options));
        expect(new Set(signals).size).toBe(1);
        expect(signals[0]?.aborted).toBe(false);

        pointer(document, 'pointerup', { pointerId: 1, pointerType: 'mouse' });
        expect(signals[0]?.aborted).toBe(true);
    });

    it('替换元素后拖动新元素', async () => {
        const { store } = await setup();
        store.second = true;
        await settle();
        const element = screen.getByText('Second');
        expect(element).toHaveStyle({ position: 'absolute' });

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('可以拖动晚于组件挂载的元素', async () => {
        const { store } = await setup({}, { show: false });
        store.show = true;
        await settle();

        drag(screen.getByText('Drag me'), [100, 100], [130, 140], 'touch');

        expect(screen.getByText('Drag me')).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('options 换成新对象后按新选项重新绑定', async () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const { store } = await setup();
        const element = screen.getByText('Drag me');

        store.options = { positionStrategy: 'relative', onMouseDown };
        await settle();
        expect(element).toHaveStyle({ position: 'relative' });

        drag(element, [100, 100], [130, 140]);
        // one listener only: the first attachment removed its own
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('元素移除后不再响应，也不留下 pointerdown 监听', async () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const { store } = await setup({ onMouseDown });
        const element = screen.getByText('Drag me');
        const removeListener = vi.spyOn(element, 'removeEventListener');

        store.show = false;
        await settle();

        expect(removeListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        pointer(element, 'pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 });
        expect(onMouseDown).not.toHaveBeenCalled();
    });

    it('拖动中卸载时停止监听 document', async () => {
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        const view = await setup({ onMouseMove, onMouseUp });
        pointer(screen.getByText('Drag me'), 'pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 });

        view.unmount();
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 130, clientY: 140 });
        pointer(document, 'pointerup', { pointerId: 1, pointerType: 'mouse' });

        expect(onMouseMove).not.toHaveBeenCalled();
        expect(onMouseUp).not.toHaveBeenCalled();
    });

    it('handler 内部元素被替换后，新的 handler 同样获得 move 光标和 touch-action', async () => {
        await setup({}, { variant: 'swap-handler' });
        const oldHandle = screen.getByTestId('handle');
        expect(oldHandle).toHaveStyle({ cursor: 'move', touchAction: 'none' });

        screen.getByText('swap').click();
        flushSync();

        await waitFor(() => expect(screen.getByTestId('handle')).not.toBe(oldHandle));
        await waitFor(() => expect(screen.getByTestId('handle').style.touchAction).toBe('none'));
        expect(screen.getByTestId('handle')).toHaveStyle({ cursor: 'move' });
    });
});
