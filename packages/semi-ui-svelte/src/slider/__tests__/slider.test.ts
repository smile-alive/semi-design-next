import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { SliderProps } from '../interface';
import SliderConfig from './slider-config.svelte';
import SliderFixture from './slider-fixture.svelte';
import SliderLabelled from './slider-labelled.svelte';
import SliderModes from './slider-modes.svelte';
import SliderSnippets from './slider-snippets.svelte';

type OnChange = (value: number | number[]) => void;
type Value = number | number[] | undefined;
type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

const prefix = 'semi-slider';
const SIZED = 'width: 100px; height: 32px';
const VERTICAL = 'width: 4px; height: 400px; margin-left: 20px; margin-top: 40px';

const mouse = { pointerId: 1, pointerType: 'mouse' };
const touch = (init = {}) => ({ pointerId: 2, pointerType: 'touch', ...init });

// jsdom lays nothing out: the test setup reads a box from the inline width, height and margins, so a slider needs a SIZED style to be clicked or dragged.
async function settle() {
    await Promise.resolve();
    flushSync();
}
async function press(el: Element, init = {}) {
    await fireEvent.pointerDown(el, { ...mouse, ...init });
    flushSync();
}
async function move(init = {}) {
    await fireEvent.pointerMove(document.body, { ...mouse, ...init });
    flushSync();
}
async function release(init = {}) {
    await fireEvent.pointerUp(window, { ...mouse, ...init });
    flushSync();
}
async function click(el: Element, init = {}) {
    await fireEvent.click(el, init);
    flushSync();
}

// A hidden tooltip keeps its node until the CSS leave animation ends, which jsdom never fires; `-wrapper-show` marks the tooltip as visible.
const getTooltip = () => document.querySelector(`.semi-tooltip-wrapper-show`);
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
const expectValues = (...values: number[]) => expect(getInputs().map((input) => input.value)).toEqual(values.map(String));
// A key on a native range changes its value; jsdom runs no such default action, so the input event is fired directly.
async function changeTo(input: HTMLInputElement, value: number) {
    await fireEvent.input(input, { target: { value: String(value) } });
    flushSync();
}
// Focus an input the way a Tab press does: jsdom's :focus-visible heuristic needs a key press first.
async function tabTo(el: HTMLElement) {
    await fireEvent.keyDown(document.body, { key: 'Tab' });
    el.focus();
    await settle();
}
// fireEvent resolves to nothing, so checks of the default action dispatch the event themselves
async function dispatch(target: EventTarget, event: Event) {
    target.dispatchEvent(event);
    await settle();
    return event;
}

function setup(props: SliderProps = {}, style?: string) {
    const store = createStore<{ props: SliderProps }>({ props: { ...(style ? { style } : {}), ...props } });
    const view = render(SliderFixture, { props: { store } });
    flushSync();
    return { store, ...view };
}

function setupConfig(props: SliderProps, extra: { direction?: 'ltr' | 'rtl'; locale?: typeof en_US } = {}) {
    render(SliderConfig, { props: { props, ...extra } });
    flushSync();
}

function setupModes(mode: Mode, value?: Value, { accept = true, range = false } = {}) {
    const store = createStore<{ value: Value; accept: boolean; log: string[] }>({ value, accept, log: [] });
    render(SliderModes, { props: { mode, store, range } });
    flushSync();
    return { store, input: getInputs()[0] as HTMLInputElement };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Slider 受控值（$bindable）', () => {
    it('非受控：轨道点击与输入框变化移动手柄，onChange 与 onAfterChange 各报告一次', async () => {
        const { store } = setupModes('uncontrolled');
        expectValues(0);
        await click(query('rail'), { clientX: 40, clientY: 16 });
        expectValues(40);
        await changeTo(getInputs()[0] as HTMLInputElement, 41);
        await fireEvent.keyUp(getInputs()[0] as HTMLInputElement, { key: 'ArrowRight' });
        expectValues(41);
        expect(store.log).toEqual(['change 40', 'after 40', 'change 41', 'after 41']);
    });

    it('非受控：拖动期间只报告 onChange，松开后报告一次 onAfterChange', async () => {
        const { store } = setupModes('uncontrolled');
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 40, clientY: 10 });
        await move({ clientX: 40, clientY: 10 });
        await move({ clientX: 45, clientY: 10 });
        await release();
        expect(store.log).toEqual(['change 40', 'change 45', 'after 45']);
        expectValues(45);
    });

    it('bind:value：点击写回父级，父级改值同步到滑块', async () => {
        const { store } = setupModes('bind', 30);
        expectValues(30);
        await click(query('rail'), { clientX: 70, clientY: 16 });
        expect(store.value).toBe(70);
        expectValues(70);
        store.value = 20;
        flushSync();
        expectValues(20);
        expect(getHandle()).toHaveStyle({ left: '20%' });
        // a controlled value change ends a change too
        expect(store.log).toEqual(['change 70', 'after 70', 'after 20']);
    });

    it('bind:value 重置为 undefined 后回到 min，不报告 afterChange', async () => {
        const { store } = setupModes('bind', 30);
        await click(query('rail'), { clientX: 70, clientY: 16 });
        store.log.length = 0;
        store.value = undefined;
        flushSync();
        expectValues(0);
        expect(store.log).toEqual([]);
        // back to uncontrolled: the slider moves itself and reports the end of the change itself
        await click(query('rail'), { clientX: 50, clientY: 16 });
        expectValues(50);
        expect(store.log).toEqual(['change 50', 'after 50']);
    });

    it('bind:value 的范围值：拖动最大值滑块写回数组', async () => {
        const { store } = setupModes('bind', [20, 60], { range: true });
        await press(getHandles()[1] as HTMLElement, { clientX: 0, clientY: 10 });
        await move({ clientX: 80, clientY: 10 });
        await release();
        expect(store.value).toEqual([20, 80]);
        expectValues(20, 80);
    });

    it('函数绑定：setter 拒绝时滑块保持原值，输入框也被改回', async () => {
        const { store, input } = setupModes('function', 30, { accept: false });
        await changeTo(input, 31);
        expect(store.log).toEqual(['set 31', 'change 31']);
        expect(store.value).toBe(30);
        expect(input.value).toBe('30');
        expect(getHandle()).toHaveStyle({ left: '30%' });
        await click(query('rail'), { clientX: 80, clientY: 16 });
        expect(store.value).toBe(30);
        expectValues(30);
        expect(getHandle()).toHaveStyle({ left: '30%' });
    });

    it('函数绑定：setter 接受时滑块跟随', async () => {
        const { store, input } = setupModes('function', 30, { accept: true });
        await changeTo(input, 31);
        expect(store.value).toBe(31);
        expect(input.value).toBe('31');
    });

    it('单向传值：交互在本地覆盖，父级值不变；父级再推值时以父级为准', async () => {
        const { store, input } = setupModes('one-way', 30);
        await changeTo(input, 31);
        expect(store.value).toBe(30);
        expectValues(31);
        store.value = 50;
        flushSync();
        expectValues(50);
        expect(store.log).toContain('after 50');
    });

    it('受控范围值接收内容相同的新数组时不报告变化，越界值夹到边界', async () => {
        const { store } = setupModes('one-way', [20, 60], { range: true });
        store.value = [20, 60];
        flushSync();
        expect(store.log).toEqual([]);
        store.value = [10, 120];
        flushSync();
        expectValues(10, 100);
        expect(store.log).toEqual(['after [10,120]']);
        store.value = [150, 200];
        flushSync();
        expectValues(100, 100);
        store.value = [-50, -10];
        flushSync();
        expectValues(0, 0);
    });

    it('形状错误的受控范围值被忽略', () => {
        const { store } = setupModes('one-way', [20, 60], { range: true });
        store.value = [10, undefined] as unknown as number[];
        flushSync();
        expectValues(20, 60);
    });

    it('值为 0 时是受控的 0；值低于 min 时夹到 min', () => {
        setup({ value: 0 });
        expect(getInput()).toHaveValue('0');
    });
});

