/** @jsxImportSource vue */
import { createSSRApp, defineComponent, KeepAlive, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { render } from '@test/utils/vue';
import ColorPicker from '..';
import type * as ColorPickerModule from '..';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import DeepRef from './fixtures/deep-ref.vue';
import Model from './fixtures/model.vue';
import SlotsFixture from './fixtures/slots.vue';

type ColorValue = ColorPickerModule.ColorValue;
type Props = Record<string, unknown>;
type Slots = Record<string, () => unknown>;

describe('ColorPicker 公开类型', () => {
    it('导出 Props 用到的颜色类型与组件自身的类型', () => {
        expectTypeOf<ColorPickerModule.HsvaColor>().toHaveProperty('h');
        expectTypeOf<ColorPickerModule.RgbaColor>().toHaveProperty('r');
        expectTypeOf<ColorPickerModule.ColorFormat>().toEqualTypeOf<'hex' | 'rgba' | 'hsva'>();
        expectTypeOf<ColorPickerModule.ColorValue>().toHaveProperty('hex');
        expectTypeOf<ColorPickerModule.ColorPickerProps>().toHaveProperty('modelValue');
        expectTypeOf<ColorPickerModule.ColorPickerEmits>().toHaveProperty('update:modelValue');
        expectTypeOf<ColorPickerModule.ColorPickerSlots>().toHaveProperty('topSlot');
        expectTypeOf<ColorPickerModule.ColorPickerHandle>().toHaveProperty('root');
        expectTypeOf<ColorPickerModule.ColorPickerPopoverProps>().toHaveProperty('onVisibleChange');
    });
});

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;
const text = en_US.ColorPicker;

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
const greyColor: ColorValue = {
    hsva: { h: 200, s: 0, v: 50, a: 1 },
    rgba: { r: 128, g: 128, b: 128, a: 1 },
    hex: '#808080',
};

const saturationBrightness = (s: number, v: number) => text.saturationBrightness.replace('${saturation}', String(s)).replace('${brightness}', String(v));

// the popup content mounts a few ticks after the popover opens
const settle = () => new Promise((resolve) => setTimeout(resolve));

// Every render uses a non-Chinese locale, so a hard-coded Chinese name cannot pass
function renderColorPicker(props: Props = {}, slots: Slots = {}) {
    const Host = (attrs: Props) => <ConfigProvider locale={en_US}>{() => <ColorPicker {...attrs}>{slots as never}</ColorPicker>}</ConfigProvider>;
    return render(Host, { props });
}

const query = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector);
function need<T extends HTMLElement>(el: T | null) {
    if (!el) throw new Error('missing element');
    return el;
}
const getPicker = () => query(`.${prefixCls}`);
const getArea = () => need(query(`.${prefixCls}-colorChooseArea`));
const getAreaHandle = () => need(query(`.${prefixCls}-colorChooseArea .${prefixCls}-handle`));
const getColorSlider = () => need(query(`.${prefixCls}-colorSlider`));
const getColorSliderHandle = () => need(query(`.${prefixCls}-colorSlider .${prefixCls}-handle`));
const getAlphaSlider = () => need(query(`.${prefixCls}-alphaSlider`));
const getAlphaRange = () => within(getAlphaSlider()).getByRole('slider');
const getAlphaHandle = () => need(query(`.${prefixCls}-alphaHandle`));
const getInput = () => need(query<HTMLInputElement>(`.${prefixCls}-colorPickerInput input`));
const getAlphaInput = () => need(query<HTMLInputElement>(`.${prefixCls}-colorPickerInputNumber input`));
const getDemoBlock = () => need(query(`.${prefixCls}-colorDemoBlock`));
const getEyeDropperButton = () => screen.getByRole('button', { name: text.eyeDropper });
const getFormatSelect = () => screen.getByRole('combobox');
const getDefaultTrigger = () => need(query(`.${prefixCls}-popover-defaultChildren`));
function lastColor(onChange: { mock: { calls: ColorValue[][] } }) {
    const last = onChange.mock.calls.at(-1)?.[0];
    if (!last) throw new Error('onChange was not called');
    return last;
}

const changeInput = (value: string) => fireEvent.update(getInput(), value);
const changeAlphaInput = (value: string) => fireEvent.update(getAlphaInput(), value);

// the setup rect mock has no x/y, which the pickers subtract from clientX/clientY
function mockRect(el: HTMLElement) {
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
        toJSON: () => ({}),
    });
    return el;
}

// a browser sends a captured pointer's release, then lostpointercapture, to the capturing element
async function release(el: HTMLElement) {
    await fireEvent.pointerUp(el);
    await fireEvent.lostPointerCapture(el);
}

async function selectFormat(format: string) {
    await userEvent.click(getFormatSelect());
    const options = await screen.findAllByRole('option');
    const option = options.find((candidate) => candidate.textContent === format);
    if (!option) throw new Error(`no format option ${format}`);
    await userEvent.click(option);
}

function globalWith(overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) {
    const semi = new SemiGlobal();
    semi.config.overrideDefaultProps = overrideDefaultProps;
    return { provide: { [semiGlobalKey]: semi } };
}

const onChangeMock = () => vi.fn<(value: ColorValue) => void>();

afterEach(() => {
    delete window.EyeDropper;
    semiGlobal.config.overrideDefaultProps = {};
});

