import { createSignal, onMount } from 'solid-js';
import { fireEvent as testingFireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Slider, { type SliderProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Tooltip from '../../tooltip';

const mouse = { pointerId: 1, pointerType: 'mouse' };
// fireEvent is a function with helpers as own properties; only those are copied
const fireEvent = Object.assign({}, testingFireEvent, {
    mouseDown: (element: Element | Window, init?: object) => testingFireEvent.pointerDown(element, { ...mouse, ...init }),
    mouseMove: (element: Element | Window, init?: object) => testingFireEvent.pointerMove(element, { ...mouse, ...init }),
    mouseUp: (element: Element | Window, init?: object) => testingFireEvent.pointerUp(element, { ...mouse, ...init }),
});
type OnChange = NonNullable<SliderProps['onChange']>;
const touch = (init = {}) => ({ pointerId: 2, pointerType: 'touch', ...init });

const prefix = `${BASE_CLASS_PREFIX}-slider`;
// a hidden tooltip keeps its node until a CSS leave animation jsdom never fires; `-wrapper-show` marks it visible
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
// jsdom runs no key default action on a native range, so the input is fired directly
const changeTo = (input: HTMLInputElement, value: number) => fireEvent.input(input, { target: { value: String(value) } });
// jsdom's :focus-visible heuristic misses focus moving between two inputs, so Tab is dispatched from the body
const tabTo = (element: HTMLElement) => {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    element.focus();
};
const query = (container: ParentNode, suffix: string) => container.querySelector(`.${prefix}-${suffix}`) as HTMLElement;
const queryAll = (container: ParentNode, suffix: string) => container.querySelectorAll(`.${prefix}-${suffix}`);
const getWrapper = () => query(document, 'wrapper');
// rects derive from inline width/height/margin: with width 100 and no margin, clientX equals the value
const SIZED = { width: '100px', height: '32px' };
const VERTICAL = { width: '4px', height: '400px', 'margin-left': '20px', 'margin-top': '40px' };

const expectValues = (...values: number[]) => expect(getInputs().map((input) => input.value)).toEqual(values.map(String));

describe('Slider', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('默认值与默认范围值', () => {
        render(() => (
            <div>
                <Slider defaultValue={10} showBoundary />
                <Slider defaultValue={[20, 60]} range />
            </div>
        ));
        const handles = getHandles();
        expect(handles[0]).toHaveStyle({ left: '10%' });
        expect(handles[1]).toHaveStyle({ left: '20%' });
        expect(handles[2]).toHaveStyle({ left: '60%' });
        expectValues(10, 20, 60);
    });

    it('既无 value 也无 defaultValue 时位于 min', () => {
        const { unmount } = render(() => <Slider range />);
        expectValues(0, 0);
        unmount();
        render(() => <Slider min={10} max={50} />);
        expectValues(10);
        expect(getHandle()).toHaveStyle({ left: '0%' });
    });

    it('点击 rail 移动手柄并报告 onChange', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={{ width: '100px', height: '32px', 'margin-left': '13px' }} step={1} onChange={onChange} />);
        const rail = query(document, 'rail');

        fireEvent.click(rail, { clientX: 113, clientY: 16 });
        expectValues(100);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith(100);
        fireEvent.click(rail, { clientX: 13, clientY: 16 });
        expectValues(0);
        expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('垂直 range 的 rail 点击', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={VERTICAL} defaultValue={[20, 60]} range vertical onChange={onChange} />);
        const rail = query(document, 'rail');

        fireEvent.click(rail, { clientX: 22, clientY: 40 });
        expectValues(0, 60);
        expect(onChange).toHaveBeenLastCalledWith([0, 60]);
        fireEvent.click(rail, { clientX: 22, clientY: 440 });
        expectValues(0, 100);
        expect(onChange).toHaveBeenLastCalledWith([0, 100]);
    });

    // a click on the rail moves the handle nearest to it, in every layout direction
    it.each([
        ['horizontal', {}, SIZED, { clientX: 25, clientY: 16 }, undefined],
        ['horizontal rtl', {}, SIZED, { clientX: 75, clientY: 16 }, 'rtl'],
        ['vertical', { vertical: true }, VERTICAL, { clientX: 22, clientY: 140 }, undefined],
        ['vertical reverse', { vertical: true, verticalReverse: true }, VERTICAL, { clientX: 22, clientY: 340 }, undefined],
    ] as const)('范围轨道点击时移动最近的滑块：%s', (_name, props, style, point, direction) => {
        const slider = () => <Slider style={style} defaultValue={[20, 80]} step={1} range {...props} />;
        render(() => (direction ? <ConfigProvider direction={direction}>{slider()}</ConfigProvider> : slider()));
        fireEvent.click(query(document, 'rail'), point);
        expectValues(25, 80);
        // the second click lands past the maximum handle, which moves instead
        const vertical = 'vertical' in props;
        const key = vertical ? 'clientY' : 'clientX';
        const step = (vertical ? 4 : 1) * 60 * ('verticalReverse' in props || direction ? -1 : 1);
        fireEvent.click(query(document, 'rail'), { ...point, [key]: point[key] + step });
        expectValues(25, 85);
    });

    it('受控值只随 value 移动，越界值夹到边界，不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal(10);
        render(() => <Slider step={1} value={value()} onChange={onChange} />);
        expectValues(10);
        setValue(20);
        expectValues(20);
        setValue(101);
        expectValues(100);
        expect(getHandle()).toHaveStyle({ left: '100%' });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('受控值为 0 时初始值是 0，不取 defaultValue', () => {
        render(() => <Slider defaultValue={50} value={0} />);
        expect(getInput()).toHaveValue('0');
    });

    it('受控范围值', () => {
        const [value, setValue] = createSignal([20, 60]);
        render(() => <Slider value={value()} range />);
        expectValues(20, 60);
        setValue([30, 70]);
        expectValues(30, 70);
        setValue([150, 200]);
        expectValues(100, 100);
        setValue([-50, -10]);
        expectValues(0, 0);
    });

    it('受控值变化时报告 onAfterChange，内容相同的新数组不报告', () => {
        const onAfterChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal([20, 60]);
        render(() => <Slider value={value()} range onAfterChange={onAfterChange} />);
        setValue([20, 60]);
        expect(onAfterChange).not.toHaveBeenCalled();
        setValue([10, 120]);
        expectValues(10, 100);
        expect(onAfterChange.mock.calls).toEqual([[[10, 120]]]);
    });

    it('受控 slider 的点击与输入只报告，不移动', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} value={50} onChange={onChange} />);
        fireEvent.click(query(document, 'rail'), { clientX: 80 });
        expect(onChange).toHaveBeenLastCalledWith(80);
        changeTo(getInput(), 31);
        expect(onChange).toHaveBeenLastCalledWith(31);
        expectValues(50);
    });

    it('受控 slider 随父组件的值移动', () => {
        const onAfterChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal<number | number[]>(30);
        render(() => (
            <Slider
                style={SIZED}
                value={value()}
                onAfterChange={onAfterChange}
                onChange={(next) => {
                    setValue(next as number | number[]);
                }}
            />
        ));
        changeTo(getInput(), 31);
        expectValues(31);
        // a controlled value change reports onAfterChange itself, and the key release reports it again
        expect(onAfterChange.mock.calls).toEqual([[31]]);
        fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(onAfterChange.mock.calls).toEqual([[31], [31]]);
        fireEvent.click(query(document, 'rail'), { clientX: 70 });
        expectValues(70);
    });

    it('value 为 null 时按受控处理：拖动只报告新值，不移动手柄', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} {...({ value: null } as unknown as SliderProps)} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 60, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(60);
        expectValues(0);
    });

    it('value 变为 undefined 时回到 defaultValue，重置不报告变化', () => {
        const onAfterChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal<number[] | undefined>([30, 80]);
        render(() => <Slider defaultValue={[10, 20]} value={value()} range onAfterChange={onAfterChange} />);
        expectValues(30, 80);
        onAfterChange.mockClear();
        setValue(undefined);
        expectValues(10, 20);
        expect(onAfterChange).not.toHaveBeenCalled();
    });

    it('父组件挂载时就改了 value，手柄移到新值', () => {
        function Demo() {
            const [value, setValue] = createSignal(30);
            onMount(() => setValue(50));
            return <Slider value={value()} />;
        }
        render(() => <Demo />);
        expectValues(50);
    });

    it('没有 defaultValue 的 value 变为 undefined 时回到 min', () => {
        const [value, setValue] = createSignal<number[] | undefined>([30, 80]);
        render(() => <Slider min={5} value={value()} range />);
        setValue(undefined);
        expectValues(5, 5);
    });

    it('刻度：点、激活态与点击', () => {
        const marks = { 20: '20c', 40: '40c' };
        render(() => <Slider style={SIZED} defaultValue={[0, 100]} marks={marks} range />);
        expect(queryAll(document, 'dot')).toHaveLength(2);
        fireEvent.click(queryAll(document, 'dot')[0], { clientX: 20 });
        expectValues(20, 100);
    });

    it('简单值的刻度按位置排列，并标出激活的点', () => {
        const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' };
        render(() => <Slider defaultValue={37} marks={marks} />);
        expect(queryAll(document, 'dot')).toHaveLength(4);
        expect(queryAll(document, 'dot-active')).toHaveLength(3);
        expect(screen.getByText('26°C')).toHaveStyle({ left: '26%' });
    });

    it('included 为 false 时轨道无样式，刻度不高亮', () => {
        render(() => <Slider defaultValue={30} included={false} marks={{ 0: '0', 50: '50', 100: '100' }} />);
        expect(query(document, 'track').getAttribute('style')).toBeFalsy();
        expect(queryAll(document, 'dot')).toHaveLength(3);
        expect(queryAll(document, 'dot-active')).toHaveLength(0);
    });

    it('仅高亮 included 范围内的刻度', () => {
        const marks = { 10: 'a', 40: 'b', 80: 'c' };
        const [included, setIncluded] = createSignal(true);
        render(() => <Slider defaultValue={[20, 60]} included={included()} marks={marks} range />);
        expect(queryAll(document, 'dot')).toHaveLength(3);
        expect(queryAll(document, 'dot-active')).toHaveLength(1);
        setIncluded(false);
        expect(queryAll(document, 'dot-active')).toHaveLength(3);
    });

    it('showMarkLabel 为 false 时不显示标签，空 marks 不渲染刻度', () => {
        const { unmount } = render(() => <Slider defaultValue={30} marks={{ 20: '20c', 40: '40c' }} showMarkLabel={false} />);
        expect(query(document, 'marks')).toBeNull();
        expect(screen.queryByText('20c')).toBeNull();
        expect(queryAll(document, 'dot')).toHaveLength(2);
        unmount();

        render(() => <Slider defaultValue={30} marks={{}} />);
        expect(queryAll(document, 'dot')).toHaveLength(0);
        expect(query(document, 'marks')).toBeNull();
    });

    it('renderMark 渲染刻度节点', () => {
        const renderMark: SliderProps['renderMark'] = (value, label) =>
            value === 20 ? (
                <span class="custom-mark" style={{ color: 'red' }}>
                    {label}
                </span>
            ) : (
                <strong>{label}</strong>
            );
        render(() => <Slider defaultValue={30} marks={{ 20: '20', 40: '40' }} renderMark={renderMark} />);
        expect(queryAll(document, 'mark')).toHaveLength(2);
        expect(document.querySelectorAll('.custom-mark')).toHaveLength(1);
        expect(screen.getByText('20')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(screen.getByText('40').tagName).toBe('STRONG');
    });

    it('verticalReverse 下的刻度与竖向范围手柄位置', () => {
        render(() => <Slider defaultValue={[20, 60]} marks={{ 20: '20c', 40: '40c' }} range vertical verticalReverse />);
        expect(getWrapper()).toHaveClass(`${prefix}-vertical-wrapper`, `${prefix}-reverse`);
        expect(query(document, 'marks-reverse')).not.toBeNull();
        expect(queryAll(document, 'mark-reverse')).toHaveLength(2);
        const [minHandle, maxHandle] = getHandles();
        expect(minHandle).toHaveStyle({ top: '20%' });
        expect(maxHandle).toHaveStyle({ top: '60%' });
    });

    it('点击刻度标签取该刻度的值，range 时移动离该刻度近的手柄', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={50} marks={{ 20: '二十', 80: '八十' }} onChange={onChange} />);
        fireEvent.click(screen.getByText('二十'), { clientX: 35, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(20);
        expectValues(20);
        unmount();

        render(() => <Slider style={SIZED} defaultValue={[10, 90]} marks={{ 20: '二十', 80: '八十' }} range onChange={onChange} />);
        fireEvent.click(screen.getByText('八十'), { clientX: 60, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith([10, 80]);
        expectValues(10, 80);
    });

    it('垂直时手柄用 top 定位，轨道用 height', () => {
        render(() => <Slider defaultValue={30} vertical />);
        expect(query(document, 'vertical-wrapper')).not.toBeNull();
        expect(getHandle()).toHaveStyle({ top: '30%' });
        expect(query(document, 'track')).toHaveStyle({ height: '30%' });
        expect(query(document, 'track').style.width).toBe('');
    });

    it('range 的轨道是两个手柄之间的区段，included 为 false 时无样式', () => {
        const { unmount } = render(() => <Slider defaultValue={[20, 60]} range />);
        expect(query(document, 'track')).toHaveStyle({ width: '40%', left: '20%' });
        unmount();
        render(() => <Slider defaultValue={[20, 60]} included={false} range />);
        expect(query(document, 'track').style.width).toBe('');
    });

    it('rtl 方向下，滑块和 track 从右侧定位', () => {
        const { unmount } = render(() => (
            <ConfigProvider direction="rtl">
                <Slider defaultValue={30} />
            </ConfigProvider>
        ));
        expect(getHandle()).toHaveStyle({ right: '30%' });
        expect(query(document, 'track')).toHaveStyle({ width: '30%', right: '0px' });
        unmount();

        render(() => (
            <ConfigProvider direction="rtl">
                <Slider defaultValue={[20, 60]} range />
            </ConfigProvider>
        ));
        expect(query(document, 'track')).toHaveStyle({ width: '40%', right: '20%' });
    });

    it('step、min、max 落在输入框上，边界标签随之更新', () => {
        const [max, setMax] = createSignal(100);
        render(() => <Slider defaultValue={30} max={max()} min={10} step={10} showBoundary />);
        expect(getInput()).toHaveAttribute('step', '10');
        expect(getInput()).toHaveAttribute('min', '10');
        expect(getInput()).toHaveAttribute('max', '100');
        changeTo(getInput(), 40);
        expectValues(40);
        setMax(50);
        expect(query(document, 'boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('max', '50');
        changeTo(getInput(), 50);
        expectValues(50);
        expect(getHandle()).toHaveStyle({ left: '100%' });
    });

    it('小数 step', () => {
        render(() => <Slider defaultValue={0.5} max={1} min={0} step={0.1} />);
        expectValues(0.5);
        changeTo(getInput(), 0.6);
        expectValues(0.6);
    });

    it('showBoundary 在指针进入时显示边界值', () => {
        render(() => <Slider defaultValue={30} showBoundary />);
        const boundary = query(document, 'boundary');
        expect(query(document, 'boundary-min')).toHaveTextContent(/^0$/);
        expect(query(document, 'boundary-max')).toHaveTextContent(/^100$/);
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
        fireEvent.mouseEnter(getWrapper());
        expect(boundary).toHaveClass(`${prefix}-boundary-show`);
        fireEvent.mouseLeave(getWrapper());
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
    });

    it('class、style、railStyle 与 data-* 落在 wrapper', () => {
        render(() => <Slider class="custom-slider" style={{ width: '300px' }} railStyle={{ 'background-color': '#ccc' }} data-testid="volume" title="Volume" defaultValue={30} />);
        const wrapper = screen.getByTestId('volume');
        expect(wrapper).toBe(document.querySelector('.custom-slider'));
        expect(wrapper).toHaveClass(`${prefix}-wrapper`);
        expect(wrapper).toHaveStyle({ width: '300px' });
        expect(wrapper).toHaveAttribute('title', 'Volume');
        expect(query(document, 'rail')).toHaveStyle({ backgroundColor: 'rgb(204, 204, 204)' });
        expect(getWrapper().parentElement).toHaveClass(prefix);
    });

    it('ref 指向 wrapper', () => {
        let ref: HTMLDivElement | undefined;
        render(() => <Slider ref={(node) => (ref = node)} defaultValue={30} />);
        expect(ref).toBe(getWrapper());
    });

    it('disabled：输入框禁用，忽略拖动、点击和输入，可重新启用', () => {
        const onChange = vi.fn<OnChange>();
        const [disabled, setDisabled] = createSignal(true);
        render(() => <Slider style={SIZED} defaultValue={30} disabled={disabled()} onChange={onChange} />);
        expect(getWrapper()).toHaveClass(`${prefix}-disabled`);
        expect(getInput()).toBeDisabled();
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.mouseMove(document.body, { clientX: 60, clientY: 10 });
        fireEvent.mouseUp(window);
        fireEvent.click(query(document, 'rail'), { clientX: 80 });
        expect(onChange).not.toHaveBeenCalled();
        expectValues(30);

        setDisabled(false);
        expect(getWrapper()).not.toHaveClass(`${prefix}-disabled`);
        fireEvent.click(query(document, 'rail'), { clientX: 80 });
        expect(onChange).toHaveBeenCalledWith(80);
    });

    it('tab 顺序：只有输入框是 Tab 停靠点，刻度点与手柄 span 不是', async () => {
        render(() => (
            <div>
                <button type="button">before</button>
                <Slider defaultValue={[20, 60]} range marks={{ 30: '30' }} tooltipOnMark />
            </div>
        ));
        screen.getByRole('button', { name: 'before' }).focus();
        const [minInput, maxInput] = getInputs();
        await userEvent.tab();
        expect(minInput).toHaveFocus();
        await userEvent.tab();
        expect(maxInput).toHaveFocus();
        getHandles().forEach((handle) => expect(handle).toHaveAttribute('tabindex', '-1'));
        queryAll(document, 'dot').forEach((dot) => expect(dot).toHaveAttribute('tabindex', '-1'));
    });

    it('autofocus 聚焦起点手柄的 input，不落到 wrapper', () => {
        render(() => <Slider autofocus defaultValue={[10, 20]} range />);
        expect(getInputs()[0]).toHaveFocus();
        expect(getWrapper()).not.toHaveAttribute('autofocus');
    });

    it('读取全局默认值，实例属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Slider: { step: 10, max: 50, defaultValue: 20 } };
        const { unmount } = render(() => <Slider />);
        expectValues(20);
        expect(query(document, 'boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('step', '10');
        unmount();
        render(() => <Slider defaultValue={5} step={1} />);
        expectValues(5);
        expect(getInput()).toHaveAttribute('step', '1');
    });
});

describe('Slider 的无障碍', () => {
    it('aria-label、aria-valuetext 与 getAriaValueText', () => {
        const { unmount } = render(() => <Slider aria-label="Volume slider" aria-valuetext="30 percent" defaultValue={30} />);
        expect(screen.getByRole('slider', { name: 'Volume slider' })).toHaveAttribute('aria-valuetext', '30 percent');
        unmount();

        const getAriaValueText = (value: number, index?: number) => `${value}% (${index === 0 ? 'min' : 'max'})`;
        render(() => <Slider defaultValue={[20, 60]} getAriaValueText={getAriaValueText} range />);
        const [minInput, maxInput] = getInputs();
        expect(minInput).toHaveAttribute('aria-valuetext', '20% (min)');
        expect(maxInput).toHaveAttribute('aria-valuetext', '60% (max)');
    });

    it('输入框是原生 range，携带值与边界而不重复 aria-valuenow', () => {
        render(() => <Slider defaultValue={50} max={90} min={10} />);
        const input = getInput();
        expect(input).toHaveAttribute('type', 'range');
        expect(input).toHaveValue('50');
        expect(input).toHaveAttribute('min', '10');
        expect(input).toHaveAttribute('max', '90');
        expect(input).not.toHaveAttribute('aria-valuenow');
        expect(input).not.toHaveAttribute('aria-valuemax');
    });

    it('垂直 slider 的输入框有 aria-orientation 与竖排书写模式，dir 跟随方向', () => {
        const [reverse, setReverse] = createSignal(false);
        render(() => <Slider defaultValue={30} vertical verticalReverse={reverse()} />);
        expect(getInput()).toHaveAttribute('aria-orientation', 'vertical');
        expect(getInput()).toHaveStyle({ writingMode: 'vertical-lr' });
        expect(getInput()).toHaveAttribute('dir', 'ltr');
        setReverse(true);
        expect(getInput()).toHaveAttribute('dir', 'rtl');
    });

    it('range 的两个手柄各有名称，不在 wrapper 上设置 label', () => {
        render(() => <Slider defaultValue={[20, 60]} range />);
        expect(getWrapper()).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeStart })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeEnd })).toHaveValue('60');
    });

    it('range 把两端名称追加到 aria-label 后，语言随 ConfigProvider', () => {
        const { unmount } = render(() => <Slider aria-label="Price" defaultValue={[20, 60]} range />);
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
        unmount();

        render(() => (
            <ConfigProvider locale={en_US}>
                <Slider defaultValue={[20, 60]} range />
            </ConfigProvider>
        ));
        expect(screen.getByRole('slider', { name: 'Start' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'End' })).toBeInTheDocument();
    });

    it('range 的 aria-labelledby 加上各自的端点名', () => {
        render(() => (
            <div>
                <span id="price-label">Price</span>
                <Slider aria-labelledby="price-label" defaultValue={[20, 60]} range />
            </div>
        ));
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('aria-labelledby 命名单个手柄的输入框', () => {
        render(() => (
            <div>
                <span id="slider-label">Volume</span>
                <Slider aria-labelledby="slider-label" defaultValue={30} />
            </div>
        ));
        expect(screen.getByRole('slider', { name: 'Volume' })).toBe(getHandle().querySelector('input'));
    });

    it('id 命名输入框（range 时为第一个），label for 可聚焦，禁用时名称保留', async () => {
        const { unmount } = render(() => (
            <>
                <label for="volume">Volume</label>
                <Slider id="volume" defaultValue={30} disabled />
            </>
        ));
        expect(screen.getByRole('slider', { name: 'Volume' })).toBeDisabled();
        expect(getWrapper()).not.toHaveAttribute('id');
        unmount();

        render(() => <Slider id="price" defaultValue={[20, 60]} range />);
        const [minInput, maxInput] = getInputs();
        expect(minInput).toHaveAttribute('id', 'price');
        expect(maxInput).not.toHaveAttribute('id');
    });

    it('表单字段 aria 属性落在输入框上，不落在 wrapper 或手柄上；aria-required 不输出', () => {
        render(() => <Slider defaultValue={30} name="volume" aria-describedby="hint" aria-errormessage="err" aria-invalid aria-required />);
        const input = getInput();
        expect(input).toHaveAttribute('name', 'volume');
        expect(input).toHaveAttribute('aria-describedby', 'hint');
        expect(input).toHaveAttribute('aria-errormessage', 'err');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).not.toHaveAttribute('aria-required');
        expect(getHandle()).not.toHaveAttribute('aria-describedby');
        expect(getWrapper()).not.toHaveAttribute('aria-describedby');
    });

    it('Form 注入的属性不落到 DOM', () => {
        const injected = { validateStatus: 'error', insetLabel: 'label', insetLabelId: 'label-id', tabIndex: 0 };
        render(() => <Slider defaultValue={30} {...injected} />);
        expect(getWrapper()).not.toHaveAttribute('validatestatus');
        expect(getWrapper()).not.toHaveAttribute('insetlabel');
        expect(getWrapper()).not.toHaveAttribute('tabindex');
    });

    it('每个手柄都是原生 range，表单以 name 提交', () => {
        const form = () => new FormData(document.querySelector('form') as HTMLFormElement);
        render(() => (
            <form>
                <Slider name="volume" defaultValue={30} />
                <Slider name="price" defaultValue={[20, 60]} range />
            </form>
        ));
        expect(form().getAll('volume')).toEqual(['30']);
        expect(form().getAll('price')).toEqual(['20', '60']);
        changeTo(getInputs()[0], 45);
        expect(form().getAll('volume')).toEqual(['45']);
    });
});

