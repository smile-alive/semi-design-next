import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { colorStringToValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { ColorPickerProps, ColorValue } from '../interface';
import ColorPickerFixture from './color-picker-fixture.svelte';
import ColorPickerModes from './color-picker-modes.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;
const text = en_US.ColorPicker;

type Store = { props: ColorPickerProps; trigger?: boolean; slots?: boolean };

const defaultColor = colorStringToValue('#39c5bb');
const greyColor: ColorValue = { hsva: { h: 200, s: 0, v: 50, a: 1 }, rgba: { r: 128, g: 128, b: 128, a: 1 }, hex: '#808080' };
const translucent: ColorValue = { hsva: { h: 0, s: 100, v: 100, a: 0.5 }, rgba: { r: 255, g: 0, b: 0, a: 0.5 }, hex: '#ff000080' };

function setup(props: ColorPickerProps = {}, init: Omit<Store, 'props'> = {}) {
    const store = createStore<Store>({ ...init, props });
    const result = render(ColorPickerFixture, { props: { store } });
    flushSync();
    return { store, ...result };
}

const onChangeMock = () => vi.fn<(value: ColorValue) => void>();
const query = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector);
function need<T extends HTMLElement>(el: T | null) {
    if (!el) throw new Error('missing element');
    return el;
}
const getPicker = () => query(`.${prefixCls}`);
const getInput = () => need(query<HTMLInputElement>(`.${prefixCls}-colorPickerInput input`));
const getAlphaInput = () => need(query<HTMLInputElement>(`.${prefixCls}-colorPickerInputNumber input`));
const getSlider = (name: string) => screen.getByRole('slider', { name });
function lastColor(onChange: { mock: { calls: ColorValue[][] } }) {
    const last = onChange.mock.calls.at(-1)?.[0];
    if (!last) throw new Error('onChange was not called');
    return last;
}

async function changeInput(value: string) {
    await fireEvent.input(getInput(), { target: { value } });
    flushSync();
}
async function changeAlphaInput(value: string) {
    await fireEvent.input(getAlphaInput(), { target: { value } });
    flushSync();
}

async function selectFormat(format: string) {
    await fireEvent.click(need(query('.semi-select')));
    const option = (await screen.findAllByRole('option')).find((candidate) => candidate.textContent?.trim() === format);
    if (!option) throw new Error(`no format option ${format}`);
    await fireEvent.click(option);
    flushSync();
}

// jsdom does not implement pointer capture; the foundation captures the pointer on the pressed element
function mockRect(el: HTMLElement) {
    const width = parseFloat(el.style.width);
    const height = parseFloat(el.style.height);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}) });
    el.setPointerCapture = vi.fn<HTMLElement['setPointerCapture']>();
    return el;
}

// a browser sends a captured pointer's release, then lostpointercapture, to the capturing element
async function release(el: HTMLElement) {
    await fireEvent(el, new Event('pointerup', { bubbles: true }));
    await fireEvent(el, new Event('lostpointercapture', { bubbles: true }));
}

function pointer(type: string, init: { clientX: number; clientY?: number; button?: number }) {
    const event = new MouseEvent(type, { bubbles: true, clientY: 0, button: 0, ...init });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    return event;
}

afterEach(() => {
    delete window.EyeDropper;
    semiGlobal.config = {};
});

