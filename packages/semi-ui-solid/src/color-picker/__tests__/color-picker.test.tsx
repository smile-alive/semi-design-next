import { createSignal, onMount } from 'solid-js';
import { fireEvent, render, screen, waitFor, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import ColorPicker, { type ColorFormat, type ColorPickerProps, type ColorValue, type HsvaColor, type RgbaColor } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;

type OnChange = NonNullable<ColorPickerProps['onChange']>;

const defaultColor: ColorValue = {
    hsva: { h: 0, s: 100, v: 100, a: 1 },
    rgba: { r: 255, g: 0, b: 0, a: 1 },
    hex: '#ff0000',
};

const greenColor: ColorValue = {
    hsva: { h: 120, s: 100, v: 100, a: 1 },
    rgba: { r: 0, g: 255, b: 0, a: 1 },
    hex: '#00ff00',
};

const saturationBrightness = (s: number, v: number) => zh_CN.ColorPicker.saturationBrightness.replace('${saturation}', String(s)).replace('${brightness}', String(v));

const renderColorPicker = (props: ColorPickerProps = {}) => render(() => <ColorPicker {...props} />);

const getPicker = () => document.querySelector<HTMLElement>(`.${prefixCls}`);
const getArea = () => document.querySelector(`.${prefixCls}-colorChooseArea`) as HTMLElement;
const getAreaHandle = () => document.querySelector(`.${prefixCls}-colorChooseArea .${prefixCls}-handle`) as HTMLElement;
const getColorSlider = () => document.querySelector(`.${prefixCls}-colorSlider`) as HTMLElement;
const getColorSliderHandle = () => document.querySelector(`.${prefixCls}-colorSlider .${prefixCls}-handle`) as HTMLElement;
const getAlphaSlider = () => document.querySelector<HTMLElement>(`.${prefixCls}-alphaSlider`);
const getAlphaRange = () => within(getAlphaSlider() as HTMLElement).getByRole('slider');
const getAlphaHandle = () => document.querySelector(`.${prefixCls}-alphaHandle`) as HTMLElement;
const getInput = () => document.querySelector(`.${prefixCls}-colorPickerInput input`) as HTMLInputElement;
const getAlphaInput = () => document.querySelector<HTMLInputElement>(`.${prefixCls}-colorPickerInputNumber input`);
const getDemoBlock = () => document.querySelector(`.${prefixCls}-colorDemoBlock`) as HTMLElement;
const getEyeDropperButton = () => document.querySelector(`.${prefixCls}-dataPart button`) as HTMLElement;
const getFormatSelect = () => screen.getByRole('combobox');
const lastColor = (onChange: ReturnType<typeof vi.fn<OnChange>>) => onChange.mock.calls[onChange.mock.calls.length - 1][0];

const changeInput = (value: string) => fireEvent.input(getInput(), { target: { value } });
const changeAlphaInput = (value: string) => fireEvent.input(getAlphaInput() as HTMLInputElement, { target: { value } });

// the setup rect mock has no x/y, which the pickers subtract from clientX/clientY
const mockRect = (el: HTMLElement) => {
    const width = parseFloat(el.style.width);
    const height = parseFloat(el.style.height);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height } as DOMRect);
    return el;
};

// a browser sends a captured pointer's release, then lostpointercapture, to the capturing element
const release = (el: HTMLElement) => {
    fireEvent.pointerUp(el);
    fireEvent.lostPointerCapture(el);
};

const selectFormat = async (format: string) => {
    await userEvent.click(getFormatSelect());
    const options = await screen.findAllByRole('option');
    await userEvent.click(options.find((option) => option.textContent === format) as HTMLElement);
};

afterEach(() => {
    delete window.EyeDropper;
    semiGlobal.config.overrideDefaultProps = {};
});

describe('ColorPicker 公开类型', () => {
    it('目录入口导出颜色值类型', () => {
        expectTypeOf<ColorValue>().toHaveProperty('hex');
        expectTypeOf<HsvaColor>().toHaveProperty('h');
        expectTypeOf<RgbaColor>().toHaveProperty('r');
        expectTypeOf<ColorFormat>().toEqualTypeOf<'hex' | 'rgba' | 'hsva'>();
    });
});

