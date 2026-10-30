import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { SliderProps } from '../interface';
import SliderFixture from './slider-fixture.svelte';

const renderBody = (props: SliderProps) => render(SliderFixture, { props: { store: createStore({ props }) } }).body;

describe('Svelte Slider 服务端首帧', () => {
    it('首帧带手柄位置、track、输入框的值与名称', () => {
        const body = renderBody({ value: 30, 'aria-label': 'volume', id: 'v', name: 'volume', 'data-x': '1' } as SliderProps);
        expect(body).toMatch(/<div[^>]*class="semi-slider"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toContain('left: 30%');
        expect(body).toContain('width: 30%');
        expect(body).toMatch(/<input[^>]*type="range"/);
        expect(body).toMatch(/<input[^>]*aria-label="volume"/);
        expect(body).toMatch(/<input[^>]*id="v"/);
        expect(body).toMatch(/<input[^>]*name="volume"/);
        expect(body).toMatch(/<input[^>]*value="30"/);
    });

    it('范围、刻度、边界与垂直布局', () => {
        const body = renderBody({ value: [20, 60], range: true, marks: { 20: '20c', 60: '60c' }, showBoundary: true });
        expect(body.match(/type="range"/g)).toHaveLength(2);
        expect(body).toContain('left: 20%');
        expect(body).toContain('left: 60%');
        expect(body).toContain('semi-slider-dot-active');
        expect(body).toContain('20c');
        expect(body).toContain('semi-slider-boundary-min');

        const vertical = renderBody({ value: 30, vertical: true });
        expect(vertical).not.toMatch(/class="semi-slider"/);
        expect(vertical).toContain('semi-slider-vertical-wrapper');
        expect(vertical).toContain('top: 30%');
    });

    it('无值时手柄在 min，禁用时输入框带 disabled', () => {
        const body = renderBody({ min: 10, max: 50, disabled: true });
        expect(body).toContain('left: 0%');
        expect(body).toMatch(/<input[^>]*value="10"/);
        expect(body).toMatch(/<input[^>]*disabled/);
        expect(body).toContain('semi-slider-disabled');
    });
});
