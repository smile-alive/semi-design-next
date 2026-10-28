/** @jsxImportSource vue */
import { defineComponent, nextTick, onUpdated, shallowRef, type StyleValue } from 'vue';
import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Slider, { type HandleDot, type SliderProps } from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import InTooltip from './fixtures/in-tooltip.vue';
import MarksSlot from './fixtures/marks-slot.vue';
import Model from './fixtures/model.vue';

type OnChange = (value: number | number[]) => void;
type Props = Record<string, unknown>;

const prefix = `${BASE_CLASS_PREFIX}-slider`;
const mouse = { pointerId: 1, pointerType: 'mouse' };
const touch = (init = {}) => ({ pointerId: 2, pointerType: 'touch', ...init });
const press = (el: Element, init = {}) => fireEvent.pointerDown(el, { ...mouse, ...init });
const move = (init = {}) => fireEvent.pointerMove(document.body, { ...mouse, ...init });
const release = (init = {}) => fireEvent.pointerUp(window, { ...mouse, ...init });

// A hidden tooltip keeps its node until the CSS leave animation ends, which jsdom never fires; `-wrapper-show` marks
// the tooltip as visible.
const getTooltip = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
const findTooltip = () =>
    waitFor(() => {
        expect(getTooltip()).not.toBeNull();
        return getTooltip();
    });
