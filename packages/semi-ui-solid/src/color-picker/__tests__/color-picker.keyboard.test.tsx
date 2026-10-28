import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import ColorPicker, { type ColorPickerProps, type ColorValue } from '..';

const text = zh_CN.ColorPicker;
const color: ColorValue = {
    hsva: { h: 200, s: 50, v: 60, a: 0.5 },
    rgba: { r: 51, g: 128, b: 153, a: 0.5 },
    hex: '#33809980',
};

const setup = (props: ColorPickerProps = {}) => {
    const onChange = vi.fn<NonNullable<ColorPickerProps['onChange']>>();
    render(() => <ColorPicker defaultValue={color} alpha eyeDropper onChange={onChange} {...props} />);
    const last = () => onChange.mock.calls[onChange.mock.calls.length - 1][0].hsva;
    return { onChange, last };
};

const getSlider = (name: string) => screen.getByRole('slider', { name });

describe('ColorPicker 键盘操作', () => {
    it('取色区域暴露饱和度与明度滑块', () => {
        setup();
        const saturation = getSlider(text.saturation);
        expect(saturation).toHaveAttribute('min', '0');
        expect(saturation).toHaveAttribute('max', '100');
        expect(saturation).toHaveValue('50');
        expect(saturation).toHaveAttribute('aria-valuetext', text.saturationBrightness.replace('${saturation}', '50').replace('${brightness}', '60'));
        expect(getSlider(text.brightness)).toHaveValue('60');
    });

    it('为色相与透明度滑块提供名称', () => {
        setup();
        const hue = getSlider(text.hue);
        expect(hue).toHaveAttribute('max', '360');
        expect(hue).toHaveValue('200');
        const alpha = getSlider(text.alpha);
        expect(alpha).toHaveValue('50');
        expect(alpha).toHaveAttribute('aria-valuetext', '50%');
    });

    it('左右方向键调整饱和度，上下方向键调整明度', async () => {
        const { last } = setup();
        getSlider(text.saturation).focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(last()).toMatchObject({ s: 51, v: 60 });
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(last()).toMatchObject({ s: 49, v: 60 });
        getSlider(text.brightness).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(last()).toMatchObject({ s: 49, v: 61 });
        await userEvent.keyboard('{ArrowDown}');
        expect(last()).toMatchObject({ s: 49, v: 60 });
        expect(getSlider(text.saturation)).toHaveValue('49');
        await userEvent.keyboard('{ArrowLeft}');
        expect(last()).toMatchObject({ s: 48, v: 60 });
        getSlider(text.saturation).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(last()).toMatchObject({ s: 48, v: 61 });
    });

    it('Home 与 End 跳到两端，PageUp 与 PageDown 每次调整 10', async () => {
        const { last } = setup();
        getSlider(text.brightness).focus();
        await userEvent.keyboard('{End}');
        expect(last().v).toBe(100);
        await userEvent.keyboard('{Home}');
        expect(last().v).toBe(0);
        await userEvent.keyboard('{PageUp}');
        expect(last().v).toBe(10);
        getSlider(text.saturation).focus();
        await userEvent.keyboard('{End}');
        expect(last()).toMatchObject({ s: 100, v: 10 });
        await userEvent.keyboard('{PageDown}');
        expect(last()).toMatchObject({ s: 100, v: 0 });
    });

    it('调整色相，并限制在 0..360 之间', async () => {
        const { last } = setup();
        getSlider(text.hue).focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(last().h).toBe(201);
        await userEvent.keyboard('{End}');
        expect(last().h).toBe(360);
        await userEvent.keyboard('{ArrowRight}');
        expect(last().h).toBe(360);
        await userEvent.keyboard('{Home}');
        expect(last().h).toBe(0);
        expect(getSlider(text.hue)).toHaveValue('0');
    });

    it('以整数百分比调整透明度', async () => {
        const { last } = setup();
        getSlider(text.alpha).focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(last().a).toBe(0.51);
        await userEvent.keyboard('{End}');
        expect(last().a).toBe(1);
        await userEvent.keyboard('{Home}');
        expect(last().a).toBe(0);
        expect(getSlider(text.alpha)).toHaveAttribute('aria-valuetext', '0%');
    });

    it('忽略其他按键', async () => {
        const { onChange } = setup();
        getSlider(text.hue).focus();
        await userEvent.keyboard('a{Tab}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
        [text.saturation, 'ArrowRight'],
        [text.brightness, 'Home'],
        [text.hue, 'ArrowRight'],
        [text.alpha, 'End'],
    ])('带 Alt、Ctrl 或 Meta 的 %s 滑块按键留给浏览器', (name, key) => {
        const { onChange } = setup();
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
            expect(fireEvent.keyDown(getSlider(name), { key, [modifier]: true })).toBe(true);
        }
        expect(onChange).not.toHaveBeenCalled();
        expect(fireEvent.keyDown(getSlider(name), { key })).toBe(false);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('方向键只改被操作的轴，另一轴保持原值', async () => {
        const { last } = setup({ defaultValue: { ...color, hsva: { h: 200, s: 71.4, v: 50.6, a: 1 } } });
        getSlider(text.brightness).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(last()).toMatchObject({ s: 71.4, v: 52 });
        getSlider(text.saturation).focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(last()).toMatchObject({ s: 72, v: 52 });
    });

    it('为颜色与透明度输入框提供名称', () => {
        setup();
        expect(screen.getByRole('textbox', { name: text.color })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: text.alpha })).toBeInTheDocument();
    });
});
