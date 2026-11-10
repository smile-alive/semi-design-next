import { describe, expect, it, vi } from 'vite-plus/test';
import ColorPickerFoundation, { type ColorPickerAdapter, type ColorPickerProps } from '../foundation';

const red = ColorPickerFoundation.colorStringToValue('#ff0000');
const blue = ColorPickerFoundation.colorStringToValue('#0000ff');

describe('ColorPickerFoundation.deriveColor', () => {
    it('受控的 value 优先，null 显示 defaultValue，未受控时取 state', () => {
        expect(ColorPickerFoundation.deriveColor({ value: red, defaultValue: blue }, { currentColor: blue })).toBe(red);
        expect(ColorPickerFoundation.deriveColor({ value: null, defaultValue: blue }, { currentColor: red })).toBe(blue);
        expect(ColorPickerFoundation.deriveColor({ defaultValue: blue }, { currentColor: red })).toBe(red);
    });
});

describe('ColorPickerFoundation.handleAreaChange', () => {
    it('保留当前的色相与透明度，只换饱和度与明度', () => {
        const props: ColorPickerProps = { alpha: true, value: { ...red, hsva: { h: 120, s: 100, v: 100, a: 0.5 } } };
        const notifyChange = vi.fn<ColorPickerAdapter['notifyChange']>();
        const adapter = { getProps: () => props, getProp: (key: keyof ColorPickerProps) => props[key], getStates: () => ({ currentColor: red }), isControlledComponent: () => true, setState: vi.fn<() => void>(), notifyChange };
        new ColorPickerFoundation(adapter as unknown as ColorPickerAdapter).handleAreaChange({ s: 40, v: 60 });
        expect(notifyChange.mock.calls[0][0].hsva).toEqual({ h: 120, s: 40, v: 60, a: 0.5 });
    });
});
