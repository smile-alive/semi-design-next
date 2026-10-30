import { StrictMode, createRef, useState, type ReactNode } from 'react';
import { act, render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { DragMove } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { DragMoveProps } from '../index';

type PointerHandler = (e: PointerEvent) => void;

function drag(element, from, to, pointerType = 'mouse') {
    fireEvent.pointerDown(element, { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    fireEvent.pointerMove(document, { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    fireEvent.pointerUp(document, { pointerId: 1, pointerType });
}

// jsdom has no layout, so a real ResizeObserver never reports. This one reports each observed child when flushed,
// which render and rerender below do after committing, like the browser reporting before paint.
const pendingReports = [];

class ReportingResizeObserver {
    callback: (entries: unknown[]) => void;

    constructor(callback) {
        this.callback = callback;
    }

    observe(target) {
        pendingReports.push(() => this.callback([{ target }]));
    }

    unobserve() {}

    disconnect() {}
}

const flushResizeReports = () => act(() => pendingReports.splice(0).forEach((report) => report()));

function render(ui) {
    const result = rtlRender(ui);
    flushResizeReports();
    return {
        ...result,
        rerender: (next) => {
            result.rerender(next);
            flushResizeReports();
        },
    };
}

// jsdom has no layout; give elements the offset sizes the absolute strategy reads
function setSize(element, width, height) {
    Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width });
    Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
}

describe('DragMove', () => {
    beforeEach(() => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback(0);
            return 0;
        });
        vi.stubGlobal('ResizeObserver', ReportingResizeObserver);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('默认使用 absolute 定位策略', () => {
        render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );

        expect(screen.getByText('Drag me')).toHaveStyle({ position: 'absolute' });
    });

    it('使用 relative 偏移且不让元素脱离文档流', () => {
        render(
            <DragMove positionStrategy="relative">
                <div style={{ left: 12, top: 8 }}>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ position: 'relative', left: '42px', top: '48px' });
    });

    it('relative 偏移被限制在 constrainer 边界内', () => {
        render(
            <DragMove constrainer="parent" positionStrategy="relative">
                <div style={{ left: 10, top: 5 }}>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');
        const constrainer = element.parentNode as HTMLElement;
        element.getBoundingClientRect = () =>
            ({
                left: 40,
                top: 30,
                right: 140,
                bottom: 80,
                width: 100,
                height: 50,
            }) as DOMRect;
        constrainer.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 0,
                right: 200,
                bottom: 100,
                width: 200,
                height: 100,
            }) as DOMRect;

        drag(element, [100, 100], [300, 300]);

        expect(element).toHaveStyle({ left: '70px', top: '25px' });
    });

    it('按指针位移移动元素，并显示 move 光标', () => {
        render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');
        expect(element.style.cursor).toBe('move');

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('absolute 偏移被限制在父级 constrainer 内', () => {
        render(
            <div data-testid="box">
                <DragMove constrainer="parent">
                    <div>Drag me</div>
                </DragMove>
            </div>
        );
        const element = screen.getByText('Drag me');
        setSize(screen.getByTestId('box'), 200, 100);
        setSize(element, 50, 20);

        drag(element, [100, 100], [400, 400]);
        expect(element).toHaveStyle({ left: '150px', top: '80px' });

        drag(element, [100, 100], [0, 0]);
        expect(element).toHaveStyle({ left: '0px', top: '0px' });
    });

    it('限制在 constrainer 函数返回的元素内', () => {
        const box = document.createElement('div');
        setSize(box, 300, 200);
        render(
            <DragMove constrainer={() => box}>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');
        setSize(element, 100, 100);

        drag(element, [0, 0], [500, 500]);

        expect(element).toHaveStyle({ left: '200px', top: '100px' });
    });

    it('allowMove 返回 false 时不拖动，但仍上报 mousedown', () => {
        const allowMove = vi.fn<(e: PointerEvent, element: HTMLElement) => boolean>(() => false);
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        render(
            <DragMove allowMove={allowMove} onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(allowMove).toHaveBeenCalledWith(expect.any(PointerEvent), element);
        expect(onMouseMove).not.toHaveBeenCalled();
        expect(element.style.left).toBe('');
    });

    it('只从 handler 元素开始拖动', () => {
        const handlerRef = createRef<HTMLSpanElement>();
        render(
            <DragMove handler={() => handlerRef.current}>
                <div>
                    <span ref={handlerRef}>Handle</span>
                    <span>Body</span>
                </div>
            </DragMove>
        );
        const handle = screen.getByText('Handle');
        const element = handle.parentNode as HTMLElement;
        expect(handle.style.cursor).toBe('move');
        expect(element.style.cursor).toBe('');

        drag(screen.getByText('Body'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        drag(handle, [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('除非设置 allowInputDrag，否则不从 input 或 textarea 开始拖动', () => {
        const { rerender } = render(
            <DragMove>
                <div data-testid="drag">
                    <input aria-label="name" />
                    <textarea aria-label="note" />
                </div>
            </DragMove>
        );
        const element = screen.getByTestId('drag');

        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        drag(screen.getByLabelText('note'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        rerender(
            <DragMove allowInputDrag>
                <div data-testid="drag">
                    <input aria-label="name" />
                    <textarea aria-label="note" />
                </div>
            </DragMove>
        );
        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('把原生事件传给鼠标回调，pointerup 后停止', () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        render(
            <DragMove onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledWith(expect.any(PointerEvent));
        expect(onMouseDown.mock.calls[0][0].clientX).toBe(100);
        expect(onMouseMove).toHaveBeenCalledWith(expect.any(PointerEvent));
        expect(onMouseMove.mock.calls[0][0].clientX).toBe(130);
        expect(onMouseUp).toHaveBeenCalledWith(expect.any(PointerEvent));

        fireEvent.pointerMove(document, { pointerId: 1, clientX: 200, clientY: 200 });
        expect(onMouseMove).toHaveBeenCalledTimes(1);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('新位置交给 customMove，而不是写入样式', () => {
        const customMove = vi.fn<(e: HTMLElement, top: number, left: number) => void>();
        render(
            <DragMove customMove={customMove}>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(customMove).toHaveBeenCalledWith(element, 40, 30);
        expect(element.style.left).toBe('');
        expect(element.style.top).toBe('');
    });

    it('支持触摸拖动，只上报给触摸回调，并在结束时停止', () => {
        const onTouchStart = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        const onTouchEnd = vi.fn<PointerHandler>();
        const onMouseDown = vi.fn<PointerHandler>();
        render(
            <DragMove onMouseDown={onMouseDown} onTouchEnd={onTouchEnd} onTouchMove={onTouchMove} onTouchStart={onTouchStart}>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140], 'touch');

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
        expect(onTouchStart).toHaveBeenCalledTimes(1);
        expect(onTouchMove).toHaveBeenCalledTimes(1);
        expect(onTouchEnd).toHaveBeenCalledTimes(1);
        expect(onMouseDown).not.toHaveBeenCalled();

        fireEvent.pointerMove(document, { pointerId: 1, pointerType: 'touch', clientX: 200, clientY: 200 });
        expect(onTouchMove).toHaveBeenCalledTimes(1);
    });

    it('触摸取消时上报并停止拖动', () => {
        const onTouchCancel = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        render(
            <DragMove onTouchCancel={onTouchCancel} onTouchMove={onTouchMove}>
                <div>Drag me</div>
            </DragMove>
        );
        fireEvent.pointerDown(screen.getByText('Drag me'), {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
        });

        fireEvent.pointerCancel(document, { pointerId: 1, pointerType: 'touch' });
        fireEvent.pointerMove(document, { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });

        expect(onTouchCancel).toHaveBeenCalledTimes(1);
        expect(onTouchMove).not.toHaveBeenCalled();
    });

    it('拖动中忽略第二个指针', () => {
        render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');
        fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
        fireEvent.pointerDown(element, { pointerId: 2, pointerType: 'touch', clientX: 500, clientY: 500 });

        fireEvent.pointerMove(document, { pointerId: 2, pointerType: 'touch', clientX: 900, clientY: 900 });
        expect(element.style.left).toBe('');
        fireEvent.pointerMove(document, { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('document 监听共用一个 AbortController signal，拖动结束时 abort', () => {
        const addListener = vi.spyOn(document, 'addEventListener');
        render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');
        fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 });

        const signalOf = (options: boolean | AddEventListenerOptions) => (options as AddEventListenerOptions)?.signal;
        const dragCalls = addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls.map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel', 'selectstart', 'dragstart']);
        const signals = dragCalls.map(([, , options]) => signalOf(options));
        expect(new Set(signals).size).toBe(1);
        expect(signals[0].aborted).toBe(false);

        fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse' });
        expect(signals[0].aborted).toBe(true);
    });

    it('替换子元素后拖动新元素', () => {
        const { rerender } = render(
            <DragMove>
                <div key="a">First</div>
            </DragMove>
        );
        rerender(
            <DragMove>
                <div key="b">Second</div>
            </DragMove>
        );
        const element = screen.getByText('Second');
        expect(element).toHaveStyle({ position: 'absolute' });

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('可以拖动在 DragMove 之后挂载的子元素', () => {
        const { rerender } = render(<DragMove>{null}</DragMove>);
        rerender(
            <DragMove>
                <div>Late</div>
            </DragMove>
        );
        const element = screen.getByText('Late');

        drag(element, [100, 100], [130, 140], 'touch');

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('positionStrategy 变化时更新定位样式', () => {
        const { rerender } = render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        rerender(
            <DragMove positionStrategy="relative">
                <div>Drag me</div>
            </DragMove>
        );

        expect(element).toHaveStyle({ position: 'relative' });
    });

    it('保留子元素自带的 ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <DragMove>
                <div ref={ref}>Drag me</div>
            </DragMove>
        );

        expect(ref.current).toBe(screen.getByText('Drag me'));
    });

    it('拖动中卸载时停止监听 document', () => {
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        const { unmount } = render(
            <DragMove onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
                <div>Drag me</div>
            </DragMove>
        );
        fireEvent.pointerDown(screen.getByText('Drag me'), {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 100,
            clientY: 100,
        });

        unmount();
        fireEvent.pointerMove(document, { pointerId: 1, pointerType: 'mouse', clientX: 130, clientY: 140 });
        fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse' });

        expect(onMouseMove).not.toHaveBeenCalled();
        expect(onMouseUp).not.toHaveBeenCalled();
    });

    it('StrictMode 下正常工作', () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        render(
            <StrictMode>
                <DragMove onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
                    <div>Drag me</div>
                </DragMove>
            </StrictMode>
        );
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onMouseMove).toHaveBeenCalledTimes(1);
        expect(element).toHaveStyle({ position: 'absolute', left: '30px', top: '40px' });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { DragMove: { positionStrategy: 'relative' } };
        try {
            render(
                <DragMove>
                    <div>Drag me</div>
                </DragMove>
            );
            expect(screen.getByText('Drag me')).toHaveStyle({ position: 'relative' });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('右键和中键按下不启动拖拽，触屏与笔不受影响', () => {
        render(
            <DragMove>
                <div>Drag me</div>
            </DragMove>
        );
        const element = screen.getByText('Drag me');

        for (const button of [1, 2]) {
            fireEvent.pointerDown(element, { pointerId: 1, pointerType: 'mouse', button, clientX: 100, clientY: 100 });
            fireEvent.pointerMove(document, { pointerId: 1, pointerType: 'mouse', clientX: 130, clientY: 140 });
            fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse' });
        }
        expect(element.style.left).toBe('');

        for (const pointerType of ['touch', 'pen']) {
            fireEvent.pointerDown(element, { pointerId: 2, pointerType, button: 0, clientX: 100, clientY: 100 });
            fireEvent.pointerMove(document, { pointerId: 2, pointerType, clientX: 130, clientY: 140 });
            fireEvent.pointerUp(document, { pointerId: 2, pointerType });
        }
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('handler 内部元素被替换后，新的 handler 同样获得 move 光标和 touch-action', async () => {
        function Inner() {
            const [key, setKey] = useState('a');
            return (
                <div>
                    <button onClick={() => setKey('b')}>swap</button>
                    <span key={key} data-testid="handle">
                        handle
                    </span>
                </div>
            );
        }
        render(
            <DragMove handler={() => screen.getByTestId('handle')}>
                <Inner />
            </DragMove>
        );
        expect(screen.getByTestId('handle')).toHaveStyle({ cursor: 'move', touchAction: 'none' });
        const oldHandle = screen.getByTestId('handle');

        await act(async () => {
            fireEvent.click(screen.getByText('swap'));
        });

        expect(screen.getByTestId('handle')).not.toBe(oldHandle);
        expect(screen.getByTestId('handle')).toHaveStyle({ cursor: 'move', touchAction: 'none' });
    });

    it('handler 可以返回 null，children 只接受 ReactNode', () => {
        expectTypeOf<DragMoveProps['handler']>().toEqualTypeOf<(() => HTMLElement | null) | undefined>();
        expectTypeOf<DragMoveProps['children']>().toEqualTypeOf<ReactNode | undefined>();
        expectTypeOf<{ children: () => void }>().not.toExtend<DragMoveProps>();
    });

    it('可以拖动未转发 ref 的函数组件子元素', () => {
        function Card() {
            return <div>Card</div>;
        }
        render(
            <div data-testid="box">
                <DragMove constrainer="parent">
                    <Card />
                </DragMove>
            </div>
        );
        const element = screen.getByText('Card');
        setSize(screen.getByTestId('box'), 200, 100);
        setSize(element, 50, 20);

        drag(element, [100, 100], [400, 130]);

        expect(element).toHaveStyle({ position: 'absolute', left: '150px', top: '30px' });
    });
});
