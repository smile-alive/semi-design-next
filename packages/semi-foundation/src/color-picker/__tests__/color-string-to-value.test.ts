import { describe, expect, it } from 'vite-plus/test';
import ColorPickerFoundation from '../foundation';

const { colorStringToValue } = ColorPickerFoundation;

describe('ColorPickerFoundation.colorStringToValue', () => {
    it('6 位与 8 位 hex 保持原样', () => {
        expect(colorStringToValue('#ff0000')).toMatchObject({ hex: '#ff0000', rgba: { r: 255, g: 0, b: 0, a: 1 } });
        const withAlpha = colorStringToValue('#ff000080');
        expect(withAlpha.hex).toBe('#ff000080');
        expect(withAlpha.rgba.a).toBeCloseTo(0.5, 1);
    });

    it('3 位与 4 位 hex 展开为 6 位与 8 位', () => {
        expect(colorStringToValue('#f00')).toMatchObject({
            hex: '#ff0000',
            rgba: { r: 255, g: 0, b: 0, a: 1 },
            hsva: { h: 0, s: 100, v: 100, a: 1 },
        });
        const withAlpha = colorStringToValue('#0f08');
        expect(withAlpha.hex).toBe('#00ff0088');
        expect(withAlpha.rgba).toMatchObject({ r: 0, g: 255, b: 0 });
        expect(withAlpha.rgba.a).toBeCloseTo(0.53, 2);
    });

    it('rgb、rgba、hsv、hsva 字符串转换为同一颜色的三种表示', () => {
        expect(colorStringToValue('rgb(255, 0, 0)')).toMatchObject({ hex: '#ff0000', rgba: { r: 255, g: 0, b: 0 } });
        expect(colorStringToValue('rgba(255, 0, 0, 0.5)').rgba.a).toBe(0.5);
        expect(colorStringToValue('hsv(0, 100%, 100%)')).toMatchObject({ hex: '#ff0000', rgba: { r: 255 } });
        expect(colorStringToValue('hsva(0, 100%, 100%, 0.5)').rgba.a).toBe(0.5);
    });

    it.each(['', 'invalid', '#', '#ff', '#ff000', '#gggggg', '#ff0000000', 'rgb(abc)', 'rgb(1,2)', 'rgbx', 'rgb(300,0,0)', 'rgb(-5,0,0)', 'rgba(1,2,3,2)', 'hsv(abc)', 'hsvfoo', 'hsv(0,101%,100%)', 'hsva(0,50%,50%,1.5)'])('无法完整解析或越界的 %j 抛出错误', (raw) => {
        expect(() => colorStringToValue(raw)).toThrow('Semi ColorPicker');
    });
});
