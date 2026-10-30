/** @jsxImportSource vue */
import { nextTick, shallowRef, type VNodeChild } from 'vue';
import { screen, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import DragMove, { type DragMoveProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Card from './fixtures/card.vue';
import ChildRef from './fixtures/child-ref.vue';
import Handler from './fixtures/handler.vue';
import SwapHandle from './fixtures/swap-handle.vue';
import Swap from './fixtures/swap.vue';

type Props = Record<string, unknown>;
type PointerHandler = (e: PointerEvent) => void;

const pointer = (target: EventTarget, type: string, init: PointerEventInit) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }));
function drag(element: Element, from: number[], to: number[], pointerType = 'mouse') {
    pointer(element, 'pointerdown', { pointerId: 1, pointerType, clientX: from[0], clientY: from[1] });
    pointer(document, 'pointermove', { pointerId: 1, pointerType, clientX: to[0], clientY: to[1] });
    pointer(document, 'pointerup', { pointerId: 1, pointerType });
}

// jsdom has no layout, so a real ResizeObserver never reports. This one reports each observed child when flushed,
// which the render helpers below do after mounting and updating, like the browser reporting before paint.
const pendingReports: (() => void)[] = [];

class ReportingResizeObserver {
    #callback: (entries: { target: Element }[]) => void;

    constructor(callback: (entries: { target: Element }[]) => void) {
        this.#callback = callback;
    }

