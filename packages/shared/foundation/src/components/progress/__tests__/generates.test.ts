import { describe, expect, it } from 'vite-plus/test';
import { strings } from '../constants';
import { generateColor } from '../generates';

describe('generateColor', () => {
    it('Semi 色板名输出 CSS 变量表达式，不在渲染期解析成固定值', () => {
        const at = (color: string) => generateColor([{ percent: 0, color }], 50, false);
        expect(at('blue')).toBe('var(--semi-blue-5)');
        expect(at('orange-9')).toBe('var(--semi-orange-9)');
        expect(at('light-green-8')).toBe('var(--semi-light-green-8)');
        expect(at(' Black ')).toBe('var(--semi-black)');
        expect(at('white')).toBe('var(--semi-white)');
    });

    it('其他颜色原样输出', () => {
        const at = (color: string) => generateColor([{ percent: 0, color }], 50, false);
        for (const color of ['#fff', '#ffffff80', 'rgba(255, 0, 0, 0.5)', 'hsla(125, 50%, 46%, 1)', 'tomato']) {
            expect(at(color)).toBe(color);
        }
    });

    it('渐变按区间内的位置用 color-mix 混合相邻两个色标', () => {
        const stroke = [
            { percent: 100, color: 'white' },
            { percent: 20, color: 'blue' },
        ];
        expect(generateColor(stroke, 40, true)).toBe('color-mix(in srgb, var(--semi-white) 25%, var(--semi-blue-5))');
    });

    it('不渐变时取已到达的色标，越过末尾取最后一个，未到第一个取默认色', () => {
        const stroke = [
            { percent: 20, color: '#f00' },
            { percent: 60, color: '#00f' },
        ];
        expect(generateColor(stroke, 40, false)).toBe('#f00');
        expect(generateColor(stroke, 60, true)).toBe('#00f');
        expect(generateColor(stroke, 90, true)).toBe('#00f');
        expect(generateColor(stroke, 10, true)).toBe(strings.STROKE_DEFAULT);
        expect(generateColor([], 10, true)).toBeUndefined();
    });
});
