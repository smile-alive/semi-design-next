import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { clickOutside, expectThemeFocusRing, tabTo } from '@test/utils/browser';
import ColorPicker, { type ColorPickerProps } from '..';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;
const text = en_US.ColorPicker;

type OnChange = NonNullable<ColorPickerProps['onChange']>;

function required<T extends Element>(el: T | null) {
    if (!el) throw new Error('missing element');
    return el;
}

// the picker next to a box below and to the right of every drag surface, where a drag ends outside
function renderWithOutside(props: ColorPickerProps) {
    const onChange = vi.fn<OnChange>();
    const { container } = render(() => (
        <div style={{ display: 'flex', 'align-items': 'end' }}>
            <ConfigProvider locale={en_US}>
                <ColorPicker onChange={onChange} {...props} />
            </ConfigProvider>
            <div style={{ width: '100px', height: '100px' }} data-testid="outside" />
        </div>
    ));
    const surface = (name: string) => required(container.querySelector<HTMLElement>(`.${prefixCls}-${name}`));
    return { onChange, surface, outside: required(container.querySelector<HTMLElement>('[data-testid="outside"]')) };
}

describe('ColorPicker（浏览器）', () => {
    it('拖动色相时，指针移出滑块后仍持续跟随，松开后结束', async () => {
        const { onChange, surface, outside } = renderWithOutside({ defaultValue: ColorPicker.colorStringToValue('#ff0000') });
        const slider = surface('colorSlider');

        await userEvent.dragAndDrop(required(slider.querySelector(`.${prefixCls}-handle`)), outside);
        expect(onChange.mock.lastCall?.[0].hsva.h).toBe(360);

        const changes = onChange.mock.calls.length;
        await userEvent.hover(slider, { position: { x: 10, y: 5 } });
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it('拖动选色区到区域外时颜色贴到角落，松开后结束', async () => {
        const { onChange, surface, outside } = renderWithOutside({ defaultValue: ColorPicker.colorStringToValue('#ff0000') });
        const area = surface('colorChooseArea');

        await userEvent.dragAndDrop(required(area.querySelector(`.${prefixCls}-handle`)), outside);
        expect(onChange.mock.lastCall?.[0].hsva).toMatchObject({ s: 100, v: 0 });
        expect(getComputedStyle(area).cursor).toBe('pointer');

        const changes = onChange.mock.calls.length;
        await userEvent.hover(area, { position: { x: 10, y: 10 } });
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it('拖动透明度时，指针移出滑块后仍持续跟随，松开后结束', async () => {
        const { onChange, surface, outside } = renderWithOutside({ alpha: true, defaultValue: ColorPicker.colorStringToValue('#ff000080') });
        const slider = surface('alphaSlider');

        await userEvent.dragAndDrop(required(slider.querySelector(`.${prefixCls}-alphaHandle`)), outside);
        expect(onChange.mock.lastCall?.[0].rgba.a).toBe(1);

        const changes = onChange.mock.calls.length;
        await userEvent.hover(slider, { position: { x: 10, y: 5 } });
        expect(onChange).toHaveBeenCalledTimes(changes);
    });

    it.each([
        [text.saturation, 'ArrowRight', '51'],
        [text.brightness, 'ArrowUp', '61'],
        [text.hue, 'ArrowRight', '201'],
        [text.alpha, 'PageUp', '60'],
    ])('%s 滑块按 %s 只走一步，原生 range 不再自行步进', async (name, key, expected) => {
        const color = { hsva: { h: 200, s: 50, v: 60, a: 0.5 }, rgba: { r: 51, g: 128, b: 153, a: 0.5 }, hex: '#33809980' };
        const { onChange } = renderWithOutside({ alpha: true, defaultValue: color });
        const slider = screen.getByRole('slider', { name });
        slider.focus();
        await userEvent.keyboard(`{${key}}`);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(slider).toHaveValue(expected);
    });

    it('每个拖拽区域都阻止触摸拖动滚动页面', () => {
        const { container } = render(() => <ColorPicker defaultValue={ColorPicker.colorStringToValue('#ff0000')} alpha />);
        for (const name of ['colorChooseArea', 'colorSlider', 'alphaSlider']) {
            expect(getComputedStyle(required(container.querySelector(`.${prefixCls}-${name}`))).touchAction).toBe('none');
        }
    });

    it('默认触发器显示主题焦点环', async () => {
        // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
        const { container } = render(() => (
            <div style={{ '--semi-color-primary-light-active': 'rgb(1, 2, 3)' }}>
                <ColorPicker defaultValue={ColorPicker.colorStringToValue('#3370ff')} usePopover />
            </div>
        ));
        const trigger = required(container.querySelector(`.${prefixCls}-popover-defaultChildren`));
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });

    it('在弹层内通过格式 Select 切换格式后，弹层保持打开', async () => {
        render(() => (
            <ConfigProvider locale={en_US}>
                <ColorPicker usePopover defaultFormat="hex" popoverProps={{ motion: false }} />
            </ConfigProvider>
        ));
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog', { name: text.color });

        // the Select's list is portaled out of the dialog, and a press in it is not an outside press of the popover
        await userEvent.click(screen.getByRole('combobox'));
        const option = (await screen.findAllByRole('option')).find((candidate) => candidate.textContent === 'rgba');
        await userEvent.click(required(option ?? null));
        await expect.poll(() => screen.getByRole('combobox').textContent).toContain('rgba');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: text.color })).toHaveValue('57,197,187');
    });

    it('弹层内 Tab 顺序依次经过各控件，Esc 关闭并把焦点还给触发器', async () => {
        render(() => (
            <ConfigProvider locale={en_US}>
                <ColorPicker usePopover popoverProps={{ motion: false }} />
            </ConfigProvider>
        ));
        const trigger = screen.getByRole('button', { name: text.color });
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        const dialog = await screen.findByRole('dialog', { name: text.color });

        const expected = [text.saturation, text.brightness, text.hue, text.alpha, text.color, text.alpha, text.format, text.eyeDropper];
        const seen: (string | null)[] = [];
        for (let i = 0; i < expected.length; i++) {
            await userEvent.keyboard('{Tab}');
            const active = document.activeElement;
            seen.push(active && dialog.contains(active) ? active.getAttribute('aria-label') : null);
        }
        expect(seen).toEqual(expected);

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
        expect(trigger).toHaveFocus();
    });

    it('弹层关闭后文档中没有 picker 残留', async () => {
        render(() => (
            <ConfigProvider locale={en_US}>
                <ColorPicker usePopover popoverProps={{ motion: false }} />
            </ConfigProvider>
        ));
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        await screen.findByRole('dialog');
        expect(document.querySelector(`.${prefixCls}`)).not.toBeNull();

        await clickOutside();
        await expect.poll(() => document.querySelector(`.${prefixCls}`)).toBeNull();
    });
});
