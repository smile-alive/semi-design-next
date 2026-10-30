/** @jsxImportSource vue */
import { nextTick, ref, shallowRef, type ComponentPublicInstance, type StyleValue } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import { Resizable, type ResizeCallback, type ResizeStartCallback, type Size } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Controlled from './fixtures/controlled.vue';
import { down, drag, key, mockLayout, move, nonPrimaryPresses, up } from './helpers';

type Props = Record<string, unknown>;

const BOX = { width: '1000px', height: '800px' };
const getRoot = () => document.querySelector<HTMLElement>('.semi-resizable-resizable') as HTMLElement;
const getHandle = (dir: string) => document.querySelector<HTMLElement>(`.semi-resizable-resizableHandler-${dir}`) as HTMLElement;
const getBackground = () => document.querySelector('.semi-resizable-background');
function sizeOf() {
    const { width, height } = getRoot().style;
    return { width, height };
}

async function renderResizable(initial: Props, wrapper?: Props) {
    const props = shallowRef(initial);
    const result = render({
        render: () =>
            wrapper ? (
                <div style={wrapper as StyleValue}>
                    <Resizable {...props.value} />
                </div>
            ) : (
                <Resizable {...props.value} />
            ),
    });
    await nextTick();
    return {
        ...result,
        setProps: async (next: Props) => {
            props.value = next;
            await nextTick();
        },
    };
}
const renderBox = (props: Props = {}) => renderResizable({ defaultSize: { width: 200, height: 100 }, ...props }, BOX);

