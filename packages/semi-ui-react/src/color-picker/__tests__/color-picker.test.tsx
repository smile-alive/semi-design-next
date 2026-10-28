import { StrictMode, createRef, useState, type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import AlphaSliderFoundation from '@fibrae/semi-foundation/color-picker/alpha-slider-foundation';
import ColorChooseAreaFoundation from '@fibrae/semi-foundation/color-picker/color-choose-area-foundation';
import ColorSliderFoundation from '@fibrae/semi-foundation/color-picker/color-slider-foundation';
import DataPartFoundation, { type DataPartAdapter } from '@fibrae/semi-foundation/color-picker/data-part-foundation';
import ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
import { hexToHsva, hexToRgba, hsvaToHex, hsvaToHslaString, hsvaToHslString, hsvaToRgba, rgbaStringToHsva, rgbaStringToRgba, rgbaToHex, rgbaToHsva } from '@fibrae/semi-foundation/color-picker/utils/convert';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { ColorPicker, type ColorFormat as PackageColorFormat, type ColorValue as PackageColorValue, type HsvaColor as PackageHsvaColor, type RgbaColor as PackageRgbaColor } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type * as ColorPickerModule from '../index';

describe('ColorPicker 公开类型', () => {
    it('包入口导出颜色值类型', () => {
        expectTypeOf<PackageColorValue>().toHaveProperty('hex');
        expectTypeOf<PackageHsvaColor>().toHaveProperty('h');
        expectTypeOf<PackageRgbaColor>().toHaveProperty('r');
        expectTypeOf<PackageColorFormat>().toEqualTypeOf<'hex' | 'rgba' | 'hsva'>();
    });

    it('只导出 Props 用到的颜色类型', () => {
        expectTypeOf<ColorPickerModule.HsvaColor>().toHaveProperty('h');
        expectTypeOf<ColorPickerModule.RgbaColor>().toHaveProperty('r');
        expectTypeOf<ColorPickerModule.ColorFormat>().toEqualTypeOf<'hex' | 'rgba' | 'hsva'>();
        // @ts-expect-error not exported: nothing references it
        expectTypeOf<ColorPickerModule.ColorModel<string>>();
        // @ts-expect-error not exported: nothing references it
        expectTypeOf<ColorPickerModule.AnyColor>();
        // @ts-expect-error not exported: nothing references it
        expectTypeOf<ColorPickerModule.ObjectColor>();
        // @ts-expect-error not exported: an internal drag event shape
        expectTypeOf<ColorPickerModule.DragPointerEvent>();
    });
});

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;

type OnChange = NonNullable<ComponentProps<typeof ColorPicker>['onChange']>;
type ColorPickerAdapter = ConstructorParameters<typeof ColorPickerFoundation>[0];
type ColorChooseAreaAdapter = ConstructorParameters<typeof ColorChooseAreaFoundation>[0];
type ColorSliderAdapter = ConstructorParameters<typeof ColorSliderFoundation>[0];
type AlphaSliderAdapter = ConstructorParameters<typeof AlphaSliderFoundation>[0];

const defaultColor = {
    hsva: { h: 0, s: 100, v: 100, a: 1 },
    rgba: { r: 255, g: 0, b: 0, a: 1 },
    hex: '#ff0000',
};

const greenColor = {
    hsva: { h: 120, s: 100, v: 100, a: 1 },
    rgba: { r: 0, g: 255, b: 0, a: 1 },
    hex: '#00ff00',
};

const saturationBrightness = (s, v) => zh_CN.ColorPicker.saturationBrightness.replace('${saturation}', s).replace('${brightness}', v);

const renderColorPicker = (props = {}) => render(<ColorPicker {...props} />);

const getPicker = () => document.querySelector<HTMLElement>(`.${prefixCls}`);
const getArea = () => document.querySelector<HTMLElement>(`.${prefixCls}-colorChooseArea`);
const getAreaHandle = () => document.querySelector<HTMLElement>(`.${prefixCls}-colorChooseArea .${prefixCls}-handle`);
const getColorSlider = () => document.querySelector<HTMLElement>(`.${prefixCls}-colorSlider`);
const getColorSliderHandle = () => document.querySelector<HTMLElement>(`.${prefixCls}-colorSlider .${prefixCls}-handle`);
const getAlphaSlider = () => document.querySelector<HTMLElement>(`.${prefixCls}-alphaSlider`);
const getAlphaRange = () => within(getAlphaSlider()).getByRole('slider');
const getAlphaHandle = () => document.querySelector<HTMLElement>(`.${prefixCls}-alphaHandle`);
const getInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls}-colorPickerInput input`);
const getAlphaInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls}-colorPickerInputNumber input`);
const getDemoBlock = () => document.querySelector<HTMLElement>(`.${prefixCls}-colorDemoBlock`);
const getEyeDropperButton = () => document.querySelector<HTMLElement>(`.${prefixCls}-dataPart button`);
const getFormatSelect = () => screen.getByRole('combobox');
const lastColor = (onChange) => onChange.mock.calls[onChange.mock.calls.length - 1][0];

const changeInput = (value) => fireEvent.change(getInput(), { target: { value } });
const changeAlphaInput = (value) => fireEvent.change(getAlphaInput(), { target: { value } });

// the setup rect mock has no x/y, which the pickers subtract from clientX/clientY
const mockRect = (el) => {
    const width = parseFloat(el.style.width);
    const height = parseFloat(el.style.height);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width,
        height,
        right: width,
        bottom: height,
    });
    return el;
};

// a browser sends a captured pointer's release, then lostpointercapture, to the capturing element
const release = (el) => {
    fireEvent.pointerUp(el);
    fireEvent.lostPointerCapture(el);
};

const selectFormat = async (format) => {
    await userEvent.click(getFormatSelect());
    const options = await screen.findAllByRole('option');
    await userEvent.click(options.find((option) => option.textContent === format));
};

const createPickerFoundation = (props = {}, state = {}) => {
    const notifyChange = vi.fn<ColorPickerAdapter['notifyChange']>();
    const foundation = new ColorPickerFoundation({
        getProp: (key) => props[key],
        getProps: () => props,
        getState: (key) => state[key],
        setState: vi.fn<() => void>(),
        notifyChange,
    } as unknown as ColorPickerAdapter);
    return { foundation, notifyChange };
};