describe('ColorPicker 审计修复', () => {
    const greyColor: ColorValue = {
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
        const translucent: ColorValue = {
            hsva: { h: 0, s: 100, v: 100, a: 0.5 },
            rgba: { r: 255, g: 0, b: 0, a: 0.5 },
            hex: '#ff000080',
        };

        it.each([
            ['rgba', '0,255,0'],
            ['hsva', '120,100,100'],
            ['hex', '#00ff00'],
        ] as const)('%s 格式输入 %s 后透明度仍为 0.5', (defaultFormat, text) => {
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
    });

    it.each(['hex', 'rgba'] as const)('%s 格式改透明度输入框时保留色相', (format) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: format, defaultValue: greyColor, onChange });
        changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 200, s: 0, v: 50, a: 0.5 });
    });

    it('默认触发器是有名称的按钮，弹层为 dialog', async () => {
        renderColorPicker({ usePopover: true });
        const trigger = screen.getByRole('button', { name: zh_CN.ColorPicker.color });
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.click(trigger);
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toContainElement(getPicker());
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
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

        render(() => (
            <ColorPicker usePopover popoverProps={{ 'aria-labelledby': 'cp-title' }}>
                <button id="cp-title" type="button">
                    标题
                </button>
            </ColorPicker>
        ));
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

    it('辅助技术经 input 事件调整被受控拒绝时，原生 range 回到 value', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ value: greenColor, onChange });
        const hue = within(getColorSlider()).getByRole('slider');
        fireEvent.input(hue, { target: { value: '121' } });
        expect(lastColor(onChange).hsva.h).toBe(121);
        expect(hue).toHaveValue('120');
    });

    it('自定义触发器的弹层也是 dialog', async () => {
        render(() => (
            <ColorPicker usePopover>
                <button type="button">pick</button>
            </ColorPicker>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'pick' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('函数 children 取得 getTriggerProps，弹层状态落在自定义触发器上', async () => {
        render(() => (
            <ColorPicker usePopover>
                {(getTriggerProps) => (
                    <button {...getTriggerProps({ type: 'button' })} class="own-trigger">
                        pick
                    </button>
                )}
            </ColorPicker>
        ));
        const trigger = screen.getByRole('button', { name: 'pick' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.click(trigger);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('usePopover 默认点击打开，悬停不打开', async () => {
        renderColorPicker({ usePopover: true });
        const trigger = screen.getByRole('button', { name: zh_CN.ColorPicker.color });
        await userEvent.hover(trigger);
        // longer than Popover's hover open delay
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
    it('无报错地渲染', () => {
        const { container } = renderColorPicker();
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
    });

    it('渲染自定义 class', () => {
        renderColorPicker({ class: 'custom-class' });
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

    it('默认启用 alpha', () => {
        renderColorPicker();
        expect(getAlphaSlider()).not.toBeNull();
        expect(getAlphaInput()).not.toBeNull();
    });

    it('alpha 为 false 时不渲染透明度滑块与输入框', () => {
        renderColorPicker({ alpha: false });
        expect(getAlphaSlider()).toBeNull();
        expect(getAlphaInput()).toBeNull();
    });

    it('使用自定义宽高渲染', () => {
        renderColorPicker({ width: 300, height: 200, alpha: true });
        expect(getArea()).toHaveStyle({ width: '300px', height: '200px' });
        expect(getColorSlider()).toHaveStyle({ width: '300px' });
        expect(getAlphaSlider()).toHaveStyle({ width: '300px' });
        expect(document.querySelector(`.${prefixCls}-dataPart`)).toHaveStyle({ width: '300px' });
    });

    it('eyeDropper 禁用时不渲染按钮', () => {
        const { container } = renderColorPicker({ eyeDropper: false });
        expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('eyeDropper 启用时渲染带名称的滴管按钮', () => {
        renderColorPicker({ eyeDropper: true });
        expect(getEyeDropperButton().querySelector(`.${BASE_CLASS_PREFIX}-icon-eyedropper`)).not.toBeNull();
        expect(getEyeDropperButton()).toHaveAccessibleName(zh_CN.ColorPicker.eyeDropper);
    });

    it('defaultFormat 非法时按 hex 显示', () => {
        // deliberately invalid: the input falls back to the hex text
        renderColorPicker({ defaultFormat: 'rgb' as ColorFormat });
        expect(getInput()).toHaveValue('#39c5bb');
    });

    it('同时使用 topSlot 与 bottomSlot 渲染', () => {
        renderColorPicker({ topSlot: <div class="top-slot">Top</div>, bottomSlot: <div class="bottom-slot">Bottom</div> });
        expect(getPicker()?.firstElementChild).toBe(screen.getByText('Top'));
        expect(screen.getByText('Top')).toHaveClass('top-slot');
        expect(getPicker()?.lastElementChild).toBe(screen.getByText('Bottom'));
        expect(screen.getByText('Bottom')).toHaveClass('bottom-slot');
    });

    it('使用 usePopover 渲染', () => {
        renderColorPicker({ usePopover: true });
        const trigger = document.querySelector(`.${prefixCls}-popover-defaultChildren`);
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
        expect(getPicker()).toBeNull();
    });

    it('使用 popoverProps 渲染', async () => {
        renderColorPicker({ usePopover: true, popoverProps: { position: 'bottom', trigger: 'click', class: 'custom-popover' } });
        expect(getPicker()).toBeNull();

        await userEvent.click(document.querySelector(`.${prefixCls}-popover-defaultChildren`) as HTMLElement);
        await waitFor(() => expect(getPicker()).not.toBeNull());
        expect(document.querySelector(`.${prefixCls}-popover`)).toHaveClass('custom-popover');
    });

    it('usePopover 为 false 时渲染', () => {
        const { container } = renderColorPicker({ usePopover: false });
        expect(container.firstElementChild).toBe(getPicker());
        expect(document.querySelector(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('Popover 模式下渲染 children', () => {
        render(() => (
            <ColorPicker usePopover>
                <button class="custom-trigger">Pick Color</button>
            </ColorPicker>
        ));
        expect(screen.getByRole('button', { name: 'Pick Color' })).toHaveClass('custom-trigger');
        expect(document.querySelector(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('非 usePopover 时不渲染 children', () => {
        render(() => (
            <ColorPicker>
                <button>Pick Color</button>
            </ColorPicker>
        ));
        expect(screen.queryByRole('button', { name: 'Pick Color' })).toBeNull();
    });

    it('渲染自定义 style', () => {
        renderColorPicker({ style: { border: '1px solid red' } });
        expect(getPicker()).toHaveStyle({ border: '1px solid rgb(255, 0, 0)' });
    });

    it('colorStringToValue 是挂在组件上的静态方法', () => {
        expect(ColorPicker.colorStringToValue('rgba(255, 0, 0, 0.5)')).toMatchObject({ rgba: { r: 255, g: 0, b: 0, a: 0.5 } });
        expect(() => ColorPicker.colorStringToValue('invalid')).toThrow('Semi ColorPicker');
    });

    it('渲染 ColorChooseArea、ColorSlider 与 DataPart', () => {
        renderColorPicker();
        expect(getArea()).toHaveStyle({ width: '280px', height: '280px' });
        expect(getColorSlider()).toHaveClass('colorSliderWrapper');
        expect(getColorSlider()).toHaveStyle({ width: '280px', height: '10px' });
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

    it('三个 handle 的尺寸', () => {
        renderColorPicker({ alpha: true });
        expect(getAreaHandle()).toHaveStyle({ width: '20px', height: '20px' });
        expect(getColorSliderHandle()).toHaveStyle({ width: '18px', height: '18px' });
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

    it('value 变化时 ColorChooseArea 与 ColorSlider 更新', () => {
        const halfColor: ColorValue = {
            hsva: { h: 120, s: 50, v: 50, a: 1 },
            rgba: { r: 64, g: 128, b: 64, a: 1 },
            hex: '#408040',
        };
        const [value, setValue] = createSignal<ColorValue>();
        render(() => <ColorPicker defaultValue={defaultColor} value={value()} />);
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });

        setValue(halfColor);
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(within(getArea()).getAllByRole('slider')[0]).toHaveAttribute('aria-valuetext', saturationBrightness(50, 50));
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
        const slider = mockRect(getAlphaSlider() as HTMLElement);

        fireEvent.pointerDown(getAlphaHandle(), { clientX: 280 });
        onChange.mockClear();
        fireEvent.pointerMove(slider, { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');

        release(slider);
        fireEvent.pointerMove(slider, { clientX: 70 });
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
        for (const surface of [getArea(), getColorSlider(), getAlphaSlider() as HTMLElement]) {
            fireEvent.pointerDown(mockRect(surface), { pointerId: 7, clientX: 10, clientY: 10 });
            expect(capture.mock.contexts.at(-1)).toBe(surface);
            expect(capture.mock.calls.at(-1)).toEqual([7]);
            release(surface);
        }
    });

    it('alpha 变化时 AlphaSlider 与透明度输入框更新', () => {
        const [value, setValue] = createSignal<ColorValue>(defaultColor);
        render(() => <ColorPicker alpha value={value()} />);
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '100%');
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });

        setValue({ ...defaultColor, hsva: { ...defaultColor.hsva, a: 0.5 }, rgba: { ...defaultColor.rgba, a: 0.5 } });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaInput()).toHaveValue('50');
    });

    it('DataPart 渲染输入框与格式选择器', () => {
        renderColorPicker();
        expect(getInput()).not.toBeNull();
        expect(document.querySelector(`.${prefixCls}-formatSelect`)).toBe(getFormatSelect());
    });

    it.each([
        ['hex', '#39c5bb'],
        ['rgba', '57,197,187'],
        ['hsva', '176,71,77'],
    ] as const)('DataPart 以 %s 格式渲染', (format, text) => {
        renderColorPicker({ defaultFormat: format });
        expect(getFormatSelect()).toHaveTextContent(format);
        expect(getInput()).toHaveValue(text);
    });

    it('DataPart 输入合法 hex 时变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('#00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it.each(['abc', 'invalid', '#f00'])('DataPart 输入非法 hex %s 时保留输入、不通知', (text) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput(text);
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue(text);
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
    });

    it('DataPart 输入不带 # 前缀的 hex 时补全', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        changeInput('00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('DataPart 切换格式时更新输入框', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');
        await selectFormat('rgba');
        expect(getFormatSelect()).toHaveTextContent('rgba');
        expect(getInput()).toHaveValue('255,0,0');
        await selectFormat('hsva');
        expect(getFormatSelect()).toHaveTextContent('hsva');
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('alpha 为 true 时 DataPart 渲染透明度输入框', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaInput()).toHaveValue('100');
        expect(document.querySelector(`.${prefixCls}-inputNumberSuffix`)).toHaveTextContent('%');
    });

    it('value 属性更新组件', () => {
        const [value, setValue] = createSignal(defaultColor);
        render(() => <ColorPicker value={value()} />);
        expect(getInput()).toHaveValue('#ff0000');

        setValue(greenColor);
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('受控 value 变回 undefined 时回到 defaultValue，后续调整从 defaultValue 开始并更新界面', () => {
        const onChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal<ColorValue | undefined>(greenColor);
        render(() => <ColorPicker defaultValue={defaultColor} value={value()} onChange={onChange} />);
        expect(getInput()).toHaveValue('#00ff00');

        setValue(undefined);
        expect(getInput()).toHaveValue('#ff0000');
        fireEvent.keyDown(within(getColorSlider()).getByRole('slider'), { key: 'ArrowRight' });
        const { h } = lastColor(onChange).hsva;
        expect(h).toBeGreaterThan(0);
        expect(h).toBeLessThan(10);
        expect(getInput()).toHaveValue(lastColor(onChange).hex);
    });

    it('受控 value 变回 undefined 且没有 defaultValue 时回到组件默认色', () => {
        const [value, setValue] = createSignal<ColorValue | undefined>(greenColor);
        render(() => <ColorPicker value={value()} />);
        setValue(undefined);
        expect(getInput()).toHaveValue('#39c5bb');
    });

    it('父组件挂载时就改了 value，输入框显示新颜色', () => {
        function Demo() {
            const [value, setValue] = createSignal(defaultColor);
            onMount(() => setValue(greenColor));
            return <ColorPicker value={value()} />;
        }
        render(() => <Demo />);
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('父组件挂载时就把受控 value 改回 undefined，回到 defaultValue', () => {
        function Demo() {
            const [value, setValue] = createSignal<ColorValue | undefined>(greenColor);
            onMount(() => setValue(undefined));
            return <ColorPicker defaultValue={defaultColor} value={value()} />;
        }
        render(() => <Demo />);
        expect(getInput()).toHaveValue('#ff0000');
    });

    it.each([
        ['hex', '#00ff00'],
        ['rgba', '0,255,0'],
        ['hsva', '120,100,100'],
    ] as const)('%s 格式的 defaultValue', (defaultFormat, text) => {
        renderColorPicker({ defaultFormat, defaultValue: greenColor });
        expect(getInput()).toHaveValue(text);
    });

    it.each([
        ['hsva', '120,100,100'],
        ['rgba', '0,255,0'],
    ] as const)('%s 格式输入后发出完整颜色', (defaultFormat, text) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, defaultFormat });
        changeInput(text);
        expect(onChange).toHaveBeenCalledWith({ hsva: { h: 120, s: 100, v: 100, a: 1 }, rgba: { r: 0, g: 255, b: 0, a: 1 }, hex: '#00ff00' });
    });

    it('拖动色相改变颜色，选色区背景跟随', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva).toEqual({ h: 180, s: 71, v: 77, a: 1 });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });
        expect(getInput()).toHaveValue(lastColor(onChange).hex);
    });

    it('受控时拖动色相只报告变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, value: defaultColor });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(lastColor(onChange)).toEqual({ hsva: { h: 180, s: 100, v: 100, a: 1 }, rgba: { r: 0, g: 255, b: 255, a: 1 }, hex: '#00ffff' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getInput()).toHaveValue('#ff0000');
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
    });

    it('拖动透明度更新透明度', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getAlphaSlider() as HTMLElement), { clientX: 140 });
        expect(lastColor(onChange)).toEqual({ rgba: { r: 255, g: 0, b: 0, a: 0.5 }, hsva: { h: 0, s: 100, v: 100, a: 0.5 }, hex: '#ff000080' });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaInput()).toHaveValue('50');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
    });

    it('受控时拖动透明度只报告变化', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, value: defaultColor });
        fireEvent.pointerDown(mockRect(getAlphaSlider() as HTMLElement), { clientX: 140 });
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaInput()).toHaveValue('100');
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });
    });

    it('选色区受控时 handle 始终对应 value', () => {
        const onChange = vi.fn<OnChange>();
        const [value, setValue] = createSignal(defaultColor);
        render(() => <ColorPicker value={value()} onChange={onChange} />);
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        release(getArea());
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(onChange).toHaveBeenCalledTimes(1);

        setValue({ ...defaultColor, hsva: { ...defaultColor.hsva } });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        setValue(greenColor);
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
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
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        fireEvent.pointerMove(getArea(), { clientX: 500, clientY: 500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 100, v: 0 });
        fireEvent.pointerMove(getArea(), { clientX: -500, clientY: -500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 0, v: 100 });
        release(getArea());
    });

    it('改变 width 与 height 后三个 handle 重新对应颜色', () => {
        const color: ColorValue = {
            hsva: { h: 180, s: 50, v: 100, a: 0.5 },
            rgba: { r: 128, g: 255, b: 255, a: 0.5 },
            hex: '#80ffff80',
        };
        const [size, setSize] = createSignal({ width: 280, height: 280 });
        render(() => <ColorPicker value={color} width={size().width} height={size().height} />);
        setSize({ width: 200, height: 100 });
        expect(getAreaHandle()).toHaveStyle({ left: '90px', top: '-10px' });
        expect(getColorSliderHandle()).toHaveStyle({ left: '91px' });
        expect(getAlphaHandle()).toHaveStyle({ left: '91px' });
    });

    it('非主键按下不取色也不开始拖动', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100, button: 2 });
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 100, button: 2 });
        fireEvent.pointerDown(mockRect(getAlphaSlider() as HTMLElement), { clientX: 100, button: 2 });
        expect(onChange).not.toHaveBeenCalled();
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it.each([
        ['透明度', () => getAlphaSlider() as HTMLElement, getAlphaHandle, (color: ColorValue) => color.rgba.a, [1, 0]],
        ['色相', getColorSlider, getColorSliderHandle, (color: ColorValue) => color.hsva.h, [360, 0]],
    ] as const)('%s滑块拖出任一端时，handle 保持在该端', (_name, getSlider, getHandle, read, [end, start]) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        const slider = mockRect(getSlider());
        fireEvent.pointerDown(getHandle(), { clientX: 140 });
        fireEvent.pointerMove(slider, { clientX: 500 });
        fireEvent.pointerMove(slider, { clientX: 600 });
        expect(read(lastColor(onChange))).toBe(end);
        expect(getHandle()).toHaveStyle({ left: '271px' });
        fireEvent.pointerMove(slider, { clientX: -50 });
        fireEvent.pointerMove(slider, { clientX: -100 });
        expect(read(lastColor(onChange))).toBe(start);
        expect(getHandle()).toHaveStyle({ left: '-9px' });
        release(slider);
    });

    it('rgba 输入非法或越界值时不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor, onChange });
        changeInput('invalid');
        expect(getInput()).toHaveValue('invalid');
        changeInput('abc,def,ghi');
        changeInput('300,0,0');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hsva 输入越界色相时不触发 onChange', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        changeInput('400,100,100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        ['rgba', '128,255,0', { rgba: { r: 128, g: 255, b: 0, a: 1 } }],
        ['rgba', '128,255,0,0.5', { rgba: { r: 128, g: 255, b: 0, a: 0.5 } }],
        ['hsva', ' 120 , 100 , 100 ', { hsva: { h: 120, s: 100, v: 100, a: 1 } }],
        ['hsva', '120,100,100,0.5', { hsva: { h: 120, s: 100, v: 100, a: 0.5 } }],
        ['hex', 'ff0000', { hex: '#ff0000' }],
        ['hex', '#ff000080', { hex: '#ff000080' }],
    ] as const)('%s 格式解析 %s', (defaultFormat, text, expected) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ defaultFormat, defaultValue: greenColor, onChange });
        changeInput(text);
        expect(lastColor(onChange)).toMatchObject(expected);
    });

    it('任意文本只更新输入框', () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange });
        changeInput('test');
        expect(getInput()).toHaveValue('test');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('EyeDropper 不可用时点击滴管不通知', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ eyeDropper: true, onChange });
        expect(window.EyeDropper).toBeUndefined();
        await userEvent.click(getEyeDropperButton());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('点击 eyeDropper 按钮取色', async () => {
        const onChange = vi.fn<OnChange>();
        const open = vi.fn<() => Promise<{ sRGBHex: string }>>(async () => ({ sRGBHex: '#00ff00' }));
        window.EyeDropper = class {
            open = open;
        };
        renderColorPicker({ eyeDropper: true, onChange });
        await userEvent.click(getEyeDropperButton());
        expect(open).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getInput()).toHaveValue('#00ff00'));
        expect(lastColor(onChange).hex).toBe('#00ff00');
    });

    it('用户取消取色（AbortError）时不报错也不通知', async () => {
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

    it.each([
        ['rgba', { rgba: { r: 255, g: 0, b: 0, a: 0.5 } }],
        ['hex', { hex: '#ff000080' }],
        ['hsva', { hsva: { h: 0, s: 100, v: 100, a: 0.5 } }],
    ] as const)('%s 模式下改透明度输入框', (defaultFormat, expected) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat, onChange, defaultValue: defaultColor });
        changeAlphaInput('50');
        expect(lastColor(onChange)).toMatchObject(expected);
    });

    it.each(['rgba', 'hex', 'hsva'])('切换到 %s 格式后改透明度输入框', async (format) => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ alpha: true, defaultFormat: format === 'hex' ? 'rgba' : 'hex', onChange, defaultValue: defaultColor });
        await selectFormat(format);
        changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 100, v: 100, a: 0.5 });
    });

    it('非受控时输入更新示例块与选色区，受控时不更新', () => {
        const uncontrolled = renderColorPicker({ defaultValue: defaultColor });
        changeInput('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        uncontrolled.unmount();

        const onChange = vi.fn<OnChange>();
        renderColorPicker({ onChange, value: defaultColor });
        changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    describe('逐字输入透明度', () => {
        const typeAlpha = async (defaultFormat: ColorFormat, typed: string) => {
            renderColorPicker({ alpha: true, defaultFormat, defaultValue: defaultColor });
            const alphaInput = getAlphaInput() as HTMLInputElement;
            await userEvent.clear(alphaInput);
            await userEvent.type(alphaInput, typed);
            expect(getAlphaRange()).toHaveAttribute('aria-valuetext', `${typed}%`);
        };

        it('rgba 模式下示例块跟随透明度', async () => {
            await typeAlpha('rgba', '50');
            expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgba(255, 0, 0, 0.5)' });
        });

        it('hex 模式下颜色输入框仍显示 6 位 hex', async () => {
            await typeAlpha('hex', '50');
            expect(getInput()).toHaveValue('#ff0000');
        });

        it('hsva 模式下透明度 handle 跟随', async () => {
            await typeAlpha('hsva', '80');
            expect(getAlphaHandle()).toHaveStyle({ left: `${0.8 * 280 - 9}px` });
        });
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
        const dataPart = container.querySelector(`.${prefixCls}-dataPart`) as HTMLElement;
        expect(dataPart.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
        expect(dataPart.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
        expect(dataPart.querySelectorAll(`.${BASE_CLASS_PREFIX}-input-suffix`)).toHaveLength(1);
    });

    it('受控 value 在各格式下经 onChange 往返一致', async () => {
        const changes: ColorValue[] = [];
        const [value, setValue] = createSignal(defaultColor);
        render(() => (
            <ColorPicker
                value={value()}
                onChange={(next) => {
                    changes.push(next);
                    setValue(next);
                }}
            />
        ));
        fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        release(getColorSlider());
        expect(changes.at(-1)).toEqual({ hsva: { h: 180, s: 100, v: 100, a: 1 }, rgba: { r: 0, g: 255, b: 255, a: 1 }, hex: '#00ffff' });
        expect(getInput()).toHaveValue('#00ffff');
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });

        await selectFormat('rgba');
        changeInput('0,0,255');
        expect(changes.at(-1)).toEqual({ rgba: { r: 0, g: 0, b: 255, a: 1 }, hsva: { h: 240, s: 100, v: 100, a: 1 }, hex: '#0000ff' });
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });

        await selectFormat('hsva');
        expect(getInput()).toHaveValue('240,100,100');
        changeInput('120,100,100');
        expect(changes.at(-1)?.hex).toBe('#00ff00');
        expect(getColorSliderHandle()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('换掉 onChange 后拖动调用新的 onChange', () => {
        const first = vi.fn<OnChange>();
        const second = vi.fn<OnChange>();
        const [onChange, setOnChange] = createSignal(first);
        render(() => <ColorPicker alpha defaultValue={defaultColor} onChange={onChange()} />);
        const slider = mockRect(getAlphaSlider() as HTMLElement);
        fireEvent.pointerDown(slider, { clientX: 280 });
        setOnChange(() => second);
        fireEvent.pointerMove(slider, { clientX: 140 });
        expect(second).toHaveBeenCalledTimes(1);
        expect(lastColor(second).rgba.a).toBe(0.5);
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('受控 value 相等时不覆盖正在输入的内容', () => {
        const [value, setValue] = createSignal(defaultColor);
        render(() => <ColorPicker value={value()} />);
        changeInput('ff00');
        setValue({ ...defaultColor, rgba: { ...defaultColor.rgba } });
        expect(getInput()).toHaveValue('ff00');
        setValue(greenColor);
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('Popover 内的取色器会改变默认触发色块', async () => {
        const onChange = vi.fn<OnChange>();
        renderColorPicker({ usePopover: true, onChange, defaultValue: defaultColor, popoverProps: { trigger: 'click' } });
        const trigger = document.querySelector(`.${prefixCls}-popover-defaultChildren`) as HTMLElement;
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        await userEvent.click(trigger);
        await waitFor(() => expect(getPicker()).not.toBeNull());
        changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('未知属性传到根元素，ref 指向根元素', () => {
        let ref: HTMLDivElement | undefined;
        render(() => <ColorPicker ref={(node) => (ref = node)} data-testid="picker" aria-describedby="hint" />);
        expect(getPicker()).toHaveAttribute('data-testid', 'picker');
        expect(getPicker()).toHaveAttribute('aria-describedby', 'hint');
        expect(ref).toBe(getPicker());
    });

    it('不把 tabIndex 落在根元素上，Tooltip 包裹时不多出 Tab 停靠点', () => {
        renderColorPicker({ tabIndex: 0 });
        expect(getPicker()).not.toHaveAttribute('tabindex');
    });

    it.each([
        ['area', getArea],
        ['color slider', getColorSlider],
        ['alpha slider', () => getAlphaSlider() as HTMLElement],
    ])('在 %s 上拖动中途卸载后，停止后续变化', (_name, getTarget) => {
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
