import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { splitControlAttrs } from '../control-attrs';
import ControlAttrsFixture from './control-attrs-fixture.svelte';

describe('splitControlAttrs', () => {
    it('symbol 键（组件上的 attachment）归入 control，字符串键按判定函数分配', () => {
        const attachment = Symbol('attachment');
        const { root, control } = splitControlAttrs({ 'aria-label': '名称', title: '提示', [attachment]: 'fn' }, (key) => key.startsWith('aria-'));

        expect(root).toEqual({ title: '提示' });
        expect(control).toEqual({ 'aria-label': '名称', [attachment]: 'fn' });
    });

    it('写在 Input、Switch 上的 {@attach} 作用于接收 aria 与焦点的原生 input', () => {
        const onAttach = vi.fn<(name: string, node: Element) => void>();
        render(ControlAttrsFixture, { props: { onAttach } });

        expect(onAttach).toHaveBeenCalledWith('input', screen.getByRole('textbox', { name: '名称' }));
        expect(onAttach).toHaveBeenCalledWith('switch', screen.getByRole('switch', { name: '开关' }));
    });

    it('ListItem、Avatar 不可点击时 {@attach} 作用于根元素，可点击时作用于焦点目标', () => {
        const onAttach = vi.fn<(name: string, node: Element) => void>();
        render(ControlAttrsFixture, { props: { onAttach } });

        expect(onAttach).toHaveBeenCalledWith('static-item', screen.getByTestId('static-item'));
        expect(onAttach).toHaveBeenCalledWith('clickable-item', screen.getByRole('button', { name: '可点击项' }));
        expect(onAttach).toHaveBeenCalledWith('static-avatar', screen.getByTestId('static-avatar'));
        expect(onAttach).toHaveBeenCalledWith('clickable-avatar', screen.getByRole('button', { name: '可点击头像' }));
    });
});