    observe(target: Element) {
        pendingReports.push(() => this.#callback([{ target }]));
    }

    unobserve() {}

    disconnect() {}
}

const flushResizeReports = () => pendingReports.splice(0).forEach((report) => report());

function renderDrag(initial: Props, children: () => VNodeChild, wrapper?: Props) {
    const props = shallowRef(initial);
    const tree = () => <DragMove {...props.value}>{{ default: children }}</DragMove>;
    const result = render({ render: () => (wrapper ? <div {...wrapper}>{tree()}</div> : tree()) });
    flushResizeReports();
    return {
        ...result,
        setProps: async (next: Props) => {
            props.value = next;
            await nextTick();
            flushResizeReports();
        },
    };
}
const dragMe = () => <div>Drag me</div>;

// jsdom has no layout; give elements the offset sizes the absolute strategy reads
function setSize(element: Element, width: number, height: number) {
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
        pendingReports.length = 0;
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('默认使用 absolute 定位策略', () => {
        renderDrag({}, dragMe);
        expect(screen.getByText('Drag me')).toHaveStyle({ position: 'absolute' });
    });

    it('使用 relative 偏移且不让元素脱离文档流', () => {
        renderDrag({ positionStrategy: 'relative' }, () => <div style={{ left: '12px', top: '8px' }}>Drag me</div>);
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ position: 'relative', left: '42px', top: '48px' });
    });

    it('relative 偏移被限制在 constrainer 边界内', () => {
        renderDrag({ constrainer: 'parent', positionStrategy: 'relative' }, () => <div style={{ left: '10px', top: '5px' }}>Drag me</div>);
        const element = screen.getByText('Drag me');
        const constrainer = element.parentNode as HTMLElement;
        element.getBoundingClientRect = () => ({ left: 40, top: 30, right: 140, bottom: 80, width: 100, height: 50 }) as DOMRect;
        constrainer.getBoundingClientRect = () => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect;

        drag(element, [100, 100], [300, 300]);

        expect(element).toHaveStyle({ left: '70px', top: '25px' });
    });

    it('按指针位移移动元素，并显示 move 光标', () => {
        renderDrag({}, dragMe);
        const element = screen.getByText('Drag me');
        expect(element.style.cursor).toBe('move');

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('absolute 偏移被限制在父级 constrainer 内', () => {
        renderDrag({ constrainer: 'parent' }, dragMe, { 'data-testid': 'box' });
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
        renderDrag({ constrainer: () => box }, dragMe);
        const element = screen.getByText('Drag me');
        setSize(element, 100, 100);

        drag(element, [0, 0], [500, 500]);

        expect(element).toHaveStyle({ left: '200px', top: '100px' });
    });

    it('allowMove 返回 false 时不拖动，但仍发出 mouseDown', () => {
        const allowMove = vi.fn<NonNullable<DragMoveProps['allowMove']>>(() => false);
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        renderDrag({ allowMove, onMouseDown, onMouseMove }, dragMe);
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(allowMove).toHaveBeenCalledWith(expect.any(PointerEvent), element);
        expect(onMouseMove).not.toHaveBeenCalled();
        expect(element.style.left).toBe('');
    });

    it('只从 handler 元素开始拖动', () => {
        render(Handler);
        flushResizeReports();
        const handle = screen.getByText('Handle');
        const element = handle.parentNode as HTMLElement;
        expect(handle.style.cursor).toBe('move');
        expect(element.style.cursor).toBe('');

        drag(screen.getByText('Body'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        drag(handle, [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('除非设置 allowInputDrag，否则不从 input 或 textarea 开始拖动', async () => {
        const children = () => (
            <div data-testid="drag">
                <input aria-label="name" />
                <textarea aria-label="note" />
            </div>
        );
        const view = renderDrag({}, children);
        const element = screen.getByTestId('drag');

        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        drag(screen.getByLabelText('note'), [100, 100], [130, 140]);
        expect(element.style.left).toBe('');

        await view.setProps({ allowInputDrag: true });
        drag(screen.getByLabelText('name'), [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('把原生事件传给 mouse 系事件，pointerup 后停止', () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        renderDrag({ onMouseDown, onMouseMove, onMouseUp }, dragMe);
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

    it('笔按 mouse 系事件发出', () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        const onTouchStart = vi.fn<PointerHandler>();
        renderDrag({ onMouseDown, onMouseUp, onTouchStart }, dragMe);

        drag(screen.getByText('Drag me'), [100, 100], [130, 140], 'pen');

        expect(onMouseDown).toHaveBeenCalledTimes(1);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(onTouchStart).not.toHaveBeenCalled();
    });

    it('新位置交给 customMove，而不是写入样式', () => {
        const customMove = vi.fn<NonNullable<DragMoveProps['customMove']>>();
        renderDrag({ customMove }, dragMe);
        const element = screen.getByText('Drag me');

        drag(element, [100, 100], [130, 140]);

        expect(customMove).toHaveBeenCalledWith(element, 40, 30);
        expect(element.style.left).toBe('');
        expect(element.style.top).toBe('');
    });

    it('支持触摸拖动，只发出 touch 系事件，并在结束时停止', () => {
        const onTouchStart = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        const onTouchEnd = vi.fn<PointerHandler>();
        const onMouseDown = vi.fn<PointerHandler>();
        renderDrag({ onMouseDown, onTouchEnd, onTouchMove, onTouchStart }, dragMe);
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

    it('触摸取消时发出 touchCancel 并停止拖动', () => {
        const onTouchCancel = vi.fn<PointerHandler>();
        const onTouchMove = vi.fn<PointerHandler>();
        renderDrag({ onTouchCancel, onTouchMove }, dragMe);
        pointer(screen.getByText('Drag me'), 'pointerdown', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
        });

        pointer(document, 'pointercancel', { pointerId: 1, pointerType: 'touch' });
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });

        expect(onTouchCancel).toHaveBeenCalledTimes(1);
        expect(onTouchMove).not.toHaveBeenCalled();
    });

    it('拖动中忽略第二个指针', () => {
        renderDrag({}, dragMe);
        const element = screen.getByText('Drag me');
        pointer(element, 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
        pointer(element, 'pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 500, clientY: 500 });

        pointer(document, 'pointermove', { pointerId: 2, pointerType: 'touch', clientX: 900, clientY: 900 });
        expect(element.style.left).toBe('');
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 140 });
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('document 监听共用一个 AbortController signal，拖动结束时 abort', () => {
        const addListener = vi.spyOn(document, 'addEventListener');
        renderDrag({}, dragMe);
        const element = screen.getByText('Drag me');
        pointer(element, 'pointerdown', { pointerId: 1, pointerType: 'mouse', clientX: 100, clientY: 100 });

        const signalOf = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal;
        const dragCalls = addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls.map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel', 'selectstart', 'dragstart']);
        const signals = dragCalls.map(([, , options]) => signalOf(options));
        expect(new Set(signals).size).toBe(1);
        expect(signals[0]?.aborted).toBe(false);

        pointer(document, 'pointerup', { pointerId: 1, pointerType: 'mouse' });
        expect(signals[0]?.aborted).toBe(true);
    });

    it('替换子元素后拖动新元素', async () => {
        render(Swap);
        flushResizeReports();
        screen.getByText('swap').click();
        await nextTick();
        flushResizeReports();
        const element = screen.getByText('Second');
        expect(element).toHaveStyle({ position: 'absolute' });

        drag(element, [100, 100], [130, 140]);

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('父级重渲染后同一子元素仍可拖动，并发出新加监听的事件', async () => {
        const onMouseDown = vi.fn<PointerHandler>();
        const view = renderDrag({}, () => <div key="a">First</div>);
        const first = screen.getByText('First');
        await view.setProps({ onMouseDown });
        drag(first, [100, 100], [130, 140]);
        expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('可以拖动在 DragMove 之后挂载的子元素', async () => {
        const view = render(Swap, { props: { show: false } });
        flushResizeReports();
        await view.rerender({ show: true });
        flushResizeReports();
        const element = screen.getByText('First');

        drag(element, [100, 100], [130, 140], 'touch');

        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('positionStrategy 变化时更新定位样式', async () => {
        const view = renderDrag({}, dragMe);
        const element = screen.getByText('Drag me');

        await view.setProps({ positionStrategy: 'relative' });

        expect(element).toHaveStyle({ position: 'relative' });
    });

    it('保留子元素自带的模板 ref', () => {
        const onReady = vi.fn<(child: HTMLElement | null) => void>();
        render(ChildRef, { props: { onReady } });
        expect(onReady).toHaveBeenCalledWith(screen.getByText('Drag me'));
    });

    it('拖动中卸载时停止监听 document', () => {
        const onMouseMove = vi.fn<PointerHandler>();
        const onMouseUp = vi.fn<PointerHandler>();
        const view = renderDrag({ onMouseMove, onMouseUp }, dragMe);
        pointer(screen.getByText('Drag me'), 'pointerdown', {
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 100,
            clientY: 100,
        });

        view.unmount();
        pointer(document, 'pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 130, clientY: 140 });
        pointer(document, 'pointerup', { pointerId: 1, pointerType: 'mouse' });

        expect(onMouseMove).not.toHaveBeenCalled();
        expect(onMouseUp).not.toHaveBeenCalled();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { DragMove: { positionStrategy: 'relative' } };
        renderDrag({}, dragMe);
        expect(screen.getByText('Drag me')).toHaveStyle({ position: 'relative' });
    });

    it('全局默认的 allowInputDrag 生效，函数 constrainer 的全局值在每次拖动时读取', () => {
        semiGlobal.config.overrideDefaultProps = { DragMove: { allowInputDrag: true } };
        renderDrag({}, () => (
            <div data-testid="drag">
                <input aria-label="name" />
            </div>
        ));
        const element = screen.getByTestId('drag');
        setSize(element, 100, 100);
        drag(screen.getByLabelText('name'), [0, 0], [30, 40]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });

        const box = document.createElement('div');
        setSize(box, 120, 120);
        semiGlobal.config.overrideDefaultProps = { DragMove: { allowInputDrag: true, constrainer: () => box } };
        drag(element, [0, 0], [500, 500]);
        expect(element).toHaveStyle({ left: '20px', top: '20px' });
    });

    it('右键和中键按下不启动拖拽，触屏与笔不受影响', () => {
        renderDrag({}, dragMe);
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

    it('handler 内部元素被替换后，新的 handler 同样获得 move 光标和 touch-action', async () => {
        renderDrag({ handler: () => screen.getByTestId('handle') }, () => <SwapHandle />);
        expect(screen.getByTestId('handle')).toHaveStyle({ cursor: 'move', touchAction: 'none' });
        const oldHandle = screen.getByTestId('handle');

        screen.getByText('swap').click();

        await waitFor(() => expect(screen.getByTestId('handle')).not.toBe(oldHandle));
        await waitFor(() => expect(screen.getByTestId('handle').style.touchAction).toBe('none'));
        expect(screen.getByTestId('handle')).toHaveStyle({ cursor: 'move' });
    });

    it('handler 可以返回 null', () => {
        expectTypeOf<DragMoveProps['handler']>().toEqualTypeOf<(() => HTMLElement | null) | undefined>();
    });

    it('可以拖动单根子组件，不需要它透传属性', () => {
        renderDrag({ constrainer: 'parent' }, () => <Card />, { 'data-testid': 'box' });
        const element = screen.getByText('Card');
        setSize(screen.getByTestId('box'), 200, 100);
        setSize(element, 50, 20);

        drag(element, [100, 100], [400, 130]);

        expect(element).toHaveStyle({ position: 'absolute', left: '150px', top: '30px' });
    });

    it('文本子节点不可拖动，也不报错', () => {
        renderDrag({}, () => ['plain text', <div>Drag me</div>]);
        const element = screen.getByText('Drag me');
        drag(element, [100, 100], [130, 140]);
        expect(element).toHaveStyle({ left: '30px', top: '40px' });
    });

    it('未声明的属性与原生监听不落到任何元素，也不报 extraneous attrs 警告', () => {
        const warn = vi.spyOn(console, 'warn');
        const onMousedown = vi.fn<(e: MouseEvent) => void>();
        render(DragMove, {
            attrs: { class: 'custom', id: 'drag', onMousedown },
            slots: { default: dragMe },
        });
        flushResizeReports();
        const element = screen.getByText('Drag me');
        expect(element).not.toHaveClass('custom');
        expect(document.getElementById('drag')).toBeNull();
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(onMousedown).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
    });
});