beforeEach(() => {
    mockLayout();
});

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Resizable', () => {
    it('渲染带 class、style、data-* 与默认插槽的根元素，并为每个方向渲染一个手柄', () => {
        render(Resizable, {
            attrs: { class: 'custom', style: { color: 'red' }, 'data-testid': 'box' },
            slots: { default: () => <span class="child">content</span> },
        });
        const root = getRoot();
        expect(root).toHaveClass('custom');
        expect(root.style.color).toBe('red');
        expect(root.dataset.testid).toBe('box');
        expect(root.querySelector('.child')).toHaveTextContent('content');
        expect(sizeOf()).toEqual({ width: 'auto', height: 'auto' });
        expect([...document.querySelectorAll('.semi-resizable-resizableHandler')].map((el) => [...el.classList].find((c) => c.startsWith('semi-resizable-resizableHandler-')))).toEqual(
            ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'].map((dir) => `semi-resizable-resizableHandler-${dir}`)
        );
        expect(getBackground()).toBeNull();
    });

    it('根据 defaultSize 的数字与字符串计算尺寸，并应用 min/max 样式，数字输出 px', async () => {
        const view = await renderResizable({
            defaultSize: { width: 200, height: '50%' },
            maxHeight: '90%',
            minWidth: 50,
        });
        expect(sizeOf()).toEqual({ width: '200px', height: '50%' });
        expect(getRoot().style.minWidth).toBe('50px');
        expect(getRoot().style.maxHeight).toBe('90%');
        await view.setProps({ size: { width: '30vw', height: 120 } });
        expect(sizeOf()).toEqual({ width: '30vw', height: '120px' });
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
    ] as const)('拖动 %s 手柄', async (dir, to, width, height) => {
        const onChange = vi.fn<ResizeCallback>();
        await renderBox({ onChange });
        await down(getHandle(dir), [100, 100]);
        await move([...to]);
        expect(sizeOf()).toEqual({ width: `${width}px`, height: `${height}px` });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0]?.[0]).toEqual({ width, height });
        expect(onChange.mock.calls[0]?.[2]).toBe(dir);
        await up([...to]);
        expect(sizeOf()).toEqual({ width: `${width}px`, height: `${height}px` });
    });

    it('调用 onResizeStart，发出 change 与 resizeEnd，并传入尺寸、事件与方向', async () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        await renderBox({ onResizeStart, onChange, onResizeEnd });
        await down(getHandle('right'), [100, 100]);
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        expect(onResizeStart.mock.calls[0]?.[0]).toBeInstanceOf(PointerEvent);
        expect((onResizeStart.mock.calls[0]?.[0] as PointerEvent | undefined)?.clientX).toBe(100);
        expect(onResizeStart.mock.calls[0]?.[1]).toBe('right');
        await move([150, 100]);
        await move([150, 120]);
        await move([160, 100]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1]?.[0]).toEqual({ width: 260, height: 100 });
        expect(onChange.mock.calls[1]?.[1]).toBeInstanceOf(PointerEvent);
        await up([160, 100]);
        expect(onResizeEnd).toHaveBeenCalledTimes(1);
        expect(onResizeEnd.mock.calls[0]?.[0]).toEqual({ width: 260, height: 100 });
        expect(onResizeEnd.mock.calls[0]?.[1]).toBeInstanceOf(PointerEvent);
        expect(onResizeEnd.mock.calls[0]?.[2]).toBe('right');
        await move([200, 100]);
        await up([200, 100]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onResizeEnd).toHaveBeenCalledTimes(1);
    });

    it('onResizeStart 返回 false 时不调整大小', async () => {
        const onChange = vi.fn<ResizeCallback>();
        await renderBox({ onResizeStart: () => false, onChange });
        await down(getHandle('right'), [100, 100]);
        expect(getBackground()).toBeNull();
        await move([150, 100]);
        expect(onChange).not.toHaveBeenCalled();
        expect(sizeOf().width).toBe('200px');
    });

    it('背景层不使用使用方传入的 class', async () => {
        await renderBox({ class: 'custom' });
        await down(getHandle('right'), [100, 100]);
        expect(getRoot()).toHaveClass('custom');
        expect(getBackground()).not.toHaveClass('custom');
        await up();
    });

    it('只在调整大小期间显示背景层并禁用文本选择', async () => {
        await renderBox();
        expect(getRoot().style.userSelect).toBe('auto');
        await down(getHandle('right'), [100, 100]);
        expect(getBackground()).not.toBeNull();
        expect(getRoot().style.userSelect).toBe('none');
        await up();
        expect(getBackground()).toBeNull();
        expect(getRoot().style.userSelect).toBe('auto');
    });

    it('限制在 maxWidth、minWidth、百分比 maxHeight 与默认 10px 最小值之内', async () => {
        await renderResizable({ defaultSize: { width: 200, height: 100 }, maxHeight: '50%', maxWidth: 220, minWidth: 150 }, { width: '400px', height: '300px' });
        await drag(getHandle('right'), [100, 100], [200, 100]);
        expect(sizeOf().width).toBe('220px');
        await drag(getHandle('right'), [100, 100], [0, 100]);
        expect(sizeOf().width).toBe('150px');
        await drag(getHandle('bottom'), [100, 100], [100, 300]);
        expect(sizeOf().height).toBe('150px');
        await drag(getHandle('bottom'), [100, 100], [100, -500]);
        expect(sizeOf().height).toBe('10px');
    });

    it('lockAspectRatio 下保持初始宽高比，或保持指定的宽高比', async () => {
        const view = await renderBox({ lockAspectRatio: true });
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(sizeOf()).toEqual({ width: '250px', height: '125px' });
        await drag(getHandle('bottom'), [100, 100], [100, 125]);
        expect(sizeOf()).toEqual({ width: '300px', height: '150px' });
        await view.setProps({ defaultSize: { width: 200, height: 100 }, lockAspectRatio: 1 });
        await drag(getHandle('right'), [100, 100], [110, 100]);
        expect(sizeOf()).toEqual({ width: '310px', height: '310px' });
    });

    it('在 snapGap 范围内吸附到网格与吸附点', async () => {
        const view = await renderBox({ grid: [50, 50] });
        await drag(getHandle('right'), [100, 100], [130, 100]);
        expect(sizeOf().width).toBe('250px');
        await view.setProps({ defaultSize: { width: 200, height: 100 }, grid: [50, 50], snapGap: 10 });
        await drag(getHandle('right'), [100, 100], [80, 100]);
        expect(sizeOf().width).toBe('230px');
        await view.setProps({ defaultSize: { width: 200, height: 100 }, snap: { x: [100, 300] } });
        await drag(getHandle('right'), [100, 100], [100, 100]);
        expect(sizeOf().width).toBe('300px');
    });

    it('指针位移按 ratio 与 scale 缩放', async () => {
        const view = await renderBox({ ratio: 2 });
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(sizeOf().width).toBe('300px');
        await view.setProps({ defaultSize: { width: 200, height: 100 }, scale: 2 });
        await drag(getHandle('right'), [100, 100], [200, 100]);
        expect(sizeOf().width).toBe('350px');
    });

    it('百分比尺寸保持为百分比，未改动的 auto 边保持 auto', async () => {
        const onChange = vi.fn<ResizeCallback>();
        const view = await renderBox({ defaultSize: { width: '50%', height: 100 }, onChange });
        await drag(getHandle('right'), [100, 100], [200, 100]);
        expect(sizeOf()).toEqual({ width: '60%', height: '100px' });
        expect(onChange.mock.calls[0]?.[0]).toEqual({ width: '60%', height: 100 });
        view.unmount();
        await renderResizable({ onChange }, {});
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(sizeOf()).toEqual({ width: '350px', height: 'auto' });
        expect(onChange.mock.calls[1]?.[0]).toEqual({ width: 350, height: 'auto' });
    });

    it('单向绑定 size 时，受控尺寸在拖动中与拖动后都显示该尺寸，换值后显示新值', async () => {
        const onChange = vi.fn<ResizeCallback>();
        const view = await renderResizable({ size: { width: 200, height: 100 }, onChange });
        await down(getHandle('right'), [100, 100]);
        await move([150, 100]);
        expect(onChange.mock.calls[0]?.[0]).toEqual({ width: 250, height: 100 });
        expect(sizeOf().width).toBe('200px');
        await up();
        expect(sizeOf().width).toBe('200px');
        await view.setProps({ size: { width: 300, height: 100 }, onChange });
        expect(sizeOf().width).toBe('300px');
    });

    it('只受控一个轴时，另一个轴使用 defaultSize，拖动中与拖动后保持拖动的结果', async () => {
        render(Controlled, { props: { mode: 'width' } });
        await nextTick();
        expect(sizeOf()).toEqual({ width: '200px', height: '100px' });
        await down(getHandle('bottom'), [100, 100]);
        await move([100, 150]);
        expect(sizeOf().height).toBe('150px');
        await up();
        expect(sizeOf()).toEqual({ width: '200px', height: '150px' });
    });

    it('v-model:size 拖动时受控尺寸比指针落后一次移动，结束后显示拖动结果并回写父级', async () => {
        render(Controlled, { props: { mode: 'two-way' } });
        await nextTick();
        await down(getHandle('right'), [100, 100]);
        await move([150, 100]);
        expect(sizeOf().width).toBe('200px');
        await move([170, 100]);
        expect(sizeOf().width).toBe('250px');
        await up();
        expect(sizeOf().width).toBe('270px');
        expect(screen.getByLabelText('size')).toHaveTextContent('270x100');
    });

    it('update:size 与 change 的尺寸相同，update:size 先发出', async () => {
        const order: string[] = [];
        const onUpdateSize = vi.fn<(size: Size) => void>(() => order.push('update:size'));
        const onChange = vi.fn<ResizeCallback>(() => order.push('change'));
        await renderBox({ 'onUpdate:size': onUpdateSize, onChange });
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(onUpdateSize).toHaveBeenCalledWith({ width: 250, height: 100 });
        expect(onChange.mock.calls[0]?.[0]).toEqual({ width: 250, height: 100 });
        expect(order).toEqual(['update:size', 'change']);
    });

    it('只为启用的方向渲染手柄', async () => {
        const view = await renderResizable({ enable: { right: false, top: false } });
        expect(document.querySelectorAll('.semi-resizable-resizableHandler')).toHaveLength(6);
        expect(getHandle('right')).toBeNull();
        expect(getHandle('top')).toBeNull();
        await view.setProps({ enable: false });
        expect(document.querySelectorAll('.semi-resizable-resizableHandler')).toHaveLength(0);
    });

    it('应用 #handle 插槽、handleClass、handleStyle 与手柄包裹层属性', () => {
        render(Resizable, {
            props: {
                handleClass: { right: 'right-class' },
                handleWrapperClass: 'wrapper',
                handleStyle: { right: { background: 'red' } },
                handleWrapperStyle: { zIndex: 3 },
            },
            slots: {
                handle: ({ direction }: { direction: string }) => (direction === 'right' ? <span class="node">R</span> : undefined),
            },
        });
        const right = getHandle('right');
        expect(right).toHaveClass('right-class');
        expect(right.style.background).toBe('red');
        expect(right.querySelector('.node')).toHaveTextContent('R');
        expect(right.parentElement).toHaveClass('wrapper');
        expect(right.parentElement?.style.zIndex).toBe('3');
        expect(getHandle('left').children).toHaveLength(0);
        expect(getHandle('left').textContent).toBe('');
    });

    it('#handle 插槽在每个启用方向的手柄内各自收到该方向', () => {
        render(Resizable, {
            props: { enable: { top: false } },
            slots: { handle: ({ direction }: { direction: string }) => <i data-dir={direction} /> },
        });
        const handles = [...document.querySelectorAll<HTMLElement>('.semi-resizable-resizableHandler')];
        expect(handles).toHaveLength(7);
        for (const handle of handles) {
            const marks = [...handle.querySelectorAll<HTMLElement>('i')].map((el) => el.dataset.dir);
            expect(marks).toHaveLength(1);
            expect(handle).toHaveClass(`semi-resizable-resizableHandler-${marks[0]}`);
        }
    });

    it('boundElement="parent" 时尺寸限制在父元素之内', async () => {
        await renderResizable({ boundElement: 'parent', defaultSize: { width: 200, height: 100 } }, { width: '400px', height: '300px' });
        await drag(getHandle('right'), [100, 100], [600, 100]);
        expect(sizeOf().width).toBe('400px');
    });

    it('使用触摸指针调整大小', async () => {
        const onChange = vi.fn<ResizeCallback>();
        await renderBox({ onChange });
        await down(getHandle('right'), [100, 100], { pointerType: 'touch' });
        await move([140, 100]);
        expect(sizeOf().width).toBe('240px');
        await up([140, 100]);
        await move([180, 100]);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('非主键（鼠标右键与中键、笔的侧键与橡皮擦）按下不开始调整也不捕获指针', async () => {
        const onResizeStart = vi.fn<ResizeStartCallback>();
        await renderBox({ onResizeStart });
        const handle = getHandle('right');
        const capture = vi.spyOn(handle, 'setPointerCapture');
        for (const [pointerType, button] of nonPrimaryPresses) {
            await down(handle, [100, 100], { button, pointerType });
            expect(getBackground()).toBeNull();
            await move([140, 100]);
            await up([140, 100]);
        }
        expect(onResizeStart).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
        expect(sizeOf().width).toBe('200px');
        await down(handle, [100, 100], { button: 0 });
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        await up();
    });

    it('按下时在手柄上捕获指针', async () => {
        await renderBox();
        const handle = getHandle('right');
        const capture = vi.spyOn(handle, 'setPointerCapture');
        await down(handle, [100, 100], { pointerId: 7 });
        expect(capture).toHaveBeenCalledWith(7);
        await up();
    });

    it('拖动因卸载中断时不再上报', async () => {
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        const view = await renderBox({ onChange, onResizeEnd });
        await down(getHandle('right'), [100, 100]);
        view.unmount();
        await move([150, 100]);
        await up();
        expect(onChange).not.toHaveBeenCalled();
        expect(onResizeEnd).not.toHaveBeenCalled();
    });

    describe('键盘', () => {
        it('右侧与底部手柄成为分隔符，每个尺寸一个，其余手柄仍由指针操作', async () => {
            render({
                render: () => (
                    <ConfigProvider locale={en_US}>
                        {() => (
                            <div style={BOX}>
                                <Resizable defaultSize={{ width: 200, height: 100 }} maxWidth={400} />
                            </div>
                        )}
                    </ConfigProvider>
                ),
            });
            await nextTick();
            const right = getHandle('right');
            const bottom = getHandle('bottom');
            expect(right).toHaveAttribute('role', 'separator');
            expect(right).toHaveAttribute('tabindex', '0');
            expect(right).toHaveAttribute('aria-orientation', 'vertical');
            expect(right).toHaveAttribute('aria-label', 'Resize width');
            expect(right).toHaveAttribute('aria-valuenow', '200');
            expect(right).toHaveAttribute('aria-valuemin', '10');
            expect(right).toHaveAttribute('aria-valuemax', '400');
            expect(bottom).toHaveAttribute('aria-orientation', 'horizontal');
            expect(bottom).toHaveAttribute('aria-label', 'Resize height');
            expect(bottom).toHaveAttribute('aria-valuenow', '100');
            for (const dir of ['top', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft']) {
                expect(getHandle(dir)).not.toHaveAttribute('tabindex');
                expect(getHandle(dir)).not.toHaveAttribute('role');
            }
        });

        it('方向键沿手柄轴向调整大小，与拖动一样触发同一组回调', async () => {
            const calls: unknown[][] = [];
            await renderBox({
                onResizeStart: (e: KeyboardEvent, dir: string) => calls.push(['start', dir, e.type]),
                onChange: (size: Size, e: Event, dir: string) => calls.push(['change', dir, e.type, size.width, size.height]),
                onResizeEnd: (size: Size, e: Event, dir: string) => calls.push(['end', dir, e.type, size.width, size.height]),
            });
            const right = getHandle('right');
            await key(right, 'ArrowUp');
            expect(calls).toEqual([]);
            await key(right, 'ArrowRight');
            expect(calls).toEqual([
                ['start', 'right', 'keydown'],
                ['change', 'right', 'keydown', 210, 100],
                ['end', 'right', 'keydown', 210, 100],
            ]);
            expect(sizeOf()).toEqual({ width: '210px', height: '100px' });
            expect(getBackground()).toBeNull();
            await key(right, 'ArrowLeft');
            expect(sizeOf().width).toBe('200px');
            await key(getHandle('bottom'), 'ArrowDown');
            expect(sizeOf()).toEqual({ width: '200px', height: '110px' });
        });

        it('方向键步长不受 ratio 与 scale 影响', async () => {
            const view = await renderBox({ ratio: 2 });
            await key(getHandle('right'), 'ArrowRight');
            expect(sizeOf().width).toBe('210px');
            view.unmount();
            const scaled = await renderBox({ scale: 0.5 });
            await key(getHandle('bottom'), 'ArrowDown');
            expect(sizeOf().height).toBe('110px');
            scaled.unmount();
            await renderBox({ ratio: [4, 2] });
            await key(getHandle('right'), 'ArrowRight');
            await key(getHandle('bottom'), 'ArrowDown');
            expect(sizeOf()).toEqual({ width: '210px', height: '110px' });
        });

        it('边界元素完全位于 Resizable 之外时，非正的边界余量不覆盖 maxWidth', async () => {
            const boundary = document.createElement('div');
            boundary.style.width = '50px';
            boundary.style.height = '50px';
            // an own property: spying would replace the prototype mock that the Resizable itself is measured with
            boundary.getBoundingClientRect = () => ({ left: -500, top: 0 }) as DOMRect;
            await renderBox({ boundElement: boundary, maxWidth: 300 });
            expect(getHandle('right')).toHaveAttribute('aria-valuemax', '300');
            await drag(getHandle('right'), [100, 100], [900, 100]);
            expect(sizeOf().width).toBe('300px');
        });

        it('保持在 max 与 min 尺寸之内，并遵守 onResizeStart 返回 false', async () => {
            const view = await renderBox({ maxWidth: 205 });
            await key(getHandle('right'), 'ArrowRight');
            expect(sizeOf().width).toBe('205px');
            view.unmount();
            await renderBox({ onResizeStart: () => false });
            await key(getHandle('right'), 'ArrowRight');
            expect(sizeOf().width).toBe('200px');
        });

        it('只启用左边与上边时，它们各成为所在轴的分隔符，并按边的方向调整大小', async () => {
            await renderBox({ enable: { right: false, bottom: false } });
            const left = getHandle('left');
            const top = getHandle('top');
            expect(getHandle('right')).toBeNull();
            expect(left).toHaveAttribute('role', 'separator');
            expect(left).toHaveAttribute('aria-orientation', 'vertical');
            expect(left).toHaveAttribute('aria-valuenow', '200');
            expect(top).toHaveAttribute('role', 'separator');
            expect(top).toHaveAttribute('aria-orientation', 'horizontal');
            expect(getHandle('topLeft')).not.toHaveAttribute('role');
            await key(left, 'ArrowLeft');
            expect(sizeOf().width).toBe('210px');
            await key(top, 'ArrowDown');
            expect(sizeOf().height).toBe('90px');
        });

        it('Alt、Ctrl、Meta 加方向键不调整大小，也不阻止默认行为', async () => {
            await renderBox();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(await key(getHandle('right'), 'ArrowRight', { [modifier]: true })).toBe(true);
            }
            expect(sizeOf().width).toBe('200px');
        });

        it('处理过的方向键阻止默认行为，其他按键不阻止', async () => {
            await renderBox();
            expect(await key(getHandle('right'), 'ArrowRight')).toBe(false);
            expect(await key(getHandle('right'), 'ArrowUp')).toBe(true);
            expect(await key(getHandle('left'), 'ArrowLeft')).toBe(true);
        });
    });

    it('模板 ref 的 $el 是根元素', () => {
        const box = ref<ComponentPublicInstance | null>(null);
        render({ render: () => <Resizable ref={box} /> });
        expect(box.value?.$el).toBe(getRoot());
    });

    it('把未声明的属性透传到根元素', () => {
        render(Resizable, { attrs: { id: 'box', 'aria-label': 'box' } });
        expect(getRoot().id).toBe('box');
        expect(getRoot().getAttribute('aria-label')).toBe('box');
    });

    it('使用方 style 中的 width 被尺寸覆盖，其余样式保留', async () => {
        await renderBox({ style: { width: '999px', color: 'red' } });
        expect(sizeOf().width).toBe('200px');
        expect(getRoot().style.color).toBe('red');
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(sizeOf().width).toBe('250px');
    });

    it('读取 semiGlobal.config.overrideDefaultProps 中的默认值', async () => {
        semiGlobal.config.overrideDefaultProps = { Resizable: { grid: [50, 50] } };
        await renderBox();
        await drag(getHandle('right'), [100, 100], [130, 100]);
        expect(sizeOf().width).toBe('250px');
    });

    it('boundsByDirection 缺省时读取全局默认值，全局未配置时按未启用处理', async () => {
        const pull = async () => {
            const view = await renderResizable({ boundElement: 'parent', defaultSize: { width: 200, height: 100 }, enable: { left: true } }, { width: '400px', height: '300px' });
            await drag(getHandle('left'), [100, 100], [0, 100]);
            const { width } = sizeOf();
            view.unmount();
            return width;
        };
        expect(await pull()).toBe('300px');
        semiGlobal.config.overrideDefaultProps = { Resizable: { boundsByDirection: true } };
        expect(await pull()).toBe('200px');
    });

    it('根带 aria-label 或 aria-labelledby 时 role 为 group，使用方的 role 优先', () => {
        render(Resizable, { attrs: { 'aria-label': 'box' } });
        expect(getRoot()).toHaveAttribute('role', 'group');
        document.body.innerHTML = '';
        render(Resizable, { attrs: { 'aria-labelledby': 'x' } });
        expect(getRoot()).toHaveAttribute('role', 'group');
        document.body.innerHTML = '';
        render(Resizable, { attrs: { 'aria-label': 'box', role: 'region' } });
        expect(getRoot()).toHaveAttribute('role', 'region');
        document.body.innerHTML = '';
        render(Resizable);
        expect(getRoot()).not.toHaveAttribute('role');
    });

    it('全局默认的 onResizeStart 在每次调整开始时读取', async () => {
        const onChange = vi.fn<ResizeCallback>();
        await renderBox({ onChange });
        semiGlobal.config.overrideDefaultProps = { Resizable: { onResizeStart: () => false } };
        await drag(getHandle('right'), [100, 100], [150, 100]);
        expect(onChange).not.toHaveBeenCalled();
        expect(sizeOf().width).toBe('200px');
    });

    it('在同一次渲染中应用 flex basis，且不改动 style 属性', async () => {
        const style = { flexBasis: '200px' };
        await renderResizable({ style, defaultSize: { width: 200, height: 100 } }, { display: 'flex', width: '1000px', height: '800px' });
        await down(getHandle('right'), [100, 100]);
        await move([150, 100]);
        expect(getRoot().style.flexBasis).toBe('250px');
        await up();
        expect(style).toEqual({ flexBasis: '200px' });
    });
});
