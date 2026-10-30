import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import ColorPickerFixture from './color-picker-fixture.svelte';

describe('Svelte ColorPicker 服务端首帧', () => {
    it('首帧带 picker、默认颜色对应的文本框值与透传属性', () => {
        const store = createStore({ props: { 'aria-label': 'Fill', 'data-x': '1' } });
        const { body } = render(ColorPickerFixture, { props: { store } });
        expect(body).toMatch(/<div[^>]*class="[^"]*semi-colorPicker[^"]*"[^>]*role="group"/);
        expect(body).toContain('data-x="1"');
        expect(body).toContain('value="#39c5bb"');
        expect(body).toContain('semi-colorPicker-alphaSlider');
    });

    it('usePopover 首帧只有默认触发器，背景色是当前颜色，弹层内容不输出', () => {
        const store = createStore({ props: { usePopover: true, value: { hsva: { h: 0, s: 100, v: 100, a: 1 }, rgba: { r: 255, g: 0, b: 0, a: 1 }, hex: '#ff0000' } } });
        const { body } = render(ColorPickerFixture, { props: { store } });
        expect(body).toContain('semi-colorPicker-popover-defaultChildren');
        expect(body).toMatch(/background-color:\s*#ff0000/);
        expect(body).not.toContain('semi-colorPicker-colorChooseArea');
    });
});
