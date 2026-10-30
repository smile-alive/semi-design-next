import { type ComponentProps, createSignal } from 'solid-js';
import { fireEvent, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { mockResizeObserver } from '@test/utils/solid';
import { Resizable, ResizeGroup, ResizeHandler, ResizeItem } from '..';
import semiGlobal from '../../_utils/semi-global';

type ResizeCallback = NonNullable<ComponentProps<typeof Resizable>['onChange']>;
type ResizeStartCallback = NonNullable<ComponentProps<typeof Resizable>['onResizeStart']>;
type ResizableProps = ComponentProps<typeof Resizable>;
type ItemProps = ComponentProps<typeof ResizeItem>;
type Axis = 'width' | 'height';

// jsdom has no layout: size comes from inline width/height (px, % or calc of the parent); a group handler is 10px,
// a Resizable without a size is 300 x 200, anything else fills its parent; the document is 1000 x 800
const ROOT = { width: 1000, height: 800 };

function measure(el: HTMLElement, prop: Axis): number {
    const value = el.style?.[prop] ?? '';
    const parentSize = () => (el.parentElement ? measure(el.parentElement, prop) : ROOT[prop]);
    if (value.endsWith('px')) {
        return parseFloat(value);
    }
    if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * parentSize();
    }
    const calc = /^calc\(([\d.]+)% - ([\d.]+)px\)$/.exec(value);
    if (calc) {
        return (Number(calc[1]) / 100) * parentSize() - Number(calc[2]);
    }
    if (el.classList?.contains('semi-resizable-resizable')) {
        return prop === 'width' ? 300 : 200;
    }
    if (el.classList?.contains('semi-resizable-handler')) {
        return 10;
    }
    return parentSize();
}

function mockLayout() {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return measure(this, 'width');
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return measure(this, 'height');
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const width = measure(this, 'width');
        const height = measure(this, 'height');
        return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height } as DOMRect;
    });
}

const point = ([clientX, clientY]: number[]) => ({ clientX, clientY });
// a mouse right or middle button, a pen's barrel button and its eraser
const nonPrimaryPresses = [
    ['mouse', 1],
    ['mouse', 2],
    ['pen', 2],
    ['pen', 5],
] as const;
// jsdom has no pointer capture, so the moves and the release the browser would send to the pressed handle go to it
let pressed: Element;
function down(target: Element, from: number[], init?: PointerEventInit) {
    pressed = target;
    fireEvent.pointerDown(target, { ...point(from), ...init });
}
const move = (to: number[]) => fireEvent.pointerMove(pressed, point(to));
function up(to = [0, 0]) {
    fireEvent.pointerUp(pressed, point(to));
    fireEvent.lostPointerCapture(pressed, point(to));
}
function drag(target: Element, from: number[], to: number[]) {
    down(target, from);
    move(to);
    up(to);
}
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(el, { key: k, ...init });

const html = (el: Element | null) => el as HTMLElement;

