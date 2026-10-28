/** @jsxImportSource vue */
import { ref, type ComponentPublicInstance, type VNode } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { mockResizeObserver, render } from '@test/utils/vue';
import { ResizeGroup, ResizeHandler, ResizeItem, type ResizeCallback, type Size } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Group from './fixtures/group.vue';
import { down, drag, key, mockLayout, move, nonPrimaryPresses, up } from './helpers';

type Props = Record<string, unknown>;

const getGroup = () => document.querySelector<HTMLElement>('.semi-resizable-group') as HTMLElement;
const getItems = () => [...document.querySelectorAll<HTMLElement>('.semi-resizable-item')];
const getHandlers = () => [...document.querySelectorAll<HTMLElement>('.semi-resizable-handler')];
const getBackground = () => document.querySelector('.semi-resizable-background');
const widths = () => getItems().map((el) => el.style.width);
const heights = () => getItems().map((el) => el.style.height);
const handler = (index = 0) => getHandlers()[index] as HTMLElement;
const item = (index = 0) => getItems()[index] as HTMLElement;

function renderGroup(props: Props = {}) {
    const vertical = props.direction === 'vertical';
    return render(Group, {
        props: { width: vertical ? '500px' : '1010px', height: vertical ? '510px' : '500px', ...props },
    });
}
const renderPlain = (children: () => VNode, groupProps: Props = {}) => render({ render: () => <ResizeGroup {...groupProps}>{children}</ResizeGroup> });

beforeEach(() => {
    mockLayout();
});

afterEach(() => {
    vi.useRealTimers();
    semiGlobal.config.overrideDefaultProps = {};
});