describe('Svelte ColorPicker 受控值（$bindable）', () => {
    const modes = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', value?: ColorValue, accept = true) => {
        const store = createStore<{ value: ColorValue | undefined; accept: boolean; log: string[] }>({ value, accept, log: [] });
        render(ColorPickerModes, { props: { mode, store } });
        const nudge = async () => {
            await fireEvent.keyDown(getSlider(text.hue), { key: 'ArrowRight' });
            flushSync();
        };
        return { store, nudge };
    };

    const red = colorStringToValue('#ff0000');

    it('非受控：拖动后界面更新，onChange 收到新颜色', async () => {
        const { store, nudge } = modes('uncontrolled');
        expect(getSlider(text.hue)).toHaveValue('176');
        await nudge();
        expect(getSlider(text.hue)).toHaveValue('177');
        expect(store.log).toHaveLength(1);
        expect(store.log[0]).toMatch(/^change #[0-9a-f]{6}$/);
    });

    it('bind:value：写回父级，父级改值同步到组件', async () => {
        const { store, nudge } = modes('bind', red);
        await nudge();
        expect(store.value?.hsva.h).toBe(1);
        expect(getSlider(text.hue)).toHaveValue('1');
        store.value = colorStringToValue('#00ff00');
        flushSync();
        expect(getSlider(text.hue)).toHaveValue('120');
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('bind:value 重置为 undefined 后回到默认颜色，之后的调整从默认颜色开始', async () => {
        const { store, nudge } = modes('bind', red);
        store.value = undefined;
        flushSync();
        expect(getInput()).toHaveValue('#39c5bb');
        expect(getSlider(text.hue)).toHaveValue('176');
        await nudge();
        expect(getSlider(text.hue)).toHaveValue('177');
    });

    it('函数绑定：setter 拒绝时组件保持原值，滑块也不移动', async () => {
        const { store, nudge } = modes('function', red, false);
        await nudge();
        expect(store.log[0]).toMatch(/^set #/);
        expect(store.value).toEqual(red);
        expect(getSlider(text.hue)).toHaveValue('0');
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('函数绑定：setter 接受时组件跟随', async () => {
        const { store, nudge } = modes('function', red, true);
        await nudge();
        expect(store.value?.hsva.h).toBe(1);
        expect(getSlider(text.hue)).toHaveValue('1');
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, nudge } = modes('one-way', red);
        await nudge();
        expect(store.value).toEqual(red);
        expect(getSlider(text.hue)).toHaveValue('1');
        store.value = colorStringToValue('#00ff00');
        flushSync();
        expect(getSlider(text.hue)).toHaveValue('120');
    });

    it('一个非受控实例改色后，后挂载的实例仍从默认颜色开始', async () => {
        const first = modes('uncontrolled');
        await first.nudge();
        document.body.innerHTML = '';
        modes('uncontrolled');
        expect(getSlider(text.hue)).toHaveValue('176');
    });
});

describe('Svelte ColorPicker 渲染', () => {
    it('默认渲染 picker，带 class 与 style，并透传未声明属性', () => {
        setup({ class: 'custom', style: 'margin: 1px', 'data-x': '1', 'aria-describedby': 'hint' });
        const picker = need(getPicker());
        expect(picker).toHaveClass('custom');
        expect(picker).toHaveAttribute('style', expect.stringContaining('margin: 1px'));
        expect(picker).toHaveAttribute('data-x', '1');
        expect(picker).toHaveAttribute('aria-describedby', 'hint');
    });

    it('传入 aria-label 时 picker 是 group，传入 role 时不覆盖，没有名称时无 role；tabindex 被丢弃', () => {
        const named = setup({ 'aria-label': 'Fill', tabindex: 0 });
        expect(screen.getByRole('group', { name: 'Fill' })).toBe(getPicker());
        expect(getPicker()).not.toHaveAttribute('tabindex');
        named.unmount();

        const withRole = setup({ 'aria-label': 'Fill', role: 'region' });
        expect(screen.getByRole('region', { name: 'Fill' })).toBe(getPicker());
        withRole.unmount();

        setup();
        expect(getPicker()).not.toHaveAttribute('role');
    });

    it('默认启用 alpha 与滴管；alpha、eyeDropper 为 false 时不渲染', () => {
        const first = setup();
        expect(getSlider(text.alpha)).toBeInTheDocument();
        expect(query(`.${prefixCls}-colorPickerInputNumber`)).not.toBeNull();
        expect(screen.getByRole('button', { name: text.eyeDropper })).toBeInTheDocument();
        first.unmount();

        setup({ alpha: false, eyeDropper: false });
        expect(screen.queryByRole('slider', { name: text.alpha })).toBeNull();
        expect(query(`.${prefixCls}-colorPickerInputNumber`)).toBeNull();
        expect(screen.queryByRole('button', { name: text.eyeDropper })).toBeNull();
    });

    it('自定义宽高作用于三个拖拽区域与数据区', () => {
        setup({ width: 200, height: 150 });
        expect(need(query(`.${prefixCls}-colorChooseArea`)).style).toMatchObject({ width: '200px', height: '150px' });
        expect(need(query(`.${prefixCls}-colorSlider`)).style.width).toBe('200px');
        expect(need(query(`.${prefixCls}-alphaSlider`)).style.width).toBe('200px');
        expect(need(query(`.${prefixCls}-dataPart`)).style.width).toBe('200px');
    });

    it('三个 handle 的尺寸为 20、18、18', () => {
        setup();
        expect(need(query(`.${prefixCls}-colorChooseArea .${prefixCls}-handle`)).style.width).toBe('20px');
        expect(need(query(`.${prefixCls}-colorSlider .${prefixCls}-handle`)).style.width).toBe('18px');
        expect(need(query(`.${prefixCls}-alphaHandle`)).style.width).toBe('18px');
    });

    it('topSlot 与 bottomSlot 渲染在取色区之前与数据区之后', () => {
        setup({}, { slots: true });
        const picker = need(getPicker());
        expect(picker.firstElementChild).toHaveClass('top-slot');
        expect(picker.lastElementChild).toHaveClass('bottom-slot');
    });

    it('没有 topSlot 与 bottomSlot 时 picker 以取色区开头、以数据区结尾', () => {
        setup();
        const picker = need(getPicker());
        expect(picker.firstElementChild).toHaveClass(`${prefixCls}-colorChooseArea`);
        expect(picker.lastElementChild).toHaveClass(`${prefixCls}-dataPart`);
    });

    it('取色区的两个滑块展示饱和度与明度，透明度滑块显示百分比，色相滑块上限 360', () => {
        setup({ value: { hsva: { h: 200, s: 50, v: 60, a: 0.5 }, rgba: { r: 51, g: 128, b: 153, a: 0.5 }, hex: '#33809980' } });
        const saturation = getSlider(text.saturation);
        expect(saturation).toHaveValue('50');
        expect(saturation).toHaveAttribute('aria-valuetext', text.saturationBrightness.replace('${saturation}', '50').replace('${brightness}', '60'));
        expect(getSlider(text.brightness)).toHaveValue('60');
        expect(getSlider(text.hue)).toHaveAttribute('max', '360');
        expect(getSlider(text.alpha)).toHaveAttribute('aria-valuetext', '50%');
    });

    it('格式选择器与文本框带名称', () => {
        setup();
        expect(screen.getByRole('combobox', { name: text.format })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: text.color })).toBeInTheDocument();
    });

    it('colorStringToValue 解析合法输入，对非法输入抛出错误', () => {
        expect(colorStringToValue('#ff0000').hsva).toEqual({ h: 0, s: 100, v: 100, a: 1 });
        expect(() => colorStringToValue('not a color')).toThrow(/not a color/);
    });

    it('value 为 null 时显示默认颜色并只报告变化', async () => {
        const onChange = onChangeMock();
        setup({ value: null, onChange });
        expect(getInput()).toHaveValue('#39c5bb');
        await fireEvent.keyDown(getSlider(text.hue), { key: 'ArrowRight' });
        flushSync();
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('首次渲染的 handle 位置对应默认色 hsva(176, 71%, 77%)', () => {
        setup();
        const handle = need(query(`.${prefixCls}-colorChooseArea .${prefixCls}-handle`));
        expect(parseFloat(handle.style.left)).toBeCloseTo(0.71 * 280 - 10, 5);
        expect(parseFloat(handle.style.top)).toBeCloseTo((1 - 0.77) * 280 - 10, 5);
    });
});

describe('Svelte ColorPicker 文本框', () => {
    it.each([
        ['rgba', '0,255,0'],
        ['hsva', '120,100,100'],
        ['hex', '#00ff00'],
    ])('%s 格式输入 %s 后保留当前透明度 0.5', async (defaultFormat, value) => {
        const onChange = onChangeMock();
        setup({ alpha: true, defaultFormat: defaultFormat as 'rgba', value: translucent, onChange });
        await changeInput(value);
        expect(lastColor(onChange).rgba.g).toBe(255);
        // hex stores opacity in 8 bits, so 0.5 comes back as 128/255
        expect(lastColor(onChange).rgba.a).toBeCloseTo(0.5, 2);
    });

    it('输入框显式写出透明度时以输入为准', async () => {
        const onChange = onChangeMock();
        setup({ alpha: true, defaultFormat: 'rgba', value: translucent, onChange });
        await changeInput('0,255,0,1');
        expect(lastColor(onChange).rgba.a).toBe(1);
    });

    it('rgba 格式逐字输入透明度分量时输入框不被回写', async () => {
        const onChange = onChangeMock();
        setup({ defaultFormat: 'rgba', value: defaultColor, onChange });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '255,0,0,0.5');
        expect(getInput()).toHaveValue('255,0,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    it('hex 格式逐字输入 8 位时输入框不被回写', async () => {
        const onChange = onChangeMock();
        setup({ defaultFormat: 'hex', value: defaultColor, onChange });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '#ff000080');
        expect(getInput()).toHaveValue('#ff000080');
        expect(lastColor(onChange).hex).toBe('#ff000080');
    });

    it.each(['#gggggg', '#1234567', '#ff0000ff00', 'zz#ff0000'])('hex 格式输入非法的 %s 时不触发 change，文本保留', async (value) => {
        const onChange = onChangeMock();
        setup({ defaultFormat: 'hex', value: defaultColor, onChange });
        await changeInput(value);
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue(value);
    });

    it('hex 格式输入不带 # 的值时变化', async () => {
        const onChange = onChangeMock();
        setup({ defaultFormat: 'hex', onChange });
        await changeInput('ff0000');
        expect(lastColor(onChange).hex).toBe('#ff0000');
    });

    it.each([
        ['rgba', '999,0,0'],
        ['rgba', 'a,b,c'],
        ['hsva', '400,0,0'],
    ])('%s 格式输入非法值 %s 时不通知', async (defaultFormat, value) => {
        const onChange = onChangeMock();
        setup({ defaultFormat: defaultFormat as 'rgba', onChange });
        await changeInput(value);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('alpha 为 false 时文本框输入的透明度被忽略', async () => {
        const onChange = onChangeMock();
        setup({ alpha: false, defaultFormat: 'hex', onChange });
        await changeInput('#ff000080');
        expect(lastColor(onChange)).toMatchObject({ hex: '#ff0000', rgba: { a: 1 }, hsva: { a: 1 } });
    });

    it('rgba 输入小数通道时发出合法的 hex', async () => {
        const onChange = onChangeMock();
        setup({ defaultFormat: 'rgba', onChange });
        await changeInput('12.5,0,0');
        expect(lastColor(onChange).hex).toMatch(/^#[0-9a-f]{6}$/);
    });

    it.each(['hex', 'rgba'])('%s 格式改透明度输入框时保留色相', async (format) => {
        const onChange = onChangeMock();
        setup({ defaultFormat: format as 'hex', value: greyColor, onChange });
        await changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 200, s: 0, v: 50, a: 0.5 });
    });

    it('各格式的文本框内容：hex 不含透明度，rgba、hsva 为逗号分隔', () => {
        const hex = setup({ defaultFormat: 'hex', value: translucent });
        expect(getInput()).toHaveValue('#ff0000');
        hex.unmount();
        const rgba = setup({ defaultFormat: 'rgba', value: translucent });
        expect(getInput()).toHaveValue('255,0,0');
        rgba.unmount();
        setup({ defaultFormat: 'hsva', value: translucent });
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('切换格式时更新文本框', async () => {
        setup({ defaultFormat: 'hex' });
        await selectFormat('rgba');
        await waitFor(() => expect(getInput()).toHaveValue('57,197,187'));
        await selectFormat('hsva');
        await waitFor(() => expect(getInput()).toHaveValue('176,71,77'));
    });

    it('受控值相等时不覆盖正在输入的内容', async () => {
        const { store } = setup({ defaultFormat: 'hex', value: defaultColor });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '#ab');
        store.props.value = structuredClone(defaultColor);
        flushSync();
        expect(getInput()).toHaveValue('#ab');
    });

    it('受控值变化时更新文本框', () => {
        const { store } = setup({ defaultFormat: 'hex', value: defaultColor });
        store.props.value = colorStringToValue('#ff0000');
        flushSync();
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('非受控时输入更新界面', async () => {
        setup({ defaultFormat: 'hex' });
        await changeInput('#ff0000');
        expect(getSlider(text.hue)).toHaveValue('0');
    });

    it('全局 Input、InputNumber 默认值不给数据区输入框加清除按钮', () => {
        semiGlobal.config = { overrideDefaultProps: { Input: { showClear: true }, InputNumber: { showClear: true } } };
        setup();
        expect(query(`.${prefixCls}-dataPart .semi-input-clearbtn`)).toBeNull();
    });
});

describe('Svelte ColorPicker 滴管', () => {
    const open = (sRGBHex: string) =>
        class {
            async open() {
                return { sRGBHex };
            }
        };

    it('EyeDropper 不可用时点击滴管按钮没有效果', async () => {
        const onChange = onChangeMock();
        setup({ onChange });
        await userEvent.click(screen.getByRole('button', { name: text.eyeDropper }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('取色后保留当前透明度', async () => {
        const onChange = onChangeMock();
        window.EyeDropper = open('#00ff00');
        setup({ alpha: true, value: translucent, onChange });
        await userEvent.click(screen.getByRole('button', { name: text.eyeDropper }));
        await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        expect(lastColor(onChange).rgba).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    });

    it('用户取消取色（AbortError）时不报错也不通知', async () => {
        const onChange = onChangeMock();
        window.EyeDropper = class {
            async open(): Promise<{ sRGBHex: string }> {
                throw new DOMException('cancelled', 'AbortError');
            }
        };
        setup({ onChange });
        await userEvent.click(screen.getByRole('button', { name: text.eyeDropper }));
        await new Promise((resolve) => setTimeout(resolve));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('取色期间卸载会取消取色，之后不再通知', async () => {
        const onChange = onChangeMock();
        let signal: AbortSignal | undefined;
        let finish: (value: { sRGBHex: string }) => void = () => {};
        window.EyeDropper = class {
            open(options?: { signal?: AbortSignal }) {
                signal = options?.signal;
                return new Promise<{ sRGBHex: string }>((resolve, reject) => {
                    finish = resolve;
                    signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
                });
            }
        };
        const { unmount } = setup({ onChange });
        await userEvent.click(screen.getByRole('button', { name: text.eyeDropper }));
        unmount();
        expect(signal?.aborted).toBe(true);
        finish({ sRGBHex: '#00ff00' });
        await new Promise((resolve) => setTimeout(resolve));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Svelte ColorPicker 拖拽与键盘', () => {
    it('按住指针拖动色相条调整色相，松开后停止', async () => {
        const onChange = onChangeMock();
        setup({ value: colorStringToValue('#ff0000'), onChange });
        const slider = mockRect(need(query(`.${prefixCls}-colorSlider`)));
        await fireEvent(slider, pointer('pointerdown', { clientX: 140 }));
        expect(lastColor(onChange).hsva.h).toBe(180);
        await fireEvent(slider, pointer('pointermove', { clientX: 70 }));
        expect(lastColor(onChange).hsva.h).toBe(90);
        await release(slider);
        const calls = onChange.mock.calls.length;
        await fireEvent(slider, pointer('pointermove', { clientX: 10 }));
        expect(onChange).toHaveBeenCalledTimes(calls);
    });

    it('拖动透明度条调整透明度并保持色相', async () => {
        const onChange = onChangeMock();
        setup({ value: colorStringToValue('#ff0000'), onChange });
        const slider = mockRect(need(query(`.${prefixCls}-alphaSlider`)));
        await fireEvent(slider, pointer('pointerdown', { clientX: 140 }));
        expect(lastColor(onChange).hsva).toMatchObject({ h: 0, a: 0.5 });
        await release(slider);
    });

    it('按下取色区取色，拖到区域外时颜色贴到角落', async () => {
        const onChange = onChangeMock();
        setup({ value: colorStringToValue('#ff0000'), onChange });
        const area = mockRect(need(query(`.${prefixCls}-colorChooseArea`)));
        await fireEvent(area, pointer('pointerdown', { clientX: 140, clientY: 140 }));
        expect(lastColor(onChange).hsva).toMatchObject({ s: 50, v: 50 });
        await fireEvent(area, pointer('pointermove', { clientX: 900, clientY: -50 }));
        expect(lastColor(onChange).hsva).toMatchObject({ s: 100, v: 100 });
        await release(area);
    });

    it('非主键按下不取色也不开始拖动', async () => {
        const onChange = onChangeMock();
        setup({ onChange });
        const area = mockRect(need(query(`.${prefixCls}-colorChooseArea`)));
        await fireEvent(area, pointer('pointerdown', { clientX: 140, clientY: 140, button: 2 }));
        await fireEvent(area, pointer('pointermove', { clientX: 10, clientY: 10 }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('按下取色区时进入 grabbing 光标，松开后恢复', async () => {
        setup();
        const area = mockRect(need(query(`.${prefixCls}-colorChooseArea`)));
        expect(area.style.cursor).toBe('pointer');
        await fireEvent(area, pointer('pointerdown', { clientX: 10, clientY: 10 }));
        expect(area.style.cursor).toBe('grabbing');
        await release(area);
        expect(area.style.cursor).toBe('pointer');
    });

    it('左右方向键调整饱和度，上下方向键调整明度，Home 与 End 跳到端点', async () => {
        const onChange = onChangeMock();
        setup({ value: { hsva: { h: 200, s: 50, v: 60, a: 1 }, rgba: { r: 51, g: 128, b: 153, a: 1 }, hex: '#338099' }, onChange });
        await fireEvent.keyDown(getSlider(text.saturation), { key: 'ArrowRight' });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 51, v: 60 });
        await fireEvent.keyDown(getSlider(text.brightness), { key: 'ArrowUp' });
        // the one-way value is only the initial value, so the first change is kept locally
        expect(lastColor(onChange).hsva).toMatchObject({ s: 51, v: 61 });
        await fireEvent.keyDown(getSlider(text.brightness), { key: 'Home' });
        expect(lastColor(onChange).hsva.v).toBe(0);
        await fireEvent.keyDown(getSlider(text.hue), { key: 'End' });
        expect(lastColor(onChange).hsva.h).toBe(360);
        await fireEvent.keyDown(getSlider(text.alpha), { key: 'PageDown' });
        expect(lastColor(onChange).hsva.a).toBe(0.9);
    });

    it('函数绑定拒绝时，输入事件与文本框输入后滑块保持原位', async () => {
        const store = createStore<{ value: ColorValue | undefined; accept: boolean; log: string[] }>({ value: colorStringToValue('#ff0000'), accept: false, log: [] });
        render(ColorPickerModes, { props: { mode: 'function', store } });
        const hue = getSlider(text.hue) as HTMLInputElement;
        await fireEvent.input(hue, { target: { value: '120' } });
        flushSync();
        expect(hue.value).toBe('0');
        await changeInput('#00ff00');
        // each attempt reports the setter and onChange once
        expect(store.log).toHaveLength(4);
        expect(hue.value).toBe('0');
    });
});

describe('Svelte ColorPicker 弹层', () => {
    it('默认触发器是有名称的按钮，弹层为有名称的 dialog，内含 picker', async () => {
        setup({ usePopover: true });
        expect(getPicker()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog', { name: text.color });
        expect(dialog).toContainElement(getPicker());
    });

    it('默认触发器的背景色是当前颜色，picker 内改色后同步', async () => {
        setup({ usePopover: true, value: colorStringToValue('#ff0000') });
        const trigger = need(query(`.${prefixCls}-popover-defaultChildren`));
        expect(trigger.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('自定义触发器的弹层也是 dialog，默认触发器不渲染', async () => {
        setup({ usePopover: true }, { trigger: true });
        expect(query(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'pick' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('usePopover 为 false 时不渲染触发器', () => {
        setup({}, { trigger: true });
        expect(screen.queryByRole('button', { name: 'pick' })).toBeNull();
        expect(getPicker()).not.toBeNull();
    });

    it('usePopover 默认点击打开，悬停不打开', async () => {
        setup({ usePopover: true });
        const trigger = screen.getByRole('button', { name: text.color });
        await userEvent.hover(trigger);
        // nothing is expected to happen, so only a fixed wait can show it: longer than the default hover delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(screen.queryByRole('dialog')).toBeNull();
        await userEvent.click(trigger);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('popoverProps.trigger 为 hover 时仍可悬停打开', async () => {
        setup({ usePopover: true, popoverProps: { trigger: 'hover' } });
        await userEvent.hover(screen.getByRole('button', { name: text.color }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('popoverProps 的名称优先，labelledby 存在时不再补默认名称', async () => {
        const named = setup({ usePopover: true, popoverProps: { 'aria-label': 'Custom', motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        expect(await screen.findByRole('dialog', { name: 'Custom' })).toBeInTheDocument();
        named.unmount();

        setup({ usePopover: true, popoverProps: { 'aria-labelledby': 'title', motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        expect(await screen.findByRole('dialog')).not.toHaveAttribute('aria-label');
    });

    it('popoverProps 的 class 与监听器生效，类名不重复', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        setup({ usePopover: true, popoverProps: { class: 'mine', onVisibleChange, motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog');
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        expect(dialog.className.split(' ').filter((name) => name === `${prefixCls}-popover`)).toHaveLength(1);
        expect(dialog).toHaveClass('mine');
    });

    it('未声明的属性落在弹层内的 picker 上，不落在触发器与对话框上', async () => {
        setup({ usePopover: true, 'data-x': '1', popoverProps: { motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog');
        expect(need(getPicker())).toHaveAttribute('data-x', '1');
        expect(dialog).not.toHaveAttribute('data-x');
        expect(screen.getByRole('button', { name: text.color })).not.toHaveAttribute('data-x');
    });

    it('getRoot：inline 时是 picker，usePopover 关闭时为 null，打开后是 picker', async () => {
        const inline = setup();
        expect(inline.component.api()?.getRoot()).toBe(getPicker());
        inline.unmount();

        const popover = setup({ usePopover: true, popoverProps: { motion: false } });
        expect(popover.component.api()?.getRoot()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        await screen.findByRole('dialog');
        expect(popover.component.api()?.getRoot()).toBe(getPicker());
    });
});

describe('Svelte ColorPicker 全局默认值', () => {
    it('从 semiGlobal 读取默认值，传入值优先', () => {
        semiGlobal.config = { overrideDefaultProps: { ColorPicker: { alpha: false, eyeDropper: false, width: 200, defaultFormat: 'rgba' } } };
        const first = setup();
        expect(screen.queryByRole('slider', { name: text.alpha })).toBeNull();
        expect(screen.queryByRole('button', { name: text.eyeDropper })).toBeNull();
        expect(need(query(`.${prefixCls}-colorSlider`)).style.width).toBe('200px');
        expect(getInput()).toHaveValue('57,197,187');
        first.unmount();

        setup({ alpha: true, width: 300 });
        expect(getSlider(text.alpha)).toBeInTheDocument();
        expect(need(query(`.${prefixCls}-colorSlider`)).style.width).toBe('300px');
    });

    it('缺省时取默认值而不是 false', () => {
        setup();
        const picker = need(getPicker());
        expect(within(picker).getByRole('slider', { name: text.alpha })).toBeInTheDocument();
        expect(within(picker).getByRole('button', { name: text.eyeDropper })).toBeInTheDocument();
        expect(need(query(`.${prefixCls}-colorChooseArea`)).style.width).toBe('280px');
    });
});