const getHandle = () => document.querySelector<HTMLElement>(`.${prefix}-handle`) as HTMLElement;
const getHandles = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-handle`)];
const getInput = () => screen.getByRole<HTMLInputElement>('slider');
const getInputs = () => screen.getAllByRole<HTMLInputElement>('slider');
const query = (suffix: string) => document.querySelector<HTMLElement>(`.${prefix}-${suffix}`) as HTMLElement;
const queryAll = (suffix: string) => [...document.querySelectorAll<HTMLElement>(`.${prefix}-${suffix}`)];
// A key on a native range changes its value; jsdom runs no such default action, so the input event is fired directly.
const changeTo = (input: HTMLInputElement, value: number) => fireEvent.update(input, String(value));
// Focus an input the way a Tab press does: jsdom's :focus-visible heuristic needs a key press first.
const tabTo = async (el: HTMLElement) => {
    await fireEvent.keyDown(document.body, { key: 'Tab' });
    el.focus();
    await nextTick();
};
const SIZED = { width: '100px', height: '32px' };
const VERTICAL = { width: '4px', height: '400px', marginLeft: '20px', marginTop: '40px' };
const expectValues = (...values: number[]) => expect(getInputs().map((input) => input.value)).toEqual(values.map(String));
const renderSlider = (props: Props = {}, style?: Props, attrs: Props = {}) => render(Slider, { props, attrs: style ? { ...attrs, style } : attrs });
const renderRtl = (props: Props, style: StyleValue = {}) => render({ render: () => <ConfigProvider direction="rtl">{() => <Slider {...props} style={style} />}</ConfigProvider> });
// fireEvent resolves to nothing, so checks of the default action dispatch the event themselves
const dispatch = async (target: EventTarget, event: Event) => {
    target.dispatchEvent(event);
    await nextTick();
    return event;
};

describe('Slider', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('默认值与默认范围值', () => {
        render({
            render: () => (
                <>
                    <Slider defaultValue={10} showBoundary />
                    <Slider defaultValue={[20, 60]} range />
                </>
            ),
        });
        const handles = getHandles();
        expect(handles[0]).toHaveStyle({ left: '10%' });
        expect(handles[1]).toHaveStyle({ left: '20%' });
        expect(handles[2]).toHaveStyle({ left: '60%' });
        expectValues(10, 20, 60);
    });

    it('change 与 update:modelValue 报告点击位置的值', async () => {
        const change = vi.fn<OnChange>();
        const update = vi.fn<OnChange>();
        renderSlider({ step: 1, onChange: change, 'onUpdate:modelValue': update }, { ...SIZED, marginLeft: '13px' });
        await fireEvent.click(query('rail'), { clientX: 113, clientY: 16 });
        expectValues(100);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenLastCalledWith(100);
        expect(update).toHaveBeenLastCalledWith(100);
        await fireEvent.click(query('rail'), { clientX: 13, clientY: 16 });
        expectValues(0);
        expect(change).toHaveBeenLastCalledWith(0);
    });

    it('range 的 change', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], range: true, vertical: true, onChange: change }, VERTICAL);
        await fireEvent.click(query('rail'), { clientX: 22, clientY: 40 });
        expectValues(0, 60);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenLastCalledWith([0, 60]);
        await fireEvent.click(query('rail'), { clientX: 22, clientY: 440 });
        expectValues(0, 100);
        expect(change).toHaveBeenLastCalledWith([0, 100]);
    });

    it.each([
        ['horizontal', {}, SIZED, { clientX: 25, clientY: 16 }, false],
        ['horizontal rtl', {}, SIZED, { clientX: 75, clientY: 16 }, true],
        ['vertical', { vertical: true }, VERTICAL, { clientX: 22, clientY: 140 }, false],
        ['vertical reverse', { vertical: true, verticalReverse: true }, VERTICAL, { clientX: 22, clientY: 340 }, false],
    ])('范围轨道点击时移动最近的滑块：%s', async (_name, extra: Props, style, point, rtl) => {
        const props = { defaultValue: [20, 80], step: 1, range: true, ...extra };
        if (rtl) {
            renderRtl(props, style);
        } else {
            renderSlider(props, style);
        }
        await fireEvent.click(query('rail'), point);
        expectValues(25, 80);
        const key = extra.vertical ? 'clientY' : 'clientX';
        const step = (extra.vertical ? 4 : 1) * 60 * (extra.verticalReverse || rtl ? -1 : 1);
        await fireEvent.click(query('rail'), { ...point, [key]: point[key as keyof typeof point] + step });
        expectValues(25, 85);
    });

    it('受控值', async () => {
        const change = vi.fn<OnChange>();
        const view = renderSlider({ step: 1, modelValue: 10, onChange: change });
        expectValues(10);
        await view.rerender({ modelValue: 20 });
        expectValues(20);
        await view.rerender({ modelValue: 101 });
        expectValues(100);
        expect(getHandle()).toHaveStyle({ left: '100%' });
        expect(change).not.toHaveBeenCalled();
    });

    it('父组件改受控值后，父组件的 onUpdated 读到新的滑块位置', async () => {
        const seen: (string | undefined)[] = [];
        const Parent = defineComponent({
            props: { value: { type: Number, required: true } },
            setup(props) {
                const host = shallowRef<HTMLElement>();
                onUpdated(() => seen.push(host.value?.querySelector<HTMLElement>(`.${prefix}-handle`)?.style.left));
                return () => (
                    <div ref={host}>
                        <Slider modelValue={props.value} />
                    </div>
                );
            },
        });
        const view = render(Parent, { props: { value: 10 } });
        await view.rerender({ value: 30 });
        expect(seen).toEqual(['30%']);
    });

    it('受控值变化只报告一次 afterChange', async () => {
        const afterChange = vi.fn<OnChange>();
        const view = renderSlider({ modelValue: 10, onAfterChange: afterChange });
        await view.rerender({ modelValue: 30 });
        expect(afterChange).toHaveBeenCalledTimes(1);
        expect(afterChange).toHaveBeenCalledWith(30);
    });

    it('有刻度标记', () => {
        renderSlider({ defaultValue: [0, 100], marks: { 20: '20c', 40: '40c' }, range: true });
        expect(queryAll('dot')).toHaveLength(2);
    });

    it('刻度可点击', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: [0, 100], marks: { 20: '20c', 40: '40c' }, range: true, onChange: change }, SIZED);
        expectValues(0, 100);
        await fireEvent.click(queryAll('dot')[0] as HTMLElement, { clientX: 20 });
        expectValues(20, 100);
        expect(change).toHaveBeenLastCalledWith([20, 100]);
    });

    it('tooltipVisible 为 true 时 tooltip 始终显示，为 false 时始终不显示', async () => {
        const view = renderSlider({ defaultValue: 30, tooltipVisible: true }, SIZED);
        expect(await findTooltip()).toHaveTextContent('30');
        await fireEvent.mouseEnter(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        view.unmount();

        renderSlider({ defaultValue: 30, tooltipVisible: false }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('垂直时没有外层 .semi-slider 容器', () => {
        const { container } = renderSlider({ defaultValue: 30, vertical: true });
        expect(query('vertical-wrapper')).not.toBeNull();
        expect(container.querySelector(`.${prefix}`)).toBeNull();
        expect(container.firstElementChild).toHaveClass(`${prefix}-wrapper`);
        expect(getHandle()).toHaveStyle({ top: '30%' });
    });

    it('水平时外层为 .semi-slider 容器', () => {
        const { container } = renderSlider({ defaultValue: 30 });
        expect(container.firstElementChild).toHaveClass(prefix);
        expect(container.firstElementChild?.firstElementChild).toHaveClass(`${prefix}-wrapper`);
    });

    it('step 属性', async () => {
        renderSlider({ defaultValue: 30, step: 10 });
        expect(getInput()).toHaveAttribute('step', '10');
        await changeTo(getInput(), 40);
        expectValues(40);
    });

    it('min 和 max 属性', () => {
        renderSlider({ defaultValue: 30, max: 50, min: 10 });
        expect(getInput()).toHaveAttribute('min', '10');
        expect(getInput()).toHaveAttribute('max', '50');
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query('boundary-min')).toHaveTextContent('10');
        expect(query('boundary-max')).toHaveTextContent('50');
    });

    it('included 属性', () => {
        renderSlider({ defaultValue: 30, included: false, marks: { 0: '0', 50: '50', 100: '100' } });
        expect(query('track').getAttribute('style')).toBeFalsy();
        expect(queryAll('dot')).toHaveLength(3);
        expect(queryAll('dot-active')).toHaveLength(0);
    });

    it('railStyle 属性', () => {
        renderSlider({ defaultValue: 30, railStyle: { backgroundColor: '#ccc' } });
        expect(query('rail')).toHaveStyle({ backgroundColor: 'rgb(204, 204, 204)' });
        expect(query('track')).toHaveStyle({ width: '30%' });
    });

    it('范围受控值', async () => {
        const view = renderSlider({ modelValue: [20, 60], range: true });
        expectValues(20, 60);
        await view.rerender({ modelValue: [30, 70] });
        expectValues(30, 70);
    });

    it('简单值的刻度', () => {
        renderSlider({ defaultValue: 37, marks: { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' } });
        expect(queryAll('dot')).toHaveLength(4);
        expect(queryAll('dot-active')).toHaveLength(3);
        expect(screen.getByText('26°C')).toHaveStyle({ left: '26%' });
    });

    it('class 和 style 落在 wrapper', () => {
        renderSlider({ defaultValue: 30 }, { width: '300px' }, { class: 'custom-slider' });
        const wrapper = document.querySelector('.custom-slider');
        expect(wrapper).toHaveClass(`${prefix}-wrapper`);
        expect(wrapper).toHaveStyle({ width: '300px' });
    });

    it('showBoundary 属性', async () => {
        renderSlider({ defaultValue: 30, showBoundary: true });
        const boundary = query('boundary');
        expect(query('boundary-min')).toHaveTextContent(/^0$/);
        expect(query('boundary-max')).toHaveTextContent(/^100$/);
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
        await fireEvent.mouseEnter(query('wrapper'));
        expect(boundary).toHaveClass(`${prefix}-boundary-show`);
        await fireEvent.mouseLeave(query('wrapper'));
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
    });

    it('tooltipOnMark 属性', async () => {
        renderSlider({ defaultValue: 30, marks: { 20: '20c', 40: '40c' }, tooltipOnMark: true });
        await userEvent.hover(queryAll('dot')[0] as HTMLElement);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20c'));
    });

    it('tooltipOnMark 的刻度点不是 Tab 停靠点', async () => {
        render({
            render: () => (
                <>
                    <button type="button">before</button>
                    <Slider defaultValue={30} marks={{ 20: '20c', 40: '40c' }} tooltipOnMark />
                </>
            ),
        });
        queryAll('dot').forEach((dot) => expect(dot).toHaveAttribute('tabindex', '-1'));
        screen.getByRole('button', { name: 'before' }).focus();
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
    });

    it('showMarkLabel 为 false', () => {
        renderSlider({ defaultValue: 30, marks: { 20: '20c', 40: '40c' }, showMarkLabel: false });
        expect(query('marks')).toBeNull();
        expect(screen.queryByText('20c')).toBeNull();
        expect(queryAll('dot')).toHaveLength(2);
    });

    it('aria-label 属性', () => {
        renderSlider({ 'aria-label': 'Volume slider', defaultValue: 30 });
        expect(screen.getByRole('slider', { name: 'Volume slider' })).toBeInTheDocument();
    });

    it('aria-valuetext 属性', () => {
        renderSlider({ 'aria-valuetext': '30 percent', defaultValue: 30 });
        expect(getInput()).toHaveAttribute('aria-valuetext', '30 percent');
    });

    it('getAriaValueText 返回正确的值', () => {
        const getAriaValueText = (value: number, index?: number) => `${value} percent at index ${index}`;
        renderSlider({ defaultValue: 30, getAriaValueText });
        expect(getInput()).toHaveAttribute('aria-valuetext', '30 percent at index 0');
    });

    it('range slider 的 getAriaValueText', () => {
        const getAriaValueText = (value: number, index?: number) => `${value}% (${index === 0 ? 'min' : 'max'})`;
        renderSlider({ defaultValue: [20, 60], getAriaValueText, range: true });
        const [min, max] = getInputs();
        expect(min).toHaveAttribute('aria-valuetext', '20% (min)');
        expect(max).toHaveAttribute('aria-valuetext', '60% (max)');
    });

    it('禁用的 slider 会禁用其输入，使其不在 Tab 顺序中', () => {
        renderSlider({ defaultValue: [20, 60], disabled: true, range: true });
        getInputs().forEach((input) => expect(input).toBeDisabled());
    });

    it('只有输入框是 Tab 停靠点，绘制滑块的元素不是且不被 Tooltip 描述', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        const [minInput, maxInput] = getInputs();
        await userEvent.tab();
        expect(minInput).toHaveFocus();
        await userEvent.tab();
        expect(maxInput).toHaveFocus();
        getHandles().forEach((handle) => {
            expect(handle).toHaveAttribute('tabindex', '-1');
            expect(handle).not.toHaveAttribute('aria-describedby');
        });
    });

    it('handle 的 mouseenter 和 mouseleave 显示与隐藏 tooltip', async () => {
        renderSlider({ defaultValue: 30 }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30'));
        await fireEvent.mouseLeave(getHandle());
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 最大值滑块的 focus 和 blur', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        const max = getInputs()[1] as HTMLInputElement;
        await tabTo(max);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        max.blur();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('垂直 slider 具有 aria-orientation 和竖排书写模式', async () => {
        const view = renderSlider({ defaultValue: 30, vertical: true });
        expect(getInput()).toHaveAttribute('aria-orientation', 'vertical');
        expect(getInput()).toHaveStyle({ writingMode: 'vertical-lr' });
        expect(getInput()).toHaveAttribute('dir', 'ltr');
        await view.rerender({ verticalReverse: true });
        expect(getInput()).toHaveAttribute('dir', 'rtl');
    });

    it('handle 输入携带值和边界', () => {
        renderSlider({ defaultValue: 50, max: 90, min: 10 });
        const input = getInput();
        expect(input).toHaveAttribute('type', 'range');
        expect(input).toHaveValue('50');
        expect(input).toHaveAttribute('min', '10');
        expect(input).toHaveAttribute('max', '90');
        // a native range already exposes them: ARIA in HTML says not to repeat them
        expect(input).not.toHaveAttribute('aria-valuenow');
        expect(input).not.toHaveAttribute('aria-valuemax');
    });

    it('受控 value 为 0 时初始值是 0，不取 defaultValue', () => {
        renderSlider({ defaultValue: 50, modelValue: 0 });
        expect(getInput()).toHaveValue('0');
    });

    it('两个范围输入都横跨 slider 边界，且一个滑块不能越过另一个', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], max: 100, min: 0, range: true, onChange: change });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        [minInput, maxInput].forEach((input) => {
            expect(input).toHaveAttribute('min', '0');
            expect(input).toHaveAttribute('max', '100');
        });
        expectValues(20, 60);
        await changeTo(minInput, 100);
        expectValues(60, 60);
        await changeTo(maxInput, 0);
        expectValues(60, 60);
        expect(change.mock.calls).toEqual([[[60, 60]]]);
    });

    it('track 样式根据 included 属性变化', () => {
        renderSlider({ defaultValue: 30, included: true });
        expect(query('track')).toHaveStyle({ width: '30%' });
    });

    it('垂直 slider 的 track 使用高度而非宽度', () => {
        renderSlider({ defaultValue: 30, vertical: true });
        expect(query('track')).toHaveStyle({ height: '30%' });
        expect(query('track').style.width).toBe('');
    });

    it('range slider 的 track 宽度为两个滑块之间的差值', () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        expect(query('track')).toHaveStyle({ width: '40%', left: '20%' });
    });

    it('verticalReverse 下的刻度', () => {
        renderSlider({ defaultValue: 30, marks: { 20: '20c', 40: '40c' }, vertical: true, verticalReverse: true });
        expect(query('marks-reverse')).not.toBeNull();
        expect(queryAll('mark-reverse')).toHaveLength(2);
    });

    it('区分范围 slider 的两个滑块的名称，且不在无 role 的外层容器上设置 label', () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        expect(query('wrapper')).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeStart })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeEnd })).toHaveValue('60');
    });

    it('范围 slider 把两端名称追加到调用方的 aria-label 后', () => {
        renderSlider({ 'aria-label': 'Price', defaultValue: [20, 60], range: true });
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 每个滑块的名称由分组标签加上各自的端点名组成', () => {
        render({
            render: () => (
                <>
                    <span id="price-label">Price</span>
                    <Slider aria-labelledby="price-label" defaultValue={[20, 60]} range />
                </>
            ),
        });
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 的端点名使用所选语言', () => {
        render({
            render: () => <ConfigProvider locale={en_US}>{() => <Slider defaultValue={[20, 60]} range />}</ConfigProvider>,
        });
        expect(screen.getByRole('slider', { name: 'Start' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'End' })).toBeInTheDocument();
    });

    it('handle 的 mouseover 与输入框聚焦检查 slider 是否在渲染树中', async () => {
        const sized = renderSlider({ defaultValue: 30, tooltipVisible: true }, SIZED);
        await findTooltip();
        await fireEvent.mouseOver(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        sized.unmount();

        // a slider without layout (e.g. inside a hidden container) is not in the render tree: its tooltip hides
        const noBoxes = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        onTestFinished(() => noBoxes.mockRestore());
        const hidden = renderSlider({ defaultValue: 30, tooltipVisible: true });
        await findTooltip();
        await fireEvent.mouseOver(getHandle());
        expect(getTooltip()).toBeNull();
        hidden.unmount();

        const focus = vi.fn<(event: FocusEvent) => void>();
        renderSlider({ defaultValue: 30, tooltipVisible: true, onFocus: focus });
        await findTooltip();
        getInput().focus();
        await nextTick();
        expect(getTooltip()).toBeNull();
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it('手柄 input 的 input 事件改值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onChange: change });
        await changeTo(getInput(), 31);
        expectValues(31);
        expect(change).toHaveBeenCalledWith(31);
    });

    it('handle 的触摸 pointer down 和 up', async () => {
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange });
        const handle = getHandle();
        await fireEvent.pointerDown(handle, touch({ clientX: 0, clientY: 10 }));
        expect(handle).toHaveClass(`${prefix}-handle-clicked`);
        await fireEvent.pointerUp(handle, touch());
        expect(handle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(afterChange).toHaveBeenCalledWith(30);
    });

    it('range slider 最大值滑块的事件', async () => {
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], range: true, onAfterChange: afterChange });
        const maxHandle = getHandles()[1] as HTMLElement;
        await fireEvent.mouseEnter(maxHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        await fireEvent.mouseLeave(maxHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());

        await fireEvent.pointerDown(maxHandle, touch({ clientX: 0, clientY: 10 }));
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        await fireEvent.pointerUp(maxHandle, touch());
        expect(maxHandle).not.toHaveClass(`${prefix}-handle-clicked`);

        const maxInput = getInputs()[1] as HTMLInputElement;
        await changeTo(maxInput, 59);
        expectValues(20, 59);
        await fireEvent.keyUp(maxInput, { key: 'ArrowLeft' });
        expect(afterChange).toHaveBeenLastCalledWith([20, 59]);
    });

    // the native disabled already tells the state; a fallback aria-label would replace the caller's label
    it('禁用的 slider 不另加 aria-label，保留 label 给出的名称', () => {
        render({
            render: () => (
                <>
                    <label for="volume">Volume</label>
                    <Slider id="volume" defaultValue={30} disabled />
                </>
            ),
        });
        expect(getInput()).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: 'Volume' })).toBeDisabled();
    });

    it('自定义 aria-label 在禁用时保留', () => {
        renderSlider({ 'aria-label': 'Custom label', defaultValue: 30, disabled: true });
        expect(getInput()).toHaveAttribute('aria-label', 'Custom label');
    });

    it('handle 的 pointerdown 聚焦输入框，mousedown 不移走焦点', async () => {
        renderSlider({ defaultValue: 30 });
        const handle = getHandle();
        await press(handle, { clientX: 30, clientY: 10 });
        expect(handle).toHaveClass(`${prefix}-handle-clicked`);
        expect(handle).toHaveStyle({ zIndex: 2 });
        expect(getInput()).toHaveFocus();
        const mousedown = await dispatch(handle, new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        expect(mousedown.defaultPrevented).toBe(true);
    });

    it('range slider 最小值滑块的 pointerdown', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        const [minHandle, maxHandle] = getHandles() as [HTMLElement, HTMLElement];
        await press(minHandle, { clientX: 20, clientY: 10 });
        expect(minHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).toHaveStyle({ zIndex: 2 });
        expect(maxHandle).toHaveStyle({ zIndex: 1 });

        await press(maxHandle, { clientX: 60, clientY: 10 });
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(maxHandle).toHaveStyle({ zIndex: 2 });
        expect(minHandle).toHaveStyle({ zIndex: 1 });
    });

    it('rail 点击', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await fireEvent.click(query('rail'), { clientX: 50, clientY: 10 });
        expectValues(50);
        expect(change).toHaveBeenCalledWith(50);
        expect(afterChange).toHaveBeenCalledWith(50);
    });

    it('track 点击', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onChange: change }, SIZED);
        await fireEvent.click(query('track'), { clientX: 20, clientY: 10 });
        expectValues(20);
        expect(change).toHaveBeenCalledWith(20);
    });

    it('带刻度时的 dot 点击', async () => {
        renderSlider({ defaultValue: 30, marks: { 20: '20c', 40: '40c', 60: '60c' } }, SIZED);
        const dots = queryAll('dot');
        expect(dots).toHaveLength(3);
        await fireEvent.click(dots[2] as HTMLElement, { clientX: 60, clientY: 10 });
        expectValues(60);
    });

    it('刻度标签点击', async () => {
        renderSlider({ defaultValue: 30, marks: { 20: '20c', 40: '40c' } }, SIZED);
        await fireEvent.click(screen.getByText('40c'), { clientX: 40, clientY: 10 });
        expectValues(40);
    });

    it('disabled 变化后禁用与恢复', async () => {
        const change = vi.fn<OnChange>();
        const view = renderSlider({ defaultValue: 30, onChange: change }, SIZED);
        expect(query('disabled')).toBeNull();
        await view.rerender({ disabled: true });
        expect(query('disabled')).not.toBeNull();
        await fireEvent.click(query('rail'), { clientX: 80 });
        expect(change).not.toHaveBeenCalled();
        await view.rerender({ disabled: false });
        expect(query('disabled')).toBeNull();
        await fireEvent.click(query('rail'), { clientX: 80 });
        expect(change).toHaveBeenCalledWith(80);
    });

    it('值低于 min 时夹到 min', () => {
        renderSlider({ min: 0, modelValue: -10 });
        expectValues(0);
        expect(getHandle()).toHaveStyle({ left: '0%' });
    });

    it('min 不为 0 且无值时，手柄初始位置在 min', () => {
        render({
            render: () => (
                <>
                    <Slider min={10} max={50} />
                    <Slider min={10} max={50} range />
                    <Slider min={-10} max={50} modelValue={0} />
                </>
            ),
        });
        expectValues(10, 10, 10, 0);
    });

    it('既无 modelValue 也无 defaultValue 时使用范围默认值', () => {
        renderSlider({ range: true });
        expectValues(0, 0);
    });

    it('既无 modelValue 也无 defaultValue 时使用单值默认值', () => {
        renderSlider();
        expectValues(0);
    });

    it('受控 slider 点击轨道只报告新值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ modelValue: 50, onChange: change }, SIZED);
        await fireEvent.click(query('rail'), { clientX: 80 });
        expect(change).toHaveBeenCalledWith(80);
        expectValues(50);
    });

    it('键盘聚焦显示格式化后的 tooltip，Tab 离开后隐藏', async () => {
        renderSlider({ defaultValue: 30, tipFormatter: (value: number) => `${value}%` }, SIZED);
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30%'));
        await changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 焦点从最大值滑块移到最小值滑块时 tooltip 随之切换', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        await tabTo(maxInput);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        await tabTo(minInput);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(1));
        expect(getTooltip()).toHaveTextContent('20');
    });

    it('range slider 最小值滑块 Tab 进入与 Shift+Tab 离开', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        await userEvent.tab();
        expect(getInputs()[0]).toHaveFocus();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20'));
        await userEvent.tab({ shift: true });
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 最小值滑块的触摸 pointer up', async () => {
        const afterChange = vi.fn<OnChange>();
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        renderSlider({ defaultValue: [20, 60], range: true, onAfterChange: afterChange, onMouseUp: mouseUp });
        await fireEvent.pointerDown(getHandles()[0] as HTMLElement, touch());
        await fireEvent.pointerUp(getHandles()[0] as HTMLElement, touch());
        expect(mouseUp).toHaveBeenCalledTimes(1);
        expect(afterChange).toHaveBeenCalledWith([20, 60]);
    });

    it('range slider 最小值滑块的 mouseleave', async () => {
        renderSlider({ defaultValue: [20, 60], range: true });
        const minHandle = getHandles()[0] as HTMLElement;
        await fireEvent.mouseEnter(minHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20'));
        await fireEvent.mouseLeave(minHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 最小值滑块的 keyup', async () => {
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], range: true, onAfterChange: afterChange });
        await fireEvent.keyUp(getInputs()[0] as HTMLInputElement, { key: 'ArrowRight' });
        expect(afterChange).toHaveBeenCalledWith([20, 60]);
    });

    it('handleDot 属性渲染 dot 元素', () => {
        renderSlider({ defaultValue: 30, handleDot: { size: '8px', color: 'red' } });
        const dot = query('handle-dot');
        expect(getHandle()).toContainElement(dot);
        expect(dot).toHaveStyle({ width: '8px', height: '8px', backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('range slider 的 handleDot 数组属性', () => {
        renderSlider({
            defaultValue: [20, 60],
            range: true,
            handleDot: [
                { size: '8px', color: 'red' },
                { size: '10px', color: 'blue' },
            ],
        });
        const [minHandle, maxHandle] = getHandles() as [HTMLElement, HTMLElement];
        expect(queryAll('handle-dot')).toHaveLength(2);
        const dotOf = (handle: HTMLElement) => handle.querySelector(`.${prefix}-handle-dot`);
        expect(dotOf(minHandle)).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        expect(dotOf(maxHandle)).toHaveStyle({ width: '10px', backgroundColor: 'rgb(0, 0, 255)' });
        expectTypeOf<NonNullable<SliderProps['handleDot']>>().toEqualTypeOf<HandleDot | HandleDot[]>();
    });

    it('range slider 传入单个 handleDot 对象时两个手柄都显示该圆点', () => {
        renderSlider({ defaultValue: [20, 60], range: true, handleDot: { size: '8px', color: 'red' } });
        const dots = queryAll('handle-dot');
        expect(dots).toHaveLength(2);
        dots.forEach((dot) => expect(dot).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' }));
    });

    it('mouseUp 在松开指针时触发一次，载荷为 pointerup 事件', async () => {
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        renderSlider({ defaultValue: 30, onMouseUp: mouseUp });
        const handle = getHandle();
        await press(handle, { clientX: 30, clientY: 10 });
        await release();
        expect(mouseUp).toHaveBeenCalledTimes(1);
        expect(mouseUp.mock.calls[0]?.[0].type).toBe('pointerup');
        expect(handle).not.toHaveClass(`${prefix}-handle-clicked`);
        await release();
        expect(mouseUp).toHaveBeenCalledTimes(1);
    });

    it('松开取值键时 mouseUp 的载荷为 KeyboardEvent', async () => {
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        renderSlider({ defaultValue: 30, onMouseUp: mouseUp });
        await fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(mouseUp.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    });

    // jsdom gives handles an empty rect, so a handle's centre is at clientX 0; pressing there keeps the drag offset at
    // zero and the handle follows the pointer exactly.
    it('拖动报告新值，松开后报告 afterChange', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 50, clientY: 10 });
        expect(change).toHaveBeenLastCalledWith(50);
        expectValues(50);
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query('track')).toHaveStyle({ width: '50%' });
        expect(afterChange).not.toHaveBeenCalled();
        await release({ clientX: 50, clientY: 10 });
        expect(afterChange).toHaveBeenCalledWith(50);
    });

    it('拖动中 pointermove 的默认行为被阻止', async () => {
        renderSlider({ defaultValue: 30 }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        const event = await dispatch(document.body, createEvent.pointerMove(document.body, { ...mouse, clientX: 40, clientY: 10 }));
        expect(event.defaultPrevented).toBe(true);
    });

    it('受控拖动只报告新值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ modelValue: 30, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 60, clientY: 10 });
        expect(change).toHaveBeenCalledWith(60);
        expectValues(30);
    });

    it('点击轨道时按指针位置吸附到最近的步进值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, step: 10, onChange: change }, SIZED);
        await fireEvent.click(query('rail'), { clientX: 47 });
        expect(change).toHaveBeenCalledWith(50);
        expectValues(50);
    });

    it('点击当前值不报告变化', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await fireEvent.click(query('rail'), { clientX: 30 });
        expect(change).not.toHaveBeenCalled();
        expect(afterChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('滚动容器不影响点击换算', async () => {
        const change = vi.fn<OnChange>();
        const { container } = render({
            render: () => (
                <div style={{ overflow: 'auto', height: '50px' }}>
                    <div style={{ height: '500px' }}>
                        <Slider defaultValue={30} onChange={change} style={SIZED} />
                    </div>
                </div>
            ),
        });
        (container.firstElementChild as HTMLElement).scrollTop = 100;
        await fireEvent.click(query('rail'), { clientX: 50 });
        expect(change).toHaveBeenCalledWith(50);
    });

    it('无 offsetParent 时按视口换算', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ onChange: change }, { ...SIZED, marginLeft: '20px' });
        await fireEvent.click(query('rail'), { clientX: 70 });
        expect(change).toHaveBeenCalledWith(50);
    });

    it('按 offsetParent 换算', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ onChange: change }, { ...SIZED, marginLeft: '100px' });
        // jsdom has no layout, so emulate a positioned parent 100px from the viewport edge
        const parent = document.createElement('div');
        parent.style.marginLeft = '100px';
        Object.defineProperty(query('wrapper'), 'offsetParent', { get: () => parent });
        await fireEvent.click(query('rail'), { clientX: 150 });
        expect(change).toHaveBeenCalledWith(50);
    });

    it('卸载后拖动监听解除', async () => {
        const change = vi.fn<OnChange>();
        const view = renderSlider({ defaultValue: 30, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        view.unmount();
        await move({ clientX: 50, clientY: 10 });
        await release();
        expect(change).not.toHaveBeenCalled();
    });

    it('aria-labelledby 传递给手柄输入框', () => {
        render({
            render: () => (
                <>
                    <span id="slider-label">Volume</span>
                    <Slider aria-labelledby="slider-label" defaultValue={30} />
                </>
            ),
        });
        expect(screen.getByRole('slider', { name: 'Volume' })).toBe(getHandle().querySelector('input'));
    });

    it('showArrow 为 false 时隐藏 tooltip 箭头', async () => {
        const view = renderSlider({ defaultValue: 30, tooltipVisible: true });
        expect(await findTooltip()).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
        view.unmount();

        renderSlider({ defaultValue: 30, showArrow: false, tooltipVisible: true });
        expect(await findTooltip()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-icon-arrow`)).toBeNull();
    });

    it('tipFormatter 返回格式化后的值', async () => {
        renderSlider({ defaultValue: 30, tipFormatter: (value: number) => `${value}%`, tooltipVisible: true });
        expect(await findTooltip()).toHaveTextContent('30%');
        await changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
    });

    it('tipFormatter 为 null 时隐藏 tooltip', async () => {
        renderSlider({ defaultValue: 30, tipFormatter: null }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await tabTo(getInput());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('小数 step', async () => {
        renderSlider({ defaultValue: 0.5, max: 1, min: 0, step: 0.1 });
        expectValues(0.5);
        expect(getInput()).toHaveAttribute('step', '0.1');
        await changeTo(getInput(), 0.6);
        expectValues(0.6);
    });

    it('#mark 插槽渲染刻度标签并收到刻度值与文本', () => {
        render(MarksSlot);
        expect(queryAll('mark')).toHaveLength(2);
        expect(document.querySelectorAll(`.${prefix}-mark .custom-mark`)).toHaveLength(2);
        expect(screen.getByText('20c@20').tagName).toBe('STRONG');
        expect(screen.getByText('40c@40')).toBeInTheDocument();
    });

    it('#mark 插槽同时用于 tooltipOnMark 的提示', async () => {
        render(MarksSlot, { props: { tooltipOnMark: true } });
        await userEvent.hover(queryAll('dot')[0] as HTMLElement);
        await waitFor(() => {
            const tips = [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)];
            expect(tips.some((tip) => tip.querySelector('.custom-mark')?.textContent === '20c@20')).toBe(true);
        });
    });

    it('#tip 插槽收到 tipFormatter 的结果与手柄', async () => {
        render(MarksSlot);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show .custom-tip`)).toHaveLength(2));
        const tips = [...document.querySelectorAll('.custom-tip')].map((tip) => tip.textContent);
        expect(tips).toEqual(['min:30%', 'max:60%']);
    });

    it('垂直范围 slider 带 verticalReverse', () => {
        renderSlider({ defaultValue: [20, 60], range: true, vertical: true, verticalReverse: true });
        const wrapper = query('wrapper');
        expect(wrapper).toHaveClass(`${prefix}-vertical-wrapper`);
        expect(wrapper).toHaveClass(`${prefix}-reverse`);
        const [minHandle, maxHandle] = getHandles();
        expect(minHandle).toHaveStyle({ top: '20%' });
        expect(maxHandle).toHaveStyle({ top: '60%' });
    });

    it('单值 slider 通过属性更新值并报告 afterChange', async () => {
        const afterChange = vi.fn<OnChange>();
        const view = renderSlider({ modelValue: 30, onAfterChange: afterChange });
        expectValues(30);
        await view.rerender({ modelValue: 50 });
        expectValues(50);
        expect(afterChange).toHaveBeenCalledWith(50);
    });

    it('range slider 中 included 为 false', () => {
        renderSlider({ defaultValue: [20, 60], included: false, range: true });
        expect(query('track').style.width).toBe('');
    });

    it('垂直 slider 带 showBoundary', async () => {
        renderSlider({ defaultValue: 30, showBoundary: true, vertical: true });
        await fireEvent.mouseEnter(query('vertical-wrapper'));
        expect(query('boundary')).toHaveClass(`${prefix}-boundary-show`);
        expect(query('boundary-max')).toHaveTextContent('100');
    });

    it('空的 marks 对象', () => {
        renderSlider({ defaultValue: 30, marks: {} });
        expect(queryAll('dot')).toHaveLength(0);
        expect(query('marks')).toBeNull();
    });

    it('rtl 方向下，滑块和 track 从右侧定位', () => {
        const view = renderRtl({ defaultValue: 30 });
        expect(getHandle()).toHaveStyle({ right: '30%' });
        expect(query('track')).toHaveStyle({ width: '30%', right: '0px' });
        view.unmount();

        renderRtl({ defaultValue: [20, 60], range: true });
        expect(query('track')).toHaveStyle({ width: '40%', right: '20%' });
    });

    it('data-* 与 title 透传到 wrapper', () => {
        renderSlider({ defaultValue: 30 }, undefined, {
            'data-kind': 'audio',
            'data-testid': 'volume',
            title: 'Volume',
        });
        const wrapper = query('wrapper');
        expect(screen.getByTestId('volume')).toBe(wrapper);
        expect(wrapper).toHaveAttribute('data-kind', 'audio');
        expect(wrapper).toHaveAttribute('title', 'Volume');
    });

    it('读取 semiGlobal.config.overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Slider: { step: 10, max: 50, defaultValue: 20 } };
        const view = renderSlider();
        expectValues(20);
        expect(query('boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('step', '10');
        expect(getInput()).toHaveAttribute('max', '50');
        view.unmount();
        renderSlider({ defaultValue: 5, step: 1 });
        expectValues(5);
        expect(getInput()).toHaveAttribute('step', '1');
    });

    it('全局默认值里的 id 不影响 Slider', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { Slider: { id: 'from-global' } } as object;
        const view = renderSlider();
        expect(getInput()).not.toHaveAttribute('id');
        view.unmount();
        renderSlider({ id: 'own' });
        expect(getInput()).toHaveAttribute('id', 'own');
    });

    it('读取 app 注入的全局默认值', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Slider: { range: true, defaultValue: [10, 40] } };
        render(Slider, { global: { provide: { [semiGlobalKey]: semi } } });
        expectValues(10, 40);
    });

    it('tipFormatter 与 getAriaValueText 的全局值每次读取，显式 null 不被全局值替换', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Slider: {
                tipFormatter: (value: number) => `${value} dB`,
                getAriaValueText: (value: number) => `${value}%`,
            },
        };
        const view = renderSlider({ defaultValue: 30, tooltipVisible: true });
        expect(await findTooltip()).toHaveTextContent('30 dB');
        expect(getInput()).toHaveAttribute('aria-valuetext', '30%');
        semiGlobal.config.overrideDefaultProps = {
            Slider: {
                tipFormatter: (value: number) => `${value} Hz`,
                getAriaValueText: (value: number) => `${value} pc`,
            },
        };
        await changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31 Hz');
        expect(getInput()).toHaveAttribute('aria-valuetext', '31 pc');
        view.unmount();

        renderSlider({ defaultValue: 30, tipFormatter: null }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('change 按值变化计数，afterChange 每次拖动只调用一次', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 40, clientY: 10 });
        await move({ clientX: 40, clientY: 10 });
        await move({ clientX: 45, clientY: 10 });
        await release();
        expect(change.mock.calls).toEqual([[40], [45]]);
        expect(afterChange.mock.calls).toEqual([[45]]);
        expectValues(45);
    });

    it('step 为 1 时取整后值不变的拖动不触发 change', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 40, onChange: change }, { width: '300px', height: '32px' });
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 121, clientY: 10 });
        await move({ clientX: 121, clientY: 10 });
        await release();
        expect(change).not.toHaveBeenCalled();
    });

    it('step 为 1 时取整后值不变的轨道点击不触发 change', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 40, onChange: change }, { width: '300px', height: '32px' });
        await fireEvent.click(query('rail'), { clientX: 121, clientY: 16 });
        expect(change).not.toHaveBeenCalled();
    });

    it('拖动时吸附到最近的步进值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, step: 10, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 64, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(60);
        expectValues(60);
    });

    it('拖动步数从 min 计算，即原生 range 输入的步进基准', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 25, min: 5, step: 10, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 64, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(65);
        expectValues(65);
    });

    it('拖动范围最大值滑块时不移动最小值滑块', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], range: true, onChange: change }, SIZED);
        await press(getHandles()[1] as HTMLElement, { clientX: 0, clientY: 10 });
        await move({ clientX: 80, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith([20, 80]);
        expectValues(20, 80);
    });

    it('垂直 slider 沿 y 轴拖动，verticalReverse 时反向', async () => {
        const vertical = { width: '4px', height: '100px' };
        const change = vi.fn<OnChange>();
        const view = renderSlider({ vertical: true, onChange: change }, vertical);
        await press(getHandle(), { clientX: 0, clientY: 0 });
        await move({ clientX: 0, clientY: 70 });
        await release();
        expect(change).toHaveBeenLastCalledWith(70);
        expect(getHandle()).toHaveStyle({ top: '70%' });
        view.unmount();

        renderSlider({ vertical: true, verticalReverse: true, onChange: change }, vertical);
        await fireEvent.click(query('rail'), { clientX: 0, clientY: 20 });
        expect(change).toHaveBeenLastCalledWith(80);
        expectValues(80);
    });

    it('仅高亮 included 范围内的刻度', async () => {
        const view = renderSlider({ defaultValue: [20, 60], marks: { 10: 'a', 40: 'b', 80: 'c' }, range: true });
        expect(queryAll('dot')).toHaveLength(3);
        expect(queryAll('dot-active')).toHaveLength(1);
        await view.rerender({ included: false });
        expect(queryAll('dot-active')).toHaveLength(3);
    });

    it('禁用的 slider 忽略拖动和 rail 点击', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, disabled: true, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        await move({ clientX: 60, clientY: 10 });
        await release();
        await fireEvent.click(query('rail'), { clientX: 80 });
        expect(change).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('v-model 的 slider 通过键盘和点击跟随父组件的值', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        render(Model, { props: { onChange: change, onAfterChange: afterChange } });
        await changeTo(getInput(), 31);
        expectValues(31);
        expect(screen.getByRole('status')).toHaveTextContent('31');
        expect(change.mock.calls).toEqual([[31]]);
        expect(afterChange.mock.calls).toEqual([[31]]);
        await fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(afterChange.mock.calls).toEqual([[31], [31]]);

        await fireEvent.click(query('rail'), { clientX: 70 });
        expectValues(70);
        expect(change).toHaveBeenLastCalledWith(70);
    });

    it('v-model 的 slider 拖动更新父组件的值，改回 undefined 时回到默认位置', async () => {
        const afterChange = vi.fn<OnChange>();
        render(Model, { props: { onAfterChange: afterChange } });
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 55, clientY: 10 });
        await release();
        expectValues(55);
        expect(screen.getByRole('status')).toHaveTextContent('55');
        afterChange.mockClear();
        await fireEvent.click(screen.getByRole('button', { name: 'reset' }));
        expectValues(0);
        expect(afterChange).not.toHaveBeenCalled();
    });

    it('受控范围值接收内容相同的新数组时不报告变化', async () => {
        const afterChange = vi.fn<OnChange>();
        const view = renderSlider({ modelValue: [20, 60], range: true, onAfterChange: afterChange });
        await view.rerender({ modelValue: [20, 60] });
        expect(afterChange).not.toHaveBeenCalled();
        await view.rerender({ modelValue: [10, 120] });
        expectValues(10, 100);
        expect(afterChange.mock.calls).toEqual([[[10, 120]]]);
    });

    it('单向绑定时输入框、拖动与点击只报告新值，手柄与输入框保持受控值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ modelValue: 30, onChange: change }, SIZED);
        await changeTo(getInput(), 31);
        expect(change).toHaveBeenLastCalledWith(31);
        expectValues(30);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 60, clientY: 10 });
        await release();
        await fireEvent.click(query('rail'), { clientX: 80 });
        expect(change).toHaveBeenLastCalledWith(80);
        expectValues(30);
        expect(getHandle()).toHaveStyle({ left: '30%' });
    });

    it('value 相关的 key 留在 slider 上：方向键由 slider 处理，Page、Home、End 保留原生默认行为；其他 key 传递给祖先元素', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', keydown);
        renderSlider({ defaultValue: 30 });
        const arrow = await dispatch(getInput(), new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
        expect(arrow.defaultPrevented).toBe(true);
        expect(getInput()).toHaveValue('31');
        const page = await dispatch(getInput(), new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
        expect(page.defaultPrevented).toBe(false);
        expect(keydown).not.toHaveBeenCalled();
        await fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(keydown).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', keydown);
    });

    it('onKeydown 在手柄上对每个按键各调用一次，value key 仍不传递给祖先元素', async () => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', ancestor);
        renderSlider({ defaultValue: 30 }, undefined, { onKeydown });
        await fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        await fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(onKeydown.mock.calls.map(([event]) => event.key)).toEqual(['ArrowRight', 'Tab']);
        expect(ancestor).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', ancestor);
    });

    it('onKeydown 调用 preventDefault 后，slider 不再独占该 value key', async () => {
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', ancestor);
        renderSlider({ defaultValue: 30 }, undefined, { onKeydown: (event: KeyboardEvent) => event.preventDefault() });
        await fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        expect(ancestor).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', ancestor);
    });

    it('带 Alt、Ctrl 或 Meta 的 value key 是浏览器快捷键，传递给祖先元素且不结束变化', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        const afterChange = vi.fn<OnChange>();
        document.addEventListener('keydown', keydown);
        renderSlider({ defaultValue: 30, onAfterChange: afterChange });
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            await fireEvent.keyDown(getInput(), { key: 'ArrowLeft', [modifier]: true });
            await fireEvent.keyUp(getInput(), { key: 'ArrowLeft', [modifier]: true });
        }
        expect(keydown).toHaveBeenCalledTimes(3);
        expect(afterChange).not.toHaveBeenCalled();
        document.removeEventListener('keydown', keydown);
    });

    it('禁用的 slider 忽略输入框的变化', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, disabled: true, onChange: change });
        await changeTo(getInput(), 31);
        expect(change).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('仅松开 value 相关的 key 时报告 afterChange', async () => {
        const afterChange = vi.fn<OnChange>();
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onMouseUp: mouseUp });
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await fireEvent.keyUp(getInput(), { key: 'Shift' });
        expect(afterChange).not.toHaveBeenCalled();
        expect(mouseUp).not.toHaveBeenCalled();
        await changeTo(getInput(), 31);
        await fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(afterChange.mock.calls).toEqual([[31]]);
        expect(mouseUp).toHaveBeenCalledTimes(1);
    });

    it('min 和 max 的变化同步到边界标签和滑块', async () => {
        const view = renderSlider({ defaultValue: 30, max: 100, min: 0, showBoundary: true });
        await view.rerender({ max: 50, min: 10 });
        expect(query('boundary-min')).toHaveTextContent('10');
        expect(query('boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('max', '50');
        await changeTo(getInput(), 50);
        expectValues(50);
    });

    it('id 命名滑块输入框（范围时为第一个），而非 wrapper', async () => {
        const view = renderSlider({ id: 'volume', defaultValue: 30 });
        expect(getInput()).toHaveAttribute('id', 'volume');
        expect(query('wrapper')).not.toHaveAttribute('id');
        view.unmount();

        renderSlider({ id: 'price', defaultValue: [20, 60], range: true });
        const [minInput, maxInput] = getInputs();
        expect(minInput).toHaveAttribute('id', 'price');
        expect(maxInput).not.toHaveAttribute('id');
    });

    it('modelValue 变为 undefined 时回到 defaultValue，没有时回到 min，不报告 afterChange', async () => {
        const afterChange = vi.fn<OnChange>();
        const view = renderSlider({
            defaultValue: [10, 20],
            modelValue: [30, 80],
            range: true,
            onAfterChange: afterChange,
        });
        expectValues(30, 80);
        await view.rerender({ modelValue: undefined });
        expectValues(10, 20);

        await view.rerender({ min: 5, defaultValue: undefined });
        await view.rerender({ modelValue: [30, 80] });
        afterChange.mockClear();
        await view.rerender({ modelValue: undefined });
        expectValues(5, 5);
        expect(afterChange).not.toHaveBeenCalled();
    });

    it('形状错误的受控范围值被忽略', async () => {
        const view = renderSlider({ modelValue: [20, 60], range: true });
        await view.rerender({ modelValue: [10, undefined] as unknown as number[] });
        expectValues(20, 60);
    });

    it('用触摸 pointer 拖动，拖动期间忽略其他 pointer', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        await fireEvent.pointerMove(document.body, touch({ pointerId: 7, clientX: 90, clientY: 10 }));
        expect(change).not.toHaveBeenCalled();
        await fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(change).toHaveBeenLastCalledWith(50);
        expectValues(50);
        await fireEvent.pointerUp(document.body, touch({ pointerId: 7 }));
        expect(afterChange).not.toHaveBeenCalled();
        await fireEvent.pointerUp(document.body, touch());
        expect(afterChange).toHaveBeenCalledWith(50);
    });

    it('pointer 被取消时结束拖动', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onAfterChange: afterChange, onChange: change }, SIZED);
        await fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        await fireEvent.pointerCancel(document.body, touch());
        await fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(afterChange).toHaveBeenCalledTimes(1);
        expect(change).not.toHaveBeenCalled();
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
    });

    it('window 监听绑定到同一个 AbortController 的 signal，拖动结束或卸载时中止', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const view = renderSlider({ defaultValue: 30 }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });

        const signalOf = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal;
        const dragCalls = () => addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls().map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel']);
        const signal = signalOf(dragCalls()[0]?.[2]) as AbortSignal;
        expect(dragCalls().every(([, , options]) => signalOf(options) === signal)).toBe(true);
        expect(signal.aborted).toBe(false);
        await release();
        expect(signal.aborted).toBe(true);

        await press(getHandle(), { clientX: 0, clientY: 10 });
        const second = signalOf(dragCalls().at(-1)?.[2]) as AbortSignal;
        expect(second).not.toBe(signal);
        view.unmount();
        expect(second.aborted).toBe(true);
    });

    it('showArrow 同时作用于范围的两个 tooltip', async () => {
        renderSlider({ defaultValue: [20, 60], range: true, showArrow: false, tooltipVisible: true });
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(2));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-with-arrow`)).toBeNull();
    });

    it('每个滑块都是原生 range 输入框，表单以 name 提交', async () => {
        const { container } = render({
            render: () => (
                <form>
                    <Slider {...{ name: 'volume' }} defaultValue={30} />
                    <Slider {...{ name: 'price' }} defaultValue={[20, 60]} range />
                </form>
            ),
        });
        const form = container.querySelector('form') as HTMLFormElement;
        expect(new FormData(form).getAll('volume')).toEqual(['30']);
        expect(new FormData(form).getAll('price')).toEqual(['20', '60']);
        await changeTo(getInputs()[0] as HTMLInputElement, 45);
        expect(new FormData(form).getAll('volume')).toEqual(['45']);
    });

    it('滑块输入框变化时移动该滑块并报告值', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: [20, 60], range: true, onChange: change });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        await changeTo(minInput, 40);
        expect(change).toHaveBeenLastCalledWith([40, 60]);
        await changeTo(maxInput, 10);
        expect(change).toHaveBeenLastCalledWith([40, 40]);
        expect([minInput.value, maxInput.value]).toEqual(['40', '40']);
    });

    it('受控 range 的新值两端都越界时，两个滑块都夹到边界内', async () => {
        const view = renderSlider({ modelValue: [10, 20], range: true });
        await view.rerender({ modelValue: [150, 200] });
        expectValues(100, 100);
        await view.rerender({ modelValue: [-50, -10] });
        expectValues(0, 0);
    });

    it('min 带小数时，拖动落在步长网格上的值不被再次取整', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 0.25, max: 10.25, min: 0.25, step: 0.5, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 5, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(0.75);
    });

    it('没有宽度的 slider 不报告 NaN', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onChange: change });
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 50, clientY: 10 });
        await release();
        await fireEvent.click(query('rail'), { clientX: 50 });
        expect(change).not.toHaveBeenCalled();
        expectValues(30);
    });
});