beforeEach(() => {
    mockLayout();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Resizable', () => {
    const getRoot = (container: Element) => html(container.querySelector('.semi-resizable-resizable'));
    const getHandle = (container: Element, dir: string) => html(container.querySelector(`.semi-resizable-resizableHandler-${dir}`));
    const queryHandle = (container: Element, dir: string) => container.querySelector<HTMLElement>(`.semi-resizable-resizableHandler-${dir}`);
    const sizeOf = (container: Element) => {
        const { width, height } = getRoot(container).style;
        return { width, height };
    };
    const renderBox = (props: ResizableProps = {}) =>
        render(() => (
            <div style={{ width: '1000px', height: '800px' }}>
                <Resizable defaultSize={{ width: 200, height: 100 }} {...props} />
            </div>
        ));

    it('渲染带 class、style、data-* 与 children 的根元素，并为每个方向渲染一个手柄', () => {
        const { container } = render(() => (
            <Resizable class="custom" style={{ color: 'red' }} data-testid="box">
                <span class="child">content</span>
            </Resizable>
        ));
        const root = getRoot(container);
        expect(root).toHaveClass('custom');
        expect(root.style.color).toBe('red');
        expect(root.dataset.testid).toBe('box');
        expect(root.querySelector('.child')).toHaveTextContent('content');
        expect(sizeOf(container)).toEqual({ width: 'auto', height: 'auto' });
        expect([...container.querySelectorAll('.semi-resizable-resizableHandler')].map((el) => [...el.classList].find((c) => c.startsWith('semi-resizable-resizableHandler-')))).toEqual(
            ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'].map((dir) => `semi-resizable-resizableHandler-${dir}`)
        );
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
    });

    it('style 可以是字符串，并与内部样式合并', () => {
        const style: string = 'color: red; width: 10px';
        const { container } = render(() => <Resizable style={style} defaultSize={{ width: 200, height: 100 }} minWidth={50} />);
        const root = getRoot(container);
        expect(root.style.color).toBe('red');
        expect(root.style.minWidth).toBe('50px');
        expect(sizeOf(container)).toEqual({ width: '200px', height: '100px' });
    });

    it('根据 defaultSize 的数字与字符串计算尺寸，并应用 min/max 样式', () => {
        const [size, setSize] = createSignal<ResizableProps['size']>(undefined);
        const { container } = render(() => <Resizable size={size()} defaultSize={{ width: 200, height: '50%' }} maxHeight="90%" minWidth={50} />);
        expect(sizeOf(container)).toEqual({ width: '200px', height: '50%' });
        expect(getRoot(container).style.minWidth).toBe('50px');
        expect(getRoot(container).style.maxHeight).toBe('90%');
        setSize({ width: '30vw', height: 120 });
        expect(sizeOf(container)).toEqual({ width: '30vw', height: '120px' });
    });

    it.each([
        ['right', [150, 100], 250, 100],
        ['left', [50, 100], 250, 100],
        ['bottom', [100, 150], 200, 150],
        ['top', [100, 50], 200, 150],
        ['bottomRight', [150, 130], 250, 130],
        ['topLeft', [50, 70], 250, 130],
        ['topRight', [150, 70], 250, 130],
        ['bottomLeft', [50, 130], 250, 130],
    ])('拖动 %s 手柄', (dir, to, width, height) => {
        const onChange = vi.fn<ResizeCallback>();
        const { container } = renderBox({ onChange });
        down(getHandle(container, dir), [100, 100]);
        move(to);
        expect(sizeOf(container)).toEqual({ width: `${width}px`, height: `${height}px` });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual({ width, height });
        expect(onChange.mock.calls[0][2]).toBe(dir);
        up(to);
        expect(sizeOf(container)).toEqual({ width: `${width}px`, height: `${height}px` });
    });

    it('调用 onResizeStart、onChange 与 onResizeEnd，并传入尺寸、事件与方向', () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        const { container } = renderBox({ onResizeStart, onChange, onResizeEnd });
        down(getHandle(container, 'right'), [100, 100]);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStart.mock.calls[0][0]).toBeInstanceOf(PointerEvent);
        expect((onResizeStart.mock.calls[0][0] as PointerEvent).clientX).toBe(100);
        expect(onResizeStart.mock.calls[0][1]).toBe('right');
        move([150, 100]);
        move([150, 120]);
        move([160, 100]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0]).toEqual({ width: 260, height: 100 });
        expect(onChange.mock.calls[1][1]).toBeInstanceOf(PointerEvent);
        up([160, 100]);
        expect(onResizeEnd).toHaveBeenCalledTimes(1);
        expect(onResizeEnd.mock.calls[0][0]).toEqual({ width: 260, height: 100 });
        expect(onResizeEnd.mock.calls[0][1]).toBeInstanceOf(PointerEvent);
        expect(onResizeEnd.mock.calls[0][2]).toBe('right');
        move([200, 100]);
        up([200, 100]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onResizeEnd).toHaveBeenCalledTimes(1);
    });

    it('onResizeStart 返回 false 时不调整大小', () => {
        const onChange = vi.fn<ResizeCallback>();
        const { container } = renderBox({ onResizeStart: () => false, onChange });
        down(getHandle(container, 'right'), [100, 100]);
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
        move([150, 100]);
        expect(onChange).not.toHaveBeenCalled();
        expect(sizeOf(container).width).toBe('200px');
    });

    it('背景层不使用用户传入的 class', () => {
        const { container } = renderBox({ class: 'custom' });
        down(getHandle(container, 'right'), [100, 100]);
        expect(getRoot(container)).toHaveClass('custom');
        expect(container.querySelector('.semi-resizable-background')).not.toHaveClass('custom');
        up();
    });

    it('只在调整大小期间显示背景层并禁用文本选择', () => {
        const { container } = renderBox();
        expect(getRoot(container).style.userSelect).toBe('auto');
        down(getHandle(container, 'right'), [100, 100]);
        expect(container.querySelector('.semi-resizable-background')).not.toBeNull();
        expect(getRoot(container).style.userSelect).toBe('none');
        up();
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
        expect(getRoot(container).style.userSelect).toBe('auto');
    });

    it('限制在 maxWidth、minWidth、百分比 maxHeight 与默认 10px 最小值之内', () => {
        const { container } = render(() => (
            <div style={{ width: '400px', height: '300px' }}>
                <Resizable defaultSize={{ width: 200, height: 100 }} maxHeight="50%" maxWidth={220} minWidth={150} />
            </div>
        ));
        drag(getHandle(container, 'right'), [100, 100], [200, 100]);
        expect(sizeOf(container).width).toBe('220px');
        drag(getHandle(container, 'right'), [100, 100], [0, 100]);
        expect(sizeOf(container).width).toBe('150px');
        drag(getHandle(container, 'bottom'), [100, 100], [100, 300]);
        expect(sizeOf(container).height).toBe('150px');
        drag(getHandle(container, 'bottom'), [100, 100], [100, -500]);
        expect(sizeOf(container).height).toBe('10px');
    });

    it('lockAspectRatio 下保持初始宽高比，或保持指定的宽高比', () => {
        const [lock, setLock] = createSignal<boolean | number>(true);
        const { container } = render(() => (
            <div style={{ width: '1000px', height: '800px' }}>
                <Resizable defaultSize={{ width: 200, height: 100 }} lockAspectRatio={lock()} />
            </div>
        ));
        drag(getHandle(container, 'right'), [100, 100], [150, 100]);
        expect(sizeOf(container)).toEqual({ width: '250px', height: '125px' });
        drag(getHandle(container, 'bottom'), [100, 100], [100, 125]);
        expect(sizeOf(container)).toEqual({ width: '300px', height: '150px' });
        setLock(1);
        drag(getHandle(container, 'right'), [100, 100], [110, 100]);
        expect(sizeOf(container)).toEqual({ width: '310px', height: '310px' });
    });

    it('在 snapGap 范围内吸附到网格与吸附点', () => {
        const [extra, setExtra] = createSignal<ResizableProps>({ grid: [50, 50] });
        const { container } = renderBox({
            get grid() {
                return extra().grid;
            },
            get snapGap() {
                return extra().snapGap;
            },
            get snap() {
                return extra().snap;
            },
        });
        drag(getHandle(container, 'right'), [100, 100], [130, 100]);
        expect(sizeOf(container).width).toBe('250px');
        setExtra({ grid: [50, 50], snapGap: 10 });
        drag(getHandle(container, 'right'), [100, 100], [80, 100]);
        expect(sizeOf(container).width).toBe('230px');
        setExtra({ snap: { x: [100, 300] } });
        drag(getHandle(container, 'right'), [100, 100], [100, 100]);
        // 230 is nearer to 300 than to 100
        expect(sizeOf(container).width).toBe('300px');
    });

    it('指针位移按 ratio 与 scale 缩放', () => {
        const [scaling, setScaling] = createSignal<{ ratio?: number; scale?: number }>({ ratio: 2 });
        const { container } = renderBox({
            get ratio() {
                return scaling().ratio;
            },
            get scale() {
                return scaling().scale;
            },
        });
        drag(getHandle(container, 'right'), [100, 100], [150, 100]);
        expect(sizeOf(container).width).toBe('300px');
        setScaling({ scale: 2 });
        drag(getHandle(container, 'right'), [100, 100], [200, 100]);
        expect(sizeOf(container).width).toBe('350px');
    });

    it('百分比尺寸保持为百分比，未改动的 auto 边保持 auto', () => {
        const onChange = vi.fn<ResizeCallback>();
        const first = renderBox({ defaultSize: { width: '50%', height: 100 }, onChange });
        drag(getHandle(first.container, 'right'), [100, 100], [200, 100]);
        expect(sizeOf(first.container)).toEqual({ width: '60%', height: '100px' });
        expect(onChange.mock.calls[0][0]).toEqual({ width: '60%', height: 100 });
        first.unmount();
        const { container } = render(() => (
            <div>
                <Resizable onChange={onChange} />
            </div>
        ));
        drag(getHandle(container, 'right'), [100, 100], [150, 100]);
        expect(sizeOf(container)).toEqual({ width: '350px', height: 'auto' });
        expect(onChange.mock.calls[1][0]).toEqual({ width: 350, height: 'auto' });
    });

    it('父组件忽略变化时，受控尺寸在拖动中与拖动后都显示该尺寸', () => {
        const onChange = vi.fn<ResizeCallback>();
        const [size, setSize] = createSignal({ width: 200, height: 100 });
        const { container } = render(() => <Resizable size={size()} onChange={onChange} />);
        down(getHandle(container, 'right'), [100, 100]);
        move([150, 100]);
        expect(onChange.mock.calls[0][0]).toEqual({ width: 250, height: 100 });
        expect(sizeOf(container).width).toBe('200px');
        up();
        expect(sizeOf(container).width).toBe('200px');
        setSize({ width: 300, height: 100 });
        expect(sizeOf(container).width).toBe('300px');
    });

    it('只受控一个轴时，另一个轴使用 defaultSize，拖动中与拖动后保持拖动的结果', () => {
        const [width, setWidth] = createSignal(200);
        const { container } = render(() => <Resizable defaultSize={{ height: 100 }} size={{ width: width() }} onChange={(next) => setWidth(next.width as number)} />);
        expect(sizeOf(container)).toEqual({ width: '200px', height: '100px' });
        down(getHandle(container, 'bottom'), [100, 100]);
        move([100, 150]);
        expect(sizeOf(container).height).toBe('150px');
        up();
        expect(sizeOf(container)).toEqual({ width: '200px', height: '150px' });
    });

    it('拖动时受控尺寸立即跟随 onChange 写回的值，不落后于指针', () => {
        const [size, setSize] = createSignal<ResizableProps['size']>({ width: 200, height: 100 });
        const { container } = render(() => <Resizable size={size()} onChange={(next) => setSize(next)} />);
        down(getHandle(container, 'right'), [100, 100]);
        move([150, 100]);
        expect(sizeOf(container).width).toBe('250px');
        move([170, 100]);
        expect(sizeOf(container).width).toBe('270px');
        up();
        expect(sizeOf(container).width).toBe('270px');
    });

    it('只为启用的方向渲染手柄', () => {
        const [enable, setEnable] = createSignal<ResizableProps['enable']>({ right: false, top: false });
        const { container } = render(() => <Resizable enable={enable()} />);
        expect(container.querySelectorAll('.semi-resizable-resizableHandler')).toHaveLength(6);
        expect(queryHandle(container, 'right')).toBeNull();
        expect(queryHandle(container, 'top')).toBeNull();
        setEnable(false);
        expect(container.querySelectorAll('.semi-resizable-resizableHandler')).toHaveLength(0);
    });

    it('应用 renderHandle、handleClass、handleStyle 与手柄包裹层属性', () => {
        const { container } = render(() => <Resizable handleClass={{ right: 'right-class' }} handleWrapperClass="wrapper" handleStyle={{ right: { background: 'red' } }} handleWrapperStyle={{ 'z-index': 3 }} renderHandle={(direction) => (direction === 'right' ? <span class="node">R</span> : undefined)} />);
        const right = getHandle(container, 'right');
        expect(right).toHaveClass('right-class');
        expect(right.style.background).toBe('red');
        expect(right.querySelector('.node')).toHaveTextContent('R');
        expect(right.parentElement).toHaveClass('wrapper');
        expect(html(right.parentElement).style.zIndex).toBe('3');
        expect(getHandle(container, 'left').childNodes).toHaveLength(0);
    });

    it('boundElement="parent" 时尺寸限制在父元素之内', () => {
        const { container } = render(() => (
            <div style={{ width: '400px', height: '300px' }}>
                <Resizable boundElement="parent" defaultSize={{ width: 200, height: 100 }} />
            </div>
        ));
        drag(getHandle(container, 'right'), [100, 100], [600, 100]);
        expect(sizeOf(container).width).toBe('400px');
    });

    it('使用触摸指针调整大小', () => {
        const onChange = vi.fn<ResizeCallback>();
        const { container } = renderBox({ onChange });
        down(getHandle(container, 'right'), [100, 100], { pointerType: 'touch' });
        move([140, 100]);
        expect(sizeOf(container).width).toBe('240px');
        up([140, 100]);
        move([180, 100]);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按下时在手柄上捕获指针', () => {
        const { container } = renderBox();
        const handle = getHandle(container, 'right');
        const capture = vi.spyOn(handle, 'setPointerCapture');
        down(handle, [100, 100], { pointerId: 7 });
        expect(capture).toHaveBeenCalledWith(7);
        up();
    });

    it('非主键（鼠标右键与中键、笔的侧键与橡皮擦）按下不开始调整也不捕获指针，触摸不受影响', () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        const { container } = renderBox({ onResizeStart });
        const handle = getHandle(container, 'right');
        const capture = vi.spyOn(handle, 'setPointerCapture');
        for (const [pointerType, button] of nonPrimaryPresses) {
            down(handle, [100, 100], { button, pointerType });
            expect(container.querySelector('.semi-resizable-background')).toBeNull();
            move([140, 100]);
            up([140, 100]);
        }
        expect(onResizeStart).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
        expect(sizeOf(container).width).toBe('200px');
        down(handle, [100, 100], { button: 0, pointerType: 'mouse' });
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        up();
    });

    it('拖动因卸载中断时不再上报', () => {
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        const { container, unmount } = renderBox({ onChange, onResizeEnd });
        down(getHandle(container, 'right'), [100, 100]);
        unmount();
        move([150, 100]);
        up();
        expect(onChange).not.toHaveBeenCalled();
        expect(onResizeEnd).not.toHaveBeenCalled();
    });

    describe('键盘', () => {
        it('右侧与底部手柄成为分隔符，每个尺寸一个，其余手柄仍由指针操作', () => {
            const { container } = renderBox({ maxWidth: 400 });
            const right = getHandle(container, 'right');
            const bottom = getHandle(container, 'bottom');
            expect(right).toHaveAttribute('role', 'separator');
            expect(right).toHaveAttribute('tabindex', '0');
            expect(right).toHaveAttribute('aria-orientation', 'vertical');
            expect(right).toHaveAttribute('aria-label', '调整宽度');
            expect(right).toHaveAttribute('aria-valuenow', '200');
            expect(right).toHaveAttribute('aria-valuemin', '10');
            expect(right).toHaveAttribute('aria-valuemax', '400');
            expect(bottom).toHaveAttribute('aria-orientation', 'horizontal');
            expect(bottom).toHaveAttribute('aria-label', '调整高度');
            expect(bottom).toHaveAttribute('aria-valuenow', '100');
            for (const dir of ['top', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft']) {
                expect(getHandle(container, dir)).not.toHaveAttribute('tabindex');
                expect(getHandle(container, dir)).not.toHaveAttribute('role');
            }
        });

        it('方向键沿手柄轴向调整大小，与拖动一样触发同一组回调', () => {
            const calls: unknown[][] = [];
            const { container } = renderBox({
                onResizeStart: (e, dir) => {
                    calls.push(['start', dir, e.type]);
                },
                onChange: (size, e, dir) => calls.push(['change', dir, e.type, size.width, size.height]),
                onResizeEnd: (size, e, dir) => calls.push(['end', dir, e.type, size.width, size.height]),
            });
            const right = getHandle(container, 'right');
            key(right, 'ArrowUp');
            expect(calls).toEqual([]);
            key(right, 'ArrowRight');
            expect(calls).toEqual([
                ['start', 'right', 'keydown'],
                ['change', 'right', 'keydown', 210, 100],
                ['end', 'right', 'keydown', 210, 100],
            ]);
            expect(sizeOf(container)).toEqual({ width: '210px', height: '100px' });
            expect(container.querySelector('.semi-resizable-background')).toBeNull();
            key(right, 'ArrowLeft');
            expect(sizeOf(container).width).toBe('200px');
            key(getHandle(container, 'bottom'), 'ArrowDown');
            expect(sizeOf(container)).toEqual({ width: '200px', height: '110px' });
        });

        it('只启用左边与上边时，它们各成为所在轴的分隔符，并按边的方向调整大小', () => {
            const { container } = renderBox({ enable: { right: false, bottom: false } });
            const left = getHandle(container, 'left');
            const top = getHandle(container, 'top');
            expect(queryHandle(container, 'right')).toBeNull();
            expect(left).toHaveAttribute('role', 'separator');
            expect(left).toHaveAttribute('aria-orientation', 'vertical');
            expect(left).toHaveAttribute('aria-label', '调整宽度');
            expect(left).toHaveAttribute('aria-valuenow', '200');
            expect(top).toHaveAttribute('role', 'separator');
            expect(top).toHaveAttribute('aria-orientation', 'horizontal');
            expect(top).toHaveAttribute('aria-label', '调整高度');
            expect(getHandle(container, 'topLeft')).not.toHaveAttribute('role');
            key(left, 'ArrowLeft');
            expect(sizeOf(container).width).toBe('210px');
            key(top, 'ArrowDown');
            expect(sizeOf(container).height).toBe('90px');
        });

        it('Alt、Ctrl、Meta 加方向键不调整大小，也不阻止浏览器的默认行为', () => {
            const { container } = renderBox();
            const right = getHandle(container, 'right');
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(fireEvent.keyDown(right, { key: 'ArrowRight', [modifier]: true })).toBe(true);
            }
            expect(sizeOf(container).width).toBe('200px');
            key(right, 'ArrowRight', { shiftKey: true });
            expect(sizeOf(container).width).toBe('210px');
        });

        it('方向键步长不受 ratio 与 scale 影响', () => {
            const { container } = renderBox({ ratio: 2 });
            key(getHandle(container, 'right'), 'ArrowRight');
            expect(sizeOf(container).width).toBe('210px');
            const scaled = renderBox({ scale: 0.5 });
            key(getHandle(scaled.container, 'bottom'), 'ArrowDown');
            expect(sizeOf(scaled.container).height).toBe('110px');
            const pair = renderBox({ ratio: [4, 2] });
            key(getHandle(pair.container, 'right'), 'ArrowRight');
            key(getHandle(pair.container, 'bottom'), 'ArrowDown');
            expect(sizeOf(pair.container)).toEqual({ width: '210px', height: '110px' });
        });

        it('边界元素完全位于 Resizable 之外时，非正的边界余量不覆盖 maxWidth', () => {
            // 50px wide, 500px to the left of the Resizable: the boundary leaves 50 + (-500) px
            const boundary = document.createElement('div');
            boundary.style.width = '50px';
            boundary.style.height = '50px';
            // an own property: spying would replace the prototype mock that the Resizable itself is measured with
            boundary.getBoundingClientRect = () => ({ left: -500, top: 0 }) as DOMRect;
            const { container } = renderBox({ boundElement: boundary, maxWidth: 300 });
            const right = getHandle(container, 'right');
            expect(right).toHaveAttribute('aria-valuemax', '300');
            drag(right, [100, 100], [900, 100]);
            expect(sizeOf(container).width).toBe('300px');
        });

        it('保持在 max 与 min 尺寸之内，并遵守 onResizeStart 返回 false', () => {
            const { container } = renderBox({ maxWidth: 205 });
            key(getHandle(container, 'right'), 'ArrowRight');
            expect(sizeOf(container).width).toBe('205px');
            const refused = renderBox({ onResizeStart: () => false });
            key(getHandle(refused.container, 'right'), 'ArrowRight');
            expect(sizeOf(refused.container).width).toBe('200px');
        });
    });

    it('ref 指向根元素', () => {
        const refs: HTMLDivElement[] = [];
        const { container } = render(() => <Resizable ref={(el) => refs.push(el)} />);
        expect(refs).toEqual([getRoot(container)]);
    });

    it('把未声明的属性透传到根元素', () => {
        const { container } = render(() => <Resizable id="box" aria-label="box" />);
        expect(getRoot(container).id).toBe('box');
        expect(getRoot(container).getAttribute('aria-label')).toBe('box');
    });

    it('读取 semiGlobal.config.overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Resizable: { grid: [50, 50] } };
        const { container } = renderBox();
        drag(getHandle(container, 'right'), [100, 100], [130, 100]);
        expect(sizeOf(container).width).toBe('250px');
    });

    it('在同一次渲染中应用 flex basis，且不改动 style 对象', () => {
        const style = { 'flex-basis': '200px' };
        const { container } = render(() => (
            <div style={{ display: 'flex', width: '1000px', height: '800px' }}>
                <Resizable style={style} defaultSize={{ width: 200, height: 100 }} />
            </div>
        ));
        down(getHandle(container, 'right'), [100, 100]);
        move([150, 100]);
        expect(getRoot(container).style.flexBasis).toBe('250px');
        up();
        expect(style).toEqual({ 'flex-basis': '200px' });
    });

    it('带 aria-label 或 aria-labelledby 时 role 为 group，使用方的 role 优先', () => {
        const [props, setProps] = createSignal<ResizableProps>({ 'aria-label': 'box' });
        const { container } = render(() => <Resizable {...props()} />);
        expect(getRoot(container)).toHaveAttribute('role', 'group');
        setProps({ 'aria-labelledby': 'x' });
        expect(getRoot(container)).toHaveAttribute('role', 'group');
        setProps({ 'aria-label': 'box', role: 'note' });
        expect(getRoot(container)).toHaveAttribute('role', 'note');
        setProps({});
        expect(getRoot(container)).not.toHaveAttribute('role');
    });
});

