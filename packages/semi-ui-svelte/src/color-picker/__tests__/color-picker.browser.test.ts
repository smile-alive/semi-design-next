import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { clickOutside, expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { colorStringToValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ColorPickerProps, ColorValue } from '../interface';
import ColorPickerFixture from './color-picker-fixture.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-colorPicker`;
const text = en_US.ColorPicker;

function setup(props: ColorPickerProps = {}) {
    const store = createStore<{ props: ColorPickerProps }>({ props });
    const result = render(ColorPickerFixture, { props: { store } });
    flushSync();
    return { store, ...result };
}

function required<T extends Element>(el: T | null) {
    if (!el) throw new Error('missing element');
    return el;
}

describe('Svelte ColorPicker（浏览器）', () => {
    it('拖动色相时，指针移出滑块后仍持续跟随，松开后结束', async () => {
        const onChange = vi.fn<(value: ColorValue) => void>();
        const { container } = setup({ value: colorStringToValue('#ff0000'), onChange });
        const slider = required(container.querySelector<HTMLElement>(`.${prefixCls}-colorSlider`));
        const handle = required(slider.querySelector<HTMLElement>(`.${prefixCls}-handle`));
        const outside = required(container.ownerDocument.body.appendChild(document.createElement('div')));
        outside.style.cssText = 'position:fixed;left:400px;top:0;width:100px;height:100px';
        expect(getComputedStyle(slider).touchAction).toBe('none');

        // the pointer is released over another element, past the slider's right end
        await userEvent.dragAndDrop(handle, outside);
        expect(onChange.mock.lastCall?.[0].hsva.h).toBeGreaterThan(300);

        const changes = onChange.mock.calls.length;
        await userEvent.hover(slider, { position: { x: 10, y: 5 } });
        expect(onChange).toHaveBeenCalledTimes(changes);
        outside.remove();
    });

    it('每个拖拽区域都阻止触摸拖动滚动页面', () => {
        const { container } = setup({ value: colorStringToValue('#ff0000'), alpha: true });
        for (const name of ['colorChooseArea', 'colorSlider', 'alphaSlider']) {
            const surface = required(container.querySelector(`.${prefixCls}-${name}`));
            expect(getComputedStyle(surface).touchAction).toBe('none');
        }
    });

    it('默认触发器显示主题焦点环', async () => {
        // the theme is not loaded here: give the focus token a value so the ring color is not invalid at computed time
        document.documentElement.style.setProperty('--semi-color-primary-light-active', 'rgb(1, 2, 3)');
        setup({ value: colorStringToValue('#3370ff'), usePopover: true });
        const trigger = required(document.querySelector<HTMLElement>(`.${prefixCls}-popover-defaultChildren`));
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        document.documentElement.style.removeProperty('--semi-color-primary-light-active');
    });

    it('在弹层内通过格式 Select 切换格式后，弹层保持打开', async () => {
        setup({ usePopover: true, defaultFormat: 'hex', popoverProps: { motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        const dialog = await screen.findByRole('dialog', { name: text.color });

        // the Select's list is teleported out of the dialog, and a press in it is not an outside press of the popover
        await userEvent.click(screen.getByRole('combobox', { name: text.format }));
        const option = (await screen.findAllByRole('option')).find((candidate) => candidate.textContent?.trim() === 'rgba');
        await userEvent.click(required(option ?? null));
        await expect.poll(() => screen.getByRole('combobox', { name: text.format }).textContent).toContain('rgba');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: text.color })).toHaveValue('57,197,187');
    });

    it('弹层内 Tab 顺序依次经过各控件，Esc 关闭并把焦点还给触发器', async () => {
        setup({ usePopover: true, popoverProps: { motion: false } });
        const trigger = screen.getByRole('button', { name: text.color });
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        const dialog = await screen.findByRole('dialog', { name: text.color });

        const expected = [text.saturation, text.brightness, text.hue, text.alpha, text.color, text.alpha, text.format, text.eyeDropper];
        const seen: string[] = [];
        for (let i = 0; i < 14 && seen.length < expected.length; i++) {
            await userEvent.keyboard('{Tab}');
            const active = document.activeElement;
            const label = active?.getAttribute('aria-label') ?? '';
            if (active && dialog.contains(active) && expected.includes(label) && seen.at(-1) !== label) {
                seen.push(label);
            }
        }
        expect(seen).toEqual(expected);

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
        expect(trigger).toHaveFocus();
    });

    it('弹层关闭后文档中没有 picker 残留', async () => {
        setup({ usePopover: true, popoverProps: { motion: false } });
        await userEvent.click(screen.getByRole('button', { name: text.color }));
        await screen.findByRole('dialog');
        expect(document.querySelector(`.${prefixCls}`)).not.toBeNull();

        await clickOutside();
        await expect.poll(() => document.querySelector(`.${prefixCls}`)).toBeNull();
    });
});