describe('Slider attrs 与事件', () => {
    it('aria 描述、错误状态与 name 落到每个手柄输入框，tabindex 与 aria-required 被丢弃', () => {
        renderSlider({ defaultValue: [20, 60], range: true }, undefined, {
            'aria-describedby': 'hint',
            'aria-invalid': 'true',
            'aria-errormessage': 'error',
            'aria-required': 'true',
            name: 'price',
            tabindex: 0,
        });
        getInputs().forEach((input) => {
            expect(input).toHaveAttribute('aria-describedby', 'hint');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', 'error');
            expect(input).toHaveAttribute('name', 'price');
            expect(input).not.toHaveAttribute('tabindex');
        });
        expect(document.querySelector('[aria-required]')).toBeNull();
        expect(query('wrapper')).not.toHaveAttribute('aria-describedby');
        expect(query('wrapper')).not.toHaveAttribute('tabindex');
    });

    it('focus 在每次手柄聚焦时触发，blur 只在焦点离开整个 Slider 时触发', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        render({
            render: () => (
                <>
                    <Slider defaultValue={[20, 60]} range onFocus={focus} onBlur={blur} />
                    <button type="button">after</button>
                </>
            ),
        });
        await userEvent.tab();
        await userEvent.tab();
        expect(getInputs()[1]).toHaveFocus();
        expect(focus).toHaveBeenCalledTimes(2);
        expect(focus.mock.calls[0]?.[0]).toBeInstanceOf(FocusEvent);
        expect(blur).not.toHaveBeenCalled();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
        expect(blur).toHaveBeenCalledTimes(1);
    });

    it('作为 hover Tooltip 的触发器时，外层 Tooltip 与 showBoundary 都随悬停生效', async () => {
        render(InTooltip);
        await userEvent.hover(query('wrapper'));
        await waitFor(() => expect(screen.getByText('outer tip')).toBeInTheDocument());
        expect(query('boundary')).toHaveClass(`${prefix}-boundary-show`);
        expect(getInput()).toHaveAttribute('aria-describedby');
        expect(query('wrapper')).not.toHaveAttribute('tabindex');
    });
});

