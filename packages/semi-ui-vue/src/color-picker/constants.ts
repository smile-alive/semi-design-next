import type { ColorValue } from './interface';

/** The color of an untouched picker; read-only, shared by every instance */
export const DEFAULT_COLOR: ColorValue = {
    hsva: { h: 176, s: 71, v: 77, a: 1 },
    rgba: { r: 57, g: 197, b: 187, a: 1 },
    hex: '#39c5bb',
};

export const FORMAT_OPTIONS = [
    { label: 'hex', value: 'hex' },
    { label: 'rgba', value: 'rgba' },
    { label: 'hsva', value: 'hsva' },
];