describe('Slider 的输入框与键盘', () => {
    it('输入框变化移动该手柄并报告值，range 的手柄不越过另一个', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider defaultValue={[20, 60]} range onChange={onChange} />);
        const [minInput, maxInput] = getInputs();
        [minInput, maxInput].forEach((input) => {
            expect(input).toHaveAttribute('min', '0');
            expect(input).toHaveAttribute('max', '100');
        });
        changeTo(minInput, 100);
        expectValues(60, 60);
        changeTo(maxInput, 0);
        expectValues(60, 60);
        expect(onChange.mock.calls).toEqual([[[60, 60]]]);
    });

    it('value key 留在 slider 上，不传给祖先的 JSX 处理函数；其他 key 传递', () => {
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        render(() => (
            <div onKeyDown={ancestor}>
                <Slider defaultValue={30} />
            </div>
        ));
        // arrows are handled by the slider; Page, Home and End keep the native range behavior
        expect(fireEvent.keyDown(getInput(), { key: 'ArrowRight' })).toBe(false);
        expect(getInput()).toHaveValue('31');
        expect(fireEvent.keyDown(getInput(), { key: 'PageUp' })).toBe(true);
        expect(ancestor).not.toHaveBeenCalled();
        fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(ancestor).toHaveBeenCalledTimes(1);
    });

    it('onKeyDown 在手柄上对每个按键各调用一次，preventDefault 后 value key 交还祖先', () => {
        const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        const [prevent, setPrevent] = createSignal(false);
        render(() => (
            <div onKeyDown={ancestor}>
                <Slider
                    defaultValue={30}
                    onKeyDown={(event) => {
                        onKeyDown(event);
                        if (prevent()) {
                            event.preventDefault();
                        }
                    }}
                />
            </div>
        ));
        fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['ArrowRight', 'Tab']);
        expect(ancestor).toHaveBeenCalledTimes(1);
        setPrevent(true);
        fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        expect(ancestor).toHaveBeenCalledTimes(2);
    });

    it('带 Alt、Ctrl 或 Meta 的 value key 传递给祖先且不结束变化', () => {
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        const onAfterChange = vi.fn<OnChange>();
        render(() => (
            <div onKeyDown={ancestor}>
                <Slider defaultValue={30} onAfterChange={onAfterChange} />
            </div>
        ));
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            fireEvent.keyDown(getInput(), { key: 'ArrowLeft', [modifier]: true });
            fireEvent.keyUp(getInput(), { key: 'ArrowLeft', [modifier]: true });
        }
        expect(ancestor).toHaveBeenCalledTimes(3);
        expect(onAfterChange).not.toHaveBeenCalled();
    });

    it('仅松开 value 相关的 key 时报告 onAfterChange 与 onMouseUp', async () => {
        const onAfterChange = vi.fn<OnChange>();
        const onMouseUp = vi.fn<(event: unknown) => void>();
        render(() => <Slider defaultValue={30} onAfterChange={onAfterChange} onMouseUp={onMouseUp} />);
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

    it('onFocus 对任一手柄的聚焦触发，onBlur 只在焦点离开两个手柄后触发', () => {
        const onFocus = vi.fn<(event: unknown) => void>();
        const onBlur = vi.fn<(event: unknown) => void>();
        render(() => <Slider defaultValue={[20, 60]} range onFocus={onFocus} onBlur={onBlur} />);
        const [minInput, maxInput] = getInputs();
        minInput.focus();
        maxInput.focus();
        expect(onFocus).toHaveBeenCalledTimes(2);
        expect(onBlur).not.toHaveBeenCalled();
        maxInput.blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('使用方在 wrapper 上的焦点与指针处理和组件自己的处理同时生效', () => {
        const handlers = { onFocusIn: vi.fn<(event: FocusEvent) => void>(), onFocusOut: vi.fn<(event: FocusEvent) => void>(), onMouseEnter: vi.fn<(event: MouseEvent) => void>(), onMouseLeave: vi.fn<(event: MouseEvent) => void>() };
        const onFocus = vi.fn<(event: unknown) => void>();
        const onBlur = vi.fn<(event: unknown) => void>();
        render(() => <Slider defaultValue={30} showBoundary onFocus={onFocus} onBlur={onBlur} {...handlers} />);
        getInput().focus();
        getInput().blur();
        expect(handlers.onFocusIn).toHaveBeenCalledTimes(1);
        expect(handlers.onFocusOut).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        fireEvent.mouseEnter(getWrapper());
        expect(handlers.onMouseEnter).toHaveBeenCalledTimes(1);
        expect(query(document, 'boundary')).toHaveClass(`${prefix}-boundary-show`);
        fireEvent.mouseLeave(getWrapper());
        expect(handlers.onMouseLeave).toHaveBeenCalledTimes(1);
        expect(query(document, 'boundary')).not.toHaveClass(`${prefix}-boundary-show`);
    });
});

describe('Slider 的 tooltip', () => {
    it('tooltipVisible 为 true 时始终显示，为 null 时始终不显示', async () => {
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={30} tooltipVisible />);
        expect(await findTooltip()).toHaveTextContent('30');
        fireEvent.mouseEnter(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        unmount();

        render(() => <Slider style={SIZED} defaultValue={30} tooltipVisible={null as unknown as boolean} />);
        fireEvent.mouseEnter(getHandle());
        // give a tooltip the time it would need to show
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('悬停手柄显示该手柄的值，离开后隐藏', async () => {
        render(() => <Slider style={SIZED} defaultValue={[20, 60]} range />);
        const [minHandle, maxHandle] = getHandles();
        fireEvent.mouseEnter(maxHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        fireEvent.mouseLeave(maxHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());
        fireEvent.mouseEnter(minHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20'));
    });

    it('键盘聚焦显示 tooltip，随输入更新，Tab 离开后隐藏', async () => {
        render(() => <Slider style={SIZED} defaultValue={30} tipFormatter={(value) => `${value}%`} />);
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30%'));
        changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range 聚焦第二个手柄后切回第一个，只剩一个 tooltip', async () => {
        render(() => <Slider defaultValue={[20, 60]} range />);
        const [minInput, maxInput] = getInputs();
        tabTo(maxInput);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        tabTo(minInput);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(1));
        expect(getTooltip()).toHaveTextContent('20');
    });

    it('tipFormatter 对每个手柄单独调用，参数是 number；返回 null 时隐藏 tooltip', async () => {
        const tipFormatter = vi.fn<(value: number) => string>((value) => value.toFixed(1));
        const { unmount } = render(() => <Slider defaultValue={[20, 60]} range tipFormatter={tipFormatter} tooltipVisible />);
        await waitFor(() => expect(document.body).toHaveTextContent('60.0'));
        expect(document.body).toHaveTextContent('20.0');
        tipFormatter.mock.calls.forEach(([value]) => expect(typeof value).toBe('number'));
        unmount();

        render(() => <Slider style={SIZED} defaultValue={30} tipFormatter={null} />);
        fireEvent.mouseEnter(getHandle());
        tabTo(getInput());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('showArrow 为 false 时隐藏箭头，同时作用于 range 的两个 tooltip', async () => {
        const { unmount } = render(() => <Slider defaultValue={30} tooltipVisible />);
        expect(await findTooltip()).toHaveClass(`${BASE_CLASS_PREFIX}-tooltip-with-arrow`);
        unmount();

        render(() => <Slider defaultValue={[20, 60]} range showArrow={false} tooltipVisible />);
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-tooltip-wrapper-show`)).toHaveLength(2));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tooltip-with-arrow`)).toBeNull();
    });

    it('没有布局的 slider 不显示 tooltip', async () => {
        const onFocus = vi.fn<(event: unknown) => void>();
        const noBoxes = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        onTestFinished(() => noBoxes.mockRestore());
        render(() => <Slider defaultValue={30} tooltipVisible onFocus={onFocus} />);
        await findTooltip();
        fireEvent.mouseOver(getHandle());
        await waitFor(() => expect(getTooltip()).toBeNull());
        getInput().focus();
        expect(getTooltip()).toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('tooltipOnMark：悬停刻度点显示标签', async () => {
        render(() => <Slider defaultValue={30} marks={{ 20: '20c', 40: '40c' }} tooltipOnMark />);
        await userEvent.hover(queryAll(document, 'dot')[0]);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20c'));
    });

    it('tooltipOnMark 与 renderMark 同用时标签与气泡各调用一次', async () => {
        const renderMark = vi.fn<NonNullable<SliderProps['renderMark']>>((_, label) => <b>{label}</b>);
        render(() => <Slider defaultValue={30} marks={{ 20: '20c' }} renderMark={renderMark} tooltipOnMark />);
        expect(renderMark).toHaveBeenCalledTimes(1);
        await userEvent.hover(queryAll(document, 'dot')[0]);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20c'));
        expect(screen.getAllByText('20c')).toHaveLength(2);
        expect(renderMark).toHaveBeenCalledTimes(2);
    });

    it('handleDot：单个、数组与 range 共用', () => {
        const { unmount } = render(() => <Slider defaultValue={30} handleDot={{ size: '8px', color: 'red' }} />);
        const dot = query(document, 'handle-dot');
        expect(getHandle()).toContainElement(dot);
        expect(dot).toHaveStyle({ width: '8px', height: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        unmount();

        const shared = render(() => <Slider defaultValue={[20, 60]} range handleDot={{ size: '8px', color: 'red' }} />);
        expect(queryAll(document, 'handle-dot')).toHaveLength(2);
        shared.unmount();

        render(() => (
            <Slider
                defaultValue={[20, 60]}
                range
                handleDot={[
                    { size: '8px', color: 'red' },
                    { size: '10px', color: 'blue' },
                ]}
            />
        ));
        const [minHandle, maxHandle] = getHandles();
        expect(minHandle.querySelector(`.${prefix}-handle-dot`)).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        expect(maxHandle.querySelector(`.${prefix}-handle-dot`)).toHaveStyle({ width: '10px', backgroundColor: 'rgb(0, 0, 255)' });
    });
});

describe('Slider 的指针', () => {
    it('按下手柄聚焦输入框并取消 mousedown 默认行为，该手柄置顶', () => {
        render(() => <Slider defaultValue={[20, 60]} range />);
        const [minHandle, maxHandle] = getHandles();

        fireEvent.mouseDown(minHandle, { clientX: 20, clientY: 10 });
        expect(minHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).toHaveStyle({ zIndex: 2 });
        expect(maxHandle).toHaveStyle({ zIndex: 1 });
        expect(getInputs()[0]).toHaveFocus();
        expect(testingFireEvent.mouseDown(minHandle)).toBe(false);

        fireEvent.mouseDown(maxHandle, { clientX: 60, clientY: 10 });
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(maxHandle).toHaveStyle({ zIndex: 2 });
    });

    // jsdom handles have an empty rect (centre at clientX 0), so the drag offset stays zero
    it('拖动报告 onChange，松手报告 onAfterChange 与 onMouseUp 一次', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        const onMouseUp = vi.fn<(event: unknown) => void>();
        render(() => <Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} onMouseUp={onMouseUp} />);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        expect(fireEvent.mouseMove(document.body, { clientX: 40, clientY: 10 })).toBe(false);
        fireEvent.mouseMove(document.body, { clientX: 40, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 45, clientY: 10 });
        expect(onChange.mock.calls).toEqual([[40], [45]]);
        expectValues(45);
        expect(getHandle()).toHaveStyle({ left: '45%' });
        expect(query(document, 'track')).toHaveStyle({ width: '45%' });
        expect(onAfterChange).not.toHaveBeenCalled();

        fireEvent.mouseUp(window);
        fireEvent.mouseUp(window);
        expect(onAfterChange.mock.calls).toEqual([[45]]);
        expect(onMouseUp).toHaveBeenCalledTimes(1);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.mouseMove(document.body, { clientX: 70, clientY: 10 });
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('取整后值不变的拖动与轨道点击不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={{ width: '300px', height: '32px' }} defaultValue={40} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 121, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 121, clientY: 10 });
        fireEvent.mouseUp(window);
        fireEvent.click(query(document, 'rail'), { clientX: 121, clientY: 16 });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('拖动吸附到最近的步进值，步数从 min 计算', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={30} step={10} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(60);
        unmount();

        render(() => <Slider style={SIZED} defaultValue={25} min={5} step={10} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        // 64% of 5..100 is 65.8: the nearest of 5, 15, ..., 95 is 65
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        expect(onChange).toHaveBeenLastCalledWith(65);
        // max need not be on the step grid; the last step below it is the end
        fireEvent.mouseMove(document.body, { clientX: 100, clientY: 10 });
        expect(onChange).toHaveBeenLastCalledWith(95);
        fireEvent.mouseUp(window);
    });

    it('min 带小数时落在步长网格上的值不被再次取整；小数 step 的终点不被截掉', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={0.25} max={10.25} min={0.25} step={0.5} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        // 7.5% of 0.25..10.25 is 1.0, the nearest grid value from min is 0.75
        fireEvent.mouseMove(document.body, { clientX: 5, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(0.75);
        unmount();

        render(() => <Slider style={SIZED} defaultValue={0} max={0.3} step={0.1} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 100, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(0.3);
    });

    it.each([0, null])('step 为 %s 时指针按 1 取整，不回报 NaN', (step) => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={30} step={step as number} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 64, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(64);
        expectValues(64);
    });

    it('max - min 不是 step 的整数倍时，点击轨道末端不超过 max', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={0} max={11} step={3} onChange={onChange} />);
        fireEvent.click(query(document, 'rail'), { clientX: 100, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(9);
    });

    it('拖动范围最大值手柄时不移动最小值手柄', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={[20, 60]} range onChange={onChange} />);
        fireEvent.mouseDown(getHandles()[1], { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 80, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith([20, 80]);
        expectValues(20, 80);
    });

    it('垂直 slider 沿 y 轴拖动，verticalReverse 时反向', () => {
        const vertical = { width: '4px', height: '100px' };
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(() => <Slider style={vertical} vertical onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document.body, { clientX: 0, clientY: 70 });
        fireEvent.mouseUp(window);
        expect(onChange).toHaveBeenLastCalledWith(70);
        expect(getHandle()).toHaveStyle({ top: '70%' });
        unmount();

        render(() => <Slider style={vertical} vertical verticalReverse onChange={onChange} />);
        fireEvent.click(query(document, 'rail'), { clientX: 0, clientY: 20 });
        expect(onChange).toHaveBeenLastCalledWith(80);
        expectValues(80);
    });

    it('track 与刻度点的点击同 rail', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={30} marks={{ 20: 'a', 60: 'b' }} onChange={onChange} />);
        fireEvent.click(query(document, 'track'), { clientX: 20, clientY: 10 });
        expect(onChange).toHaveBeenLastCalledWith(20);
        fireEvent.click(queryAll(document, 'dot')[1], { clientX: 60, clientY: 10 });
        expectValues(60);
    });

    it('点击轨道时 rail 与 parent 的偏移被扣除', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider style={{ ...SIZED, 'margin-left': '20px' }} onChange={onChange} />);
        fireEvent.click(query(document, 'rail'), { clientX: 70 });
        expect(onChange).toHaveBeenCalledWith(50);
    });

    it('没有宽度的 slider 不报告 NaN', () => {
        const onChange = vi.fn<OnChange>();
        render(() => <Slider defaultValue={30} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        fireEvent.mouseUp(window);
        fireEvent.click(query(document, 'rail'), { clientX: 50 });
        expect(onChange).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('触摸 pointer 拖动，拖动期间忽略其他 pointer', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        fireEvent.pointerMove(document.body, touch({ pointerId: 7, clientX: 90, clientY: 10 }));
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(onChange).toHaveBeenLastCalledWith(50);
        fireEvent.pointerUp(document.body, touch({ pointerId: 7 }));
        expect(onAfterChange).not.toHaveBeenCalled();
        fireEvent.pointerUp(document.body, touch());
        expect(onAfterChange).toHaveBeenCalledWith(50);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
    });

    it('pointer 被取消时结束拖动', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);

        fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        fireEvent.pointerCancel(document.body, touch());
        fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));

        expect(onAfterChange).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
    });

    it('鼠标右键按下手柄不开始拖动', () => {
        const onChange = vi.fn<OnChange>();
        const onAfterChange = vi.fn<OnChange>();
        render(() => <Slider style={SIZED} defaultValue={30} onAfterChange={onAfterChange} onChange={onChange} />);
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
        const [disabled, setDisabled] = createSignal(false);
        render(() => <Slider style={SIZED} defaultValue={30} disabled={disabled()} onChange={onChange} onAfterChange={onAfterChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        setDisabled(true);
        fireEvent.mouseUp(window);
        expect(onAfterChange).toHaveBeenCalledTimes(1);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        setDisabled(false);
        fireEvent.click(query(document, 'rail'), { clientX: 80, clientY: 16 });
        expect(onChange).toHaveBeenLastCalledWith(80);
    });

    it('window 监听绑定到同一个 AbortController 的 signal，拖动结束或卸载时中止', () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={30} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });

        const signalOf = (options?: boolean | AddEventListenerOptions) => (options as AddEventListenerOptions | undefined)?.signal as AbortSignal;
        const dragCalls = addListener.mock.calls.filter(([, , options]) => signalOf(options) && ['pointermove', 'pointerup', 'pointercancel'].includes(addListener.mock.calls[0][0]));
        const dragEvents = dragCalls.filter(([type]) => ['pointermove', 'pointerup', 'pointercancel'].includes(type));
        expect(dragEvents.map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel']);
        const signal = signalOf(dragEvents[0][2]);
        expect(dragEvents.every(([, , options]) => signalOf(options) === signal)).toBe(true);
        expect(signal.aborted).toBe(false);
        fireEvent.mouseUp(window);
        expect(signal.aborted).toBe(true);

        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        const second = signalOf(addListener.mock.calls.filter(([type, , options]) => type === 'pointerup' && signalOf(options)).at(-1)?.[2]);
        expect(second).not.toBe(signal);
        unmount();
        expect(second.aborted).toBe(true);
        addListener.mockRestore();
    });

    it('卸载后拖动事件不再报告', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = render(() => <Slider style={SIZED} defaultValue={30} onChange={onChange} />);
        fireEvent.mouseDown(getHandle(), { clientX: 0, clientY: 10 });
        unmount();
        fireEvent.mouseMove(document.body, { clientX: 50, clientY: 10 });
        fireEvent.mouseUp(window);
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Slider 作为 Tooltip 触发器', () => {
    it('禁用的 Slider 被 Tooltip 的包裹元素接管', () => {
        render(() => (
            <Tooltip content="tip" trigger="click">
                <Slider defaultValue={30} disabled />
            </Tooltip>
        ));
        const wrapper = getWrapper().closest(`.${BASE_CLASS_PREFIX}-tooltip-trigger-wrapper`) as HTMLElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('展开触发器属性后 ref 与描述落在 wrapper 上', async () => {
        render(() => <Tooltip content="tip">{(getTriggerProps) => <Slider defaultValue={30} {...(getTriggerProps() as SliderProps)} />}</Tooltip>);
        expect(getWrapper()).toBeInTheDocument();
        expect(getInput()).toBeInTheDocument();
    });

    it('展开信号对象时，无关属性变化不重置非受控的值', () => {
        const [props, setProps] = createSignal<SliderProps>({ defaultValue: 10 });
        render(() => <Slider {...props()} />);
        changeTo(getInput(), 40);
        expect(getInput().value).toBe('40');
        setProps({ defaultValue: 10, class: 'other' });
        expect(getWrapper()).toHaveClass('other');
        expect(getInput().value).toBe('40');
    });

    it('整体替换 props 时保留根节点与焦点', () => {
        const [props, setProps] = createSignal<SliderProps>({ defaultValue: 10 });
        render(() => <Slider {...props()} />);
        const wrapper = getWrapper();
        getInput().focus();
        setProps({ defaultValue: 10, showBoundary: true });
        expect(getWrapper()).toBe(wrapper);
        expect(getInput()).toHaveFocus();
    });

    it('ref 的 focus 落到最小手柄，blur 释放', () => {
        let ref!: HTMLDivElement;
        render(() => <Slider ref={(node) => (ref = node)} range defaultValue={[10, 40]} />);
        ref.focus();
        expect(getInputs()[0]).toHaveFocus();
        ref.blur();
        expect(document.body).toHaveFocus();
    });
});