describe('Slider 的指针边界', () => {
    it('max - min 不是 step 的整数倍时，拖到终点不超过 max', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 25, min: 5, step: 10, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 100, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(95);
        expectValues(95);
    });

    it('max - min 不是 step 的整数倍时，点击轨道末端不超过 max', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 0, max: 11, step: 3, onChange: change }, SIZED);
        await fireEvent.click(query('rail'), { clientX: 100, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith(9);
    });

    it.each([0, null])('step 为 %s 时指针按 1 取整，与原生 range 一致，不回报 NaN', async (step) => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, step, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 64, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(64);
        expectValues(64);
    });

    it('autofocus 聚焦起点手柄的 input，不落到外层 div', () => {
        const focus = vi.spyOn(HTMLElement.prototype, 'focus');
        renderSlider({ range: true, defaultValue: [10, 20] }, undefined, { autofocus: true });
        expect(focus.mock.contexts).toEqual([getInputs()[0]]);
        expect(getInputs()[0]).toHaveAttribute('autofocus');
        expect(getInputs()[1]).not.toHaveAttribute('autofocus');
        expect(query('wrapper')).not.toHaveAttribute('autofocus');
    });

    it('鼠标右键按下手柄不开始拖动', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        renderSlider({ defaultValue: 30, onChange: change, onAfterChange: afterChange }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10, button: 2 });
        await move({ clientX: 64, clientY: 10 });
        await release();
        expect(change).not.toHaveBeenCalled();
        expect(afterChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('拖动中途被禁用，松手仍结束拖动并报告 afterChange，重新启用后点击轨道恢复', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        const disabled = shallowRef(false);
        render({ render: () => <Slider defaultValue={30} disabled={disabled.value} onChange={change} onAfterChange={afterChange} style={SIZED} /> });
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 50, clientY: 10 });
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        disabled.value = true;
        await nextTick();
        await release();
        expect(afterChange).toHaveBeenCalledTimes(1);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        disabled.value = false;
        await nextTick();
        await fireEvent.click(query('rail'), { clientX: 80, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith(80);
    });

    it('点击刻度标签取该刻度的值，标签较宽时点到旁边也一样', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ defaultValue: 50, marks: { 20: '二十', 80: '八十' }, onChange: change }, SIZED);
        await fireEvent.click(screen.getByText('二十'), { clientX: 35, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith(20);
        expectValues(20);
    });

    it('range 点击刻度标签移动离该刻度近的手柄', async () => {
        const change = vi.fn<OnChange>();
        renderSlider({ range: true, defaultValue: [10, 90], marks: { 20: '二十', 80: '八十' }, onChange: change }, SIZED);
        await fireEvent.click(screen.getByText('八十'), { clientX: 60, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith([10, 80]);
        expectValues(10, 80);
    });
});