describe('Svelte Slider', () => {
    it('初始值与范围值', () => {
        setup({ value: 10, showBoundary: true });
        setup({ value: [20, 60], range: true });
        const handles = getHandles();
        expect(handles[0]).toHaveStyle({ left: '10%' });
        expect(handles[1]).toHaveStyle({ left: '20%' });
        expect(handles[2]).toHaveStyle({ left: '60%' });
        expectValues(10, 20, 60);
    });

    it('无值时手柄在 min，范围时两端都在 min', () => {
        setup({ min: 10, max: 50 });
        setup({ min: 10, max: 50, range: true });
        setup({ min: -10, max: 50, value: 0 });
        expectValues(10, 10, 10, 0);
    });

    it('值低于 min 时夹到 min', () => {
        setup({ min: 0, value: -10 });
        expectValues(0);
        expect(getHandle()).toHaveStyle({ left: '0%' });
    });

    it('轨道点击报告点击位置的值', async () => {
        const change = vi.fn<OnChange>();
        setup({ step: 1, onChange: change }, `${SIZED}; margin-left: 13px`);
        await click(query('rail'), { clientX: 113, clientY: 16 });
        expectValues(100);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenLastCalledWith(100);
        await click(query('rail'), { clientX: 13, clientY: 16 });
        expectValues(0);
        expect(change).toHaveBeenLastCalledWith(0);
    });

    it('垂直范围轨道点击', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: [20, 60], range: true, vertical: true, onChange: change }, VERTICAL);
        await click(query('rail'), { clientX: 22, clientY: 40 });
        expectValues(0, 60);
        expect(change).toHaveBeenCalledTimes(1);
        expect(change).toHaveBeenLastCalledWith([0, 60]);
        await click(query('rail'), { clientX: 22, clientY: 440 });
        expectValues(0, 100);
        expect(change).toHaveBeenLastCalledWith([0, 100]);
    });

    it.each([
        ['horizontal', {}, SIZED, { clientX: 25, clientY: 16 }, false],
        ['horizontal rtl', {}, SIZED, { clientX: 75, clientY: 16 }, true],
        ['vertical', { vertical: true }, VERTICAL, { clientX: 22, clientY: 140 }, false],
        ['vertical reverse', { vertical: true, verticalReverse: true }, VERTICAL, { clientX: 22, clientY: 340 }, false],
    ])('范围轨道点击时移动最近的滑块：%s', async (_name, extra: SliderProps, style, point, rtl) => {
        const props = { value: [20, 80], step: 1, range: true, ...extra };
        if (rtl) {
            setupConfig({ ...props, style }, { direction: 'rtl' });
        } else {
            setup(props, style);
        }
        await click(query('rail'), point);
        expectValues(25, 80);
        const key = extra.vertical ? 'clientY' : 'clientX';
        const step = (extra.vertical ? 4 : 1) * 60 * (extra.verticalReverse || rtl ? -1 : 1);
        await click(query('rail'), { ...point, [key]: point[key as keyof typeof point] + step });
        expectValues(25, 85);
    });

    it('track 点击、刻度点与刻度标签点击取对应位置的值', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 30, onChange: change, marks: { 20: '20c', 40: '40c', 60: '60c' } }, SIZED);
        await click(query('track'), { clientX: 20, clientY: 10 });
        expectValues(20);
        await click(queryAll('dot')[2] as HTMLElement, { clientX: 60, clientY: 10 });
        expectValues(60);
        await click(screen.getByText('40c'), { clientX: 40, clientY: 10 });
        expectValues(40);
        expect(change.mock.calls).toEqual([[20], [60], [40]]);
    });

    it('点击刻度标签取该刻度的值，标签较宽时点到旁边也一样', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 50, marks: { 20: '二十', 80: '八十' }, onChange: change }, SIZED);
        await click(screen.getByText('二十'), { clientX: 35, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith(20);
        expectValues(20);
    });

    it('range 点击刻度标签移动离该刻度近的手柄', async () => {
        const change = vi.fn<OnChange>();
        setup({ range: true, value: [10, 90], marks: { 20: '二十', 80: '八十' }, onChange: change }, SIZED);
        await click(screen.getByText('八十'), { clientX: 60, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith([10, 80]);
        expectValues(10, 80);
    });

    it('点击轨道时按指针位置吸附到最近的步进值，点击当前值不报告变化', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 30, step: 10, onChange: change }, SIZED);
        await click(query('rail'), { clientX: 47 });
        expect(change).toHaveBeenCalledWith(50);
        expectValues(50);
        change.mockClear();
        await click(query('rail'), { clientX: 50 });
        expect(change).not.toHaveBeenCalled();
    });

    it('点击当前值既不报告 change 也不报告 afterChange', async () => {
        const { store } = setupModes('uncontrolled');
        await click(query('rail'), { clientX: 0 });
        expect(store.log).toEqual([]);
    });

    it('step 为 1 时取整后值不变的拖动与点击不触发 change', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 40, onChange: change }, 'width: 300px; height: 32px');
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 121, clientY: 10 });
        await move({ clientX: 121, clientY: 10 });
        await release();
        await click(query('rail'), { clientX: 121, clientY: 16 });
        expect(change).not.toHaveBeenCalled();
    });

    it('垂直时没有外层 .semi-slider 容器，水平时有', () => {
        const vertical = setup({ value: 30, vertical: true });
        expect(query('vertical-wrapper')).not.toBeNull();
        expect(vertical.container.querySelector(`.${prefix}`)).toBeNull();
        expect(getHandle()).toHaveStyle({ top: '30%' });
        vertical.unmount();

        const horizontal = setup({ value: 30 });
        const outer = horizontal.container.querySelector(`.${prefix}`) as HTMLElement;
        expect(outer.firstElementChild).toHaveClass(`${prefix}-wrapper`);
    });

    it('step、min、max 属性落到输入框，边界标签随 min、max 变化', async () => {
        const { store } = setup({ value: 30, max: 50, min: 10, step: 10, showBoundary: true });
        const input = getInput();
        expect(input).toHaveAttribute('step', '10');
        expect(input).toHaveAttribute('min', '10');
        expect(input).toHaveAttribute('max', '50');
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query('boundary-min')).toHaveTextContent(/^10$/);
        expect(query('boundary-max')).toHaveTextContent(/^50$/);
        await changeTo(input, 40);
        expectValues(40);
        store.props.max = 60;
        store.props.min = 0;
        flushSync();
        expect(query('boundary-min')).toHaveTextContent(/^0$/);
        expect(query('boundary-max')).toHaveTextContent(/^60$/);
        expect(input).toHaveAttribute('max', '60');
    });

    it('小数 step', async () => {
        setup({ value: 0.5, max: 1, min: 0, step: 0.1 });
        expectValues(0.5);
        expect(getInput()).toHaveAttribute('step', '0.1');
        await changeTo(getInput(), 0.6);
        expectValues(0.6);
    });

    it('track 与 rail 的样式随 included、vertical、range、railStyle 变化', () => {
        setup({ value: 30, included: true, railStyle: 'background-color: #ccc' });
        expect(query('track')).toHaveStyle({ width: '30%' });
        expect(query('rail')).toHaveStyle({ backgroundColor: 'rgb(204, 204, 204)' });
        setup({ value: 30, included: false });
        expect(queryAll('track')[1]?.getAttribute('style')).toBeFalsy();
        setup({ value: 30, vertical: true });
        expect(queryAll('track')[2]).toHaveStyle({ height: '30%' });
        expect((queryAll('track')[2] as HTMLElement).style.width).toBe('');
        setup({ value: [20, 60], range: true });
        expect(queryAll('track')[3]).toHaveStyle({ width: '40%', left: '20%' });
        setup({ value: [20, 60], range: true, included: false });
        expect((queryAll('track')[4] as HTMLElement).style.width).toBe('');
    });

    it('刻度：数量、激活状态、included 与 showMarkLabel', () => {
        const view = setup({ value: 37, marks: { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' } });
        expect(queryAll('dot')).toHaveLength(4);
        expect(queryAll('dot-active')).toHaveLength(3);
        expect(screen.getByText('26°C')).toHaveStyle({ left: '26%' });
        view.unmount();

        setup({ value: 30, included: false, marks: { 0: '0', 50: '50', 100: '100' } });
        expect(queryAll('dot')).toHaveLength(3);
        expect(queryAll('dot-active')).toHaveLength(0);
    });

    it('仅高亮 included 范围内的刻度', () => {
        const { store } = setup({ value: [20, 60], marks: { 10: 'a', 40: 'b', 80: 'c' }, range: true });
        expect(queryAll('dot')).toHaveLength(3);
        expect(queryAll('dot-active')).toHaveLength(1);
        store.props.included = false;
        flushSync();
        expect(queryAll('dot-active')).toHaveLength(3);
    });

    it('showMarkLabel 为 false 时不渲染标签，空 marks 不渲染刻度', () => {
        const view = setup({ value: 30, marks: { 20: '20c', 40: '40c' }, showMarkLabel: false });
        expect(query('marks')).toBeNull();
        expect(screen.queryByText('20c')).toBeNull();
        expect(queryAll('dot')).toHaveLength(2);
        view.unmount();
        setup({ value: 30, marks: {} });
        expect(queryAll('dot')).toHaveLength(0);
        expect(query('marks')).toBeNull();
    });

    it('verticalReverse 下的刻度与手柄方向', () => {
        setup({ value: [20, 60], marks: { 20: '20c', 40: '40c' }, range: true, vertical: true, verticalReverse: true });
        expect(query('marks-reverse')).not.toBeNull();
        expect(queryAll('mark-reverse')).toHaveLength(2);
        expect(query('wrapper')).toHaveClass(`${prefix}-vertical-wrapper`, `${prefix}-reverse`);
        const [minHandle, maxHandle] = getHandles();
        expect(minHandle).toHaveStyle({ top: '20%' });
        expect(maxHandle).toHaveStyle({ top: '60%' });
    });

    it('rtl 方向下，滑块和 track 从右侧定位', () => {
        setupConfig({ value: 30 }, { direction: 'rtl' });
        expect(getHandle()).toHaveStyle({ right: '30%' });
        expect(query('track')).toHaveStyle({ width: '30%', right: '0px' });
    });

    it('class 与 style 落在 wrapper，data-* 与 title 透传', () => {
        setup({ value: 30, class: 'custom-slider', style: 'width: 300px', title: 'Volume', 'data-kind': 'audio', 'data-testid': 'volume' } as SliderProps);
        const wrapper = query('wrapper');
        expect(wrapper).toHaveClass('custom-slider');
        expect(wrapper).toHaveStyle({ width: '300px' });
        expect(screen.getByTestId('volume')).toBe(wrapper);
        expect(wrapper).toHaveAttribute('data-kind', 'audio');
        expect(wrapper).toHaveAttribute('title', 'Volume');
    });

    it('showBoundary：悬停 wrapper 显示边界，垂直时同样', async () => {
        setup({ value: 30, showBoundary: true });
        const boundary = query('boundary');
        expect(query('boundary-min')).toHaveTextContent(/^0$/);
        expect(query('boundary-max')).toHaveTextContent(/^100$/);
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
        await fireEvent.mouseEnter(query('wrapper'));
        expect(boundary).toHaveClass(`${prefix}-boundary-show`);
        await fireEvent.mouseLeave(query('wrapper'));
        expect(boundary).not.toHaveClass(`${prefix}-boundary-show`);
    });

    it('disabled 变化后禁用与恢复，禁用的 slider 忽略拖动、点击和输入', async () => {
        const change = vi.fn<OnChange>();
        const { store } = setup({ value: 30, onChange: change }, SIZED);
        expect(query('disabled')).toBeNull();
        store.props.disabled = true;
        flushSync();
        expect(query('disabled')).not.toBeNull();
        expect(getInput()).toBeDisabled();
        await press(getHandle(), { clientX: 0, clientY: 10 });
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        await move({ clientX: 60, clientY: 10 });
        await release();
        await click(query('rail'), { clientX: 80 });
        await changeTo(getInput(), 31);
        expect(change).not.toHaveBeenCalled();
        expectValues(30);
        store.props.disabled = false;
        flushSync();
        expect(query('disabled')).toBeNull();
        await click(query('rail'), { clientX: 80 });
        expect(change).toHaveBeenCalledWith(80);
    });
});

describe('Svelte Slider 拖动', () => {
    // jsdom gives handles an empty rect, so a handle's centre is at clientX 0; pressing there keeps the drag offset at zero and the handle follows the pointer exactly.
    it('拖动报告新值，手柄与 track 跟随，松开后报告 afterChange 与 mouseUp', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        setup({ value: 30, onAfterChange: afterChange, onChange: change, onMouseUp: mouseUp }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        await move({ clientX: 50, clientY: 10 });
        expect(change).toHaveBeenLastCalledWith(50);
        expectValues(50);
        expect(getHandle()).toHaveStyle({ left: '50%' });
        expect(query('track')).toHaveStyle({ width: '50%' });
        await release({ clientX: 50, clientY: 10 });
        expect(afterChange).toHaveBeenLastCalledWith(50);
        expect(mouseUp).toHaveBeenCalledTimes(1);
        expect(mouseUp.mock.calls[0]?.[0].type).toBe('pointerup');
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        await release();
        expect(mouseUp).toHaveBeenCalledTimes(1);
    });

    it('拖动中 pointermove 的默认行为被阻止', async () => {
        setup({ value: 30 }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        const event = await dispatch(document.body, new PointerEvent('pointermove', { ...mouse, bubbles: true, cancelable: true, clientX: 40, clientY: 10 }));
        expect(event.defaultPrevented).toBe(true);
    });

    it('拖动时吸附到最近的步进值，步数从 min 计算', async () => {
        const change = vi.fn<OnChange>();
        const view = setup({ value: 30, step: 10, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 64, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith(60);
        view.unmount();

        setup({ value: 25, min: 5, step: 10, onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 64, clientY: 10 });
        expect(change).toHaveBeenLastCalledWith(65);
        await move({ clientX: 100, clientY: 10 });
        // max need not sit on the step grid: the last step below it
        expect(change).toHaveBeenLastCalledWith(95);
        await release();
    });

    it('拖动范围最大值滑块时不移动最小值滑块', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: [20, 60], range: true, onChange: change }, SIZED);
        await press(getHandles()[1] as HTMLElement, { clientX: 0, clientY: 10 });
        await move({ clientX: 80, clientY: 10 });
        await release();
        expect(change).toHaveBeenLastCalledWith([20, 80]);
        expectValues(20, 80);
    });

    it('垂直 slider 沿 y 轴拖动，verticalReverse 时反向', async () => {
        const vertical = 'width: 4px; height: 100px';
        const change = vi.fn<OnChange>();
        const view = setup({ vertical: true, onChange: change }, vertical);
        await press(getHandle(), { clientX: 0, clientY: 0 });
        await move({ clientX: 0, clientY: 70 });
        await release();
        expect(change).toHaveBeenLastCalledWith(70);
        expect(getHandle()).toHaveStyle({ top: '70%' });
        view.unmount();

        setup({ vertical: true, verticalReverse: true, onChange: change }, vertical);
        await click(query('rail'), { clientX: 0, clientY: 20 });
        expect(change).toHaveBeenLastCalledWith(80);
        expectValues(80);
    });

    it('触摸拖动期间忽略其他 pointer，取消时结束拖动', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        const view = setup({ onAfterChange: afterChange, onChange: change }, SIZED);
        await fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        await fireEvent.pointerMove(document.body, touch({ pointerId: 7, clientX: 90, clientY: 10 }));
        expect(change).not.toHaveBeenCalled();
        await fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(change).toHaveBeenLastCalledWith(50);
        await fireEvent.pointerUp(document.body, touch({ pointerId: 7 }));
        expect(afterChange).not.toHaveBeenCalled();
        await fireEvent.pointerUp(document.body, touch());
        expect(afterChange).toHaveBeenCalledWith(50);
        view.unmount();

        const cancelChange = vi.fn<OnChange>();
        const cancelAfter = vi.fn<OnChange>();
        setup({ onAfterChange: cancelAfter, onChange: cancelChange }, SIZED);
        await fireEvent.pointerDown(getHandle(), touch({ clientX: 0, clientY: 10 }));
        await fireEvent.pointerCancel(document.body, touch());
        await fireEvent.pointerMove(document.body, touch({ clientX: 50, clientY: 10 }));
        expect(cancelAfter).toHaveBeenCalledTimes(1);
        expect(cancelChange).not.toHaveBeenCalled();
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
    });

    it('鼠标右键按下手柄不开始拖动', async () => {
        const change = vi.fn<OnChange>();
        const afterChange = vi.fn<OnChange>();
        setup({ value: 30, onChange: change, onAfterChange: afterChange }, SIZED);
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
        const { store } = setup({ onChange: change, onAfterChange: afterChange }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 50, clientY: 10 });
        expect(getHandle()).toHaveClass(`${prefix}-handle-clicked`);
        store.props.disabled = true;
        flushSync();
        afterChange.mockClear();
        await release();
        expect(afterChange).toHaveBeenCalledTimes(1);
        expect(getHandle()).not.toHaveClass(`${prefix}-handle-clicked`);
        store.props.disabled = false;
        flushSync();
        await click(query('rail'), { clientX: 80, clientY: 16 });
        expect(change).toHaveBeenLastCalledWith(80);
    });

    it('卸载后拖动监听解除', async () => {
        const change = vi.fn<OnChange>();
        const view = setup({ onChange: change }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        view.unmount();
        await move({ clientX: 50, clientY: 10 });
        await release();
        expect(change).not.toHaveBeenCalled();
    });

    it('window 监听绑定到同一个 AbortController 的 signal，拖动结束或卸载时中止', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const view = setup({ value: 30 }, SIZED);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        const signalOf = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal;
        const dragCalls = () => addListener.mock.calls.filter(([, , options]) => signalOf(options));
        expect(dragCalls().map(([type]) => type)).toEqual(['pointermove', 'pointerup', 'pointercancel']);
        const signal = signalOf(dragCalls()[0]?.[2]) as AbortSignal;
        expect(signal.aborted).toBe(false);
        await release();
        expect(signal.aborted).toBe(true);
        await press(getHandle(), { clientX: 0, clientY: 10 });
        const second = signalOf(dragCalls().at(-1)?.[2]) as AbortSignal;
        expect(second).not.toBe(signal);
        view.unmount();
        expect(second.aborted).toBe(true);
        addListener.mockRestore();
    });

    it('没有宽度的 slider 不报告 NaN', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 30, onChange: change });
        await press(getHandle(), { clientX: 0, clientY: 10 });
        await move({ clientX: 50, clientY: 10 });
        await release();
        await click(query('rail'), { clientX: 50 });
        expect(change).not.toHaveBeenCalled();
        expectValues(30);
    });

    it('handle 的 pointerdown 聚焦输入框，mousedown 不移走焦点，range 的层级跟随最近按下的手柄', async () => {
        setup({ value: [20, 60], range: true });
        const [minHandle, maxHandle] = getHandles() as [HTMLElement, HTMLElement];
        await press(minHandle, { clientX: 20, clientY: 10 });
        expect(minHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).toHaveStyle({ zIndex: 2 });
        expect(maxHandle).toHaveStyle({ zIndex: 1 });
        expect(getInputs()[0]).toHaveFocus();
        const mousedown = await dispatch(minHandle, new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        expect(mousedown.defaultPrevented).toBe(true);
        await press(maxHandle, { clientX: 60, clientY: 10 });
        expect(maxHandle).toHaveClass(`${prefix}-handle-clicked`);
        expect(minHandle).not.toHaveClass(`${prefix}-handle-clicked`);
        expect(maxHandle).toHaveStyle({ zIndex: 2 });
        expect(minHandle).toHaveStyle({ zIndex: 1 });
    });
});