describe('ColorPicker 审计修复', () => {
    it('rgba 格式逐字输入透明度分量时输入框不被回写', async () => {
        const onChange = onChangeMock();
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
        ])('%s 格式输入 %s 后透明度仍为 0.5', async (defaultFormat, value) => {
            const onChange = onChangeMock();
            renderColorPicker({ alpha: true, defaultFormat: defaultFormat as 'rgba', defaultValue: translucent, onChange });
            await changeInput(value);
            expect(lastColor(onChange).rgba.g).toBe(255);
            // hex stores opacity in 8 bits, so 0.5 comes back as 128/255
            expect(lastColor(onChange).rgba.a).toBeCloseTo(0.5, 2);
        });

        it('输入框显式写出透明度时以输入为准', async () => {
            const onChange = onChangeMock();
            renderColorPicker({ alpha: true, defaultFormat: 'rgba', defaultValue: translucent, onChange });
            await changeInput('0,255,0,1');
            expect(lastColor(onChange).rgba.a).toBe(1);
        });

        it('滴管取色后透明度仍为 0.5', async () => {
            const onChange = onChangeMock();
            window.EyeDropper = class {
                async open() {
                    return { sRGBHex: '#00ff00' };
                }
            };
            renderColorPicker({ alpha: true, eyeDropper: true, defaultValue: translucent, onChange });
            await userEvent.click(getEyeDropperButton());
            await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
            expect(lastColor(onChange).rgba).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
        });
    });

    it('hex 格式逐字输入 8 位时输入框不被回写', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor, onChange });
        await userEvent.clear(getInput());
        await userEvent.type(getInput(), '#ff000080');
        expect(getInput()).toHaveValue('#ff000080');
        expect(lastColor(onChange).hex).toBe('#ff000080');
    });

    it.each(['#gggggg', '#1234567', '#ff0000ff00', 'zz#ff0000'])('hex 格式输入非法的 %s 时不触发 change', async (value) => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor, onChange });
        await changeInput(value);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('alpha 为 false 时文本框输入的透明度被忽略', async () => {
        const onChange = onChangeMock();
        const first = renderColorPicker({ alpha: false, defaultFormat: 'hex', onChange });
        await changeInput('#ff000080');
        expect(lastColor(onChange)).toMatchObject({ hex: '#ff0000', rgba: { a: 1 }, hsva: { a: 1 } });
        first.unmount();

        renderColorPicker({ alpha: false, defaultFormat: 'rgba', onChange });
        await changeInput('255,0,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('rgba 输入小数通道时发出合法的 hex', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        await changeInput('12.5,0,0');
        expect(lastColor(onChange).hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(ColorPicker.colorStringToValue('rgb(50%,0%,0%)').hex).toMatch(/^#[0-9a-f]{6}$/);
    });

    it.each(['hex', 'rgba'])('%s 格式改透明度输入框时保留色相', async (format) => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: format, defaultValue: greyColor, onChange });
        await changeAlphaInput('50');
        expect(lastColor(onChange).hsva).toEqual({ h: 200, s: 0, v: 50, a: 0.5 });
    });

    it('默认触发器是有名称的按钮，弹层为有名称的 dialog', async () => {
        renderColorPicker({ usePopover: true });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog', { name: text.color });
        expect(dialog).toContainElement(getPicker());
    });

    it('自定义触发器的弹层也是 dialog', async () => {
        renderColorPicker({ usePopover: true }, { default: () => <button type="button">pick</button> });
        await userEvent.click(screen.getByRole('button', { name: 'pick' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('usePopover 默认点击打开，悬停不打开', async () => {
        renderColorPicker({ usePopover: true });
        const trigger = screen.getByRole('button', { name: text.color });
        await userEvent.hover(trigger);
        // nothing is expected to happen, so only a fixed wait can show it: longer than the default hover delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(screen.queryByRole('dialog')).toBeNull();
        await userEvent.click(trigger);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('popoverProps.trigger 为 hover 时仍可悬停打开', async () => {
        renderColorPicker({ usePopover: true, popoverProps: { trigger: 'hover' } });
        await userEvent.hover(screen.getByRole('button', { name: text.color }));
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

    it('受控模式，使用 modelValue 属性', () => {
        renderColorPicker({ modelValue: greenColor });
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('change 与 update:modelValue 各发一次，载荷相同', async () => {
        const onChange = onChangeMock();
        const onUpdate = onChangeMock();
        renderColorPicker({ onChange, 'onUpdate:modelValue': onUpdate });
        expect(onChange).not.toHaveBeenCalled();

        await changeInput('#00ff00');
        const expected = {
            hex: '#00ff00',
            rgba: { r: 0, g: 255, b: 0, a: 1 },
            hsva: { h: 120, s: 100, v: 100, a: 1 },
        };
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expected);
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith(expected);
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
        expect(query(`.${prefixCls}-alphaSlider`)).toBeNull();
    });

    it('使用自定义宽高渲染', () => {
        renderColorPicker({ width: 300, height: 200, alpha: true });
        expect(getArea().style.width).toBe('300px');
        expect(getArea().style.height).toBe('200px');
        expect(getColorSlider().style.width).toBe('300px');
        expect(getAlphaSlider().style.width).toBe('300px');
        expect(need(query(`.${prefixCls}-dataPart`)).style.width).toBe('300px');
    });

    it('eyeDropper 禁用时不渲染滴管按钮', () => {
        renderColorPicker({ eyeDropper: false });
        expect(screen.queryByRole('button', { name: text.eyeDropper })).toBeNull();
    });

    it('eyeDropper 启用时渲染滴管按钮', () => {
        renderColorPicker({ eyeDropper: true });
        expect(getEyeDropperButton().querySelector(`.${BASE_CLASS_PREFIX}-icon-eyedropper`)).not.toBeNull();
    });

    it('使用 topSlot 渲染', () => {
        renderColorPicker({}, { topSlot: () => <div class="top-slot">Top Content</div> });
        expect(screen.getByText('Top Content')).toHaveClass('top-slot');
        expect(getPicker()?.firstElementChild).toBe(screen.getByText('Top Content'));
    });

    it('使用 bottomSlot 渲染', () => {
        renderColorPicker({}, { bottomSlot: () => <div class="bottom-slot">Bottom Content</div> });
        expect(screen.getByText('Bottom Content')).toHaveClass('bottom-slot');
        expect(getPicker()?.lastElementChild).toBe(screen.getByText('Bottom Content'));
    });

    it('没有提供 topSlot 与 bottomSlot 时 picker 以取色区开头、以数据区结尾', () => {
        renderColorPicker();
        expect(getPicker()?.firstElementChild).toBe(getArea());
        expect(getPicker()?.lastElementChild).toBe(need(query(`.${prefixCls}-dataPart`)));
    });

    it('使用 usePopover 渲染', () => {
        renderColorPicker({ usePopover: true });
        expect(getDefaultTrigger()).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
        expect(getPicker()).toBeNull();
    });

    it('使用 popoverProps 渲染', async () => {
        renderColorPicker({
            usePopover: true,
            popoverProps: { position: 'bottom', trigger: 'click', class: 'custom-popover' },
        });
        expect(getPicker()).toBeNull();

        await userEvent.click(getDefaultTrigger());
        await waitFor(() => expect(getPicker()).not.toBeNull());
        const popover = need(query(`.${prefixCls}-popover`));
        expect(popover).toHaveClass('custom-popover');
        expect(popover.className.split(' ').filter((name) => name === 'custom-popover')).toHaveLength(1);
        expect(popover.className.split(' ').filter((name) => name === `${prefixCls}-popover`)).toHaveLength(1);
    });

    it('usePopover 为 false 时渲染', () => {
        const { container } = renderColorPicker({ usePopover: false });
        expect(container.firstElementChild).toBe(getPicker());
        expect(query(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('Popover 模式下渲染默认插槽', () => {
        renderColorPicker(
            { usePopover: true },
            {
                default: () => (
                    <button class="custom-trigger" type="button">
                        Pick Color
                    </button>
                ),
            }
        );
        expect(screen.getByRole('button', { name: 'Pick Color' })).toHaveClass('custom-trigger');
        expect(query(`.${prefixCls}-popover-defaultChildren`)).toBeNull();
    });

    it('渲染自定义 style', () => {
        renderColorPicker({ style: { border: '1px solid red' } });
        // jsdom computes the color as rgb()
        expect(getPicker()).toHaveStyle({ border: '1px solid rgb(255, 0, 0)' });
    });

    it('同时使用 topSlot 与 bottomSlot 渲染', () => {
        renderColorPicker({}, { topSlot: () => <div>Top</div>, bottomSlot: () => <div>Bottom</div> });
        expect(getPicker()?.firstElementChild).toBe(screen.getByText('Top'));
        expect(getPicker()?.lastElementChild).toBe(screen.getByText('Bottom'));
    });

    it('colorStringToValue 作为静态方法挂在组件上', () => {
        const result = ColorPicker.colorStringToValue('#ff0000');
        expect(result.hex).toEqual('#ff0000');
        expect(result.rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('colorStringToValue 对非法输入抛出错误', () => {
        expect(() => ColorPicker.colorStringToValue('invalid')).toThrow('Semi ColorPicker');
        for (const raw of ['rgb(abc)', 'rgb(300,0,0)', 'hsv(abc)', 'hsva(0,50%,50%,1.5)']) {
            expect(() => ColorPicker.colorStringToValue(raw)).toThrow('Semi ColorPicker');
        }
    });

    it('渲染 ColorChooseArea', () => {
        renderColorPicker();
        expect(getArea().style.width).toBe('280px');
        expect(getArea().style.height).toBe('280px');
    });

    it('渲染 ColorSlider', () => {
        renderColorPicker();
        expect(getColorSlider()).toHaveClass('colorSliderWrapper');
        expect(getColorSlider().style.width).toBe('280px');
        expect(getColorSlider().style.height).toBe('10px');
    });

    it('渲染 DataPart', () => {
        renderColorPicker();
        expect(query(`.${prefixCls}-dataPart`)).not.toBeNull();
    });

    it('ColorChooseArea 滑块展示饱和度与明度', () => {
        renderColorPicker({ defaultValue: defaultColor });
        const sliders = within(getArea()).getAllByRole('slider');
        expect(sliders).toHaveLength(2);
        sliders.forEach((slider) => expect(slider).toHaveAttribute('aria-valuetext', saturationBrightness(100, 100)));
    });

    it('为格式选择器提供名称', () => {
        renderColorPicker();
        expect(getFormatSelect()).toHaveAccessibleName(text.format);
    });

    it('AlphaSlider 的 aria-valuetext 显示百分比', () => {
        renderColorPicker({ alpha: true });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '100%');
    });

    it('三个 handle 存在且尺寸为 20、18、18', () => {
        renderColorPicker({ alpha: true });
        expect([getAreaHandle(), getColorSliderHandle(), getAlphaHandle()].map((el) => el.style.width)).toEqual(['20px', '18px', '18px']);
        expect([getAreaHandle(), getColorSliderHandle(), getAlphaHandle()].map((el) => el.style.height)).toEqual(['20px', '18px', '18px']);
    });

    it('ColorChooseArea 的 pointerDown 触发 grabbing 状态', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });

        await fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 36, v: 64, a: 1 });
        expect(parseFloat(getAreaHandle().style.left)).toBeCloseTo(0.36 * 280 - 10);
        expect(parseFloat(getAreaHandle().style.top)).toBeCloseTo(0.36 * 280 - 10);

        await release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('ColorChooseArea handle 的 pointerDown 冒泡到根元素并触发 grabbing', async () => {
        renderColorPicker({ defaultValue: defaultColor });
        mockRect(getArea());
        await fireEvent.pointerDown(getAreaHandle(), { clientX: 50, clientY: 50 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });

        await release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('hsva 变化时 ColorChooseArea 更新', async () => {
        const halfColor: ColorValue = {
            hsva: { h: 120, s: 50, v: 50, a: 1 },
            rgba: { r: 64, g: 128, b: 64, a: 1 },
            hex: '#408040',
        };
        const view = renderColorPicker({ defaultValue: defaultColor });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });

        await view.rerender({ modelValue: halfColor });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(within(getArea()).getAllByRole('slider')[0]).toHaveAttribute('aria-valuetext', saturationBrightness(50, 50));
    });

    it('hue 变化时 ColorSlider 更新', async () => {
        const view = renderColorPicker({ defaultValue: defaultColor });
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });

        await view.rerender({ modelValue: greenColor });
        expect(parseFloat(getColorSliderHandle().style.left)).toBeCloseTo((120 / 360) * 280 - 9);
        expect(getColorSliderHandle()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('按住指针拖动时 ColorSlider 调整色相，松开后停止', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getColorSlider());

        await fireEvent.pointerDown(getColorSliderHandle(), { clientX: 0 });
        onChange.mockClear();
        await fireEvent.pointerMove(getColorSlider(), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva.h).toBe(180);
        expect(getColorSliderHandle()).toHaveStyle({ left: '131px' });

        await release(getColorSlider());
        await fireEvent.pointerMove(getColorSlider(), { clientX: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按住指针拖动时 AlphaSlider 调整透明度，松开后停止', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        mockRect(getAlphaSlider());

        await fireEvent.pointerDown(getAlphaHandle(), { clientX: 280 });
        onChange.mockClear();
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');

        await release(getAlphaSlider());
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按住指针拖动时 ColorChooseArea 调整颜色，松开后停止', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());

        await fireEvent.pointerDown(getAreaHandle(), { clientX: 280, clientY: 0 });
        expect(getArea()).toHaveStyle({ cursor: 'grabbing' });
        onChange.mockClear();
        await fireEvent.pointerMove(getArea(), { clientX: 140, clientY: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);

        await release(getArea());
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
        await fireEvent.pointerMove(getArea(), { clientX: 70, clientY: 70 });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('按下时在拖拽区域捕获指针', async () => {
        const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
        renderColorPicker({ alpha: true, defaultValue: defaultColor });
        for (const surface of [getArea(), getColorSlider(), getAlphaSlider()]) {
            await fireEvent.pointerDown(mockRect(surface), { pointerId: 7, clientX: 10, clientY: 10 });
            expect(capture.mock.contexts.at(-1)).toBe(surface);
            expect(capture.mock.calls.at(-1)).toEqual([7]);
            await release(surface);
        }
    });

    it('alpha 变化时 AlphaSlider 更新', async () => {
        const view = renderColorPicker({
            alpha: true,
            modelValue: { ...defaultColor, hsva: { ...defaultColor.hsva, a: 1 } },
        });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '100%');
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });

        await view.rerender({
            modelValue: {
                ...defaultColor,
                hsva: { ...defaultColor.hsva, a: 0.5 },
                rgba: { ...defaultColor.rgba, a: 0.5 },
            },
        });
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
        expect(getAlphaInput()).toHaveValue('50');
    });

    it('DataPart 渲染输入框与格式选择器', () => {
        renderColorPicker();
        expect(getInput()).not.toBeNull();
        expect(query(`.${prefixCls}-formatSelect`)).toBe(getFormatSelect());
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

    it('DataPart 输入合法 hex 时变化', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        await changeInput('#00ff00');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('DataPart 输入非法 hex 时不变化', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        await changeInput('abc');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('abc');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(57, 197, 187)' });
    });

    it('DataPart 输入不带 # 前缀的 hex 时变化', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        await changeInput('00ff00');
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
        expect(need(query(`.${prefixCls}-inputNumberSuffix`))).toHaveTextContent('%');
    });

    it('alpha 为 false 时 DataPart 不渲染透明度输入框', () => {
        renderColorPicker({ alpha: false });
        expect(query(`.${prefixCls}-colorPickerInputNumber`)).toBeNull();
    });

    it('modelValue 更新组件', async () => {
        const view = renderColorPicker({ modelValue: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');

        await view.rerender({ modelValue: greenColor });
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('受控 modelValue 变回 undefined 时回到 defaultValue', async () => {
        const view = renderColorPicker({ defaultValue: defaultColor, modelValue: greenColor });
        expect(getInput()).toHaveValue('#00ff00');

        await view.rerender({ modelValue: undefined });
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('受控 modelValue 变回 undefined 后，后续调整从 defaultValue 开始并更新界面', async () => {
        const onChange = onChangeMock();
        const view = renderColorPicker({ defaultValue: defaultColor, modelValue: greenColor });

        await view.rerender({ modelValue: undefined, onChange });
        await fireEvent.keyDown(within(getColorSlider()).getByRole('slider'), { key: 'ArrowRight' });

        const { h: hue } = lastColor(onChange).hsva;
        expect(hue).toBeGreaterThan(0);
        expect(hue).toBeLessThan(10);
        expect(getInput()).toHaveValue(lastColor(onChange).hex);
    });

    it('受控 modelValue 变回 undefined 且没有 defaultValue 时回到组件默认色', async () => {
        const view = renderColorPicker({ modelValue: greenColor });

        await view.rerender({ modelValue: undefined });
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

    it('hsva 格式的文本框输入产生完整的颜色', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultFormat: 'hsva' });
        await changeInput('120,100,100');
        expect(onChange).toHaveBeenCalledWith(greenColor);
    });

    it('rgba 格式的文本框输入产生完整的颜色', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultFormat: 'rgba' });
        await changeInput('0,255,0');
        expect(onChange).toHaveBeenCalledWith(greenColor);
    });

    it('色相条按下时更新色相', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva).toEqual({ h: 180, s: 71, v: 77, a: 1 });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });
    });

    it('色相条按下时受控 modelValue 不变，change 报告新颜色', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(lastColor(onChange)).toEqual({
            hsva: { h: 180, s: 100, v: 100, a: 1 },
            rgba: { r: 0, g: 255, b: 255, a: 1 },
            hex: '#00ffff',
        });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('透明度条按下时更新透明度', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 140 });
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
        expect(lastColor(onChange).hsva.a).toBe(0.5);
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getAlphaInput()).toHaveValue('50');
        expect(lastColor(onChange).hex).toBe('#ff000080');
        expect(getAlphaHandle()).toHaveStyle({ left: '131px' });
    });

    it('透明度条按下时受控 modelValue 不变', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, alpha: true, modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 140 });
        expect(lastColor(onChange).rgba.a).toBe(0.5);
        expect(getAlphaInput()).toHaveValue('100');
    });

    // controlled and not written back, so the handle stays where the value puts it
    it('选色区受控时 handle 始终对应 modelValue', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['X 超出右边界', { clientX: 300, clientY: 100 }, { s: 100, v: 64 }],
        ['Y 超出下边界', { clientX: 100, clientY: 300 }, { s: 36, v: 0 }],
        ['X 为负值', { clientX: -1, clientY: 100 }, { s: 0, v: 64 }],
        ['Y 为负值', { clientX: 100, clientY: -1 }, { s: 36, v: 100 }],
    ])('选色区按下位置%s时取边界上的颜色', async (_name, point, expected) => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getArea()), point);
        expect(lastColor(onChange).hsva).toMatchObject(expected);
    });

    it('选色区拖到区域外时颜色贴到角落', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());
        await fireEvent.pointerDown(getAreaHandle(), { clientX: 140, clientY: 140 });
        await fireEvent.pointerMove(getArea(), { clientX: 500, clientY: 500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 100, v: 0 });
        await fireEvent.pointerMove(getArea(), { clientX: -500, clientY: -500 });
        expect(lastColor(onChange).hsva).toMatchObject({ s: 0, v: 100 });
        await release(getArea());
    });

    it('改变 width 与 height 后三个 handle 重新对应颜色', async () => {
        const color: ColorValue = {
            hsva: { h: 180, s: 50, v: 100, a: 0.5 },
            rgba: { r: 128, g: 255, b: 255, a: 0.5 },
            hex: '#80ffff80',
        };
        const view = renderColorPicker({ modelValue: color, width: 280, height: 280 });
        await view.rerender({ height: 100, width: 200 });
        // x = s * width - 10, y = (1 - v) * height - 10
        expect(getAreaHandle()).toHaveStyle({ left: '90px', top: '-10px' });
        expect(getColorSliderHandle()).toHaveStyle({ left: '91px' });
        expect(getAlphaHandle()).toHaveStyle({ left: '91px' });
    });

    it('非主键按下不取色也不开始拖动', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, alpha: true, defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100, button: 2 });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 100, button: 2 });
        await fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 100, button: 2 });
        expect(onChange).not.toHaveBeenCalled();
        expect(getArea()).toHaveStyle({ cursor: 'pointer' });
    });

    it('透明度滑块受控时 handle 始终对应 modelValue', async () => {
        renderColorPicker({ alpha: true, modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getAlphaSlider()), { clientX: 100 });
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });
    });

    it('透明度滑块拖出任一端时，handle 保持在该端', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        mockRect(getAlphaSlider());
        await fireEvent.pointerDown(getAlphaHandle(), { clientX: 140 });
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: 500 });
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: 600 });
        expect(lastColor(onChange).rgba.a).toBe(1);
        expect(getAlphaHandle()).toHaveStyle({ left: '271px' });
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: -50 });
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: -100 });
        expect(lastColor(onChange).rgba.a).toBe(0);
        expect(getAlphaHandle()).toHaveStyle({ left: '-9px' });
        await release(getAlphaSlider());
    });

    it('色相滑块受控时 handle 始终对应 modelValue', async () => {
        renderColorPicker({ modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 100 });
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
    });

    it('色相滑块拖出任一端时，handle 保持在该端', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getColorSlider());
        await fireEvent.pointerDown(getColorSliderHandle(), { clientX: 140 });
        await fireEvent.pointerMove(getColorSlider(), { clientX: 500 });
        await fireEvent.pointerMove(getColorSlider(), { clientX: 600 });
        expect(lastColor(onChange).hsva.h).toBe(360);
        expect(getColorSliderHandle()).toHaveStyle({ left: '271px' });
        await fireEvent.pointerMove(getColorSlider(), { clientX: -50 });
        await fireEvent.pointerMove(getColorSlider(), { clientX: -100 });
        expect(lastColor(onChange).hsva.h).toBe(0);
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
        await release(getColorSlider());
    });

    it('受控时显示 modelValue 而不是 defaultValue', () => {
        renderColorPicker({ modelValue: greenColor, defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('rgba 格式的文本框内容', () => {
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('255,0,0');
    });

    it('hsva 格式的文本框内容', () => {
        renderColorPicker({ defaultFormat: 'hsva', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('hex 格式的文本框不显示透明度', () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: { ...defaultColor, hex: '#ff000080' } });
        expect(getInput()).toHaveValue('#ff0000');
    });

    it('rgba 格式输入合法值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor, onChange });
        await changeInput('255,0,0');
        expect(lastColor(onChange).rgba).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('rgba 格式输入非法值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', defaultValue: greenColor, onChange });
        await changeInput('invalid');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('invalid');
    });

    it('hsva 格式输入合法值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hsva', defaultValue: greenColor, onChange });
        await changeInput('0,100,100');
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 100, v: 100, a: 1 });
    });

    it('hex 格式输入合法值与不带 # 的值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor, onChange });
        await changeInput('#ff0000');
        expect(lastColor(onChange).hex).toBe('#ff0000');
        await changeInput('0000ff');
        expect(lastColor(onChange).hex).toBe('#0000ff');
    });

    it('hex 格式输入非法的短 hex', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', defaultValue: greenColor, onChange });
        await changeInput('#f00');
        expect(onChange).not.toHaveBeenCalled();
        expect(getInput()).toHaveValue('#f00');
    });

    it('输入无法解析的文本时保留文本且不通知', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange });
        await changeInput('test');
        expect(getInput()).toHaveValue('test');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('EyeDropper 不可用时点击滴管按钮没有效果', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ eyeDropper: true, onChange });
        expect(window.EyeDropper).toBeUndefined();
        await userEvent.click(getEyeDropperButton());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('点击滴管按钮取色', async () => {
        const open = vi.fn<() => Promise<{ sRGBHex: string }>>(async () => ({ sRGBHex: '#00ff00' }));
        window.EyeDropper = class {
            open = open;
        };
        renderColorPicker({ eyeDropper: true });
        await userEvent.click(getEyeDropperButton());
        expect(open).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getInput()).toHaveValue('#00ff00'));
    });

    it('颜色变化时更新文本框', async () => {
        renderColorPicker({ defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        expect(getInput()).toHaveValue('#00ffff');
    });

    it('格式变化时更新文本框', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        expect(getInput()).toHaveValue('#ff0000');
        await selectFormat('hsva');
        expect(getInput()).toHaveValue('0,100,100');
    });

    it.each([
        ['rgba', (color: ColorValue) => color.rgba, { r: 255, g: 0, b: 0, a: 0.5 }],
        ['hex', (color: ColorValue) => color.hex, '#ff000080'],
        ['hsva', (color: ColorValue) => color.hsva, { h: 0, s: 100, v: 100, a: 0.5 }],
    ])('%s 格式下改透明度输入框', async (format, pick, expected) => {
        const onChange = onChangeMock();
        renderColorPicker({ alpha: true, defaultFormat: format, onChange, defaultValue: defaultColor });
        await changeAlphaInput('50');
        expect(pick(lastColor(onChange))).toEqual(expected);
    });

    it('rgba 格式输入逗号分隔的值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        await changeInput('128,255,0');
        expect(lastColor(onChange).rgba).toEqual({ r: 128, g: 255, b: 0, a: 1 });
    });

    it('rgba 格式输入非法值或超出范围的值时不通知', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        await changeInput('abc,def,ghi');
        await changeInput('300,0,0');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hsva 格式输入逗号分隔的值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        await changeInput('120,100,100');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 1 });
    });

    it('rgba 格式输入带 alpha 的值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'rgba', onChange });
        await changeInput('128,255,0,0.5');
        expect(lastColor(onChange).rgba).toEqual({ r: 128, g: 255, b: 0, a: 0.5 });
    });

    it('非受控模式下输入更新界面', async () => {
        renderColorPicker({ defaultValue: defaultColor });
        await changeInput('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('受控模式下输入不更新界面', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, modelValue: defaultColor });
        await changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it.each([
        ['rgba', 'hex', (color: ColorValue) => color.rgba, { r: 255, g: 0, b: 0, a: 0.5 }],
        ['hex', 'rgba', (color: ColorValue) => color.hex, '#ff000080'],
        ['hsva', 'hex', (color: ColorValue) => color.hsva, { h: 0, s: 100, v: 100, a: 0.5 }],
    ])('切换到 %s 格式后改透明度输入框', async (format, from, pick, expected) => {
        const onChange = onChangeMock();
        renderColorPicker({ alpha: true, defaultFormat: from, onChange, defaultValue: defaultColor });
        await selectFormat(format);
        await changeAlphaInput('50');
        expect(pick(lastColor(onChange))).toEqual(expected);
    });

    it('受控 modelValue 的 handle 位置只跟随 modelValue', async () => {
        const view = renderColorPicker({ modelValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getArea()), { clientX: 100, clientY: 100 });
        await release(getArea());
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });

        await view.rerender({ modelValue: { ...defaultColor, hsva: { ...defaultColor.hsva } } });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });

        await view.rerender({ modelValue: greenColor });
        expect(getAreaHandle()).toHaveStyle({ left: '270px', top: '-10px' });
    });

    it('默认色的 handle 位置对应 hsva(176, 71%, 77%)', () => {
        renderColorPicker();
        expect(parseFloat(getAreaHandle().style.left)).toBeCloseTo(0.71 * 280 - 10);
        expect(parseFloat(getAreaHandle().style.top)).toBeCloseTo(0.23 * 280 - 10);
    });

    it('选色区在合法位置按下时取色', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        mockRect(getArea());
        await fireEvent.pointerDown(getAreaHandle(), { clientX: 140, clientY: 140 });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        await release(getArea());
    });

    it('EyeDropper 返回 hex 时更新颜色', async () => {
        const onChange = onChangeMock();
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

    it('用户取消取色（AbortError）时不报错也不通知', async () => {
        const onChange = onChangeMock();
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
        const onChange = onChangeMock();
        // like the real EyeDropper, a pick that is aborted rejects with an AbortError
        const open = vi.fn<(options: { signal: AbortSignal }) => Promise<{ sRGBHex: string }>>(({ signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
        window.EyeDropper = class {
            open = open;
        };
        const view = renderColorPicker({ eyeDropper: true, onChange });
        await userEvent.click(getEyeDropperButton());
        await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
        const signal = open.mock.calls[0]?.[0].signal;
        expect(signal?.aborted).toBe(false);
        view.unmount();
        expect(signal?.aborted).toBe(true);
        // the abort rejection must be swallowed, not left as an unhandled rejection
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hsva 格式输入带空格', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        await changeInput(' 120 , 100 , 100 ');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 1 });
    });

    it('hsva 格式输入带 alpha 的值', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        await changeInput('120,100,100,0.5');
        expect(lastColor(onChange).hsva).toEqual({ h: 120, s: 100, v: 100, a: 0.5 });
    });

    it('hsva 格式输入超出范围的色相时不通知', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hsva', onChange });
        await changeInput('400,100,100');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hex 格式输入 8 位 hex（带 alpha）', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ defaultFormat: 'hex', onChange });
        await changeInput('#ff000080');
        expect(lastColor(onChange).hex).toBe('#ff000080');
        expect(lastColor(onChange).rgba.a).toBeCloseTo(0.5, 1);
    });

    it.each([
        ['rgba', 'rgba(255, 0, 0, 0.5)'],
        ['hex', 'rgba(255, 0, 0, 0.5)'],
        ['hsva', 'rgba(255, 0, 0, 0.5)'],
    ])('%s 格式下逐字输入透明度', async (format, swatch) => {
        renderColorPicker({ alpha: true, defaultFormat: format, defaultValue: defaultColor });
        await userEvent.clear(getAlphaInput());
        await userEvent.type(getAlphaInput(), '50');
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '50%');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: swatch });
    });

    it('hsva 格式下逐字输入透明度时 handle 跟随', async () => {
        renderColorPicker({ alpha: true, defaultFormat: 'hsva', defaultValue: defaultColor });
        await userEvent.clear(getAlphaInput());
        await userEvent.type(getAlphaInput(), '80');
        expect(getAlphaRange()).toHaveAttribute('aria-valuetext', '80%');
        expect(parseFloat(getAlphaHandle().style.left)).toBeCloseTo(0.8 * 280 - 9);
    });

    it('格式选择器切换为 hsva', async () => {
        renderColorPicker({ defaultFormat: 'hex', defaultValue: defaultColor });
        await selectFormat('hsva');
        expect(getFormatSelect()).toHaveTextContent('hsva');
        expect(getInput()).toHaveValue('0,100,100');
    });

    it('色相条按下后 handle 跟随', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140, clientY: 5 });
        expect(lastColor(onChange).hsva.h).toBe(180);
        expect(getColorSliderHandle()).toHaveStyle({ left: '131px' });
        await release(getColorSlider());
    });

    it('选色区按下后 handle 跟随', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange, defaultValue: defaultColor });
        await fireEvent.pointerDown(mockRect(getArea()), { clientX: 140, clientY: 140 });
        expect(lastColor(onChange).hsva).toEqual({ h: 0, s: 50, v: 50, a: 1 });
        expect(getAreaHandle()).toHaveStyle({ left: '130px', top: '130px' });
        await release(getArea());
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

    it('全局 Input、InputNumber 默认值不给数据区输入框加清除按钮', () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true }, InputNumber: { showClear: true } };
        renderColorPicker({ alpha: true });
        expect(need(query(`.${prefixCls}-dataPart`)).querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('v-model 绑定的受控值在各格式下往返一致', async () => {
        render(Model);
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        await release(getColorSlider());
        expect(screen.getByLabelText('hex')).toHaveTextContent('#00ffff');
        expect(getInput()).toHaveValue('#00ffff');
        expect(getArea()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 255)' });

        await selectFormat('rgba');
        await changeInput('0,0,255');
        expect(screen.getByLabelText('hex')).toHaveTextContent('#0000ff');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });

        await selectFormat('hsva');
        expect(getInput()).toHaveValue('240,100,100');
        await changeInput('120,100,100');
        expect(screen.getByLabelText('hex')).toHaveTextContent('#00ff00');
        expect(getColorSliderHandle()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('重新渲染后拖动调用最新的 change 监听', async () => {
        const first = onChangeMock();
        const second = onChangeMock();
        const view = renderColorPicker({ alpha: true, onChange: first, defaultValue: defaultColor });
        mockRect(getAlphaSlider());
        await fireEvent.pointerDown(getAlphaSlider(), { clientX: 280 });
        await view.rerender({ onChange: second });
        await fireEvent.pointerMove(getAlphaSlider(), { clientX: 140 });
        expect(second).toHaveBeenCalledTimes(1);
        expect(lastColor(second).rgba.a).toBe(0.5);
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('受控值相等时不覆盖正在输入的内容', async () => {
        const view = renderColorPicker({ modelValue: defaultColor });
        await changeInput('ff00');
        await view.rerender({ modelValue: { ...defaultColor, rgba: { ...defaultColor.rgba } } });
        expect(getInput()).toHaveValue('ff00');
        await view.rerender({ modelValue: greenColor });
        expect(getInput()).toHaveValue('#00ff00');
    });

    it('在弹层内通过格式 Select 切换格式后，弹层保持打开', async () => {
        renderColorPicker({ usePopover: true, defaultFormat: 'hex', popoverProps: { motion: false } });
        await userEvent.click(getDefaultTrigger());
        await screen.findByRole('dialog');
        await selectFormat('rgba');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(getInput()).toHaveValue('57,197,187');
    });

    it('Popover 内的取色器会改变默认触发色块', async () => {
        const onChange = onChangeMock();
        renderColorPicker({
            usePopover: true,
            onChange,
            defaultValue: defaultColor,
            popoverProps: { trigger: 'click' },
        });
        const trigger = getDefaultTrigger();
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        await userEvent.click(trigger);
        await waitFor(() => expect(getPicker()).not.toBeNull());
        await changeInput('#00ff00');
        expect(lastColor(onChange).hex).toBe('#00ff00');
        expect(trigger).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('未知属性传到根元素', () => {
        renderColorPicker({ 'data-testid': 'picker', 'aria-describedby': 'hint', tabindex: 0 });
        expect(getPicker()).not.toHaveAttribute('tabindex');
        expect(getPicker()).toHaveAttribute('data-testid', 'picker');
        expect(getPicker()).toHaveAttribute('aria-describedby', 'hint');
    });

    it.each([
        ['area', getArea],
        ['color slider', getColorSlider],
        ['alpha slider', getAlphaSlider],
    ])('在 %s 上拖动中途卸载后，停止后续变化', async (_name, getTarget) => {
        const onChange = onChangeMock();
        const view = renderColorPicker({ alpha: true, onChange, defaultValue: defaultColor });
        const target = mockRect(getTarget());
        await fireEvent.pointerDown(target, { clientX: 140, clientY: 140 });
        view.unmount();
        onChange.mockClear();
        await fireEvent.pointerMove(target, { clientX: 70, clientY: 70 });
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('ColorPicker 的 Vue 用法', () => {
    it('v-model 双向：拖动色相后父级值更新为 ColorValue，输入框随之更新', async () => {
        render(Model);
        expect(screen.getByLabelText('hex')).toHaveTextContent('#ff0000');
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        await release(getColorSlider());
        expect(screen.getByLabelText('hex')).toHaveTextContent('#00ffff');
        expect(getInput()).toHaveValue('#00ffff');
    });

    it('单向绑定 modelValue 加 change：界面保持传入值，父级以同值重渲染也不翻转', async () => {
        const onChange = onChangeMock();
        const view = renderColorPicker({ modelValue: defaultColor, onChange });
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        await release(getColorSlider());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getInput()).toHaveValue('#ff0000');

        await view.rerender({ modelValue: { ...defaultColor } });
        expect(getInput()).toHaveValue('#ff0000');
        expect(getColorSliderHandle()).toHaveStyle({ left: '-9px' });
    });

    it('显式 modelValue: undefined 是非受控；受控转非受控回到 defaultValue', async () => {
        const onChange = onChangeMock();
        const view = renderColorPicker({ modelValue: undefined, defaultValue: defaultColor, onChange });
        await changeInput('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });

        await view.rerender({ modelValue: greenColor });
        await changeInput('#0000ff');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });

        await view.rerender({ modelValue: undefined });
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('深层 ref 的响应式 ColorValue 可正常使用，整体替换后文本框同步', async () => {
        render(DeepRef);
        expect(getInput()).toHaveValue('#ff0000');
        await fireEvent.pointerDown(mockRect(getColorSlider()), { clientX: 140 });
        await release(getColorSlider());
        expect(getInput()).toHaveValue('#00ffff');

        await fireEvent.click(screen.getByRole('button', { name: 'replace' }));
        expect(getInput()).toHaveValue('#00ff00');
        expect(getDemoBlock()).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
    });

    it('semiGlobalKey 注入的全局默认值生效，传入值优先', async () => {
        const global = globalWith({
            ColorPicker: {
                alpha: false,
                defaultFormat: 'rgba',
                width: 200,
                usePopover: true,
                popoverProps: { class: 'from-global', motion: false },
            },
        });
        const first = render(() => <ColorPicker />, { global });
        await userEvent.click(getDefaultTrigger());
        await waitFor(() => expect(getPicker()).not.toBeNull());
        expect(getInput()).toHaveValue('57,197,187');
        expect(query(`.${prefixCls}-alphaSlider`)).toBeNull();
        expect(getArea().style.width).toBe('200px');
        expect(need(query(`.${prefixCls}-popover`))).toHaveClass('from-global');
        first.unmount();

        render(() => <ColorPicker alpha defaultFormat="hsva" usePopover={false} width={300} />, { global });
        expect(getInput()).toHaveValue('176,71,77');
        expect(getAlphaSlider()).not.toBeNull();
        expect(getArea().style.width).toBe('300px');
    });

    it('alpha、eyeDropper、usePopover 缺省时取默认值而不是 false', () => {
        const props = (ColorPicker as unknown as { props: Record<string, { default?: unknown }> }).props;
        for (const key of ['alpha', 'eyeDropper', 'usePopover']) {
            expect(props[key]).toHaveProperty('default');
        }
        renderColorPicker();
        expect(getAlphaSlider()).not.toBeNull();
        expect(getEyeDropperButton()).toBeInTheDocument();
        expect(getDefaultTriggerOrNull()).toBeNull();
    });

    const attrProps = (onClick: (event: MouseEvent) => void) => ({
        class: 'mine',
        style: { margin: '3px' },
        'data-testid': 'picker',
        'aria-describedby': 'hint',
        onClick,
    });
    const expectAttrsOnPicker = async (onClick: ReturnType<typeof vi.fn>) => {
        const picker = need(getPicker());
        expect(picker).toHaveClass('mine');
        expect(picker.style.margin).toBe('3px');
        expect(picker).toHaveAttribute('data-testid', 'picker');
        expect(picker).toHaveAttribute('aria-describedby', 'hint');
        await userEvent.click(picker);
        expect(onClick).toHaveBeenCalledTimes(1);
    };

    it('class、style、data-*、aria-describedby、onClick 落在 picker 上', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderColorPicker(attrProps(onClick));
        await expectAttrsOnPicker(onClick);
    });

    it('usePopover 时未声明的属性落在弹层内的 picker 上，不落在触发器与对话框上', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        renderColorPicker({ usePopover: true, ...attrProps(onClick) });
        await userEvent.click(getDefaultTrigger());
        const dialog = await screen.findByRole('dialog');
        expect(onClick).not.toHaveBeenCalled();
        await expectAttrsOnPicker(onClick);
        expect(getDefaultTrigger()).not.toHaveAttribute('data-testid');
        expect(getDefaultTrigger()).not.toHaveClass('mine');
        expect(dialog).not.toHaveAttribute('data-testid');
    });

    it('传入 aria-label 时 picker 是 group，传入 role 时不覆盖，没有名称时无 role', () => {
        const named = renderColorPicker({ 'aria-label': 'Fill' });
        expect(screen.getByRole('group', { name: 'Fill' })).toBe(getPicker());
        named.unmount();

        const labelled = renderColorPicker({ 'aria-labelledby': 'someone' });
        expect(getPicker()).toHaveAttribute('role', 'group');
        labelled.unmount();

        const custom = renderColorPicker({ 'aria-label': 'Fill', role: 'region' });
        expect(getPicker()).toHaveAttribute('role', 'region');
        custom.unmount();

        renderColorPicker();
        expect(getPicker()).not.toHaveAttribute('role');
    });

    it('模板写法的 topSlot、bottomSlot 与默认插槽生效', async () => {
        render(SlotsFixture);
        await userEvent.click(screen.getByRole('button', { name: 'pick' }));
        await screen.findByRole('dialog');
        expect(getPicker()?.firstElementChild).toHaveClass('top-slot');
        expect(getPicker()?.lastElementChild).toHaveClass('bottom-slot');
    });

    it('默认插槽在 usePopover 为 false 时不渲染；为空时回落默认色块按钮', () => {
        const inline = renderColorPicker({}, { default: () => <button type="button">trigger</button> });
        expect(screen.queryByRole('button', { name: 'trigger' })).toBeNull();
        inline.unmount();

        renderColorPicker({ usePopover: true }, { default: () => [] });
        expect(getDefaultTrigger()).toBeInTheDocument();
    });

    it('弹层对话框默认名称取语言包，popoverProps 的名称优先', async () => {
        const first = renderColorPicker({ usePopover: true });
        await userEvent.click(getDefaultTrigger());
        expect(await screen.findByRole('dialog', { name: text.color })).toBeInTheDocument();
        first.unmount();

        const second = renderColorPicker({ usePopover: true, popoverProps: { ariaLabel: 'Fill color' } });
        await userEvent.click(getDefaultTrigger());
        expect(await screen.findByRole('dialog', { name: 'Fill color' })).toBeInTheDocument();
        second.unmount();

        const label = document.body.appendChild(document.createElement('span'));
        label.id = 'dialog-title';
        label.textContent = 'Pick a fill';
        renderColorPicker({ usePopover: true, popoverProps: { ariaLabelledby: 'dialog-title' } });
        await userEvent.click(getDefaultTrigger());
        expect(await screen.findByRole('dialog', { name: 'Pick a fill' })).toBeInTheDocument();
        label.remove();
    });

    it('弹层对话框名称随语言包切换', async () => {
        const Host = () => <ConfigProvider locale={ja_JP}>{() => <ColorPicker usePopover />}</ConfigProvider>;
        render(Host);
        await userEvent.click(screen.getByRole('button', { name: ja_JP.ColorPicker.color }));
        expect(await screen.findByRole('dialog', { name: ja_JP.ColorPicker.color })).toBeInTheDocument();
    });

    it('popoverProps 的 class 与监听器生效，类名不重复', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        renderColorPicker({
            usePopover: true,
            popoverProps: { class: 'mine', motion: false, onVisibleChange },
        });
        await userEvent.click(getDefaultTrigger());
        await screen.findByRole('dialog');
        expect(onVisibleChange).toHaveBeenCalledWith(true);
        const classes = need(query(`.${prefixCls}-popover`)).className.split(' ');
        expect(classes.filter((name) => name === 'mine')).toHaveLength(1);
        expect(classes.filter((name) => name === `${prefixCls}-popover`)).toHaveLength(1);
    });

    it('ColorPickerHandle.root：inline 时是 picker，usePopover 关闭时为 null，打开后是 picker', async () => {
        type Exposed = { root: HTMLElement | null };
        let exposed: Exposed | null = null;
        const capture = (instance: unknown) => {
            exposed = instance as Exposed | null;
        };
        const inline = render(() => <ColorPicker ref={capture} />);
        expect((exposed as Exposed | null)?.root).toBe(getPicker());
        inline.unmount();

        render(() => <ColorPicker ref={capture} usePopover />);
        expect((exposed as Exposed | null)?.root).toBeNull();
        await userEvent.click(getDefaultTrigger());
        await waitFor(() => expect(getPicker()).not.toBeNull());
        expect((exposed as Exposed | null)?.root).toBe(getPicker());
    });

    it('SSR 输出 defaultValue 对应的文本框值与触发器背景色', async () => {
        const inline = await renderToString(createSSRApp({ render: () => <ColorPicker defaultValue={greenColor} /> }));
        expect(inline).toContain('value="#00ff00"');
        const popover = await renderToString(createSSRApp({ render: () => <ColorPicker defaultValue={greenColor} usePopover /> }));
        expect(popover).toContain('#00ff00');
        expect(popover).toContain('semi-colorPicker-popover-defaultChildren');
    });

    it.each([
        ['色相', () => within(getColorSlider()).getByRole('slider'), 120, '200'],
        ['透明度', getAlphaRange, 100, '20'],
        ['饱和度', () => within(getArea()).getAllByRole('slider')[0], 100, '10'],
    ])('受控值不被接受时，%s滑块的 input 事件后 DOM 值被打回渲染值', async (_name, getRange, rendered, typed) => {
        const onChange = onChangeMock();
        renderColorPicker({ modelValue: greenColor, onChange });
        const range = getRange() as HTMLInputElement;
        expect(range.value).toBe(String(rendered));
        await fireEvent.input(range, { target: { value: typed } });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(range.value).toBe(String(rendered));
    });

    it('change 遮住原生 change：picker 内冒泡的原生 change 不会到达使用方的 @change', async () => {
        const onChange = onChangeMock();
        renderColorPicker({ onChange });
        await fireEvent(need(getPicker()), new Event('change', { bubbles: true }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('KeepAlive 切走再切回后，弹层已关闭', async () => {
        const shown = ref(true);
        const Other = defineComponent({ render: () => <div>other</div> });
        render(() => (
            <ConfigProvider locale={en_US}>
                {() => (
                    <KeepAlive>
                        {{
                            default: () => (shown.value ? <ColorPicker usePopover popoverProps={{ motion: false }} /> : <Other />),
                        }}
                    </KeepAlive>
                )}
            </ConfigProvider>
        ));
        const trigger = screen.getByRole('button', { name: text.color });
        await userEvent.click(trigger);
        await screen.findByRole('dialog');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        shown.value = false;
        await settle();
        expect(screen.queryByRole('dialog')).toBeNull();
        shown.value = true;
        await settle();
        expect(screen.getByRole('button', { name: text.color })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('一个非受控实例改色后，后挂载的实例仍从默认颜色开始', async () => {
        const first = renderColorPicker({});
        const initial = getInput().value;
        await changeInput('#00ff00');
        expect(getInput().value).toBe('#00ff00');
        first.unmount();
        renderColorPicker({});
        expect(getInput().value).toBe(initial);
    });
});

function getDefaultTriggerOrNull() {
    return query(`.${prefixCls}-popover-defaultChildren`);
}