describe('ResizeGroup', () => {
    it('水平 group 布局：各项等分，并减去相邻手柄宽度的一半', () => {
        renderGroup();
        const group = getGroup();
        expect(group).toHaveClass('custom');
        expect(group.dataset.testid).toBe('group');
        expect(group.style.flexDirection).toBe('row');
        expect(widths()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(handler()).toHaveClass('semi-resizable-handler-horizontal');
        expect(handler().querySelector('svg')).not.toBeNull();
        expect(item(1)).toHaveTextContent('item 1');
    });

    it('group 背景层不使用使用方传入的 class', async () => {
        renderGroup();
        await down(handler(), [500, 0]);
        expect(getBackground()).not.toBeNull();
        expect(getBackground()).not.toHaveClass('custom');
        await up([500, 0]);
    });

    it('竖向 group 按高度布局', () => {
        renderGroup({ direction: 'vertical' });
        expect(getGroup().style.flexDirection).toBe('column');
        expect(heights()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(widths()).toEqual(['', '']);
        expect(handler()).toHaveClass('semi-resizable-handler-vertical');
        expect(handler().querySelector<HTMLElement>('.semi-icon')?.style.rotate).toBe('90deg');
    });

    it('默认水平方向', () => {
        renderPlain(() => (
            <>
                <ResizeItem />
                <ResizeHandler />
                <ResizeItem />
            </>
        ));
        expect(getGroup().style.flexDirection).toBe('row');
    });

    it('使用方 style 中的 flex-direction 被 direction 覆盖，其余样式保留', () => {
        renderPlain(
            () => (
                <>
                    <ResizeItem />
                    <ResizeHandler />
                    <ResizeItem />
                </>
            ),
            {
                direction: 'vertical',
                style: { flexDirection: 'row', color: 'red' },
            }
        );
        expect(getGroup().style.flexDirection).toBe('column');
        expect(getGroup().style.color).toBe('red');
    });

    it('根据百分比、px 与比例形式的 defaultSize 计算各项尺寸', () => {
        const view = renderGroup({ items: [{ defaultSize: '30%' }, {}, {}] });
        expect(widths()).toEqual(['calc(30% - 5px)', 'calc(35% - 10px)', 'calc(35% - 5px)']);
        view.unmount();
        renderGroup({ items: [{ defaultSize: '202px' }, { defaultSize: 1 }, { defaultSize: '3' }] });
        expect(widths()).toEqual(['calc(20% - 5px)', 'calc(20% - 10px)', 'calc(60% - 5px)']);
    });

    it('在被拖动手柄两侧的两个项之间转移空间', async () => {
        const calls: Record<'start' | 'change' | 'end', unknown[][]> = { start: [], change: [], end: [] };
        const record = (i: number) => ({
            onResizeStart: (e: PointerEvent, dir: string) => {
                calls.start.push([i, dir, e.clientX]);
            },
            onChange: (size: Size, _e: Event, dir: string) => calls.change.push([i, dir, Math.round(Number(size.width)), size.height]),
            onResizeEnd: (size: Size, _e: Event, dir: string) => calls.end.push([i, dir, Math.round(Number(size.width))]),
        });
        renderGroup({ items: [record(0), record(1)] });
        await down(handler(), [500, 0]);
        expect(calls.start).toEqual([
            [0, 'right', 500],
            [1, 'left', 500],
        ]);
        expect(getBackground()).not.toBeNull();
        await move([600, 0]);
        expect(calls.change).toEqual([
            [0, 'right', 600, 500],
            [1, 'left', 400, 500],
        ]);
        expect(item(0).offsetWidth).toBeCloseTo(600);
        expect(item(1).offsetWidth).toBeCloseTo(400);
        await up([600, 0]);
        expect(calls.end).toEqual([
            [0, 'right', 600],
            [1, 'left', 400],
        ]);
        expect(getBackground()).toBeNull();
        await move([700, 0]);
        expect(calls.change).toHaveLength(2);
    });

    it('竖向 group 按 clientY 拖动', async () => {
        const onChange = vi.fn<ResizeCallback>();
        renderGroup({ direction: 'vertical', items: [{ onChange }, {}] });
        await drag(handler(), [0, 250], [0, 300]);
        expect(onChange.mock.calls[0]?.[2]).toBe('bottom');
        expect(onChange.mock.calls[0]?.[0].height).toBeCloseTo(300);
    });

    it('拖动第二项与第三项之间的手柄', async () => {
        renderGroup({ items: [{}, {}, {}] });
        const before = item(0).style.width;
        await drag(handler(1), [600, 0], [700, 0]);
        expect(item(0).style.width).toBe(before);
        expect(item(1).offsetWidth).toBeCloseTo(1010 / 3 - 10 + 100);
    });

    it('各项保持在 min 与 max 之内', async () => {
        renderGroup({ items: [{ max: '600px', min: '400px' }, {}] });
        await drag(handler(), [500, 0], [800, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(600);
        await drag(handler(), [500, 0], [100, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(400);
    });

    it('任一侧的 onResizeStart 返回 false 时，拖动与方向键都不调整大小', async () => {
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        renderGroup({ items: [{ onChange, onResizeEnd }, { onResizeStart: () => false }] });
        const before = widths();
        await down(handler(), [500, 0]);
        expect(getBackground()).toBeNull();
        await move([600, 0]);
        await up([600, 0]);
        await key(handler(), 'ArrowRight');
        expect(widths()).toEqual(before);
        expect(onChange).not.toHaveBeenCalled();
        expect(onResizeEnd).not.toHaveBeenCalled();
    });

    it('min 与 max 比较的是项的 border-box 尺寸（含内边距）：带内边距的项拖动与窗口缩放停在同一最小值', async () => {
        vi.useFakeTimers();
        const view = renderGroup({
            items: [{ style: { paddingLeft: '16px', paddingRight: '16px' }, min: '200px' }, {}],
        });
        await drag(handler(), [500, 0], [0, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(200);
        await view.rerender({ width: '410px' });
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(200);
        expect(item(0).offsetWidth).toBeCloseTo(200);
    });

    it('min 与 max 为百分比时换算成 px 后与拖动、窗口缩放共用同一个范围', async () => {
        renderGroup({ items: [{ min: '20%', max: '60%' }, {}] });
        await drag(handler(), [500, 0], [1000, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(606);
        await drag(handler(), [500, 0], [0, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(202);
    });

    it('defaultSize 与 min 支持 vw、vh，按窗口尺寸换算成 px', async () => {
        renderGroup({ items: [{ defaultSize: '50vw', min: '40vw' }, {}] });
        // jsdom serializes the percentage with 4 decimals, so compare the measured px
        expect(item(0).offsetWidth).toBeCloseTo(window.innerWidth * 0.5 - 5, 0);
        expect(item(1).offsetWidth).toBeCloseTo(1010 - window.innerWidth * 0.5 - 5, 0);
        await drag(handler(), [500, 0], [0, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(window.innerWidth * 0.4);
    });

    it('窗口缩小后，最后一项低于 min 时由前面的项让出空间', async () => {
        vi.useFakeTimers();
        const view = renderGroup({ items: [{}, { min: '400px' }] });
        await view.rerender({ width: '610px' });
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(200);
        expect(item(1).offsetWidth).toBeCloseTo(400);
        expect(item(0).offsetWidth).toBeCloseTo(200);
    });

    it('容器尺寸变化时（不是窗口缩放），px 的 min 同样生效', async () => {
        vi.useFakeTimers();
        const resize = mockResizeObserver();
        const view = renderGroup({ items: [{}, { min: '400px' }] });
        await view.rerender({ width: '610px' });
        await resize.fire(getGroup(), []);
        vi.advanceTimersByTime(200);
        expect(item(1).offsetWidth).toBeCloseTo(400);
        expect(item(0).offsetWidth).toBeCloseTo(200);
    });

    it('分组被隐藏（尺寸为 0）时不校正尺寸，重新显示后 aria-valuenow 保持有限且手柄仍可拖动', async () => {
        vi.useFakeTimers();
        const resize = mockResizeObserver();
        renderGroup({ items: [{}, { min: '400px' }] });
        const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
        const visibleWidth = width.getMockImplementation() as (this: HTMLElement) => number;
        width.mockReturnValue(0);
        await resize.fire(getGroup(), []);
        vi.advanceTimersByTime(200);
        width.mockImplementation(visibleWidth);
        await resize.fire(getGroup(), []);
        vi.advanceTimersByTime(200);
        expect(handler().getAttribute('aria-valuenow')).toBe('50');
        await down(handler(), [500, 0]);
        await move([600, 0]);
        await up([600, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(600);
        expect(item(1).offsetWidth).toBeCloseTo(400);
    });

    it('非主键（鼠标右键与中键、笔的侧键与橡皮擦）按下手柄不开始调整也不捕获指针', async () => {
        const onResizeStart = vi.fn<() => void>();
        renderGroup({ items: [{ onResizeStart }, {}] });
        const capture = vi.spyOn(handler(), 'setPointerCapture');
        for (const [pointerType, button] of nonPrimaryPresses) {
            await down(handler(), [500, 0], { button, pointerType });
            await move([600, 0]);
            await up([600, 0]);
        }
        expect(onResizeStart).not.toHaveBeenCalled();
        expect(capture).not.toHaveBeenCalled();
        expect(getBackground()).toBeNull();
        expect(widths()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        await down(handler(), [500, 0], { button: 0 });
        expect(onResizeStart).toHaveBeenCalledTimes(1);
        await up();
    });

    it('手柄上传入的指针监听同样被调用，拖动照常进行', async () => {
        const onPointerdown = vi.fn<(e: PointerEvent) => void>();
        const onPointermove = vi.fn<(e: PointerEvent) => void>();
        const onLostpointercapture = vi.fn<(e: PointerEvent) => void>();
        const onChange = vi.fn<ResizeCallback>();
        renderGroup({
            items: [{ onChange }, {}],
            handler: { onPointerdown, onPointermove, onLostpointercapture },
        });
        await drag(handler(), [500, 0], [600, 0]);
        expect(onPointerdown).toHaveBeenCalledTimes(1);
        expect(onPointermove).toHaveBeenCalledTimes(1);
        expect(onLostpointercapture).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('direction 变化时，各项尺寸从宽度切换为高度', async () => {
        const view = renderGroup({ direction: 'horizontal' });
        await view.rerender({ direction: 'vertical' });
        expect(getGroup().style.flexDirection).toBe('column');
        expect(heights()).toEqual(['calc(50% - 5px)', 'calc(50% - 5px)']);
        expect(widths()).toEqual(['', '']);
        expect(handler()).toHaveClass('semi-resizable-handler-vertical');
    });

    it('direction 变化时，按手柄在新轴上的尺寸重新扣除手柄占用的空间，之后的拖动沿用该扣除值', async () => {
        const view = renderGroup({
            direction: 'horizontal',
            height: '510px',
            handler: { style: { width: '8px', height: '20px' } },
        });
        expect(widths()).toEqual(['calc(50% - 4px)', 'calc(50% - 4px)']);
        await view.rerender({ direction: 'vertical' });
        expect(heights()).toEqual(['calc(50% - 10px)', 'calc(50% - 10px)']);
        expect(widths()).toEqual(['', '']);

        await drag(handler(), [0, 255], [0, 355]);
        expect(heights().every((height) => height.endsWith(' - 10px)'))).toBe(true);
    });

    it('渲染自定义手柄的默认插槽、class 与 style', () => {
        renderPlain(() => (
            <>
                <ResizeItem class="item" style={{ color: 'red' }} />
                <ResizeHandler class="handler" style={{ color: 'blue' }}>
                    {() => <span class="grip" />}
                </ResizeHandler>
                <ResizeItem />
            </>
        ));
        expect(item()).toHaveClass('item');
        expect(item().style.color).toBe('red');
        expect(handler()).toHaveClass('handler');
        expect(handler().style.color).toBe('blue');
        expect(handler().querySelector('.grip')).not.toBeNull();
        expect(handler().querySelector('svg')).toBeNull();
    });

    it('拖动因卸载中断时不再上报', async () => {
        const onChange = vi.fn<ResizeCallback>();
        const onResizeEnd = vi.fn<ResizeCallback>();
        const view = renderGroup({ items: [{ onChange, onResizeEnd }, {}] });
        const pressed = handler();
        await down(pressed, [500, 0]);
        view.unmount();
        await move([600, 0]);
        await up();
        await key(pressed, 'ArrowRight');
        expect(onChange).not.toHaveBeenCalled();
        expect(onResizeEnd).not.toHaveBeenCalled();
    });

    it('卸载时丢弃尚未执行的约束检查', () => {
        vi.useFakeTimers();
        const view = renderGroup();
        window.dispatchEvent(new Event('resize'));
        view.unmount();
        expect(() => vi.advanceTimersByTime(200)).not.toThrow();
    });

    it('移除的 items 与手柄会被注销', async () => {
        vi.useFakeTimers();
        const onChange = vi.fn<ResizeCallback>();
        const view = renderGroup({ items: [{ onChange }, {}, {}] });
        await view.rerender({ items: [{ onChange }, {}] });
        expect(getHandlers()).toHaveLength(1);
        window.dispatchEvent(new Event('resize'));
        expect(() => vi.advanceTimersByTime(200)).not.toThrow();
        await drag(handler(), [300, 0], [350, 0]);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('调用最新的 item 监听', async () => {
        const first = vi.fn<ResizeCallback>();
        const latest = vi.fn<ResizeCallback>();
        const view = renderGroup({ items: [{ onChange: first }, {}] });
        await view.rerender({ items: [{ onChange: latest }, {}] });
        await drag(handler(), [0, 0], [50, 0]);
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('把未声明的属性透传到 item 与手柄根元素，模板 ref 的 $el 指向它们', () => {
        const groupRef = ref<ComponentPublicInstance | null>(null);
        const itemRef = ref<ComponentPublicInstance | null>(null);
        const handlerRef = ref<ComponentPublicInstance | null>(null);
        renderPlain(
            () => (
                <>
                    <ResizeItem ref={itemRef} id="item" data-testid="item" />
                    <ResizeHandler ref={handlerRef} data-testid="handler" aria-label="resize" />
                    <ResizeItem />
                </>
            ),
            { ref: groupRef }
        );
        expect(item().dataset.testid).toBe('item');
        expect(item().id).toBe('item');
        expect(handler().dataset.testid).toBe('handler');
        expect(handler().getAttribute('aria-label')).toBe('resize');
        expect(groupRef.value?.$el).toBe(getGroup());
        expect(itemRef.value?.$el).toBe(item());
        expect(handlerRef.value?.$el).toBe(handler());
    });

    it('group 与 item 带 aria-label 或 aria-labelledby 时 role 为 group，使用方的 role 优先', () => {
        renderPlain(
            () => (
                <>
                    <ResizeItem aria-labelledby="x" />
                    <ResizeItem aria-label="b" role="region" />
                    <ResizeItem />
                </>
            ),
            { 'aria-label': 'panes' }
        );
        expect(getGroup()).toHaveAttribute('role', 'group');
        expect(item(0)).toHaveAttribute('role', 'group');
        expect(item(1)).toHaveAttribute('role', 'region');
        expect(item(2)).not.toHaveAttribute('role');
    });

    it('ResizeItem 与 ResizeHandler 在 ResizeGroup 外使用时抛出带组件名的错误', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => render(ResizeItem)).toThrow('ResizeItem must be used inside ResizeGroup');
        expect(() => render(ResizeHandler)).toThrow('ResizeHandler must be used inside ResizeGroup');
    });

    describe('键盘', () => {
        const now = (el: HTMLElement) => Number(el.getAttribute('aria-valuenow'));

        it('是可聚焦的分隔符，带有 orientation、值范围、受控 item 与 name', () => {
            render({
                render: () => <ConfigProvider locale={en_US}>{() => <Group items={[{ min: '20%', max: '70%' }, {}]} />}</ConfigProvider>,
            });
            const el = handler();
            expect(el).toHaveAttribute('role', 'separator');
            expect(el).toHaveAttribute('tabindex', '0');
            expect(el).toHaveAttribute('aria-orientation', 'vertical');
            expect(el).toHaveAttribute('aria-label', 'Resize panels');
            expect(el).toHaveAttribute('aria-controls', item().id);
            expect(item().id).not.toBe('');
            expect(now(el)).toBe(50);
            expect(el.getAttribute('aria-valuemin')).toBe('20.5');
            expect(el.getAttribute('aria-valuemax')).toBe('70.5');
        });

        it('foundation 写入的 aria 值在重新渲染后保留', async () => {
            const view = renderGroup();
            await key(handler(), 'ArrowRight');
            await view.rerender({ height: '400px' });
            expect(now(handler())).toBe(51);
            expect(handler().getAttribute('aria-controls')).toBe(item().id);
        });

        it('竖向 group 的分隔符为水平方向', () => {
            renderGroup({ direction: 'vertical' });
            expect(handler()).toHaveAttribute('aria-orientation', 'horizontal');
        });

        it('保留使用方设置的 name', () => {
            renderGroup({ handler: { 'aria-label': 'sidebar' } });
            expect(handler()).toHaveAttribute('aria-label', 'sidebar');
        });

        it('一次方向键按下是一次完整调整：每项各触发一次 start、change 与 end，方向与拖动一致', async () => {
            const calls: unknown[][] = [];
            const record = (i: number) => ({
                onResizeStart: (e: Event, dir: string) => {
                    calls.push(['start', i, dir, e.type]);
                },
                onChange: (_size: Size, e: Event, dir: string) => calls.push(['change', i, dir, e.type]),
                onResizeEnd: (_size: Size, e: Event, dir: string) => calls.push(['end', i, dir, e.type]),
            });
            renderGroup({ items: [record(0), record(1)] });
            const el = handler();
            await key(el, 'ArrowRight');
            expect(calls).toEqual([
                ['start', 0, 'right', 'keydown'],
                ['start', 1, 'left', 'keydown'],
                ['change', 0, 'right', 'keydown'],
                ['change', 1, 'left', 'keydown'],
                ['end', 0, 'right', 'keydown'],
                ['end', 1, 'left', 'keydown'],
            ]);
            expect(item(0).offsetWidth).toBeCloseTo(510.1);
            expect(item(1).offsetWidth).toBeCloseTo(489.9);
            expect(now(el)).toBe(51);
            expect(getBackground()).toBeNull();
            await key(el, 'ArrowLeft');
            expect(now(el)).toBe(50);
        });

        it('Shift 移动距离为 10 倍，Home 与 End 移到边界', async () => {
            renderGroup({ items: [{ min: '20%', max: '70%' }, {}] });
            const el = handler();
            await key(el, 'ArrowRight', { shiftKey: true });
            expect(now(el)).toBe(60);
            await key(el, 'End');
            expect(now(el)).toBe(70.5);
            await key(el, 'ArrowRight');
            expect(now(el)).toBe(70.5);
            await key(el, 'Home');
            expect(now(el)).toBe(20.5);
        });

        it('竖向 group 只响应 Up 与 Down', async () => {
            renderGroup({ direction: 'vertical' });
            const el = handler();
            await key(el, 'ArrowRight');
            expect(now(el)).toBe(50);
            await key(el, 'ArrowDown');
            expect(now(el)).toBe(51);
            await key(el, 'ArrowUp');
            expect(now(el)).toBe(50);
        });

        it('只移动相邻两项之间的手柄', async () => {
            renderGroup({ items: [{}, {}, {}] });
            const handlers = getHandlers();
            expect(handlers.map(now)).toEqual([33.3, 33.3]);
            await key(handler(1), 'ArrowRight');
            expect(handlers.map(now)).toEqual([33.3, 34.3]);
        });

        it('Alt、Ctrl、Meta 加方向键不移动手柄，也不阻止默认行为', async () => {
            renderGroup();
            for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
                expect(await key(handler(), 'ArrowRight', { [modifier]: true })).toBe(true);
            }
            expect(now(handler())).toBe(50);
        });

        it('无关按键正常传递', async () => {
            renderGroup();
            expect(await key(handler(), 'Tab')).toBe(true);
            expect(await key(handler(), 'ArrowRight')).toBe(false);
        });
    });

    it('读取 semiGlobal.config.overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ResizeGroup: { direction: 'vertical' } };
        renderPlain(() => (
            <>
                <ResizeItem />
                <ResizeHandler />
                <ResizeItem />
            </>
        ));
        expect(getGroup().style.flexDirection).toBe('column');
    });

    it('ResizeItem 读取全局默认的 min，onResizeStart 的全局值在每次调整开始时读取', async () => {
        semiGlobal.config.overrideDefaultProps = { ResizeItem: { min: '400px' } };
        renderGroup();
        await drag(handler(), [500, 0], [100, 0]);
        expect(item(0).offsetWidth).toBeCloseTo(400);
        semiGlobal.config.overrideDefaultProps = { ResizeItem: { onResizeStart: () => false } };
        const before = widths();
        await drag(handler(), [500, 0], [600, 0]);
        expect(widths()).toEqual(before);
    });
});