describe('Svelte Slider 输入框与键盘', () => {
    it('手柄 input 的 input 事件改值并报告', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: 30, onChange: change });
        await changeTo(getInput(), 31);
        expectValues(31);
        expect(change).toHaveBeenCalledWith(31);
    });

    it('两个范围输入都横跨 slider 边界，且一个滑块不能越过另一个', async () => {
        const change = vi.fn<OnChange>();
        setup({ value: [20, 60], max: 100, min: 0, range: true, onChange: change });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        [minInput, maxInput].forEach((input) => {
            expect(input).toHaveAttribute('min', '0');
            expect(input).toHaveAttribute('max', '100');
        });
        await changeTo(minInput, 100);
        expectValues(60, 60);
        await changeTo(maxInput, 0);
        expectValues(60, 60);
        expect(change.mock.calls).toEqual([[[60, 60]]]);
    });

    it('value 相关的 key 留在 slider 上：方向键由 slider 处理，Page、Home、End 保留原生默认行为；其他 key 传递给祖先元素', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', keydown);
        setup({ value: 30 });
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

    it('onKeyDown 在手柄上对每个按键各调用一次，调用 preventDefault 后 slider 不再独占该 value key', async () => {
        const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
        const ancestor = vi.fn<(event: KeyboardEvent) => void>();
        document.addEventListener('keydown', ancestor);
        const view = setup({ value: 30, onKeyDown });
        await fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        await fireEvent.keyDown(getInput(), { key: 'Tab' });
        expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['ArrowRight', 'Tab']);
        expect(ancestor).toHaveBeenCalledTimes(1);
        view.unmount();

        ancestor.mockClear();
        setup({ value: 30, onKeyDown: (event) => event.preventDefault() });
        await fireEvent.keyDown(getInput(), { key: 'ArrowRight' });
        expect(ancestor).toHaveBeenCalledTimes(1);
        expectValues(30);
        document.removeEventListener('keydown', ancestor);
    });

    it('带 Alt、Ctrl 或 Meta 的 value key 是浏览器快捷键，传递给祖先元素且不结束变化', async () => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        const afterChange = vi.fn<OnChange>();
        document.addEventListener('keydown', keydown);
        setup({ value: 30, onAfterChange: afterChange });
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            await fireEvent.keyDown(getInput(), { key: 'ArrowLeft', [modifier]: true });
            await fireEvent.keyUp(getInput(), { key: 'ArrowLeft', [modifier]: true });
        }
        expect(keydown).toHaveBeenCalledTimes(3);
        expect(afterChange).not.toHaveBeenCalled();
        document.removeEventListener('keydown', keydown);
    });

    it('仅松开 value 相关的 key 时报告 afterChange 与 mouseUp，载荷为 KeyboardEvent', async () => {
        const afterChange = vi.fn<OnChange>();
        const mouseUp = vi.fn<(event: PointerEvent | KeyboardEvent) => void>();
        setup({ value: 30, onAfterChange: afterChange, onMouseUp: mouseUp });
        await userEvent.tab();
        expect(getInput()).toHaveFocus();
        await fireEvent.keyUp(getInput(), { key: 'Shift' });
        expect(afterChange).not.toHaveBeenCalled();
        expect(mouseUp).not.toHaveBeenCalled();
        await fireEvent.keyUp(getInput(), { key: 'ArrowRight' });
        expect(afterChange.mock.calls).toEqual([[30]]);
        expect(mouseUp.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    });

    it('键盘聚焦显示格式化后的 tooltip，Tab 离开后隐藏', async () => {
        setup({ value: 30, tipFormatter: (value: number) => `${value}%` }, SIZED);
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toHaveTextContent('30%'));
        await changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
        await userEvent.tab();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('range 最大值滑块的 focus 与 blur，焦点切到最小值滑块时 tooltip 随之切换', async () => {
        setup({ value: [20, 60], range: true });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        await tabTo(maxInput);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        await tabTo(minInput);
        await waitFor(() => expect(document.querySelectorAll('.semi-tooltip-wrapper-show')).toHaveLength(1));
        expect(getTooltip()).toHaveTextContent('20');
        minInput.blur();
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('focus 在每次手柄聚焦时触发，blur 只在焦点离开整个 Slider 时触发', async () => {
        const focus = vi.fn<(event: FocusEvent) => void>();
        const blur = vi.fn<(event: FocusEvent) => void>();
        setup({ value: [20, 60], range: true, onFocus: focus, onBlur: blur });
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

    it('只有输入框是 Tab 停靠点，绘制滑块的元素不是且不被 Tooltip 描述', async () => {
        setup({ value: [20, 60], range: true });
        const [minInput, maxInput] = getInputs() as [HTMLInputElement, HTMLInputElement];
        await userEvent.tab();
        expect(minInput).toHaveFocus();
        await userEvent.tab();
        expect(maxInput).toHaveFocus();
        getHandles().forEach((handle) => {
            expect(handle).toHaveAttribute('tabindex', '-1');
            expect(handle).not.toHaveAttribute('aria-describedby');
        });
    });

    it('autofocus 只落到起点手柄的 input', () => {
        setup({ range: true, value: [10, 20], autofocus: true });
        expect(getInputs()[0]).toHaveAttribute('autofocus');
        expect(getInputs()[1]).not.toHaveAttribute('autofocus');
        expect(query('wrapper')).not.toHaveAttribute('autofocus');
    });
});

describe('Svelte Slider 可访问性与属性', () => {
    it('aria-label、aria-valuetext、getAriaValueText', () => {
        setup({ 'aria-label': 'Volume slider', 'aria-valuetext': '30 percent', value: 30 });
        expect(screen.getByRole('slider', { name: 'Volume slider' })).toHaveAttribute('aria-valuetext', '30 percent');
    });

    it('getAriaValueText 收到值与手柄序号，优先于 aria-valuetext', () => {
        setup({ value: [20, 60], range: true, getAriaValueText: (value, index) => `${value}% (${index === 0 ? 'min' : 'max'})`, 'aria-valuetext': 'ignored' });
        const [min, max] = getInputs();
        expect(min).toHaveAttribute('aria-valuetext', '20% (min)');
        expect(max).toHaveAttribute('aria-valuetext', '60% (max)');
    });

    it('handle 输入携带值和边界，不重复 aria-valuenow', () => {
        setup({ value: 50, max: 90, min: 10 });
        const input = getInput();
        expect(input).toHaveAttribute('type', 'range');
        expect(input).toHaveValue('50');
        expect(input).not.toHaveAttribute('aria-valuenow');
        expect(input).not.toHaveAttribute('aria-valuemax');
    });

    it('垂直 slider 具有 aria-orientation 和竖排书写模式，verticalReverse 时 dir 为 rtl', () => {
        const { store } = setup({ value: 30, vertical: true });
        expect(getInput()).toHaveAttribute('aria-orientation', 'vertical');
        expect(getInput()).toHaveStyle({ writingMode: 'vertical-lr' });
        expect(getInput()).toHaveAttribute('dir', 'ltr');
        store.props.verticalReverse = true;
        flushSync();
        expect(getInput()).toHaveAttribute('dir', 'rtl');
    });

    it('范围 slider 的两个滑块名称不同，wrapper 上没有 label', () => {
        setup({ value: [20, 60], range: true });
        expect(query('wrapper')).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeStart })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: zh_CN.Slider.rangeEnd })).toHaveValue('60');
    });

    it('范围 slider 把两端名称追加到调用方的 aria-label 后', () => {
        setup({ 'aria-label': 'Price', value: [20, 60], range: true });
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 的名称由 aria-labelledby 加上各自的端点名组成', () => {
        render(SliderLabelled, { props: { kind: 'labelledby' } });
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeStart}` })).toHaveValue('20');
        expect(screen.getByRole('slider', { name: `Price ${zh_CN.Slider.rangeEnd}` })).toHaveValue('60');
    });

    it('范围 slider 的端点名使用所选语言', () => {
        setupConfig({ value: [20, 60], range: true }, { locale: en_US });
        expect(screen.getByRole('slider', { name: 'Start' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'End' })).toBeInTheDocument();
    });

    it('禁用的 slider 不另加 aria-label，保留 label 给出的名称；自定义 aria-label 保留', () => {
        const view = render(SliderLabelled, { props: { kind: 'disabled-for' } });
        expect(getInput()).not.toHaveAttribute('aria-label');
        expect(screen.getByRole('slider', { name: 'Volume' })).toBeDisabled();
        view.unmount();
        setup({ 'aria-label': 'Custom label', value: 30, disabled: true });
        expect(getInput()).toHaveAttribute('aria-label', 'Custom label');
    });

    it('id 命名第一个手柄输入框，而非 wrapper；label 的 for 指向它', () => {
        const view = render(SliderLabelled, { props: { kind: 'for' } });
        expect(screen.getByLabelText('Volume')).toBe(getInput());
        expect(query('wrapper')).not.toHaveAttribute('id');
        view.unmount();

        setup({ id: 'price', value: [20, 60], range: true });
        const [minInput, maxInput] = getInputs();
        expect(minInput).toHaveAttribute('id', 'price');
        expect(maxInput).not.toHaveAttribute('id');
    });

    it('aria 描述、错误状态与 name 落到每个手柄输入框，tabindex 与 aria-required 被丢弃', () => {
        setup({ value: [20, 60], range: true, 'aria-describedby': 'hint', 'aria-invalid': 'true', 'aria-errormessage': 'error', 'aria-required': 'true', name: 'price', tabindex: 0 } as SliderProps);
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

    it('每个滑块都是原生 range 输入框，表单以 name 提交', async () => {
        const single = setup({ name: 'volume', value: 30 });
        const range = setup({ name: 'price', value: [20, 60], range: true });
        const form = document.createElement('form');
        form.append(single.container.firstElementChild as Element, range.container.firstElementChild as Element);
        document.body.append(form);
        expect(new FormData(form).getAll('volume')).toEqual(['30']);
        expect(new FormData(form).getAll('price')).toEqual(['20', '60']);
        await changeTo(getInputs()[0] as HTMLInputElement, 45);
        expect(new FormData(form).getAll('volume')).toEqual(['45']);
        form.remove();
    });

    it('handleDot 渲染圆点，数组按手柄分配，单个对象两个手柄共用', () => {
        const view = setup({ value: 30, handleDot: { size: '8px', color: 'red' } });
        const dot = query('handle-dot');
        expect(getHandle()).toContainElement(dot);
        expect(dot).toHaveStyle({ width: '8px', height: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        view.unmount();

        const range = setup({
            value: [20, 60],
            range: true,
            handleDot: [
                { size: '8px', color: 'red' },
                { size: '10px', color: 'blue' },
            ],
        });
        const [minHandle, maxHandle] = getHandles() as [HTMLElement, HTMLElement];
        const dotOf = (handle: HTMLElement) => handle.querySelector(`.${prefix}-handle-dot`);
        expect(dotOf(minHandle)).toHaveStyle({ width: '8px', backgroundColor: 'rgb(255, 0, 0)' });
        expect(dotOf(maxHandle)).toHaveStyle({ width: '10px', backgroundColor: 'rgb(0, 0, 255)' });
        range.unmount();

        setup({ value: [20, 60], range: true, handleDot: { size: '8px', color: 'red' } });
        expect(queryAll('handle-dot')).toHaveLength(2);
    });

    it('读取 semiGlobal.config.overrideDefaultProps，显式属性优先', () => {
        semiGlobal.config.overrideDefaultProps = { Slider: { step: 10, max: 50 } };
        const view = setup();
        expect(query('boundary-max')).toHaveTextContent('50');
        expect(getInput()).toHaveAttribute('step', '10');
        expect(getInput()).toHaveAttribute('max', '50');
        view.unmount();
        setup({ step: 1 });
        expect(getInput()).toHaveAttribute('step', '1');
    });

    it('全局默认值里的 id 不影响 Slider', () => {
        // the global type leaves out per-instance ids; the cast stands for an untyped app that sets one anyway
        semiGlobal.config.overrideDefaultProps = { Slider: { id: 'from-global' } } as object;
        const view = setup();
        expect(getInput()).not.toHaveAttribute('id');
        view.unmount();
        setup({ id: 'own' });
        expect(getInput()).toHaveAttribute('id', 'own');
    });

    it('全局的 tipFormatter 与 getAriaValueText 生效，显式 null 不被全局值替换', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Slider: {
                tipFormatter: (value: number) => `${value} dB`,
                getAriaValueText: (value: number) => `${value}%`,
            },
        };
        const view = setup({ value: 30, tooltipVisible: true });
        expect(await findTooltip()).toHaveTextContent('30 dB');
        expect(getInput()).toHaveAttribute('aria-valuetext', '30%');
        view.unmount();

        setup({ value: 30, tipFormatter: null }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });
});

describe('Svelte Slider 的 tooltip 与插槽', () => {
    it('tooltipVisible 为 true 时 tooltip 始终显示，为 false 时始终不显示', async () => {
        const view = setup({ value: 30, tooltipVisible: true }, SIZED);
        expect(await findTooltip()).toHaveTextContent('30');
        await fireEvent.mouseEnter(getHandle());
        expect(getTooltip()).toHaveTextContent('30');
        view.unmount();

        setup({ value: 30, tooltipVisible: false }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('handle 的 mouseenter 与 mouseleave 显示与隐藏 tooltip', async () => {
        setup({ value: [20, 60], range: true }, SIZED);
        const maxHandle = getHandles()[1] as HTMLElement;
        await fireEvent.mouseEnter(maxHandle);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('60'));
        await fireEvent.mouseLeave(maxHandle);
        await waitFor(() => expect(getTooltip()).toBeNull());
    });

    it('tipFormatter 返回格式化后的值，为 null 时隐藏 tooltip', async () => {
        const view = setup({ value: 30, tipFormatter: (value: number) => `${value}%`, tooltipVisible: true });
        expect(await findTooltip()).toHaveTextContent('30%');
        await changeTo(getInput(), 31);
        expect(getTooltip()).toHaveTextContent('31%');
        view.unmount();

        setup({ value: 30, tipFormatter: null }, SIZED);
        await fireEvent.mouseEnter(getHandle());
        await tabTo(getInput());
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(getTooltip()).toBeNull();
    });

    it('showArrow 为 false 时隐藏 tooltip 箭头，范围的两个 tooltip 都生效', async () => {
        const view = setup({ value: 30, tooltipVisible: true });
        expect(await findTooltip()).toHaveClass('semi-tooltip-with-arrow');
        view.unmount();

        setup({ value: [20, 60], range: true, showArrow: false, tooltipVisible: true });
        await waitFor(() => expect(document.querySelectorAll('.semi-tooltip-wrapper-show')).toHaveLength(2));
        expect(document.querySelector('.semi-tooltip-with-arrow')).toBeNull();
        expect(document.querySelector('.semi-tooltip-icon-arrow')).toBeNull();
    });

    it('tooltipOnMark：悬停刻度点显示标签，刻度点不是 Tab 停靠点', async () => {
        setup({ value: 30, marks: { 20: '20c', 40: '40c' }, tooltipOnMark: true });
        queryAll('dot').forEach((dot) => expect(dot).toHaveAttribute('tabindex', '-1'));
        await userEvent.hover(queryAll('dot')[0] as HTMLElement);
        await waitFor(() => expect(getTooltip()).toHaveTextContent('20c'));
        screen.getByRole('button', { name: 'after' }).focus();
        await userEvent.tab({ shift: true });
        expect(getInput()).toHaveFocus();
    });

    it('没有宽度的 slider（隐藏容器）里 tooltip 隐藏，聚焦时仍调用 onFocus', async () => {
        const noBoxes = vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        const focus = vi.fn<(event: FocusEvent) => void>();
        setup({ value: 30, tooltipVisible: true, onFocus: focus });
        await settle();
        await fireEvent.mouseOver(getHandle());
        expect(getTooltip()).toBeNull();
        getInput().focus();
        await settle();
        expect(getTooltip()).toBeNull();
        expect(focus).toHaveBeenCalledTimes(1);
        noBoxes.mockRestore();
    });

    it('mark 与 tip snippet 收到刻度值、文本、格式化后的值与手柄', async () => {
        render(SliderSnippets);
        flushSync();
        expect(queryAll('mark')).toHaveLength(2);
        expect(document.querySelectorAll(`.${prefix}-mark .custom-mark`)).toHaveLength(2);
        expect(screen.getByText('20c@20').tagName).toBe('STRONG');
        expect(screen.getByText('40c@40')).toBeInTheDocument();
        await waitFor(() => expect(document.querySelectorAll('.semi-tooltip-wrapper-show .custom-tip')).toHaveLength(2));
        expect([...document.querySelectorAll('.custom-tip')].map((tip) => tip.textContent)).toEqual(['min:30%', 'max:60%']);
    });

    it('mark snippet 同时用于 tooltipOnMark 的提示', async () => {
        render(SliderSnippets, { props: { tooltipOnMark: true } });
        flushSync();
        await userEvent.hover(queryAll('dot')[0] as HTMLElement);
        await waitFor(() => {
            const tips = [...document.querySelectorAll('.semi-tooltip-wrapper-show')];
            expect(tips.some((tip) => tip.querySelector('.custom-mark')?.textContent === '20c@20')).toBe(true);
        });
    });
});

describe('Svelte Slider 使用方监听', () => {
    it('传入 onfocusin、onfocusout、onmouseenter、onmouseleave 时与组件自身行为同时生效', async () => {
        const onfocusin = vi.fn<() => void>();
        const onfocusout = vi.fn<() => void>();
        const onmouseenter = vi.fn<() => void>();
        const onmouseleave = vi.fn<() => void>();
        const onFocus = vi.fn<() => void>();
        const onBlur = vi.fn<() => void>();
        const store = createStore<{ props: SliderProps }>({ props: { onfocusin, onfocusout, onmouseenter, onmouseleave, onFocus, onBlur } as SliderProps });
        render(SliderFixture, { props: { store } });
        const wrapper = document.querySelector(`.${prefix}-wrapper`) as HTMLElement;
        await fireEvent.focusIn(wrapper);
        expect(onfocusin).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);
        await fireEvent.focusOut(wrapper, { relatedTarget: document.body });
        expect(onfocusout).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        await fireEvent.mouseEnter(wrapper);
        await fireEvent.mouseLeave(wrapper);
        expect(onmouseenter).toHaveBeenCalledTimes(1);
        expect(onmouseleave).toHaveBeenCalledTimes(1);
    });
});
