import { StrictMode, createRef, useState } from 'react';
import { render, screen, fireEvent as testingFireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import SliderFoundation, { type HandleDot } from '@fibrae/semi-foundation/slider/foundation';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import { Form } from '@fibrae/semi-ui-react/form';
import Slider, { type SliderProps } from '..';

const mouse = { pointerId: 1, pointerType: 'mouse' };
// fireEvent is a function with helpers as own properties; only those are copied
const fireEvent = Object.assign({}, testingFireEvent, {
    mouseDown: (element, init) => testingFireEvent.pointerDown(element, { ...mouse, ...init }),
    mouseMove: (element, init) => testingFireEvent.pointerMove(element, { ...mouse, ...init }),
    mouseUp: (element, init) => testingFireEvent.pointerUp(element, { ...mouse, ...init }),
});
type OnChange = NonNullable<SliderProps['onChange']>;
const undeclared = (props: object) => props as unknown as SliderProps;
const touch = (init = {}) => ({ pointerId: 2, pointerType: 'touch', ...init });

const prefix = `${BASE_CLASS_PREFIX}-slider`;
// a hidden tooltip keeps its node until a CSS leave animation jsdom never fires; `-wrapper-show` marks it visible
const getTooltip = () => document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`);
const findTooltip = () =>
    waitFor(() => {
        expect(getTooltip()).not.toBeNull();
        return getTooltip();
    });
const getHandle = () => document.querySelector<HTMLElement>(`.${prefix}-handle`);
const getHandles = () => [...document.querySelectorAll<HTMLElement>(`.${prefix}-handle`)];
const getInput = () => screen.getByRole<HTMLInputElement>('slider');
const getInputs = () => screen.getAllByRole<HTMLInputElement>('slider');
// jsdom runs no key default action on a native range, so the change is fired directly
const changeTo = (input, value) => fireEvent.change(input, { target: { value: String(value) } });
// jsdom's :focus-visible heuristic misses focus moving between two inputs, so Tab is dispatched from the body
function tabTo(el) {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    void act(() => el.focus());
}
const query = (container, suffix) => container.querySelector(`.${prefix}-${suffix}`);
const queryAll = (container, suffix) => container.querySelectorAll(`.${prefix}-${suffix}`);
// rects derive from inline width/height/margin: with width 100 and no margin, clientX equals the value
const SIZED = { width: 100, height: 32 };

const expectValues = (...values) => expect(getInputs().map((input) => input.value)).toEqual(values.map(String));

describe('Slider', () => {
    it('范围值仅当两端都是数字时有效', () => {
        // the method is protected in the type
        const foundation = new SliderFoundation({} as unknown as ConstructorParameters<typeof SliderFoundation>[0]);
        expect(foundation['valueFormatIsCorrect']([10, 20])).toBe(true);
        expect(foundation['valueFormatIsCorrect']([10, undefined])).toBe(false);
        expect(foundation['valueFormatIsCorrect'](10)).toBe(true);
    });

    it('默认值与默认范围值', () => {
        render(
            <div>
                <div>Default</div>
                <Slider defaultValue={10} showBoundary />
                <Slider defaultValue={[20, 60]} range />
            </div>
        );

        const handles = getHandles();
        expect(handles[0]).toHaveStyle({ left: '10%' });
        expect(handles[1]).toHaveStyle({ left: '20%' });
        expect(handles[2]).toHaveStyle({ left: '60%' });
        expectValues(10, 20, 60);
    });

    it('onChange', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={{ width: 100, height: 32, marginLeft: 13 }} step={1} onChange={onChange} />);
        const rail = query(container, 'rail');

        fireEvent.click(rail, { clientX: 113, clientY: 16 });
        expectValues(100);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith(100);
        fireEvent.click(rail, { clientX: 13, clientY: 16 });
        expectValues(0);
        expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('range 的 onChange', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={{ width: 4, height: 400, marginLeft: 20, marginTop: 40 }} defaultValue={[20, 60]} range vertical onChange={onChange} />);
        const rail = query(container, 'rail');

        fireEvent.click(rail, { clientX: 22, clientY: 40 });
        expectValues(0, 60);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith([0, 60]);
        fireEvent.click(rail, { clientX: 22, clientY: 440 });
        expectValues(0, 100);
        expect(onChange).toHaveBeenLastCalledWith([0, 100]);
    });

    // a click on the rail moves the handle nearest to it, in every layout direction
    it.each([
        ['horizontal', {}, SIZED, { clientX: 25, clientY: 16 }, undefined],
        ['horizontal rtl', {}, SIZED, { clientX: 75, clientY: 16 }, 'rtl'],
        ['vertical', { vertical: true }, { width: 4, height: 400, marginLeft: 20, marginTop: 40 }, { clientX: 22, clientY: 140 }, undefined],
        ['vertical reverse', { vertical: true, verticalReverse: true }, { width: 4, height: 400, marginLeft: 20, marginTop: 40 }, { clientX: 22, clientY: 340 }, undefined],
    ])('范围轨道点击时移动最近的滑块：%s', (_name, props: SliderProps, style, point, direction) => {
        const slider = <Slider style={style} defaultValue={[20, 80]} step={1} range {...props} />;
        const { container } = render(direction ? <ConfigProvider direction={direction}>{slider}</ConfigProvider> : slider);
        fireEvent.click(query(container, 'rail'), point);
        expectValues(25, 80);
        // the second click lands past the maximum handle, which moves instead
        const key = props.vertical ? 'clientY' : 'clientX';
        const step = (props.vertical ? 4 : 1) * 60 * (props.verticalReverse || direction ? -1 : 1);
        fireEvent.click(query(container, 'rail'), { ...point, [key]: point[key] + step });
        expectValues(25, 85);
    });

    it('受控值', () => {
        const onChange = vi.fn<OnChange>();
        const { rerender } = render(<Slider step={1} value={10} onChange={onChange} />);

        expectValues(10);
        rerender(<Slider step={1} value={20} onChange={onChange} />);
        expectValues(20);
        rerender(<Slider step={1} value={100 + 1} onChange={onChange} />);
        expectValues(100);
        expect(getHandle()).toHaveStyle({ left: '100%' });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('有刻度标记', () => {
        const { container } = render(<Slider defaultValue={[0, 100]} marks={{ 20: '20c', 40: '40c' }} range />);
        expect(queryAll(container, 'dot')).toHaveLength(2);
    });

    it('刻度可点击', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={[0, 100]} marks={{ 20: '20c', 40: '40c' }} range onChange={onChange} />);
        expectValues(0, 100);
        fireEvent.click(queryAll(container, 'dot')[0], { clientX: 20 });
        expectValues(20, 100);
        expect(onChange).toHaveBeenLastCalledWith([20, 100]);
    });

    it('tooltipVisible 为 true 时，tooltip 始终显示，或始终不显示', async () => {
        const { unmount } = render(<Slider style={SIZED} defaultValue={30} tooltipVisible />);
        expect(await findTooltip()).toHaveTextContent('30');
        fireEvent.mouseEnter(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        unmount();

        render(<Slider style={SIZED} defaultValue={30} tooltipVisible={null} />);
        fireEvent.mouseEnter(getHandle());
        // give a tooltip the time it would need to show
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('垂直', () => {
        const { container } = render(<Slider defaultValue={30} vertical />);
        expect(query(container, 'vertical-wrapper')).not.toBeNull();
        expect(getHandle()).toHaveStyle({ top: '30%' });
    });

    it('step 属性', () => {
        render(<Slider defaultValue={30} step={10} />);
        expect(getInput()).toHaveAttribute('step', '10');
        changeTo(getInput(), 40);
        expectValues(40);
    });

    it('min 和 max 属性', () => {
        const { container } = render(<Slider defaultValue={30} max={50} min={10} />);
        expect(getInput()).toHaveAttribute('min', '10');
        expect(getInput()).toHaveAttribute('max', '50');
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query(container, 'boundary-min')).toHaveTextContent('10');
        expect(query(container, 'boundary-max')).toHaveTextContent('50');
    });

    it('included 属性', () => {
        const { container } = render(<Slider defaultValue={30} included={false} marks={{ 0: '0', 50: '50', 100: '100' }} />);
        expect(query(container, 'track').getAttribute('style')).toBeFalsy();
        // marks are only highlighted as part of an included track
        expect(queryAll(container, 'dot')).toHaveLength(3);
        expect(queryAll(container, 'dot-active')).toHaveLength(0);
    });

    it('railStyle 和 trackStyle 属性', () => {
        const railStyle = { backgroundColor: '#ccc' };
        const trackStyle = { backgroundColor: '#1890ff' };
        const { container } = render(<Slider railStyle={railStyle} {...undeclared({ trackStyle })} defaultValue={30} />);
        expect(query(container, 'rail')).toHaveStyle({ backgroundColor: 'rgb(204, 204, 204)' });
        // trackStyle is not a Slider prop: the track keeps only its computed geometry
        const track = query(container, 'track');
        expect(track).toHaveStyle({ width: '30%' });
        expect(track).not.toHaveStyle({ backgroundColor: 'rgb(24, 144, 255)' });
    });

    it('handleStyle 属性', () => {
        const handleStyle = { borderColor: '#1890ff' };
        render(<Slider {...undeclared({ handleStyle })} defaultValue={30} />);
        // handleStyle is not a Slider prop: the handle keeps only its computed position
        const handle = getHandle();
        expect(handle).toHaveStyle({ left: '30%' });
        expect(handle).not.toHaveStyle({ borderColor: 'rgb(24, 144, 255)' });
    });

    it('范围受控值', () => {
        const onChange = vi.fn<OnChange>();
        const { rerender } = render(<Slider value={[20, 60]} range onChange={onChange} />);
        expectValues(20, 60);

        rerender(<Slider value={[30, 70]} range onChange={onChange} />);
        expectValues(30, 70);
    });

    it('简单值的刻度', () => {
        const marks = {
            0: '0°C',
            26: '26°C',
            37: '37°C',
            100: '100°C',
        };
        const { container } = render(<Slider defaultValue={37} marks={marks} />);
        expect(queryAll(container, 'dot')).toHaveLength(4);
        expect(queryAll(container, 'dot-active')).toHaveLength(3);
        expect(screen.getByText('26°C')).toHaveStyle({ left: '26%' });
    });

    it('className 和 style 属性', () => {
        const { container } = render(<Slider className="custom-slider" style={{ width: 300 }} defaultValue={30} />);
        const wrapper = container.querySelector('.custom-slider');
        expect(wrapper).toHaveClass(`${prefix}-wrapper`);
        expect(wrapper).toHaveStyle({ width: '300px' });
    });

    it('showBoundary 属性', () => {
        const { container } = render(<Slider defaultValue={30} showBoundary />);
        const boundary = query(container, 'boundary');
        expect(boundary).not.toBeNull();
        expect(query(container, 'boundary-min')).toHaveTextContent(/^0$/);
        expect(query(container, 'boundary-max')).toHaveTextContent(/^100$/);
        // the boundary values show while the pointer is over the slider
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
        fireEvent.mouseEnter(query(container, 'wrapper'));
        expect(boundary).toHaveClass(`${prefix}-boundary-show`);
        fireEvent.mouseLeave(query(container, 'wrapper'));
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
    });

    it('tooltipOnMark 属性', async () => {
        const marks = { 20: '20c', 40: '40c' };
        const { container } = render(<Slider defaultValue={30} marks={marks} tooltipOnMark />);
        await userEvent.hover(queryAll(container, 'dot')[0]);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20c'));
    });

    it('tooltipOnMark 的刻度点不是 Tab 停靠点', async () => {
        const marks = { 20: '20c', 40: '40c' };
        const { container } = render(
            <div>
                <button type="button">before</button>
                <Slider defaultValue={30} marks={marks} tooltipOnMark />
            </div>
        );
        queryAll(container, 'dot').forEach((dot) => expect(dot).toHaveAttribute('tabindex', '-1'));
        screen.getByRole('button', { name: 'before' }).focus();
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
    });

    it('showMarkLabel 为 false', () => {
        const marks = { 20: '20c', 40: '40c' };
        const { container } = render(<Slider defaultValue={30} marks={marks} showMarkLabel={false} />);
        expect(query(container, 'marks')).toBeNull();
        expect(screen.queryByText('20c')).toBeNull();
        expect(queryAll(container, 'dot')).toHaveLength(2);
    });

    it('aria-label 属性', () => {
        render(<Slider aria-label="Volume slider" defaultValue={30} />);
        expect(screen.getByRole('slider', { name: 'Volume slider' })).toBeInTheDocument();
    });

    it('aria-valuetext 属性', () => {
        render(<Slider aria-valuetext="30 percent" defaultValue={30} />);
        expect(getInput()).toHaveAttribute('aria-valuetext', '30 percent');
    });

    it('getAriaValueText 返回正确的值', () => {
        const getAriaValueText = (value, index) => `${value} percent at index ${index}`;
        render(<Slider defaultValue={30} getAriaValueText={getAriaValueText} />);
        expect(getInput()).toHaveAttribute('aria-valuetext', '30 percent at index 0');
    });

    it('range slider 的 getAriaValueText', () => {
        const getAriaValueText = (value, index) => `${value}% (${index === 0 ? 'min' : 'max'})`;
        render(<Slider defaultValue={[20, 60]} getAriaValueText={getAriaValueText} range />);
        const inputs = getInputs();
        expect(inputs[0]).toHaveAttribute('aria-valuetext', '20% (min)');
        expect(inputs[1]).toHaveAttribute('aria-valuetext', '60% (max)');
    });

    it('禁用的 slider 会禁用其输入，使其不在 Tab 顺序中', () => {
        render(<Slider defaultValue={[20, 60]} disabled range />);
        getInputs().forEach((input) => expect(input).toBeDisabled());
    });

    it('只有输入框是 Tab 停靠点，绘制滑块的元素不是', async () => {
        render(<Slider defaultValue={[20, 60]} range />);
        const [minInput, maxInput] = getInputs();
        await userEvent.tab();
        expect(minInput).toHaveFocus();
        await userEvent.tab();
        expect(maxInput).toHaveFocus();
        getHandles().forEach((handle) => expect(handle).toHaveAttribute('tabindex', '-1'));
    });

    it('handle 的 mouseenter 和 mouseleave 事件', async () => {
        render(<Slider style={SIZED} defaultValue={30} />);
        const handle = getHandle();

        fireEvent.mouseEnter(handle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30'));

        fireEvent.mouseLeave(handle);
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 最大值滑块的 focus 和 blur', async () => {
        render(<Slider defaultValue={[20, 60]} range />);
        const inputs = getInputs();

        tabTo(inputs[1]);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));

        act(() => inputs[1].blur());
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('垂直 slider 具有 aria-orientation 和竖排书写模式', () => {
        const { rerender } = render(<Slider defaultValue={30} vertical />);
        expect(getInput()).toHaveAttribute('aria-orientation', 'vertical');
        expect(getInput()).toHaveStyle({ writingMode: 'vertical-lr' });
        expect(getInput()).toHaveAttribute('dir', 'ltr');
        rerender(<Slider defaultValue={30} vertical verticalReverse />);
        expect(getInput()).toHaveAttribute('dir', 'rtl');
    });

    it('handle 输入携带值和边界', () => {
        render(<Slider defaultValue={50} max={90} min={10} />);
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
        render(<Slider defaultValue={50} value={0} />);
        expect(getInput()).toHaveValue('0');
    });

    it('两个范围输入都横跨 slider 边界，且一个滑块不能越过另一个', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider defaultValue={[20, 60]} max={100} min={0} range onChange={onChange} />);
        const [minInput, maxInput] = getInputs();
        [minInput, maxInput].forEach((input) => {
            expect(input).toHaveAttribute('min', '0');
            expect(input).toHaveAttribute('max', '100');
        });
        expectValues(20, 60);
        changeTo(minInput, 100);
        expectValues(60, 60);
        changeTo(maxInput, 0);
        expectValues(60, 60);
        expect(onChange.mock.calls).toEqual([[[60, 60]]]);
    });

    it('track 样式根据 included 属性变化', () => {
        const { container } = render(<Slider defaultValue={30} included />);
        expect(query(container, 'track')).toHaveStyle({ width: '30%' });
    });

    it('垂直 slider 的 track 使用高度而非宽度', () => {
        const { container } = render(<Slider defaultValue={30} vertical />);
        const track = query(container, 'track');
        expect(track).toHaveStyle({ height: '30%' });
        expect(track.style.width).toBe('');
    });

    it('range slider 的 track 宽度为两个滑块之间的差值', () => {
        const { container } = render(<Slider defaultValue={[20, 60]} range />);
        expect(query(container, 'track')).toHaveStyle({ width: '40%', left: '20%' });
    });

    it('verticalReverse 下的刻度', () => {
        const marks = { 20: '20c', 40: '40c' };
        const { container } = render(<Slider defaultValue={30} marks={marks} vertical verticalReverse />);
        expect(query(container, 'marks-reverse')).not.toBeNull();
        expect(queryAll(container, 'mark-reverse')).toHaveLength(2);
    });

    it('区分范围 slider 的两个滑块的名称，且不在无 role 的外层容器上设置 label', () => {
        const { container } = render(<Slider defaultValue={[20, 60]} range />);
        expect(query(container, 'wrapper')).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeStart })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeEnd })).toHaveValue('60');
    });

    it('范围 slider 把两端名称追加到调用方的 aria-label 后', () => {
        render(<Slider aria-label="Price" defaultValue={[20, 60]} range />);
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 每个滑块的名称由分组标签加上各自的端点名组成', () => {
        render(
            <div>
                <span id="price-label">Price</span>
                <Slider aria-labelledby="price-label" defaultValue={[20, 60]} range />
            </div>
        );
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 的端点名使用所选语言', () => {
        render(
            <ConfigProvider locale={en_US}>
                <Slider defaultValue={[20, 60]} range />
            </ConfigProvider>
        );
        expect(screen.getByRole('slider', { name: 'Start' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'End' })).toBeInTheDocument();
    });

    it('handle 的 mouseOver 触发 isInRenderTree 检查', async () => {
        const { unmount } = render(<Slider style={SIZED} defaultValue={30} tooltipVisible />);
        await findTooltip();
        fireEvent.mouseOver(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        unmount();

        // a slider without layout (e.g. inside a hidden container) is not in the render tree: its tooltip hides
        const noBoxes = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        onTestFinished(() => noBoxes.mockRestore());
        const { unmount: unmountHidden } = render(<Slider defaultValue={30} tooltipVisible />);
        await findTooltip();
        fireEvent.mouseOver(getHandle());
        expect(getTooltip()).toBeNull();
        unmountHidden();
        const onFocus = vi.fn<(event: unknown) => void>();
        render(<Slider defaultValue={30} tooltipVisible onFocus={onFocus} />);
        await findTooltip();
        act(() => getInput().focus());
        expect(getTooltip()).toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('handle 输入的 change 事件', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider defaultValue={30} onChange={onChange} />);

        changeTo(getInput(), 31);
        expectValues(31);
        expect(onChange).toHaveBeenCalledWith(31);
    });

    it('handle 的触摸 pointer down 和 up 事件', () => {
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider defaultValue={30} onAfterChange={onAfterChange} />);
        const handle = getHandle();

        fireEvent.pointerDown(handle, touch({ clientX: 0, clientY: 10 }));
        expect(handle).toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.pointerUp(handle, touch());
        expect(handle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(onAfterChange).toHaveBeenCalledWith(30);
    });

    it('range slider 最大值滑块的事件', async () => {
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider defaultValue={[20, 60]} range onAfterChange={onAfterChange} />);
        const maxHandle = getHandles()[1];

        fireEvent.mouseEnter(maxHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));

        fireEvent.mouseLeave(maxHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());

        fireEvent.pointerDown(maxHandle, touch({ clientX: 0, clientY: 10 }));
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.pointerUp(maxHandle, touch());
        expect(maxHandle).not.toHaveClass(`${prefix}-handle-clicked`);

        const maxInput = getInputs()[1];
        changeTo(maxInput, 59);
        expectValues(20, 59);
        fireEvent.keyUp(maxInput, { key: 'ArrowLeft' });
        expect(onAfterChange).toHaveBeenLastCalledWith([20, 59]);
    });

    it('禁用时保留 <label for> 给出的名称', () => {
        render(
            <>
                <label htmlFor="volume">Volume</label>
                <Slider id="volume" defaultValue={30} disabled />
            </>
        );
        expect(screen.getByRole('slider', { name: 'Volume' })).toBeDisabled();
    });

    it('自定义 aria-label 覆盖禁用时的默认值', () => {
        render(<Slider aria-label="Custom label" defaultValue={30} disabled />);
        expect(getInput()).toHaveAttribute('aria-label', 'Custom label');
    });

    it('handle 的 mouseDown 事件', () => {
        render(<Slider defaultValue={30} />);
        const handle = getHandle();

        fireEvent.mouseDown(handle, { clientX: 30, clientY: 10 });
        expect(handle).toHaveClass(`${prefix}-handle-clicked`);
        expect(handle).toHaveStyle({ zIndex: 2 });
        // pressing a handle focuses its input, and the compatibility mousedown does not move focus to the span
        expect(getInput()).toHaveFocus();
        expect(testingFireEvent.mouseDown(handle)).toBe(false);
    });

    it('range slider 最小值滑块的 mouseDown', () => {
        render(<Slider defaultValue={[20, 60]} range />);
        const [minHandle, maxHandle] = getHandles();

        fireEvent.mouseDown(minHandle, { clientX: 20, clientY: 10 });
        expect(minHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).toHaveStyle({ zIndex: 2 });
        expect(maxHandle).toHaveStyle({ zIndex: 1 });

        fireEvent.mouseDown(maxHandle, { clientX: 60, clientY: 10 });
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(maxHandle).toHaveStyle({ zIndex: 2 });
        expect(minHandle).toHaveStyle({ zIndex: 1 });
    });

    it('rail 点击事件', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.click(query(container, 'rail'), { clientX: 50, clientY: 10 });
        expectValues(50);
        expect(onChange).toHaveBeenCalledWith(50);
        expect(onAfterChange).toHaveBeenCalledWith(50);
    });

    it('track 点击事件', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} onChange={onChange} />);

        fireEvent.click(query(container, 'track'), { clientX: 20, clientY: 10 });
        expectValues(20);
        expect(onChange).toHaveBeenCalledWith(20);
    });

    it('带刻度时的 dot 点击事件', () => {
        const marks = { 20: '20c', 40: '40c', 60: '60c' };
        const { container } = render(<Slider style={SIZED} defaultValue={30} marks={marks} />);
        const dots = queryAll(container, 'dot');
        expect(dots).toHaveLength(3);

        fireEvent.click(dots[2], { clientX: 60, clientY: 10 });
        expectValues(60);
    });

    it('刻度标签点击事件', () => {
        const marks = { 20: '20c', 40: '40c' };
        render(<Slider style={SIZED} defaultValue={30} marks={marks} />);

        fireEvent.click(screen.getByText('40c'), { clientX: 40, clientY: 10 });
        expectValues(40);
    });

    it('componentDidUpdate 处理 disabled 变化', () => {
        const onChange = vi.fn<OnChange>();
        const { container, rerender } = render(<Slider style={SIZED} defaultValue={30} onChange={onChange} />);
        expect(query(container, 'disabled')).toBeNull();

        rerender(<Slider style={SIZED} defaultValue={30} disabled onChange={onChange} />);
        expect(query(container, 'disabled')).not.toBeNull();
        fireEvent.click(query(container, 'rail'), { clientX: 80 });
        expect(onChange).not.toHaveBeenCalled();

        rerender(<Slider style={SIZED} defaultValue={30} disabled={false} onChange={onChange} />);
        expect(query(container, 'disabled')).toBeNull();
        fireEvent.click(query(container, 'rail'), { clientX: 80 });
        expect(onChange).toHaveBeenCalledWith(80);
    });

    it('值边界：值低于 min', () => {
        render(<Slider min={0} value={-10} />);
        expectValues(0);
        expect(getHandle()).toHaveStyle({ left: '0%' });
    });

    it('min 不为 0 且无 value 时，手柄初始位置在 min', () => {
        // init() clamps after mount, so only the state of the first render tells the initial position
        expect(SliderFoundation.getInitialState({ min: 10, max: 50 }).currentValue).toBe(10);
        expect(SliderFoundation.getInitialState({ min: 10, max: 50, range: true }).currentValue).toEqual([10, 10]);
        expect(SliderFoundation.getInitialState({ min: -10, max: 50, value: 0 }).currentValue).toBe(0);
    });

    it('既无 value 也无 defaultValue 时使用范围默认值', () => {
        render(<Slider range />);
        expectValues(0, 0);
    });

    it('既无 value 也无 defaultValue 时使用单值默认值', () => {
        render(<Slider />);
        expectValues(0);
    });

    it('受控的 value 属性触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} value={50} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 80 });
        expect(onChange).toHaveBeenCalledWith(80);
        expectValues(50);
    });

    it('handle 的 focus 事件', async () => {
        render(<Slider style={SIZED} defaultValue={30} tipFormatter={(v) => `${v}%`} />);

        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30%'));

        changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');

        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 第二个滑块的 focus/blur 事件', async () => {
        render(<Slider defaultValue={[20, 60]} range />);
        const [minInput, maxInput] = getInputs();

        tabTo(maxInput);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        tabTo(minInput);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(1));
        expect(getTooltip()).toHaveTextContent('20');
    });

    it('range slider 第一个（最小值）滑块的 focus/blur 事件', async () => {
        render(<Slider defaultValue={[20, 60]} range />);

        await userEvent.tab();
        expect(getInputs()[0]).toHaveFocus();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20'));

        await userEvent.tab({ shift: true });
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 第一个（最小值）滑块的触摸 pointer up 事件', () => {
        const onAfterChange = vi.fn<OnChange>();
        const onMouseUp = vi.fn<(e: unknown) => void>();
        render(<Slider defaultValue={[20, 60]} range onAfterChange={onAfterChange} onMouseUp={onMouseUp} />);

        fireEvent.pointerDown(getHandles()[0], touch());
        fireEvent.pointerUp(getHandles()[0], touch());
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(onAfterChange).toHaveBeenCalledWith([20, 60]);
    });

    it('range slider 第一个（最小值）滑块的 mouseLeave 事件', async () => {
        render(<Slider defaultValue={[20, 60]} range />);
        const minHandle = getHandles()[0];

        fireEvent.mouseEnter(minHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20'));
        fireEvent.mouseLeave(minHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range slider 第一个（最小值）滑块的 keyUp 事件', () => {
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider defaultValue={[20, 60]} range onAfterChange={onAfterChange} />);

        fireEvent.keyUp(getInputs()[0], { key: 'ArrowRight' });
        expect(onAfterChange).toHaveBeenCalledWith([20, 60]);
    });

    it('handleDot 属性渲染 dot 元素', () => {
        const { container } = render(<Slider defaultValue={30} handleDot={{ size: '8px', color: 'red' }} />);
        const dot = query(container, 'handle-dot');
        expect(getHandle()).toContainElement(dot);
        expect(dot).toHaveStyle({ width: '8px', height: '8px', backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('range slider 的 handleDot 数组属性', () => {
        const { container } = render(
            <Slider
                defaultValue={[20, 60]}
                range
                handleDot={[
                    { size: '8px', color: 'red' },
                    { size: '10px', color: 'blue' },
                ]}
            />
        );
        const [minHandle, maxHandle] = getHandles();
        expect(queryAll(container, 'handle-dot')).toHaveLength(2);
        const dotOf = (handle) => handle.querySelector(`.${prefix}-handle-dot`);
        expect(dotOf(minHandle)).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        expect(dotOf(maxHandle)).toHaveStyle({ width: '10px', backgroundColor: 'rgb(0, 0, 255)' });
        expectTypeOf<NonNullable<SliderProps['handleDot']>>().toEqualTypeOf<HandleDot | HandleDot[]>();
    });

    it('range slider 传入单个 handleDot 对象时两个手柄都显示该圆点', () => {
        const { container } = render(<Slider defaultValue={[20, 60]} range handleDot={{ size: '8px', color: 'red' }} />);
        const dots = queryAll(container, 'handle-dot');
        expect(dots).toHaveLength(2);
        dots.forEach((dot) => expect(dot).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' }));
    });

    it('触发 onMouseUp 回调', () => {
        const onMouseUp = vi.fn<(e: unknown) => void>();
        render(<Slider defaultValue={30} onMouseUp={onMouseUp} />);
        const handle = getHandle();

        fireEvent.mouseDown(handle, { clientX: 30, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(handle).not.toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.mouseUp(window);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
    });

    // jsdom handles have an empty rect (centre at clientX 0), so the drag offset stays zero
    it('handle 拖动时 mouseMove 触发 notifyChange', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });

        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        expect(onChange).toHaveBeenLastCalledWith(50);
        expectValues(50);
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query(container, 'track')).toHaveStyle({ width: '50%' });
        expect(onAfterChange).not.toHaveBeenCalled();

        fireEvent.mouseUp(window, { clientX: 50, clientY: 10 });
        expect(onAfterChange).toHaveBeenCalledWith(50);
    });

    it('拖动期间调用 adapter 的 setEventDefault', () => {
        render(<Slider style={SIZED} defaultValue={30} />);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        expect(fireEvent.mouseMove(document.body, { clientX: 40, clientY: 10 })).toBe(false);
    });

    it('clickTrack=false 且为受控值时，adapter 的 onHandleMove 返回 false', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} value={30} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 60, clientY: 10 });
        expect(onChange).toHaveBeenCalledWith(60);
        expectValues(30);
    });

    it('点击轨道时根据指针位置计算值', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} step={10} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 47 });
        expect(onChange).toHaveBeenCalledWith(50);
        expectValues(50);
    });

    it('transPosToValue 返回 false 时，adapter 的 onHandleMove 提前返回', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 30 });
        expect(onChange).not.toHaveBeenCalled();
        expect(onAfterChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('adapter 的 getScrollParentVal 返回滚动值', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(
            <div style={{ overflow: 'auto', height: 50 }}>
                <div style={{ height: 500 }}>
                    <Slider style={SIZED} defaultValue={30} onChange={onChange} />
                </div>
            </div>
        );
        (container.firstChild as HTMLElement).scrollTop = 100;
        fireEvent.click(query(container, 'rail'), { clientX: 50 });
        expect(onChange).toHaveBeenCalledWith(50);
    });

    it('有外边距时，点击位置按 offsetParent 的偏移换算', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={{ ...SIZED, marginLeft: 20 }} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 70 });
        expect(onChange).toHaveBeenCalledWith(50);
    });

    it('offsetParent 存在时，点击位置减去其 DOMRect 的偏移', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={{ ...SIZED, marginLeft: 100 }} onChange={onChange} />);

        // jsdom has no layout, so emulate a positioned parent 100px from the viewport edge
        const parent = document.createElement('div');
        parent.style.marginLeft = '100px';
        Object.defineProperty(query(container, 'wrapper'), 'offsetParent', { get: () => parent });

        fireEvent.click(query(container, 'rail'), { clientX: 150 });
        expect(onChange).toHaveBeenCalledWith(50);
    });

    it('目标没有 addEventListener 时，_addEventListener 返回空函数', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(<Slider style={SIZED} defaultValue={30} onChange={onChange} />);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        unmount();
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('aria-labelledby 属性传递给 handle', () => {
        render(
            <div>
                <span id="slider-label">Volume</span>
                <Slider aria-labelledby="slider-label" defaultValue={30} />
            </div>
        );
        expect(screen.getByRole('slider', { name: 'Volume' })).toBe(getHandle().querySelector('input'));
    });

    it('showArrow 为 false 时隐藏 tooltip 箭头', async () => {
        const { unmount } = render(<Slider defaultValue={30} tooltipVisible />);
        expect(await findTooltip()).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
        unmount();

        render(<Slider defaultValue={30} showArrow={false} tooltipVisible />);
        expect(await findTooltip()).not.toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-icon-arrow`)).toBeNull();
    });

    it('tipFormatter 返回格式化后的值', async () => {
        const tipFormatter = (value) => `${value}%`;
        render(<Slider defaultValue={30} tipFormatter={tipFormatter} tooltipVisible />);
        expect(await findTooltip()).toHaveTextContent('30%');
        changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
    });

    it('tipFormatter 对每个手柄单独调用，参数是 number', async () => {
        expectTypeOf<Parameters<NonNullable<SliderProps['tipFormatter']>>[0]>().toEqualTypeOf<number>();
        const tipFormatter = vi.fn<(value: number) => string>((value) => value.toFixed(1));
        render(<Slider defaultValue={[20, 60]} range tipFormatter={tipFormatter} tooltipVisible />);
        await waitFor(() => expect(document.body).toHaveTextContent('60.0'));
        expect(document.body).toHaveTextContent('20.0');
        tipFormatter.mock.calls.forEach(([value]) => expect(typeof value).toBe('number'));
    });

    it('tipFormatter 返回 null 时隐藏 tooltip', async () => {
        render(<Slider style={SIZED} defaultValue={30} tipFormatter={null} />);
        fireEvent.mouseEnter(getHandle());
        tabTo(getInput());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('小数 step', () => {
        render(<Slider defaultValue={0.5} max={1} min={0} step={0.1} />);
        expectValues(0.5);
        expect(getInput()).toHaveAttribute('step', '0.1');

        changeTo(getInput(), 0.6);
        expectValues(0.6);
    });

    it('刻度值为 React 元素', () => {
        const marks: SliderProps['marks'] = {
            20: (
                <span className="custom-mark" style={{ color: 'red' }}>
                    20
                </span>
            ),
            40: <strong>40</strong>,
        };
        const { container } = render(<Slider defaultValue={30} marks={marks} />);
        expect(queryAll(container, 'mark')).toHaveLength(2);
        expect(container.querySelectorAll('.custom-mark')).toHaveLength(1);
        expect(screen.getByText('20')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByText('40').tagName).toBe('STRONG');
    });

    it('垂直范围 slider 带 verticalReverse', () => {
        const { container } = render(<Slider defaultValue={[20, 60]} range vertical verticalReverse />);
        const wrapper = query(container, 'wrapper');
        expect(wrapper).toHaveClass(`${prefix}-vertical-wrapper`);
        expect(wrapper).toHaveClass(`${prefix}-reverse`);
        const [minHandle, maxHandle] = getHandles();
        expect(minHandle).toHaveStyle({ top: '20%' });
        expect(maxHandle).toHaveStyle({ top: '60%' });
    });

    it('单值 slider 通过属性更新值', () => {
        const onAfterChange = vi.fn<OnChange>();
        const { rerender } = render(<Slider value={30} onAfterChange={onAfterChange} />);
        expectValues(30);

        rerender(<Slider value={50} onAfterChange={onAfterChange} />);
        expectValues(50);
        expect(onAfterChange).toHaveBeenCalledWith(50);
    });

    it('range slider 中 included 为 false', () => {
        const { container } = render(<Slider defaultValue={[20, 60]} included={false} range />);
        expect(query(container, 'track').style.width).toBe('');
    });

    it('垂直 slider 带 showBoundary', () => {
        const { container } = render(<Slider defaultValue={30} showBoundary vertical />);
        const wrapper = query(container, 'vertical-wrapper');
        fireEvent.mouseEnter(wrapper);
        expect(query(container, 'boundary')).toHaveClass(`${prefix}-boundary-show`);
        expect(query(container, 'boundary-max')).toHaveTextContent('100');
    });

    it('空的 marks 对象', () => {
        const { container } = render(<Slider defaultValue={30} marks={{}} />);
        expect(queryAll(container, 'dot')).toHaveLength(0);
        expect(query(container, 'marks')).toBeNull();
    });

    it('step 为 null 时手柄仍按 value 定位', () => {
        const marks = { 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' };
        render(<Slider defaultValue={25} step={null} marks={marks} />);
        expectValues(25);
        expect(getHandle()).toHaveStyle({ left: '25%' });
    });

    it('rtl 方向下，滑块和 track 从右侧定位', () => {
        const { container, unmount } = render(
            <ConfigProvider direction="rtl">
                <Slider defaultValue={30} />
            </ConfigProvider>
        );
        expect(getHandle()).toHaveStyle({ right: '30%' });
        expect(query(container, 'track')).toHaveStyle({ width: '30%', right: '0px' });
        unmount();

        render(
            <ConfigProvider direction="rtl">
                <Slider defaultValue={[20, 60]} range />
            </ConfigProvider>
        );
        expect(document.querySelector(`.${prefix}-track`)).toHaveStyle({ width: '40%', right: '20%' });
    });

    it('data-* 属性透传到外层容器', () => {
        const { container } = render(<Slider data-kind="audio" data-testid="volume" defaultValue={30} />);
        const wrapper = query(container, 'wrapper');
        expect(screen.getByTestId('volume')).toBe(wrapper);
        expect(wrapper).toHaveAttribute('data-kind', 'audio');
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Slider: { step: 10, max: 50, defaultValue: 20 } };
        try {
            const { container, unmount } = render(<Slider />);
            expectValues(20);
            expect(query(container, 'boundary-max')).toHaveTextContent('50');
            expect(getInput()).toHaveAttribute('step', '10');
            expect(getInput()).toHaveAttribute('max', '50');
            unmount();
            render(<Slider defaultValue={5} step={1} />);
            expectValues(5);
            expect(getInput()).toHaveAttribute('step', '1');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('onChange 按值变化计数，onAfterChange 每次拖动只调用一次', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 40, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 40, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 45, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange.mock.calls).toEqual([[40], [45]]);
        expect(onAfterChange.mock.calls).toEqual([[45]]);
        expectValues(45);
    });

    it('step 为 1 时取整后值不变的拖动不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={{ width: 300, height: 32 }} defaultValue={40} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 121, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 121, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('step 为 1 时取整后值不变的轨道点击不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={{ width: 300, height: 32 }} defaultValue={40} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 121, clientY: 16 });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('拖动时吸附到最近的步进值', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} step={10} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(60);
        expectValues(60);
    });

    it('拖动步数从 min 计算，即原生 range 输入的步进基准', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={25} min={5} step={10} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        // 64% of 5..100 is 65.8: the nearest of 5, 15, ..., 95 is 65
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(65);
        expectValues(65);
    });

    it('拖动范围最大值滑块时不移动最小值滑块', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={[20, 60]} range onChange={onChange} />);
        fireEvent.mouseDown(getHandles()[1], { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 80, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith([20, 80]);
        expectValues(20, 80);
    });

    it('垂直 slider 沿 y 轴拖动，verticalReverse 时反向', () => {
        const vertical = { width: 4, height: 100 };
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(<Slider style={vertical} vertical onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document.body, { clientX: 0, clientY: 70 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(70);
        expect(getHandle()).toHaveStyle({ top: '70%' });
        unmount();

        render(<Slider style={vertical} vertical verticalReverse onChange={onChange} />);
        fireEvent.click(document.querySelector(`.${prefix}-rail`), { clientX: 0, clientY: 20 });
        expect(onChange).toHaveBeenLastCalledWith(80);
        expectValues(80);
    });

    it('仅高亮 included 范围内的刻度', () => {
        const marks = { 10: 'a', 40: 'b', 80: 'c' };
        const { container, rerender } = render(<Slider defaultValue={[20, 60]} marks={marks} range />);
        expect(queryAll(container, 'dot')).toHaveLength(3);
        expect(queryAll(container, 'dot-active')).toHaveLength(1);
        rerender(<Slider defaultValue={[20, 60]} included={false} marks={marks} range />);
        expect(queryAll(container, 'dot-active')).toHaveLength(3);
    });

    it('禁用的 slider 忽略拖动和 rail 点击', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={30} disabled onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.mouseMove(document.body, { clientX: 60, clientY: 10 });
        fireEvent.mouseUp(window);
        fireEvent.click(query(container, 'rail'), { clientX: 80 });
        expect(onChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('受控 slider 通过键盘和点击跟随父组件的值', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        function Controlled() {
            const [value, setValue] = useState<number | number[]>(30);
            return (
                <Slider
                    style={SIZED}
                    value={value}
                    onAfterChange={onAfterChange}
                    onChange={(v) => {
                        onChange(v);
                        setValue(v);
                    }}
                />
            );
        }
        const { container } = render(<Controlled />);
        changeTo(getInput(), 31);
        expectValues(31);
        expect(onChange.mock.calls).toEqual([[31]]);
        // a controlled value change reports onAfterChange itself, and the key release reports it again
        expect(onAfterChange.mock.calls).toEqual([[31]]);
        fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(onAfterChange.mock.calls).toEqual([[31], [31]]);

        fireEvent.click(query(container, 'rail'), { clientX: 70 });
        expectValues(70);
        expect(onChange).toHaveBeenLastCalledWith(70);
    });

    it('受控范围值接收内容相同的新数组时不报告变化', () => {
        const onAfterChange = vi.fn<OnChange>();
        const { rerender } = render(<Slider value={[20, 60]} range onAfterChange={onAfterChange} />);
        rerender(<Slider value={[20, 60]} range onAfterChange={onAfterChange} />);
        expect(onAfterChange).not.toHaveBeenCalled();
        rerender(<Slider value={[10, 120]} range onAfterChange={onAfterChange} />);
        expectValues(10, 100);
        expect(onAfterChange.mock.calls).toEqual([[[10, 120]]]);
    });

    it('StrictMode 下每次移动只拖动一次，mouseup 时解绑', () => {
        const onChange = vi.fn<OnChange>();
        const onMouseUp = vi.fn<(e: unknown) => void>();
        render(
            <StrictMode>
                <Slider style={SIZED} defaultValue={30} onChange={onChange} onMouseUp={onMouseUp} />
            </StrictMode>
        );
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        expect(onChange.mock.calls).toEqual([[50]]);
        fireEvent.mouseUp(window);
        fireEvent.mouseUp(window);
        fireEvent.mouseMove(document.body, { clientX: 70, clientY: 10 });
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expectValues(50);
    });

    it('Form.Slider 写入表单值，重置时恢复为 initValue', async () => {
        let formApi;
        const { container } = render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Slider field="volume" initValue={30} label="Volume" />
            </Form>
        );
        expectValues(30);
        changeTo(getInput(), 31);
        expectValues(31);
        expect(formApi.getValue('volume')).toBe(31);
        await act(() => formApi.reset());
        expectValues(30);
        const wrapper = query(container, 'wrapper');
        expect(wrapper).not.toHaveAttribute('validatestatus');
        expect(wrapper).not.toHaveAttribute('validateStatus');
        expect(wrapper).not.toHaveAttribute('insetlabel');
    });

    it('输入框变化仅对受控 slider 报告新值', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider value={30} onChange={onChange} />);
        changeTo(getInput(), 31);
        expect(onChange).toHaveBeenCalledWith(31);
        expectValues(30);
    });

    it('value 相关的 key 留在 slider 上：方向键由 slider 处理，Page、Home、End 保留原生默认行为；其他 key 传递给祖先元素', () => {
        const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', onKeyDown);
        render(<Slider defaultValue={30} />);
        expect(fireEvent.keyDown(getInput(), { key: 'ArrowRight' })).toBe(false);
        expect(getInput()).toHaveValue('31');
        expect(fireEvent.keyDown(getInput(), { key: 'PageUp' })).toBe(true);
        expect(onKeyDown).not.toHaveBeenCalled();
        fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', onKeyDown);
    });

    it('onKeyDown 在手柄上对每个按键各调用一次，value key 仍不传递给祖先元素', () => {
        const onKeyDown = vi.fn<(event: React.KeyboardEvent) => void>();
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', ancestor);
        render(<Slider defaultValue={30} onKeyDown={onKeyDown} />);
        fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['ArrowRight', 'Tab']);
        expect(ancestor).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', ancestor);
    });

    it('onKeyDown 调用 preventDefault 后，slider 不再独占该 value key', () => {
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', ancestor);
        render(<Slider defaultValue={30} onKeyDown={(event) => event.preventDefault()} />);
        fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        expect(ancestor).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', ancestor);
    });

    it('带 Alt、Ctrl 或 Meta 的 value key 是浏览器快捷键，传递给祖先元素且不结束变化', () => {
        const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
        const onAfterChange = vi.fn<OnChange>();
        document.addEventListener('keydown', onKeyDown);
        render(<Slider defaultValue={30} onAfterChange={onAfterChange} />);
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            fireEvent.keyDown(getInput(), { key: 'ArrowLeft', [modifier]: true });
            fireEvent.keyUp(getInput(), { key: 'ArrowLeft', [modifier]: true });
        }
        expect(onKeyDown).toHaveBeenCalledTimes(3);
        expect(onAfterChange).not.toHaveBeenCalled();
        document.removeEventListener('keydown', onKeyDown);
    });

    it('禁用的 slider 忽略输入框的变化', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider defaultValue={30} disabled onChange={onChange} />);
        changeTo(getInput(), 31);
        expect(onChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('仅松开 value 相关的 key 时报告 onAfterChange', async () => {
        const onAfterChange = vi.fn<OnChange>();
        const onMouseUp = vi.fn<(e: unknown) => void>();
        render(<Slider defaultValue={30} onAfterChange={onAfterChange} onMouseUp={onMouseUp} />);
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        fireEvent.keyUp(getInput(), { key: 'Shift' });
        expect(onAfterChange).not.toHaveBeenCalled();
        expect(onMouseUp).not.toHaveBeenCalled();
        changeTo(getInput(), 31);
        fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(onAfterChange.mock.calls).toEqual([[31]]);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
    });

    it('焦点离开两个滑块后，Form.Slider 在 blur 时校验', () => {
        const validate = vi.fn<(value: unknown) => string>(() => '');
        render(
            <Form>
                <Form.Slider field="price" initValue={[20, 60]} range trigger="blur" validator={validate} />
            </Form>
        );
        const [minInput, maxInput] = getInputs();
        act(() => minInput.focus());
        act(() => maxInput.focus());
        expect(validate).not.toHaveBeenCalled();
        act(() => maxInput.blur());
        expect(validate).toHaveBeenCalledTimes(1);
    });

    it('Form.Slider 把 aria 描述和错误状态传给滑块输入框', async () => {
        let formApi;
        const { container } = render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Slider field="volume" helpText="Pick a volume" rules={[{ required: true }]} />
            </Form>
        );
        const hint = screen.getByText('Pick a volume');
        expect(getInput()).toHaveAttribute('aria-describedby', hint.id);
        expect(getHandle()).not.toHaveAttribute('aria-describedby');
        await act(() => formApi.validate().catch(() => {}));
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        expect(getInput()).toHaveAttribute('aria-errormessage');
        expect(getInput()).not.toHaveAttribute('aria-required');
        expect(query(container, 'wrapper')).not.toHaveAttribute('aria-describedby');
    });

    it('min 和 max 的变化同步到边界标签和滑块', () => {
        const { container, rerender } = render(<Slider defaultValue={30} max={100} min={0} showBoundary />);
        rerender(<Slider defaultValue={30} max={50} min={10} showBoundary />);
        expect(query(container, 'boundary-min')).toHaveTextContent('10');
        expect(query(container, 'boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('max', '50');
        changeTo(getInput(), 50);
        expectValues(50);
    });

    it('ref 指向外层容器，其他属性也传到外层容器', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Slider ref={ref} title="Volume" defaultValue={30} />);
        const wrapper = query(container, 'wrapper');
        expect(ref.current).toBe(wrapper);
        expect(wrapper).toHaveAttribute('title', 'Volume');
    });

    it('id 命名滑块输入框（范围时为第一个），而非外层容器', () => {
        const { container, rerender } = render(<Slider id="volume" defaultValue={30} />);
        expect(getInput()).toHaveAttribute('id', 'volume');
        expect(query(container, 'wrapper')).not.toHaveAttribute('id');

        rerender(<Slider id="price" defaultValue={[20, 60]} range />);
        const [minInput, maxInput] = getInputs();
        expect(minInput).toHaveAttribute('id', 'price');
        expect(maxInput).not.toHaveAttribute('id');
    });

    it('Form.Slider 注入的 id 落在其 label 指向的滑块输入框上', () => {
        const { container } = render(
            <Form>
                <Form.Slider field="volume" initValue={30} label="Volume" />
            </Form>
        );
        const label = container.querySelector('label');
        expect(label).toHaveAttribute('for');
        expect(getInput()).toHaveAttribute('id', label.getAttribute('for'));
        expect(query(container, 'wrapper')).not.toHaveAttribute('id');
    });

    it('没有 initValue 的 Form.Slider 重置时回到最小值，且重置不报告变化', async () => {
        let formApi;
        const onAfterChange = vi.fn<OnChange>();
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Slider min={10} field="volume" onAfterChange={onAfterChange} />
            </Form>
        );
        changeTo(getInput(), 100);
        fireEvent.keyUp(getInput(), { key: 'End' });
        expectValues(100);
        onAfterChange.mockClear();

        await act(() => formApi.reset());

        expectValues(10);
        expect(onAfterChange).not.toHaveBeenCalled();
    });

    it('value 属性变为 undefined 时，范围值回到 defaultValue', () => {
        const onAfterChange = vi.fn<OnChange>();
        const { rerender } = render(<Slider defaultValue={[10, 20]} value={[30, 80]} range onAfterChange={onAfterChange} />);
        expectValues(30, 80);
        onAfterChange.mockClear();

        rerender(<Slider defaultValue={[10, 20]} value={undefined} range onAfterChange={onAfterChange} />);
        expectValues(10, 20);

        rerender(<Slider min={5} value={undefined} range onAfterChange={onAfterChange} />);
        rerender(<Slider min={5} value={[30, 80]} range onAfterChange={onAfterChange} />);
        onAfterChange.mockClear();
        rerender(<Slider min={5} value={undefined} range onAfterChange={onAfterChange} />);
        expectValues(5, 5);
        expect(onAfterChange).not.toHaveBeenCalled();
    });

    it('用触摸 pointer 拖动，拖动期间忽略其他 pointer', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        fireEvent.pointerMove(document.body, touch({ pointerId: 7, clientX: 90, clientY: 10 }));
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(onChange).toHaveBeenLastCalledWith(50);
        expectValues(50);
        fireEvent.pointerUp(document.body, touch({ pointerId: 7 }));
        expect(onAfterChange).not.toHaveBeenCalled();
        fireEvent.pointerUp(document.body, touch());
        expect(onAfterChange).toHaveBeenCalledWith(50);
    });

    it('pointer 被取消时结束拖动', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        fireEvent.pointerCancel(document.body, touch());
        fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));

        expect(onAfterChange).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
    });

    it('window 监听绑定到同一个 AbortController 的 signal，拖动结束或卸载时中止', () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const { unmount } = render(<Slider style={SIZED} defaultValue={30} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });

        const signalOf = (options: boolean | AddEventListenerOptions) => (options as AddEventListenerOptions)?.signal;
        const dragCalls = addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls.map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel']);
        const [signal] = dragCalls.map(([, , options]) => signalOf(options));
        expect(dragCalls.every(([, , options]) => signalOf(options) === signal)).toBe(true);
        expect(signal.aborted).toBe(false);
        fireEvent.mouseUp(window);
        expect(signal.aborted).toBe(true);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        const second = signalOf(addListener.mock.calls.filter(([, , options]) => signalOf(options)).at(-1)[2]);
        expect(second).not.toBe(signal);
        unmount();
        expect(second.aborted).toBe(true);
        addListener.mockRestore();
    });

    it('showArrow 同时作用于范围的两个 tooltip', async () => {
        render(<Slider defaultValue={[20, 60]} range showArrow={false} tooltipVisible />);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(2));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-with-arrow`)).toBeNull();
    });

    it('每个滑块都是原生 range 输入框，表单以 name 提交', () => {
        const { container } = render(
            <form>
                <Slider name="volume" defaultValue={30} />
                <Slider name="price" defaultValue={[20, 60]} range />
            </form>
        );
        const form = container.querySelector('form');
        expect(new FormData(form).getAll('volume')).toEqual(['30']);
        expect(new FormData(form).getAll('price')).toEqual(['20', '60']);
        changeTo(getInputs()[0], 45);
        expect(new FormData(form).getAll('volume')).toEqual(['45']);
    });

    it('滑块输入框变化时移动该滑块并报告值', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider defaultValue={[20, 60]} range onChange={onChange} />);
        const [minInput, maxInput] = container.querySelectorAll<HTMLInputElement>('input[type="range"]');
        fireEvent.change(minInput, { target: { value: '40' } });
        expect(onChange).toHaveBeenLastCalledWith([40, 60]);
        fireEvent.change(maxInput, { target: { value: '10' } });
        expect(onChange).toHaveBeenLastCalledWith([40, 40]);
        expect([minInput.value, maxInput.value]).toEqual(['40', '40']);
    });

    it('Form.Slider 把 id、name 和 aria-* 放在 label 指向的原生 range 输入框上', async () => {
        let formApi;
        const { container } = render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Slider name="volume-field" field="volume" helpText="Pick a volume" label="Volume" rules={[{ required: true }]} />
            </Form>
        );
        const input = container.querySelector('input[type="range"]');
        expect(container.querySelector('label').control).toBe(input);
        expect(input).toHaveAttribute('name', 'volume-field');
        expect(input).toHaveAttribute('aria-labelledby');
        expect(input).toHaveAttribute('aria-describedby', screen.getByText('Pick a volume').id);
        await act(() => formApi.validate().catch(() => {}));
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-errormessage');
    });

    it('受控 range 的新值两端都越界时，两个滑块都夹到边界内', () => {
        const { rerender } = render(<Slider value={[10, 20]} range />);
        rerender(<Slider value={[150, 200]} range />);
        expectValues(100, 100);
        rerender(<Slider value={[-50, -10]} range />);
        expectValues(0, 0);
    });

    it('min 带小数时，拖动落在步长网格上的值不被再次取整', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={0.25} max={10.25} min={0.25} step={0.5} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        // 7.5% of 0.25..10.25 is 1.0, the nearest grid value from min is 0.75
        fireEvent.mouseMove(document.body, { clientX: 5, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(0.75);
    });

    it('value 为 null 时按受控处理：拖动只报告新值，不移动手柄', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} {...undeclared({ value: null })} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 60, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(60);
        expectValues(0);
    });

    it('没有宽度的 slider 不报告 NaN', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider defaultValue={30} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        fireEvent.mouseUp(window);
        fireEvent.click(query(container, 'rail'), { clientX: 50 });
        expect(onChange).not.toHaveBeenCalled();
        expectValues(30);
    });
});

describe('Slider 的指针边界', () => {
    it('max - min 不是 step 的整数倍时，拖到终点不超过 max', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={25} min={5} step={10} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 100, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(95);
        expectValues(95);
    });

    it('max - min 不是 step 的整数倍时，点击轨道末端不超过 max', () => {
        const onChange = vi.fn<OnChange>();
        const { container } = render(<Slider style={SIZED} defaultValue={0} max={11} step={3} onChange={onChange} />);
        fireEvent.click(query(container, 'rail'), { clientX: 100, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(9);
    });

    it('小数 step 的整数倍终点不被截掉', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={0} max={0.3} step={0.1} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 100, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(0.3);
    });

    it.each([0, null])('step 为 %s 时指针按 1 取整，与原生 range 一致，不回报 NaN', (step) => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} step={step} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(64);
        expectValues(64);
    });

    it('autoFocus 聚焦起点手柄的 input，不落到外层 div', () => {
        const { container } = render(<Slider autoFocus defaultValue={[10, 20]} range />);
        expect(getInputs()[0]).toHaveFocus();
        expect(query(container, 'wrapper')).not.toHaveAttribute('autofocus');
    });

    it('鼠标右键按下手柄不开始拖动', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10, button: 2 });
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).not.toHaveBeenCalled();
        expect(onAfterChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('拖动中途被禁用，松手仍结束拖动并报告 onAfterChange，重新启用后点击轨道恢复', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        const props = { style: SIZED, defaultValue: 30, onChange, onAfterChange };
        const { container, rerender } = render(<Slider {...props} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        rerender(<Slider {...props} disabled />);
        fireEvent.mouseUp(window);
        expect(onAfterChange).toHaveBeenCalledTimes(1);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        rerender(<Slider {...props} />);
        fireEvent.click(query(container, 'rail'), { clientX: 80, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(80);
    });

    it('点击刻度标签取该刻度的值，标签较宽时点到旁边也一样', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={50} marks={{ 20: '二十', 80: '八十' }} onChange={onChange} />);
        fireEvent.click(screen.getByText('二十'), { clientX: 35, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(20);
        expectValues(20);
    });

    it('range 点击刻度标签移动离该刻度近的手柄', () => {
        const onChange = vi.fn<OnChange>();
        render(<Slider style={SIZED} defaultValue={[10, 90]} marks={{ 20: '二十', 80: '八十' }} range onChange={onChange} />);
        fireEvent.click(screen.getByText('八十'), { clientX: 60, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith([10, 80]);
        expectValues(10, 80);
    });
});