describe('ResizeGroup', () => {
    const getGroup = (container: Element) => html(container.querySelector('.semi-resizable-group'));
    const getItems = (container: Element) => [...container.querySelectorAll<HTMLElement>('.semi-resizable-item')];
    const getHandlers = (container: Element) => [...container.querySelectorAll<HTMLElement>('.semi-resizable-handler')];
    const widths = (container: Element) => getItems(container).map((el) => el.style.width);
    const heights = (container: Element) => getItems(container).map((el) => el.style.height);

    const renderGroup = ({ direction, items = [{}, {}], groupProps = {} }: { direction?: 'horizontal' | 'vertical'; items?: ItemProps[]; groupProps?: ComponentProps<typeof ResizeGroup> } = {}) => {
        const vertical = direction === 'vertical';
        return render(() => (
            <div style={{ width: vertical ? '500px' : '1010px', height: vertical ? '510px' : '500px' }}>
                <ResizeGroup direction={direction} {...groupProps}>
                    {items.flatMap((itemProps, i) => [i > 0 && <ResizeHandler />, <ResizeItem {...itemProps}>{`item ${i}`}</ResizeItem>])}
                </ResizeGroup>
            </div>
        ));
    };

    const threePanes = () => (
        <>
            <ResizeItem />
            <ResizeHandler />
            <ResizeItem />
        </>
    );

    it('水平 group 布局：各项等分，并减去相邻手柄宽度的一半', () => {
        const { container } = renderGroup({ groupProps: { class: 'custom', 'data-testid': 'group' } as ComponentProps<typeof ResizeGroup> });
        const group = getGroup(container);
        expect(group).toHaveClass('custom');
        expect(group.dataset.testid).toBe('group');
        expect(group.style.flexDirection).toBe('row');
        expect(widths(container)).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(getHandlers(container)[0]).toHaveClass('semi-resizable-handler-horizontal');
        expect(getHandlers(container)[0].querySelector('svg')).not.toBeNull();
        expect(getItems(container)[1]).toHaveTextContent('item 1');
    });

    it('group 的 style 可以是字符串，flex-direction 仍由 direction 决定', () => {
        const { container } = renderGroup({ direction: 'vertical', groupProps: { style: 'color: red; flex-direction: row' } });
        expect(getGroup(container).style.color).toBe('red');
        expect(getGroup(container).style.flexDirection).toBe('column');
    });

    it('group 背景层不使用用户传入的 class', () => {
        const { container } = renderGroup({ groupProps: { class: 'custom' } });
        down(getHandlers(container)[0], [500, 0]);
        expect(container.querySelector('.semi-resizable-background')).not.toBeNull();
        expect(container.querySelector('.semi-resizable-background')).not.toHaveClass('custom');
        up([500, 0]);
    });

    it('竖向 group 按高度布局', () => {
        const { container } = renderGroup({ direction: 'vertical' });
        expect(getGroup(container).style.flexDirection).toBe('column');
        expect(heights(container)).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(widths(container)).toEqual(['', '']);
        expect(getHandlers(container)[0]).toHaveClass('semi-resizable-handler-vertical');
        expect(html(getHandlers(container)[0].querySelector('.semi-icon')).style.rotate).toBe('90deg');
    });

    it('默认水平方向', () => {
        const { container } = render(() => <ResizeGroup>{threePanes()}</ResizeGroup>);
        expect(getGroup(container).style.flexDirection).toBe('row');
    });

    it('整体替换 props 时保留分组节点与手柄焦点', () => {
        const [props, setProps] = createSignal<ComponentProps<typeof ResizeGroup>>({ class: 'a' });
        const { container } = render(() => <ResizeGroup {...props()}>{threePanes()}</ResizeGroup>);
        const group = getGroup(container);
        const handler = getHandlers(container)[0];
        handler.focus();
        setProps({ class: 'b' });
        expect(getGroup(container)).toBe(group);
        expect(handler).toHaveFocus();
    });

    it('根据百分比、px 与比例形式的 defaultSize 计算各项尺寸', () => {
        const { container, unmount } = renderGroup({ items: [{ defaultSize: '30%' }, {}, {}] });
        expect(widths(container)).toEqual(['calc(30% - 5px)', 'calc(35% - 10px)', 'calc(35% - 5px)']);
        unmount();
        const second = renderGroup({ items: [{ defaultSize: '202px' }, { defaultSize: 1 }, { defaultSize: '3' }] });
        expect(widths(second.container)).toEqual(['calc(20% - 5px)', 'calc(20% - 10px)', 'calc(60% - 5px)']);
    });

    it('在被拖动手柄两侧的两个项之间转移空间', () => {
        const calls: { start: unknown[][]; change: unknown[][]; end: unknown[][] } = { start: [], change: [], end: [] };
        const record = (i: number): ItemProps => ({
            onResizeStart: (e, dir) => {
                calls.start.push([i, dir, (e as PointerEvent).clientX]);
            },
            onChange: (size, _e, dir) => calls.change.push([i, dir, Math.round(size.width as number), size.height]),
            onResizeEnd: (size, _e, dir) => calls.end.push([i, dir, Math.round(size.width as number)]),
        });
        const { container } = renderGroup({ items: [record(0), record(1)] });
        down(getHandlers(container)[0], [500, 0]);
        expect(calls.start).toEqual([
            [0, 'right', 500],
            [1, 'left', 500],
        ]);
        expect(container.querySelector('.semi-resizable-background')).not.toBeNull();
        move([600, 0]);
        expect(calls.change).toEqual([
            [0, 'right', 600, 500],
            [1, 'left', 400, 500],
        ]);
        const [first, second] = getItems(container).map((el) => el.offsetWidth);
        expect(first).toBeCloseTo(600);
        expect(second).toBeCloseTo(400);
        up([600, 0]);
        expect(calls.end).toEqual([
            [0, 'right', 600],
            [1, 'left', 400],
        ]);
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
        move([700, 0]);
        expect(calls.change).toHaveLength(2);
    });

    it('竖向 group 按 clientY 拖动', () => {
        const onChange = vi.fn<ResizeCallback>();
        const { container } = renderGroup({ direction: 'vertical', items: [{ onChange }, {}] });
        drag(getHandlers(container)[0], [0, 250], [0, 300]);
        expect(onChange.mock.calls[0][2]).toBe('bottom');
        expect(onChange.mock.calls[0][0].height).toBeCloseTo(300);
    });

    it('拖动第二项与第三项之间的手柄', () => {
        const { container } = renderGroup({ items: [{}, {}, {}] });
        const before = getItems(container)[0].style.width;
        drag(getHandlers(container)[1], [600, 0], [700, 0]);
        expect(getItems(container)[0].style.width).toBe(before);
        expect(getItems(container)[1].offsetWidth).toBeCloseTo(1010 / 3 - 10 + 100);
    });

    it('各项保持在 min 与 max 之内', () => {
        const { container } = renderGroup({ items: [{ max: '600px', min: '400px' }, {}] });
        drag(getHandlers(container)[0], [500, 0], [800, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(600);
        drag(getHandlers(container)[0], [500, 0], [100, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(400);
    });

    it('任一侧的 onResizeStart 返回 false 时，拖动与方向键都不调整大小', () => {
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        const { container } = renderGroup({ items: [{ onChange, onResizeEnd }, { onResizeStart: () => false }] });
        const before = widths(container);
        const handler = getHandlers(container)[0];
        down(handler, [500, 0]);
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
        move([600, 0]);
        up([600, 0]);
        fireEvent.keyDown(handler, { key: 'ArrowRight' });
        expect(widths(container)).toEqual(before);
        expect(onChange).not.toHaveBeenCalled();
        expect(onResizeEnd).not.toHaveBeenCalled();
    });

    it('min 与 max 比较的是项的 border-box 尺寸（含内边距）：带内边距的项拖动与窗口缩放停在同一最小值', () => {
        vi.useFakeTimers();
        const [width, setWidth] = createSignal(1010);
        const { container } = render(() => (
            <div style={{ width: `${width()}px`, height: '500px' }}>
                <ResizeGroup direction="horizontal">
                    <ResizeItem style={{ 'padding-left': '16px', 'padding-right': '16px' }} min="200px">
                        item 0
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem>item 1</ResizeItem>
                </ResizeGroup>
            </div>
        ));
        drag(getHandlers(container)[0], [500, 0], [0, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(200);
        setWidth(410);
        fireEvent(window, new Event('resize'));
        vi.advanceTimersByTime(200);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(200);
    });

    it('min 与 max 为百分比时换算成 px 后与拖动、窗口缩放共用同一个范围', () => {
        const { container } = renderGroup({ items: [{ min: '20%', max: '60%' }, {}] });
        drag(getHandlers(container)[0], [500, 0], [1000, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(606);
        drag(getHandlers(container)[0], [500, 0], [0, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(202);
    });

    it('defaultSize 与 min 支持 vw、vh，按窗口尺寸换算成 px', () => {
        const { container } = renderGroup({ items: [{ defaultSize: '50vw', min: '40vw' }, {}] });
        // jsdom serializes the percentage with 4 decimals, so compare the measured px
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(window.innerWidth * 0.5 - 5, 0);
        expect(getItems(container)[1].offsetWidth).toBeCloseTo(1010 - window.innerWidth * 0.5 - 5, 0);
        drag(getHandlers(container)[0], [500, 0], [0, 0]);
        expect(getItems(container)[0].offsetWidth).toBeCloseTo(window.innerWidth * 0.4);
    });

    describe('容器缩小', () => {
        const shrinkable = () => {
            const [width, setWidth] = createSignal(1010);
            const result = render(() => (
                <div style={{ width: `${width()}px`, height: '500px' }}>
                    <ResizeGroup direction="horizontal">
                        <ResizeItem>item 0</ResizeItem>
                        <ResizeHandler />
                        <ResizeItem min="400px">item 1</ResizeItem>
                    </ResizeGroup>
                </div>
            ));
            return { ...result, setWidth };
        };

        it('窗口缩小后，最后一项低于 min 时由前面的项让出空间', () => {
            vi.useFakeTimers();
            const { container, setWidth } = shrinkable();
            setWidth(610);
            fireEvent(window, new Event('resize'));
            vi.advanceTimersByTime(200);
            expect(getItems(container)[1].offsetWidth).toBeCloseTo(400);
            expect(getItems(container)[0].offsetWidth).toBeCloseTo(200);
        });

        it('容器尺寸变化时（不是窗口缩放），px 的 min 同样生效', () => {
            vi.useFakeTimers();
            const resize = mockResizeObserver();
            const { container, setWidth } = shrinkable();
            setWidth(610);
            resize.fire(getGroup(container), []);
            vi.advanceTimersByTime(200);
            expect(getItems(container)[1].offsetWidth).toBeCloseTo(400);
            expect(getItems(container)[0].offsetWidth).toBeCloseTo(200);
        });

        it('分组被隐藏（尺寸为 0）时不校正尺寸，重新显示后 aria-valuenow 保持有限且手柄仍可拖动', () => {
            vi.useFakeTimers();
            const resize = mockResizeObserver();
            const { container } = shrinkable();
            const handler = getHandlers(container)[0];
            const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
            width.mockReturnValue(0);
            resize.fire(getGroup(container), []);
            vi.advanceTimersByTime(200);
            width.mockImplementation(function (this: HTMLElement) {
                return measure(this, 'width');
            });
            resize.fire(getGroup(container), []);
            vi.advanceTimersByTime(200);
            expect(handler.getAttribute('aria-valuenow')).toBe('50');
            down(handler, [500, 0]);
            move([600, 0]);
            up([600, 0]);
            expect(getItems(container)[0].offsetWidth).toBeCloseTo(600);
            expect(getItems(container)[1].offsetWidth).toBeCloseTo(400);
        });
    });

    it('非主键（鼠标右键与中键、笔的侧键与橡皮擦）按下手柄不开始调整也不捕获指针', () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        const { container } = renderGroup({ items: [{ onResizeStart }, {}] });
        const handler = getHandlers(container)[0];
        const capture = vi.spyOn(handler, 'setPointerCapture');
        for (const [pointerType, button] of nonPrimaryPresses) {
            down(handler, [500, 0], { button, pointerType });
            move([600, 0]);
            up([600, 0]);
        }
        expect(onResizeStart).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
        expect(container.querySelector('.semi-resizable-background')).toBeNull();
        expect(widths(container)).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        down(handler, [500, 0], { button: 0, pointerType: 'mouse' });
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        up();
    });

    it('手柄上传入的指针回调先被调用，拖动照常进行', () => {
        const onPointerDown = vi.fn<(e: PointerEvent) => void>();
        const onPointerMove = vi.fn<(e: PointerEvent) => void>();
        const onLostPointerCapture = vi.fn<(e: PointerEvent) => void>();
        const onChange = vi.fn<ResizeCallback>();
        const { container } = render(() => (
            <ResizeGroup>
                <ResizeItem onChange={onChange} />
                <ResizeHandler onLostPointerCapture={onLostPointerCapture} onPointerDown={onPointerDown} onPointerMove={onPointerMove} />
                <ResizeItem />
            </ResizeGroup>
        ));
        drag(getHandlers(container)[0], [500, 0], [600, 0]);
        expect(onPointerDown).toHaveBeenCalledTimes(1);
        expect(onPointerMove).toHaveBeenCalledTimes(1);
        expect(onLostPointerCapture).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('direction 变化时，各项尺寸从宽度切换为高度', () => {
        const [direction, setDirection] = createSignal<'horizontal' | 'vertical'>('horizontal');
        const { container } = render(() => <ResizeGroup direction={direction()}>{threePanes()}</ResizeGroup>);
        setDirection('vertical');
        expect(getGroup(container).style.flexDirection).toBe('column');
        expect(heights(container)).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(widths(container)).toEqual(['', '']);
        expect(getHandlers(container)[0]).toHaveClass('semi-resizable-handler-vertical');
    });

    it('direction 变化时，按手柄在新轴上的尺寸重新扣除手柄占用的空间，之后的拖动沿用该扣除值', () => {
        const [direction, setDirection] = createSignal<'horizontal' | 'vertical'>('horizontal');
        const { container } = render(() => (
            <div style={{ width: '1010px', height: '510px' }}>
                <ResizeGroup direction={direction()}>
                    <ResizeItem />
                    <ResizeHandler style={{ width: '8px', height: '20px' }} />
                    <ResizeItem />
                </ResizeGroup>
            </div>
        ));
        expect(widths(container)).toEqual(['calc(50% - 4px)', 'calc(50% - 4px)']);
        setDirection('vertical');
        expect(heights(container)).toEqual(['calc(50% - 10px)', 'calc(50% - 10px)']);
        expect(widths(container)).toEqual(['', '']);

        drag(getHandlers(container)[0], [0, 255], [0, 355]);
        expect(heights(container).every((height) => height.endsWith(' - 10px)'))).toBe(true);
    });

    it('渲染自定义手柄的 children、class 与 style', () => {
        const { container } = render(() => (
            <ResizeGroup>
                <ResizeItem class="item" style={{ color: 'red' }} />
                <ResizeHandler class="handler" style={{ color: 'blue' }}>
                    <span class="grip" />
                </ResizeHandler>
                <ResizeItem />
            </ResizeGroup>
        ));
        const [item] = getItems(container);
        const [handler] = getHandlers(container);
        expect(item).toHaveClass('item');
        expect(item.style.color).toBe('red');
        expect(handler).toHaveClass('handler');
        expect(handler.style.color).toBe('blue');
        expect(handler.querySelector('.grip')).not.toBeNull();
        expect(handler.querySelector('svg')).toBeNull();
    });

    it('拖动因卸载中断时不再上报', () => {
        const onChange = vi.fn<ResizeCallback>();
        const { container, unmount } = renderGroup({ items: [{ onChange }, {}] });
        down(getHandlers(container)[0], [500, 0]);
        unmount();
        move([600, 0]);
        up();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('卸载时丢弃尚未执行的约束检查', () => {
        vi.useFakeTimers();
        const { unmount } = renderGroup();
        fireEvent(window, new Event('resize'));
        unmount();
        expect(() => vi.advanceTimersByTime(200)).not.toThrow();
    });

    it('移除的 items 与手柄会被注销', () => {
        vi.useFakeTimers();
        const onChange = vi.fn<ResizeCallback>();
        const [count, setCount] = createSignal(3);
        const { container } = render(() => (
            <div style={{ width: '1010px', height: '500px' }}>
                <ResizeGroup>
                    <ResizeItem onChange={onChange} />
                    <ResizeHandler />
                    <ResizeItem />
                    {count() > 2 && (
                        <>
                            <ResizeHandler />
                            <ResizeItem />
                        </>
                    )}
                </ResizeGroup>
            </div>
        ));
        setCount(2);
        fireEvent(window, new Event('resize'));
        expect(() => vi.advanceTimersByTime(200)).not.toThrow();
        drag(getHandlers(container)[0], [300, 0], [350, 0]);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('group 与 item 带 aria-label 或 aria-labelledby 时 role 为 group，使用方的 role 优先', () => {
        const { container } = renderGroup({
            groupProps: { 'aria-label': 'panes' },
            items: [{ 'aria-labelledby': 'x' }, { 'aria-label': 'b', role: 'region' }, {}],
        });
        expect(getGroup(container)).toHaveAttribute('role', 'group');
        const [first, second, third] = getItems(container);
        expect(first).toHaveAttribute('role', 'group');
        expect(second).toHaveAttribute('role', 'region');
        expect(third).not.toHaveAttribute('role');
    });

    it('ResizeItem 与 ResizeHandler 在 ResizeGroup 之外使用时抛出带组件名的错误', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(() => <ResizeItem />)).toThrow('ResizeItem must be used inside ResizeGroup');
        expect(() => render(() => <ResizeHandler />)).toThrow('ResizeHandler must be used inside ResizeGroup');
    });

    it('ResizeHandler 只有原生属性：方向与拖动回调由 ResizeGroup 决定', () => {
        expectTypeOf<ComponentProps<typeof ResizeHandler>>().not.toHaveProperty('direction');
        expectTypeOf<ComponentProps<typeof ResizeHandler>>().not.toHaveProperty('onResizeStart');
        expectTypeOf<ComponentProps<typeof ResizeHandler>>().not.toHaveProperty('disabled');
    });

    it('调用最新的 item 回调', () => {
        const first = vi.fn<ResizeCallback>();
        const latest = vi.fn<ResizeCallback>();
        const [onChange, setOnChange] = createSignal(first);
        const { container } = render(() => (
            <ResizeGroup>
                <ResizeItem onChange={onChange()} />
                <ResizeHandler />
                <ResizeItem />
            </ResizeGroup>
        ));
        setOnChange(() => latest);
        drag(getHandlers(container)[0], [0, 0], [50, 0]);
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('把未声明的属性透传到 item 与手柄根元素，ref 指向它们', () => {
        const groupRefs: HTMLDivElement[] = [];
        const itemRefs: HTMLDivElement[] = [];
        const handlerRefs: HTMLDivElement[] = [];
        const { container } = render(() => (
            <ResizeGroup ref={(el) => groupRefs.push(el)}>
                <ResizeItem ref={(el) => itemRefs.push(el)} id="item" data-testid="item" />
                <ResizeHandler ref={(el) => handlerRefs.push(el)} data-testid="handler" aria-label="resize" />
                <ResizeItem />
            </ResizeGroup>
        ));
        const [item] = getItems(container);
        const [handler] = getHandlers(container);
        expect(item.dataset.testid).toBe('item');
        expect(item.id).toBe('item');
        expect(handler.dataset.testid).toBe('handler');
        expect(handler.getAttribute('aria-label')).toBe('resize');
        expect(groupRefs).toEqual([getGroup(container)]);
        expect(itemRefs).toEqual([item]);
        expect(handlerRefs).toEqual([handler]);
    });

    describe('键盘', () => {
        const now = (handler: Element) => Number(handler.getAttribute('aria-valuenow'));

        it('是可聚焦的分隔符，带有 orientation、值范围、受控 item 与 name', () => {
            const { container } = renderGroup({ items: [{ min: '20%', max: '70%' }, {}] });
            const handler = getHandlers(container)[0];
            expect(handler).toHaveAttribute('role', 'separator');
            expect(handler).toHaveAttribute('tabindex', '0');
            expect(handler).toHaveAttribute('aria-orientation', 'vertical');
            expect(handler).toHaveAttribute('aria-label', '调整面板大小');
            expect(handler).toHaveAttribute('aria-controls', getItems(container)[0].id);
            expect(getItems(container)[0].id).not.toBe('');
            expect(now(handler)).toBe(50);
            expect(now(handler) >= Number(handler.getAttribute('aria-valuemin'))).toBe(true);
            // the item's own width is 20% to 70% of the group; the value counts the half handler the item gives up
            expect(handler.getAttribute('aria-valuemin')).toBe('20.5');
            expect(handler.getAttribute('aria-valuemax')).toBe('70.5');
        });

        it('竖向 group 的分隔符为水平方向', () => {
            const { container } = renderGroup({ direction: 'vertical' });
            expect(getHandlers(container)[0]).toHaveAttribute('aria-orientation', 'horizontal');
        });

        it('保留用户设置的 name', () => {
            const { container } = render(() => (
                <ResizeGroup>
                    <ResizeItem />
                    <ResizeHandler aria-label="sidebar" />
                    <ResizeItem />
                </ResizeGroup>
            ));
            expect(getHandlers(container)[0]).toHaveAttribute('aria-label', 'sidebar');
        });

        it('一次方向键按下是一次完整调整：每项各触发一次 start、change 与 end，方向与拖动一致', () => {
            const calls: unknown[][] = [];
            const record = (i: number): ItemProps => ({
                onResizeStart: (e, dir) => {
                    calls.push(['start', i, dir, e.type]);
                },
                onChange: (_size, e, dir) => calls.push(['change', i, dir, e.type]),
                onResizeEnd: (_size, e, dir) => calls.push(['end', i, dir, e.type]),
            });
            const { container } = renderGroup({ items: [record(0), record(1)] });
            const handler = getHandlers(container)[0];
            key(handler, 'ArrowRight');
            expect(calls).toEqual([
                ['start', 0, 'right', 'keydown'],
                ['start', 1, 'left', 'keydown'],
                ['change', 0, 'right', 'keydown'],
                ['change', 1, 'left', 'keydown'],
                ['end', 0, 'right', 'keydown'],
                ['end', 1, 'left', 'keydown'],
            ]);
            const [first, second] = getItems(container).map((el) => el.offsetWidth);
            expect(first).toBeCloseTo(510.1);
            expect(second).toBeCloseTo(489.9);
            expect(now(handler)).toBe(51);
            expect(container.querySelector('.semi-resizable-background')).toBeNull();
            key(handler, 'ArrowLeft');
            expect(now(handler)).toBe(50);
        });

        it('Shift 移动距离为 10 倍，Home 与 End 移到边界', () => {
            const { container } = renderGroup({ items: [{ min: '20%', max: '70%' }, {}] });
            const handler = getHandlers(container)[0];
            key(handler, 'ArrowRight', { shiftKey: true });
            expect(now(handler)).toBe(60);
            key(handler, 'End');
            expect(now(handler)).toBe(70.5);
            key(handler, 'ArrowRight');
            expect(now(handler)).toBe(70.5);
            key(handler, 'Home');
            expect(now(handler)).toBe(20.5);
        });

        it('竖向 group 只响应 Up 与 Down', () => {
            const { container } = renderGroup({ direction: 'vertical' });
            const handler = getHandlers(container)[0];
            key(handler, 'ArrowRight');
            expect(now(handler)).toBe(50);
            key(handler, 'ArrowDown');
            expect(now(handler)).toBe(51);
            key(handler, 'ArrowUp');
            expect(now(handler)).toBe(50);
        });

        it('只移动相邻两项之间的手柄', () => {
            const { container } = renderGroup({ items: [{}, {}, {}] });
            const handlers = getHandlers(container);
            // a handler reports the size of the item before it
            expect(handlers.map(now)).toEqual([33.3, 33.3]);
            key(handlers[1], 'ArrowRight');
            expect(handlers.map(now)).toEqual([33.3, 34.3]);
        });

        it('Alt、Ctrl、Meta 加方向键不移动手柄，也不阻止浏览器的默认行为', () => {
            const { container } = renderGroup();
            const handler = getHandlers(container)[0];
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(fireEvent.keyDown(handler, { key: 'ArrowRight', [modifier]: true })).toBe(true);
            }
            expect(now(handler)).toBe(50);
        });

        it('无关按键正常传递，传入的 onKeyDown 先被调用', () => {
            const onKeyDown = vi.fn<(e: KeyboardEvent) => void>();
            const { container } = render(() => (
                <ResizeGroup>
                    <ResizeItem />
                    <ResizeHandler onKeyDown={onKeyDown} />
                    <ResizeItem />
                </ResizeGroup>
            ));
            const handler = getHandlers(container)[0];
            expect(fireEvent.keyDown(handler, { key: 'Tab' })).toBe(true);
            expect(fireEvent.keyDown(handler, { key: 'ArrowRight' })).toBe(false);
            expect(onKeyDown).toHaveBeenCalledTimes(2);
        });
    });

    it('读取 semiGlobal.config.overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ResizeGroup: { direction: 'vertical' } };
        const { container } = render(() => <ResizeGroup>{threePanes()}</ResizeGroup>);
        expect(getGroup(container).style.flexDirection).toBe('column');
    });
});