describe('ColorPicker 审计修复', () => {
    const greyColor = {
        hsva: { h: 200, s: 0, v: 50, a: 1 },
        rgba: { r: 128, g: 128, b: 128, a: 1 },
        hex: '#808080',
    };

    it('rgba 格式逐字输入透明度分量时输入框不被回写', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: defaultColor, onChange });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '255,0,0,0.5');
        expect(getInput()).toHaveValue('255,0,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    describe('文本框与滴管不带透明度时沿用当前透明度', () => {
        const translucent = {
            hsva: { h: 0, s: 100, v: 100, a: 0.5 },
            rgba: { r: 255, g: 0, b: 0, a: 0.5 },
            hex: '#ff000080',
        };

        it.each([
            ['rgba', '0,255,0'],
            ['hsva', '120,100,100'],
            ['hex', '#00ff00'],
        ])('%s 格式输入 %s 后透明度仍为 0.5', (defaultFormat, text) => {
            const onChange = vi.fn<OnChange>();
            renderColorPicker({ alpha: true, defaultFormat, defaultValue: translucent, onChange });
            changeInput(text);
            expect(lastColor(onChange).rgba.g).toBe(255);
            // hex stores opacity in 8 bits, so 0.5 comes back as 128/255
            expect(lastColor(onChange).rgba.a).toBeCloseTo(0.5, 2);
        });

        it('输入框显式写出透明度时以输入为准', () => {
            const onChange = vi.fn<OnChange>();
            renderColorPicker({ alpha: true, defaultFormat: 'rgba', defaultValue: translucent, onChange });
            changeInput('0,255,0,1');
            expect(lastColor(onChange).rgba.a).toBe(1);
        });

        it('滴管取色后透明度仍为 0.5', async () => {
            const onChange = vi.fn<OnChange>();
            window.EyeDropper = class {
                async open() {
                    return { sRGBHex: '#00ff00' };
                }
            };
            renderColorPicker({ alpha: true, eyeDropper: true, defaultValue: translucent, onChange });
            await userEvent.click(getEyeDropperButton());
            await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
            expect(lastColor(onChange).rgba).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
        });
    });

    it('hex 格式逐字输入 8 位时输入框不被回写', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor, onChange });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '#ff000080');
        expect(getInput()).toHaveValue('#ff000080');
        expect(lastColor(onChange).hex).toBe('#ff000080');
    });

    it.each(['#gggggg', '#1234567', '#ff0000ff00', 'zz#ff0000'])('hex 格式输入非法的 %s 时不触发 onChange', (text) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor, onChange });
        changeInput(text);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('alpha 为 false 时文本框输入的透明度被忽略', () => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = renderColorPicker({ alpha: false, defaultFormat: 'hex', onChange });
        changeInput('#ff000080');
        expect(lastColor(onChange)).toMatchObject({ hex: '#ff0000', rgba: { a: 1 }, hsva: { a: 1 } });
        unmount();

        renderColorPicker({ alpha: false, defaultFormat: 'rgba', onChange });
        changeInput('255,0,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('rgba 输入小数通道时发出合法的 hex', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        changeInput('12.5,0,0');
        expect(lastColor(onChange).hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(rgbaToHex({ r: 12.5, g: 0, b: 0, a: 1 })).toMatch(/^#[0-9a-f]{6}$/);
        expect(ColorPicker.colorStringToValue('rgb(50%,0%,0%)').hex).toMatch(/^#[0-9a-f]{6}$/);
    });

    it.each(['hex', 'rgba'])('%s 格式改透明度输入框时保留色相', (format) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: format, defaultValue: greyColor, onChange });
        changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 200, s: 0, v: 50, a: 0.5 });
    });

    it('默认触发器是有名称的按钮，弹层为 dialog', async () => {
        renderColorPicker({ usePopover: true });
        const trigger = screen.getByRole('button', { name: zh_CN.ColorPicker.color });
        await userEvent.click(trigger);
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toContainElement(getPicker());
    });

    it('弹层 dialog 默认取语言包名称，popoverProps 的名称优先', async () => {
        const { unmount } = renderColorPicker({ usePopover: true });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.ColorPicker.color }));
        expect(await screen.findByRole('dialog')).toHaveAccessibleName(zh_CN.ColorPicker.color);
        unmount();

        const named = renderColorPicker({ usePopover: true, popoverProps: { 'aria-label': '主题色' } });
        await userEvent.click(screen.getByRole('button', { name: zh_CN.ColorPicker.color }));
        expect(await screen.findByRole('dialog')).toHaveAccessibleName('主题色');
        named.unmount();

        renderColorPicker({
            usePopover: true,
            popoverProps: { 'aria-labelledby': 'cp-title' },
            children: (
                <button id="cp-title" type="button">
                    标题
                </button>
            ),
        });
        await userEvent.click(screen.getByRole('button', { name: '标题' }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'cp-title');
        expect(dialog).not.toHaveAttribute('aria-label');
    });

    it('使用方传 aria-label 或 aria-labelledby 时 picker 根是 group，否则无 role', () => {
        const { unmount } = renderColorPicker({ 'aria-label': '主题色' });
        expect(screen.getByRole('group', { name: '主题色' })).toBe(getPicker());
        unmount();
        const labelled = renderColorPicker({ 'aria-labelledby': 'x' });
        expect(getPicker()).toHaveAttribute('role', 'group');
        labelled.unmount();
        const custom = renderColorPicker({ 'aria-label': 'a', role: 'region' });
        expect(getPicker()).toHaveAttribute('role', 'region');
        custom.unmount();
        renderColorPicker();
        expect(getPicker()).not.toHaveAttribute('role');
    });

    it('value 为 null 是受控的空值：显示 defaultValue，只报告变化', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ value: null, defaultValue: greenColor, onChange });
        const hue = within(getColorSlider()).getByRole('slider');
        expect(hue).toHaveValue('120');
        hue.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(lastColor(onChange).hsva.h).toBe(121);
        expect(hue).toHaveValue('120');
    });

    it('自定义触发器的弹层也是 dialog', async () => {
        renderColorPicker({ usePopover: true, children: <button type="button">pick</button> });
        await userEvent.click(screen.getByRole('button', { name: 'pick' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('usePopover 默认点击打开，悬停不打开', async () => {
        renderColorPicker({ usePopover: true });
        const trigger = screen.getByRole('button', { name: zh_CN.ColorPicker.color });
        await userEvent.hover(trigger);
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(screen.queryByRole('dialog')).toBeNull();
        await userEvent.click(trigger);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('popoverProps.trigger 为 hover 时仍可悬停打开', async () => {
        renderColorPicker({ usePopover: true, popoverProps: { trigger: 'hover' } });
        await userEvent.hover(screen.getByRole('button', { name: zh_CN.ColorPicker.color }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });
});

describe('ColorPicker', () => {
    afterEach(() => {
        delete window.EyeDropper;
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('无报错地渲染', () => {
        const { container } = renderColorPicker();
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
    });

    it('渲染自定义 className', () => {
        renderColorPicker({ className: 'custom-class' });
        expect(getPicker()).toHaveClass('custom-class');
    });

    it('使用 defaultValue 渲染', () => {
        renderColorPicker({ defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('受控模式，使用 value 属性', () => {
        renderColorPicker({ value: greenColor });
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('onChange 回调', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange });
        expect(onChange).not.toHaveBeenCalled();

        changeInput('#00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({
            hex: '#00ff00',
            rgba: { r: 0, g: 255, b: 0, a: 1 },
            hsva: { h: 120, s: 100, v: 100, a: 1 },
        });
    });

    it('alpha 为 true 时渲染透明度滑块', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaSlider()).not.toBeNull();
    });

    it('默认启用 alpha', () => {
        renderColorPicker();
        expect(getAlphaSlider()).not.toBeNull();
        expect(getAlphaInput()).not.toBeNull();
    });

    it('alpha 为 false 时不渲染透明度滑块', () => {
        renderColorPicker({ alpha: false });
        expect(getAlphaSlider()).toBeNull();
    });

    it('使用自定义宽高渲染', () => {
        renderColorPicker({ width: 300, height: 200, alpha: true });
        expect(getArea()).toHaveStyle({ width: '300px', height: '200px' });
        expect(getColorSlider()).toHaveStyle({ width: '300px' });
        expect(getAlphaSlider()).toHaveStyle({ width: '300px' });
        expect(document.querySelector(`.${prefixCls}-dataPart`)).toHaveStyle({ width: '300px' });
    });

    it('eyeDropper 禁用时渲染', () => {
        const { container } = renderColorPicker({ eyeDropper: false });
        expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('eyeDropper 启用时渲染', () => {
        renderColorPicker({ eyeDropper: true });
        expect(getEyeDropperButton()).not.toBeNull();
        expect(getEyeDropperButton().querySelector(`.${BASE_CLASS_PREFIX}-icon-eyedropper`)).not.toBeNull();
    });

    it('使用 defaultFormat 渲染', () => {
        renderColorPicker({ defaultFormat: 'rgb' });
        expect(getPicker()).not.toBeNull();
        expect(getInput()).toHaveValue('#39c5bb');
    });

    it('使用 topSlot 渲染', () => {
        const topSlot = <div className="top-slot">Top Content</div>;
        renderColorPicker({ topSlot });
        expect(screen.getByText('Top Content')).toHaveClass('top-slot');
        expect(getPicker().firstElementChild).toBe(screen.getByText('Top Content'));
    });

    it('使用 bottomSlot 渲染', () => {
        const bottomSlot = <div className="bottom-slot">Bottom Content</div>;
        renderColorPicker({ bottomSlot });
        expect(screen.getByText('Bottom Content')).toHaveClass('bottom-slot');
        expect(getPicker().lastElementChild).toBe(screen.getByText('Bottom Content'));
    });

    it('使用 usePopover 渲染', () => {
        renderColorPicker({ usePopover: true });
        const trigger = document.querySelector(`.${prefixCls}-popover-defaultChildren`);
        expect(trigger).not.toBeNull();
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
        expect(getPicker()).toBeNull();
    });

    it('使用 popoverProps 渲染', async () => {
        const popoverProps = { position: 'bottom', trigger: 'click', className: 'custom-popover' };
        renderColorPicker({ usePopover: true, popoverProps });
        expect(getPicker()).toBeNull();

        await userEvent.click(document.querySelector(`.${prefixCls}-popover-defaultChildren`));
        await waitFor(() => expect(getPicker()).not.toBeNull());
        expect(document.querySelector(`.${prefixCls}-popover`)).toHaveClass('custom-popover');
    });

    it('usePopover 为 false 时渲染', () => {
        const { container } = renderColorPicker({ usePopover: false });
        expect(container.firstElementChild).toBe(getPicker());
        expect(document.querySelector(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('Popover 模式下渲染 children', () => {
        renderColorPicker({
            usePopover: true,
            children: <button className="custom-trigger">Pick Color</button>,
        });
        expect(screen.getByRole('button', { name: 'Pick Color' })).toHaveClass('custom-trigger');
        expect(document.querySelector(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('渲染自定义 style', () => {
        const style = { border: '1px solid red' };
        renderColorPicker({ style });
        expect(getPicker()).toHaveStyle({ border: '1px solid rgb(255, 0, 0)' });
    });

    it('同时使用 topSlot 与 bottomSlot 渲染', () => {
        const topSlot = <div className="top-slot">Top</div>;
        const bottomSlot = <div className="bottom-slot">Bottom</div>;
        renderColorPicker({ topSlot, bottomSlot });
        expect(getPicker().firstElementChild).toBe(screen.getByText('Top'));
        expect(getPicker().lastElementChild).toBe(screen.getByText('Bottom'));
    });

    it('colorStringToValue 转换 hex 字符串', () => {
        const result = ColorPicker.colorStringToValue('#ff0000');
        expect(result.hex).toEqual('#ff0000');
        expect(result.rgba.r).toEqual(255);
        expect(result.rgba.g).toEqual(0);
        expect(result.rgba.b).toEqual(0);
    });

    it('colorStringToValue 转换 rgb 字符串', () => {
        const result = ColorPicker.colorStringToValue('rgb(255, 0, 0)');
        expect(result.rgba.r).toEqual(255);
        expect(result.rgba.g).toEqual(0);
        expect(result.rgba.b).toEqual(0);
    });

    it('colorStringToValue 转换 rgba 字符串', () => {
        const result = ColorPicker.colorStringToValue('rgba(255, 0, 0, 0.5)');
        expect(result.rgba.r).toEqual(255);
        expect(result.rgba.a).toEqual(0.5);
    });

    it('colorStringToValue 转换 hsv 字符串', () => {
        const result = ColorPicker.colorStringToValue('hsv(0, 100%, 100%)');
        expect(result.rgba.r).toEqual(255);
    });

    it('colorStringToValue 转换 hsva 字符串', () => {
        const result = ColorPicker.colorStringToValue('hsva(0, 100%, 100%, 0.5)');
        expect(result.rgba.r).toEqual(255);
        expect(result.rgba.a).toEqual(0.5);
    });

    it('colorStringToValue 转换带 alpha 的 hex', () => {
        const result = ColorPicker.colorStringToValue('#ff000080');
        expect(result.rgba.r).toEqual(255);
        expect(result.rgba.a).toBeCloseTo(0.5, 1);
    });

    it('colorStringToValue 对非法输入抛出错误', () => {
        expect(() => ColorPicker.colorStringToValue('invalid')).toThrow('Semi ColorPicker');
    });

    it('colorStringToValue 对空字符串抛出错误', () => {
        expect(() => ColorPicker.colorStringToValue('')).toThrow('Semi ColorPicker');
    });

    it('渲染 ColorChooseArea', () => {
        renderColorPicker();
        expect(getArea()).not.toBeNull();
        expect(getArea()).toHaveStyle({ width: '280px', height: '280px' });
    });

    it('渲染 ColorSlider', () => {
        renderColorPicker();
        expect(getColorSlider()).toHaveClass('colorSliderWrapper');
        expect(getColorSlider()).toHaveStyle({ width: '280px', height: '10px' });
    });

    it('渲染 DataPart', () => {
        renderColorPicker();
        expect(document.querySelector(`.${prefixCls}-dataPart`)).not.toBeNull();
    });

    it('ColorChooseArea 滑块展示饱和度与明度', () => {
        renderColorPicker({ defaultValue: defaultColor });
        const sliders = within(getArea()).getAllByRole('slider');
        expect(sliders).toHaveLength(2);
        sliders.forEach((slider) => expect(slider).toHaveAttribute('aria-valuetext', saturationBrightness(100, 100)));
    });

    it('为格式选择器提供名称', () => {
        renderColorPicker();
        expect(getFormatSelect()).toHaveAccessibleName(zh_CN.ColorPicker.format);
    });

    it('AlphaSlider 的 aria-valuetext 显示百分比', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '100%');
    });

    it('ColorChooseArea 中存在 handle', () => {
        renderColorPicker();
        expect(getAreaHandle()).not.toBeNull();
        expect(getAreaHandle()).toHaveStyle({ width: '20px', height: '20px' });
    });

    it('ColorSlider 中存在 handle', () => {
        renderColorPicker();
        expect(getColorSliderHandle()).not.toBeNull();
        expect(getColorSliderHandle()).toHaveStyle({ width: '18px', height: '18px' });
    });

    it('AlphaSlider 中存在 handle', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaHandle()).not.toBeNull();
        expect(getAlphaHandle()).toHaveStyle({ width: '18px', height: '18px' });
    });

    it('ColorChooseArea 的 pointerDown 触发 grabbing 状态', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });

        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 36, v: 64, a: 1 });
        expect(parseFloat(getAreaHandle().style.left)).toBeCloseTo(0.36 * 280 - 10);
        expect(parseFloat(getAreaHandle().style.top)).toBeCloseTo(0.36 * 280 - 10);

        release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('ColorChooseArea handle 的 pointerDown 冒泡到根元素并触发 grabbing', () => {
        renderColorPicker({ defaultValue: defaultColor });
        mockRect(getArea());
        fireEvent.pointerDown(getAreaHandle(), { clientX: 50, clientY: 50 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });

        release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('hsva 属性变化时 ColorChooseArea 更新', () => {
        const halfColor = {
            hsva: { h: 120, s: 50, v: 50, a: 1 },
            rgba: { r: 64, g: 128, b: 64, a: 1 },
            hex: '#408040',
        };
        const { rerender } = renderColorPicker({ defaultValue: defaultColor });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });

        rerender(<ColorPicker defaultValue={defaultColor} value={halfColor} />);
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(within(getArea()).getAllByRole('slider')[0]).toHaveAttribute('aria-valuetext', saturationBrightness(50, 50));
    });

    it('hue 属性变化时 ColorSlider 更新', () => {
        const { rerender } = renderColorPicker({ defaultValue: defaultColor });
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });

        rerender(<ColorPicker defaultValue={defaultColor} value={greenColor} />);
        expect(parseFloat(getColorSliderHandle().style.left)).toBeCloseTo((120 / 360) * 280 - 9);
        expect(getColorSliderHandle()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('按住指针拖动时 ColorSlider 调整色相，松开后停止', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getColorSlider());

        fireEvent.pointerDown(getColorSliderHandle(), { clientX: 0 });
        onChange.mockClear();
        fireEvent.pointerMove(getColorSlider(), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva.h).toBe(180);
        expect(getColorSliderHandle()).toHaveStyle({ left: '131px' });

        release(getColorSlider());
        fireEvent.pointerMove(getColorSlider(), { clientX: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按住指针拖动时 AlphaSlider 调整透明度，松开后停止', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        mockRect(getAlphaSlider());

        fireEvent.pointerDown(getAlphaHandle(), { clientX: 280 });
        onChange.mockClear();
        fireEvent.pointerMove(getAlphaSlider(), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');

        release(getAlphaSlider());
        fireEvent.pointerMove(getAlphaSlider(), { clientX: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按住指针拖动时 ColorChooseArea 调整颜色，松开后停止', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());

        fireEvent.pointerDown(getAreaHandle(), { clientX: 280, clientY: 0 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });
        onChange.mockClear();
        fireEvent.pointerMove(getArea(), { clientX: 140, clientY: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);

        release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
        fireEvent.pointerMove(getArea(), { clientX: 70, clientY: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按下时在拖拽区域捕获指针', () => {
        const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
        renderColorPicker({ alpha: true, defaultValue: defaultColor });
        for (const surface of [getArea(), getColorSlider(), getAlphaSlider()]) {
            fireEvent.pointerDown(mockRect(surface), { pointerId: 7, clientX: 10, clientY: 10 });
            expect(capture.mock.contexts.at(-1)).toBe(surface);
            expect(capture.mock.calls.at(-1)).toEqual([7]);
            release(surface);
        }
    });

    it('alpha 属性变化时 AlphaSlider 更新', () => {
        const { rerender } = renderColorPicker({
            alpha: true,
            value: { ...defaultColor, hsva: { ...defaultColor.hsva, a: 1 } },
        });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '100%');
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });

        rerender(
            <ColorPicker
                value={{
                    ...defaultColor,
                    hsva: { ...defaultColor.hsva, a: 0.5 },
                    rgba: { ...defaultColor.rgba, a: 0.5 },
                }}
                alpha
            />
        );
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaInput()).toHaveValue('50');
    });

    it('DataPart 渲染输入框与格式选择器', () => {
        renderColorPicker();
        expect(getInput()).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-formatSelect`)).toBe(getFormatSelect());
    });

    it('DataPart 默认以 hex 格式渲染', () => {
        renderColorPicker({ defaultFormat: 'hex' });
        expect(getFormatSelect()).toHaveTextContent('hex');
        expect(getInput()).toHaveValue('#39c5bb');
    });

    it('DataPart 以 rgba 格式渲染', () => {
        renderColorPicker({ defaultFormat: 'rgba' });
        expect(getFormatSelect()).toHaveTextContent('rgba');
        expect(getInput()).toHaveValue('57,197,187');
    });

    it('DataPart 以 hsva 格式渲染', () => {
        renderColorPicker({ defaultFormat: 'hsva' });
        expect(getFormatSelect()).toHaveTextContent('hsva');
        expect(getInput()).toHaveValue('176,71,77');
    });

    it('DataPart 输入合法 hex 时变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('#00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('DataPart 输入非法 hex 时变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('abc');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('abc');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
    });

    it('DataPart 输入不带 # 前缀的 hex 时变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('DataPart 切换格式为 rgba', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        await selectFormat('rgba');
        expect(getFormatSelect()).toHaveTextContent('rgba');
        expect(getInput()).toHaveValue('255,0,0');
    });

    it('DataPart 颜色示例块渲染', () => {
        renderColorPicker();
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
    });

    it('alpha 为 true 时 DataPart 渲染透明度输入框', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaInput()).toHaveValue('100');
        expect(document.querySelector(`.${prefixCls}-inputNumberSuffix`)).toHaveTextContent('%');
    });

    it('alpha 为 false 时 DataPart 不渲染透明度输入框', () => {
        renderColorPicker({ alpha: false });
        expect(getAlphaInput()).toBeNull();
    });

    it('value 属性更新组件', () => {
        const { rerender } = renderColorPicker({ value: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');

        rerender(<ColorPicker value={greenColor} />);
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('受控 value 变回 undefined 时回到 defaultValue', () => {
        const { rerender } = renderColorPicker({ defaultValue: defaultColor, value: greenColor });
        expect(getInput()).toHaveValue('#00ff00');

        rerender(<ColorPicker defaultValue={defaultColor} value={undefined} />);
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('受控 value 变回 undefined 后，后续调整从 defaultValue 开始并更新界面', () => {
        const onChange = vi.fn<OnChange>();
        const { rerender } = renderColorPicker({ defaultValue: defaultColor, value: greenColor });

        rerender(<ColorPicker defaultValue={defaultColor} value={undefined} onChange={onChange} />);
        fireEvent.keyDown(within(getColorSlider()).getByRole('slider'), { key: 'ArrowRight' });

        const { h } = lastColor(onChange).hsva;
        expect(h).toBeGreaterThan(0);
        expect(h).toBeLessThan(10);
        expect(getInput()).toHaveValue(lastColor(onChange).hex);
    });

    it('受控 value 变回 undefined 且没有 defaultValue 时回到组件默认色', () => {
        const { rerender } = renderColorPicker({ value: greenColor });

        rerender(<ColorPicker value={undefined} />);
        expect(getInput()).toHaveValue('#39c5bb');
    });

    it('不同格式的 defaultValue', () => {
        const hex = renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor });
        expect(getInput()).toHaveValue('#00ff00');
        hex.unmount();

        const rgb = renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor });
        expect(getInput()).toHaveValue('0,255,0');
        rgb.unmount();

        renderColorPicker({ defaultFormat: 'hsva', defaultValue: greenColor });
        expect(getInput()).toHaveValue('120,100,100');
    });

    it('foundation handleChange 处理 hsva 格式', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultFormat: 'hsva' });
        changeInput('120,100,100');
        expect(onChange).toHaveBeenCalledWith({
            hsva: { h: 120, s: 100, v: 100, a: 1 },
            rgba: { r: 0, g: 255, b: 0, a: 1 },
            hex: '#00ff00',
        });
    });

    it('foundation handleChange 处理 rgba 格式', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultFormat: 'rgba' });
        changeInput('0,255,0');
        expect(onChange).toHaveBeenCalledWith({
            hsva: { h: 120, s: 100, v: 100, a: 1 },
            rgba: { r: 0, g: 255, b: 0, a: 1 },
            hex: '#00ff00',
        });
    });

    it('foundation handleChange 遇到非法格式时抛出错误', () => {
        // the UI only offers hex/rgba/hsva, so the guard is only reachable on the foundation itself
        const { foundation, notifyChange } = createPickerFoundation();
        // deliberately invalid arguments to reach the runtime guard
        const invalidArgs = [{}, 'invalid'] as unknown as Parameters<ColorPickerFoundation['handleChange']>;
        expect(() => foundation.handleChange(...invalidArgs)).toThrow('format error');
        expect(notifyChange).not.toHaveBeenCalled();
    });

    it('foundation handleChangeH 更新色相', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva).toEqual({ h: 180, s: 71, v: 77, a: 1 });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });
    });

    it('foundation handleChangeH 处理受控 value', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, value: defaultColor });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(lastColor(onChange)).toEqual({
            hsva: { h: 180, s: 100, v: 100, a: 1 },
            rgba: { r: 0, g: 255, b: 255, a: 1 },
            hex: '#00ffff',
        });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('foundation handleChangeA 更新透明度', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 140 });
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
        expect(lastColor(onChange).hsva.a).toBe(0.5);
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaInput()).toHaveValue('50');
        expect(lastColor(onChange).hex).toBe('#ff000080');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
    });

    it('alpha 为 false 时 foundation handleChangeA', () => {
        // without `alpha` there is no alpha slider or input, so this path is only reachable on the foundation
        const { foundation, notifyChange } = createPickerFoundation({ alpha: false });
        // protected in the type, but the UI never reaches this branch, so the test calls it directly
        foundation['handleChangeA'](defaultColor, 0.5);
        expect(notifyChange).toHaveBeenCalledTimes(1);
        const callArg = notifyChange.mock.calls[0][0];
        expect(callArg.hsva.a).toBe(1);
        expect(callArg.rgba.a).toBe(1);
        expect(callArg.hex).toBe('#ff0000');
    });

    it('foundation handleChangeA 处理受控 value', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, value: defaultColor });
        fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 140 });
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaInput()).toHaveValue('100');
    });

    it('选色区受控时 handle 始终对应 value', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, value: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['X 超出右边界', { clientX: 300, clientY: 100 }, { s: 100, v: 64 }],
        ['Y 超出下边界', { clientX: 100, clientY: 300 }, { s: 36, v: 0 }],
        ['X 为负值', { clientX: -1, clientY: 100 }, { s: 0, v: 64 }],
        ['Y 为负值', { clientX: 100, clientY: -1 }, { s: 36, v: 100 }],
    ])('选色区按下位置%s时取边界上的颜色', (_name, point, expected) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), point);
        expect(lastColor(onChange).hsva).toMatchObject(expected);
    });

    it('选色区拖到区域外时颜色贴到角落', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());
        fireEvent.pointerDown(getAreaHandle(), { clientX: 140, clientY: 140 });
        fireEvent.pointerMove(getArea(), { clientX: 500, clientY: 500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 100, v: 0 });
        fireEvent.pointerMove(getArea(), { clientX: -500, clientY: -500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 0, v: 100 });
        release(getArea());
    });

    it('改变 width 与 height 后三个 handle 重新对应颜色', () => {
        const color = {
            hsva: { h: 180, s: 50, v: 100, a: 0.5 },
            rgba: { r: 128, g: 255, b: 255, a: 0.5 },
            hex: '#80ffff80',
        };
        const { rerender } = renderColorPicker({ value: color, width: 280, height: 280 });
        rerender(<ColorPicker value={color} height={100} width={200} />);
        expect(getAreaHandle()).toHaveStyle({ left: '90px', top: '-10px' });
        expect(getColorSliderHandle()).toHaveStyle({ left: '91px' });
        expect(getAlphaHandle()).toHaveStyle({ left: '91px' });
    });

    it('非主键按下不取色也不开始拖动', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100, button: 2 });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 100, button: 2 });
        fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 100, button: 2 });
        expect(onChange).not.toHaveBeenCalled();
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('透明度滑块受控时 handle 始终对应 value', () => {
        renderColorPicker({ alpha: true, value: defaultColor });
        fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 100 });
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });
    });

    it('透明度滑块拖出任一端时，handle 保持在该端', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        mockRect(getAlphaSlider());
        fireEvent.pointerDown(getAlphaHandle(), { clientX: 140 });
        fireEvent.pointerMove(getAlphaSlider(), { clientX: 500 });
        fireEvent.pointerMove(getAlphaSlider(), { clientX: 600 });
        expect(lastColor(onChange).rgba.a).toBe(1);
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });
        fireEvent.pointerMove(getAlphaSlider(), { clientX: -50 });
        fireEvent.pointerMove(getAlphaSlider(), { clientX: -100 });
        expect(lastColor(onChange).rgba.a).toBe(0);
        expect(getAlphaHandle()).toHaveStyle({ left: '-9px' });
        release(getAlphaSlider());
    });

    it('色相滑块受控时 handle 始终对应 value', () => {
        renderColorPicker({ value: defaultColor });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 100 });
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
    });

    it('色相滑块拖出任一端时，handle 保持在该端', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getColorSlider());
        fireEvent.pointerDown(getColorSliderHandle(), { clientX: 140 });
        fireEvent.pointerMove(getColorSlider(), { clientX: 500 });
        fireEvent.pointerMove(getColorSlider(), { clientX: 600 });
        expect(lastColor(onChange).hsva.h).toBe(360);
        expect(getColorSliderHandle()).toHaveStyle({ left: '271px' });
        fireEvent.pointerMove(getColorSlider(), { clientX: -50 });
        fireEvent.pointerMove(getColorSlider(), { clientX: -100 });
        expect(lastColor(onChange).hsva.h).toBe(0);
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
        release(getColorSlider());
    });

    it('foundation getCurrentColor 在受控模式下返回 value', () => {
        renderColorPicker({ value: greenColor, defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('DataPart foundation getInputValue 处理 rgba 格式', () => {
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('255,0,0');
    });

    it('DataPart foundation getInputValue 处理 hsva 格式', () => {
        renderColorPicker({ defaultFormat: 'hsva', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('DataPart foundation getInputValue 处理 hex 格式', () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: { ...defaultColor, hex: '#ff000080' } });
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('DataPart foundation getValueByInputValue 解析合法 rgba', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor, onChange });
        changeInput('255,0,0');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('DataPart foundation getValueByInputValue 解析非法 rgba', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor, onChange });
        changeInput('invalid');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('invalid');
    });

    it('DataPart foundation getValueByInputValue 解析合法 hsva', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', defaultValue: greenColor, onChange });
        changeInput('0,100,100');
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 100, v: 100, a: 1 });
    });

    it('DataPart foundation getValueByInputValue 解析合法 hex', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor, onChange });
        changeInput('#ff0000');
        expect(lastColor(onChange).hex).toBe('#ff0000');
    });

    it('DataPart foundation getValueByInputValue 解析不带 # 前缀的 hex', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor, onChange });
        changeInput('ff0000');
        expect(lastColor(onChange).hex).toBe('#ff0000');
    });

    it('DataPart foundation getValueByInputValue 解析非法的短 hex', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor, onChange });
        changeInput('#f00');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('#f00');
    });

    it('DataPart foundation handleInputValueChange 处理输入值变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange });
        changeInput('test');
        expect(getInput()).toHaveValue('test');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('EyeDropper 不可用时 DataPart foundation handlePickValueWithStraw', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ eyeDropper: true, onChange });
        expect(window.EyeDropper).toBeUndefined();
        await userEvent.click(getEyeDropperButton());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('点击 eyeDropper 按钮', async () => {
        const open = vi.fn<() => Promise<{ sRGBHex: string }>>(async () => ({ sRGBHex: '#00ff00' }));
        window.EyeDropper = class {
            open = open;
        };
        renderColorPicker({ eyeDropper: true });
        await userEvent.click(getEyeDropperButton());
        expect(open).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getInput()).toHaveValue('#00ff00'));
    });

    it('currentColor 变化时更新 inputValue', () => {
        renderColorPicker({ defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(getInput()).toHaveValue('#00ffff');
    });

    it('格式变化时更新 inputValue', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');
        await selectFormat('hsva');
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('rgba 模式下 alpha InputNumber 变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'rgba', onChange, defaultValue: defaultColor });
        changeAlphaInput('50');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    it('hex 模式下 alpha InputNumber 变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'hex', onChange, defaultValue: defaultColor });
        changeAlphaInput('50');
        expect(lastColor(onChange).hex).toBe('#ff000080');
    });

    it('hsva 模式下 alpha InputNumber 变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'hsva', onChange, defaultValue: defaultColor });
        changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 100, v: 100, a: 0.5 });
    });

    it('rgba 输入逗号分隔的值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        changeInput('128,255,0');
        expect(lastColor(onChange).rgba).toEqual({ r: 128, g: 255, b: 0, a: 1 });
    });

    it('rgba 输入非法值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        changeInput('abc,def,ghi');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hsva 输入逗号分隔的值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        changeInput('120,100,100');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 1 });
    });

    it('rgba 输入超出范围的值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        changeInput('300,0,0');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('rgba 输入带 alpha 的值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        changeInput('128,255,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 128, g: 255, b: 0, a: 0.5 });
    });

    it('颜色转换函数可用', () => {
        expect(hsvaToRgba({ h: 0, s: 100, v: 100, a: 1 })).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(rgbaToHsva({ r: 0, g: 255, b: 0, a: 1 })).toEqual({
            h: 120,
            s: 100,
            v: 100,
            a: 1,
        });
        expect(rgbaToHex({ r: 0, g: 0, b: 255, a: 1 })).toBe('#0000ff');
        expect(hsvaToHex({ h: 0, s: 100, v: 100, a: 1 })).toBe('#ff0000');
        expect(hexToRgba('#00ff00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
        expect(hexToHsva('#00ff00')).toEqual({ h: 120, s: 100, v: 100, a: 1 });
        expect(hsvaToHslString({ h: 0, s: 100, v: 100, a: 1 })).toBe('hsl(0, 100%, 50%)');
        expect(hsvaToHslaString({ h: 0, s: 100, v: 100, a: 0.5 })).toBe('hsla(0, 100%, 50%, 0.5)');
        expect(rgbaStringToRgba('rgba(1, 2, 3, 0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
        expect(rgbaStringToHsva('rgba(255, 0, 0, 1)')).toEqual({ h: 0, s: 100, v: 100, a: 1 });
    });

    it('非受控模式下 foundation handleChange 更新状态', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        changeInput('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('受控模式下 foundation handleChange 不更新状态', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, value: defaultColor });
        changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('rgba 格式下 DataPart onNumberChange', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'hex', onChange, defaultValue: defaultColor });
        await selectFormat('rgba');
        changeAlphaInput('50');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    it('hex 格式下 DataPart onNumberChange', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'rgba', onChange, defaultValue: defaultColor });
        await selectFormat('hex');
        changeAlphaInput('50');
        expect(lastColor(onChange).hex).toBe('#ff000080');
    });

    it('hsva 格式下 DataPart onNumberChange', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: 'hex', onChange, defaultValue: defaultColor });
        await selectFormat('hsva');
        changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 100, v: 100, a: 0.5 });
    });

    it('hsvaToHslString 转换正确', () => {
        expect(hsvaToHslString({ h: 0, s: 100, v: 100, a: 1 })).toBe('hsl(0, 100%, 50%)');
        expect(hsvaToHslString({ h: 120, s: 0, v: 100, a: 1 })).toBe('hsl(120, 0%, 100%)');
    });

    it('colorStringToValue 把 3 位 hex 展开为 6 位', () => {
        expect(ColorPicker.colorStringToValue('#f00')).toMatchObject({ hex: '#ff0000', rgba: { r: 255, g: 0, b: 0 } });
    });

    it('colorStringToValue 处理 blue 颜色名', () => {
        const result = ColorPicker.colorStringToValue('#0000ff');
        expect(result.rgba.r).toBe(0);
        expect(result.rgba.g).toBe(0);
        expect(result.rgba.b).toBe(255);
    });

    it('colorStringToValue 处理 white 颜色名', () => {
        const result = ColorPicker.colorStringToValue('#ffffff');
        expect(result.rgba.r).toBe(255);
        expect(result.rgba.g).toBe(255);
        expect(result.rgba.b).toBe(255);
    });

    it('colorStringToValue 处理 black 颜色名', () => {
        const result = ColorPicker.colorStringToValue('#000000');
        expect(result.rgba.r).toBe(0);
        expect(result.rgba.g).toBe(0);
        expect(result.rgba.b).toBe(0);
    });

    it('colorStringToValue 处理 alpha 为 1 的 rgba', () => {
        const result = ColorPicker.colorStringToValue('rgba(128, 128, 128, 1)');
        expect(result.rgba.r).toBe(128);
        expect(result.rgba.a).toBe(1);
    });

    it('colorStringToValue 处理不带 alpha 的 rgb', () => {
        const result = ColorPicker.colorStringToValue('rgb(128, 128, 128)');
        expect(result.rgba.a).toBe(1);
    });

    it('colorStringToValue 处理带 alpha 的 hsva', () => {
        const result = ColorPicker.colorStringToValue('hsva(120, 100%, 100%, 0.8)');
        expect(result.rgba.g).toBeGreaterThan(200);
        expect(result.rgba.a).toBeCloseTo(0.8, 1);
    });

    it('受控 value 的 handle 位置只跟随 value', () => {
        const { rerender } = renderColorPicker({ value: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        release(getArea());
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });

        rerender(<ColorPicker value={{ ...defaultColor, hsva: { ...defaultColor.hsva } }} />);
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });

        rerender(<ColorPicker value={greenColor} />);
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
    });

    it('ColorChooseArea foundation getHandlePositionByHSVA', () => {
        renderColorPicker();
        expect(parseFloat(getAreaHandle().style.left)).toBeCloseTo(0.71 * 280 - 10);
        expect(parseFloat(getAreaHandle().style.top)).toBeCloseTo(0.23 * 280 - 10);
    });

    // getDOM only returns null once the element is gone; the foundations are exercised directly for that guard

    it('ColorChooseArea pickByPointer 处理 rect 为 null 的情况', () => {
        const notifyChange = vi.fn<() => void>();
        const setState = vi.fn<() => void>();
        const foundation = new ColorChooseAreaFoundation({
            getDOM: () => null,
            notifyChange,
            setState,
        } as unknown as ColorChooseAreaAdapter);
        foundation.pickByPointer({ clientX: 50, clientY: 50 });
        expect(notifyChange).not.toHaveBeenCalled();
        expect(setState).not.toHaveBeenCalled();
    });

    it('ColorSlider pickByPointer 处理 rect 为 null 的情况', () => {
        const handleColorChangeByHandle = vi.fn<() => void>();
        const setState = vi.fn<() => void>();
        const foundation = new ColorSliderFoundation({
            getDOM: () => null,
            getProps: () => ({ width: 100, foundation: { handleColorChangeByHandle } }),
            setState,
        } as unknown as ColorSliderAdapter);
        foundation.pickByPointer({ clientX: 50 });
        expect(handleColorChangeByHandle).not.toHaveBeenCalled();
        expect(setState).not.toHaveBeenCalled();
    });

    it('AlphaSlider pickByPointer 处理 rect 为 null 的情况', () => {
        const handleAlphaChangeByHandle = vi.fn<() => void>();
        const setState = vi.fn<() => void>();
        const foundation = new AlphaSliderFoundation({
            getDOM: () => null,
            getProps: () => ({ width: 100, foundation: { handleAlphaChangeByHandle } }),
            setState,
        } as unknown as AlphaSliderAdapter);
        foundation.pickByPointer({ clientX: 50 });
        expect(handleAlphaChangeByHandle).not.toHaveBeenCalled();
        expect(setState).not.toHaveBeenCalled();
    });

    it('ColorChooseArea pickByPointer 处理合法位置', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());
        fireEvent.pointerDown(getAreaHandle(), { clientX: 140, clientY: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        release(getArea());
    });

    it('EyeDropper 返回 hex 时 DataPart handlePickValueWithStraw', async () => {
        const onChange = vi.fn<OnChange>();
        window.EyeDropper = class {
            async open() {
                return { sRGBHex: '#00ff00' };
            }
        };
        renderColorPicker({ eyeDropper: true, onChange });
        await userEvent.click(getEyeDropperButton());
        await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
        expect(lastColor(onChange).hex).toBe('#00ff00');
    });

    it('用户取消取色（AbortError）时 DataPart handlePickValueWithStraw 不报错也不通知', async () => {
        const onChange = vi.fn<OnChange>();
        const open = vi.fn<() => Promise<{ sRGBHex: string }>>(async () => {
            throw new DOMException('The user canceled the selection.', 'AbortError');
        });
        window.EyeDropper = class {
            open = open;
        };
        renderColorPicker({ eyeDropper: true, onChange });
        await userEvent.click(getEyeDropperButton());
        await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('EyeDropper 抛出 AbortError 以外的错误时 handlePickValueWithStraw 向上抛出', async () => {
        window.EyeDropper = class {
            async open(): Promise<{ sRGBHex: string }> {
                throw new DOMException('not allowed', 'NotAllowedError');
            }
        };
        const foundation = new DataPartFoundation({
            getProps: () => ({ foundation: { handleChange: vi.fn<() => void>() } }),
        } as unknown as DataPartAdapter);
        foundation.connect();
        await expect(foundation.handlePickValueWithStraw()).rejects.toThrow('not allowed');
    });

    it('取色期间卸载会取消取色，之后不再通知', async () => {
        const onChange = vi.fn<OnChange>();
        const open = vi.fn<(options: { signal: AbortSignal }) => Promise<{ sRGBHex: string }>>(({ signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
        window.EyeDropper = class {
            open = open;
        };
        const { unmount } = renderColorPicker({ eyeDropper: true, onChange });
        await userEvent.click(getEyeDropperButton());
        await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
        const { signal } = open.mock.calls[0][0];
        expect(signal.aborted).toBe(false);
        unmount();
        expect(signal.aborted).toBe(true);
        // the abort rejection must be swallowed, not left as an unhandled rejection
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('DataPart foundation handleFormatChange 一次写入格式与对应的输入框内容', () => {
        const setState = vi.fn<(state: object) => void>();
        const foundation = new DataPartFoundation({
            getProp: () => defaultColor,
            setState,
        } as unknown as DataPartAdapter);
        foundation.handleFormatChange('rgba');
        expect(setState).toHaveBeenCalledTimes(1);
        expect(setState.mock.calls[0][0]).toEqual({ format: 'rgba', inputValue: '255,0,0' });
    });

    it('hsva 输入带空格', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        changeInput(' 120 , 100 , 100 ');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 1 });
    });

    it('hsva 输入带 alpha 的值', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        changeInput('120,100,100,0.5');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 0.5 });
    });

    it('hsva 输入超出范围的色相', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        changeInput('400,100,100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hex 输入 8 位 hex（带 alpha）', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('#ff000080');
        expect(lastColor(onChange).hex).toBe('#ff000080');
        expect(lastColor(onChange).rgba.a).toBeCloseTo(0.5, 1);
    });

    it('rgba 模式下 DataPart InputNumber onNumberChange', async () => {
        renderColorPicker({ alpha: true, defaultFormat: 'rgba', defaultValue: defaultColor });
        await userEvent.clear(getAlphaInput());
        await userEvent.type(getAlphaInput(), '50');
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgba(255, 0, 0, 0.5)' });
    });

    it('hex 模式下 DataPart InputNumber onNumberChange', async () => {
        renderColorPicker({ alpha: true, defaultFormat: 'hex', defaultValue: defaultColor });
        await userEvent.clear(getAlphaInput());
        await userEvent.type(getAlphaInput(), '50');
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('hsva 模式下 DataPart InputNumber onNumberChange', async () => {
        renderColorPicker({ alpha: true, defaultFormat: 'hsva', defaultValue: defaultColor });
        await userEvent.clear(getAlphaInput());
        await userEvent.type(getAlphaInput(), '80');
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '80%');
        expect(getAlphaHandle()).toHaveStyle({ left: `${0.8 * 280 - 9}px` });
    });

    it('格式选择器 onSelect 切换为 hsva', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        await selectFormat('hsva');
        expect(getFormatSelect()).toHaveTextContent('hsva');
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('mock rect 后 ColorSlider handleClick', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140, clientY: 5 });
        expect(lastColor(onChange).hsva.h).toBe(180);
        expect(getColorSliderHandle()).toHaveStyle({ left: '131px' });
        release(getColorSlider());
    });

    it('mock rect 后 ColorChooseArea handleClick', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 140, clientY: 140 });
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        release(getArea());
    });

    it('colorStringToValue 覆盖 rgbaToHsva 的各个分支', () => {
        const red = ColorPicker.colorStringToValue('#ff0000');
        expect(red.hsva.h).toBe(0);

        const green = ColorPicker.colorStringToValue('#00ff00');
        expect(green.hsva.h).toBe(120);

        const blue = ColorPicker.colorStringToValue('#0000ff');
        expect(blue.hsva.h).toBe(240);

        const black = ColorPicker.colorStringToValue('#000000');
        expect(black.hsva.h).toBe(0);
        expect(black.hsva.s).toBe(0);
    });

    it('colorStringToValue 处理百分比 rgba', () => {
        const result = ColorPicker.colorStringToValue('rgba(100, 200, 50, 0.8)');
        expect(result.rgba.r).toBe(100);
        expect(result.rgba.g).toBe(200);
        expect(result.rgba.b).toBe(50);
        expect(result.rgba.a).toBeCloseTo(0.8);
    });

    it('colorStringToValue 处理 a 为 undefined 的 hex alpha', () => {
        const result = ColorPicker.colorStringToValue('#ff0000');
        expect(result.rgba.a).toBe(1);
    });

    it('alpha 为 undefined 时 rgbaToHex', () => {
        expect(rgbaToHex({ r: 255, g: 0, b: 0, a: undefined })).toBe('#ff0000');
    });

    it('alpha = 1 时 rgbaToHex', () => {
        expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000');
    });

    it('alpha < 1 时 rgbaToHex', () => {
        expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#ff000080');
    });

    it('hexToRgba 遇到非法 hex 子串时返回 a=1', () => {
        const result = hexToRgba('#ff0000');
        expect(result.a).toBe(1);
    });

    it('从 semiGlobal.config.overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ColorPicker: { defaultFormat: 'rgba', alpha: true } };
        const first = renderColorPicker();
        expect(getInput()).toHaveValue('57,197,187');
        expect(getAlphaSlider()).not.toBeNull();
        first.unmount();

        renderColorPicker({ defaultFormat: 'hsva' });
        expect(getInput()).toHaveValue('176,71,77');
    });

    it('全局 Input、InputNumber 默认值不给数据区输入框加清除按钮与前后缀', () => {
        const adornments = { showClear: true, prefix: 'x', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' };
        semiGlobal.config.overrideDefaultProps = { Input: { ...adornments, suffix: 'y' }, InputNumber: adornments };
        const { container } = renderColorPicker({ alpha: true });
        const dataPart = container.querySelector(`.${prefixCls}-dataPart`);
        expect(dataPart.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
        expect(dataPart.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
        expect(dataPart.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-suffix`)).toHaveLength(1);
    });

    it('受控 value 在各格式下经 onChange 往返一致', async () => {
        const changes = [];
        function Controlled() {
            const [value, setValue] = useState(defaultColor);
            return (
                <ColorPicker
                    value={value}
                    onChange={(v) => {
                        changes.push(v);
                        setValue(v);
                    }}
                />
            );
        }
        render(<Controlled />);
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        release(getColorSlider());
        expect(changes.at(-1)).toEqual({
            hsva: { h: 180, s: 100, v: 100, a: 1 },
            rgba: { r: 0, g: 255, b: 255, a: 1 },
            hex: '#00ffff',
        });
        expect(getInput()).toHaveValue('#00ffff');
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });

        await selectFormat('rgba');
        changeInput('0,0,255');
        expect(changes.at(-1)).toEqual({
            rgba: { r: 0, g: 0, b: 255, a: 1 },
            hsva: { h: 240, s: 100, v: 100, a: 1 },
            hex: '#0000ff',
        });
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });

        await selectFormat('hsva');
        expect(getInput()).toHaveValue('240,100,100');
        changeInput('120,100,100');
        expect(changes.at(-1).hex).toBe('#00ff00');
        expect(getColorSliderHandle()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('重新渲染后拖动调用最新的 onChange', () => {
        const first = vi.fn<OnChange>();
        const second = vi.fn<OnChange>();
        const { rerender } = renderColorPicker({ alpha: true, onChange: first, defaultValue: defaultColor });
        mockRect(getAlphaSlider());
        fireEvent.pointerDown(getAlphaSlider(), { clientX: 280 });
        rerender(<ColorPicker defaultValue={defaultColor} alpha onChange={second} />);
        fireEvent.pointerMove(getAlphaSlider(), { clientX: 140 });
        expect(second).toHaveBeenCalledTimes(1);
        expect(lastColor(second).rgba.a).toBe(0.5);
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('受控 value 相等时不覆盖正在输入的内容', () => {
        const { rerender } = renderColorPicker({ value: defaultColor });
        changeInput('ff00');
        rerender(<ColorPicker value={{ ...defaultColor, rgba: { ...defaultColor.rgba } }} />);
        expect(getInput()).toHaveValue('ff00');
        rerender(<ColorPicker value={greenColor} />);
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('Popover 内的取色器会改变默认触发色块', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({
            usePopover: true,
            onChange,
            defaultValue: defaultColor,
            popoverProps: { trigger: 'click' },
        });
        const trigger = document.querySelector(`.${prefixCls}-popover-defaultChildren`);
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        await userEvent.click(trigger);
        await waitFor(() => expect(getPicker()).not.toBeNull());
        changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('StrictMode 下拖动每次移动只改变一次颜色，松开后停止', () => {
        const onChange = vi.fn<OnChange>();
        render(
            <StrictMode>
                <ColorPicker defaultValue={defaultColor} onChange={onChange} />
            </StrictMode>
        );
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 0 });
        onChange.mockClear();
        fireEvent.pointerMove(getColorSlider(), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva.h).toBe(180);
        release(getColorSlider());
        fireEvent.pointerMove(getColorSlider(), { clientX: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('未知属性传到根元素，ref 指向根元素', () => {
        const ref = createRef();
        renderColorPicker({ ref, 'data-testid': 'picker', 'aria-describedby': 'hint' });
        expect(getPicker()).toHaveAttribute('data-testid', 'picker');
        expect(getPicker()).toHaveAttribute('aria-describedby', 'hint');
        expect(ref.current).toBe(getPicker());
    });

    it('不把 tabIndex 落在根元素上，Tooltip 包裹时不多出 Tab 停靠点', () => {
        renderColorPicker({ tabIndex: 0 });
        expect(getPicker()).not.toHaveAttribute('tabindex');
    });

    it.each([
        ['area', getArea],
        ['color slider', getColorSlider],
        ['alpha slider', getAlphaSlider],
    ])('在 %s 上拖动中途卸载后，停止后续变化', (_, getTarget) => {
        const onChange = vi.fn<OnChange>();
        const { unmount } = renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        const target = mockRect(getTarget());
        fireEvent.pointerDown(target, { clientX: 140, clientY: 140 });
        unmount();
        onChange.mockClear();
        fireEvent.pointerMove(target, { clientX: 70, clientY: 70 });
        expect(onChange).not.toHaveBeenCalled();
    });
});
