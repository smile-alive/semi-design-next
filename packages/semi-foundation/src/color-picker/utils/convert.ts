import type { RgbaColor, HslaColor, HsvaColor } from '../interface';
import { round } from './round';
/**
 * Valid CSS <angle> units.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/angle
 */

/**
 *  Referrer from https://github.com/web-padawan/vanilla-colorful/blob/master/src/lib/utils/convert.ts
 */
const angleUnits: Record<string, number> = {
    grad: 360 / 400,
    turn: 360,
    rad: 360 / (Math.PI * 2),
};

export function hexToHsva(hex: string): HsvaColor {
    return rgbaToHsva(hexToRgba(hex));
}

export function hexToRgba(hex: string): RgbaColor {
    if (hex[0] === '#') hex = hex.substring(1);

    const hexToPercent = (str: string) => {
        const decimal = parseInt(str, 16);
        if (!isNaN(decimal)) {
            const percent = decimal / 255;
            return percent;
        }
        return 1;
    };

    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
        a: hexToPercent(hex.substring(6, 8)),
    };
}

function parseHue(value: string, unit = 'deg') {
    return Number(value) * (angleUnits[unit] || 1);
}

export function hsvaToHex(hsva: HsvaColor) {
    return rgbaToHex(hsvaToRgba(hsva));
}

function hsvaToHsla({ h, s, v, a }: HsvaColor): HslaColor {
    const hh = ((200 - s) * v) / 100;

    return {
        h: round(h),
        s: round(hh > 0 && hh < 200 ? ((s * v) / 100 / (hh <= 100 ? hh : 200 - hh)) * 100 : 0),
        l: round(hh / 2),
        a: round(a, 2),
    };
}

export function hsvaToHslString(hsva: HsvaColor) {
    const { h, s, l } = hsvaToHsla(hsva);
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hsvaToHslaString(hsva: HsvaColor) {
    const { h, s, l, a } = hsvaToHsla(hsva);
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function hsvaToRgba({ h, s, v, a }: HsvaColor): RgbaColor {
    h = (h / 360) * 6;
    s = s / 100;
    v = v / 100;

    const hh = Math.floor(h),
        b = v * (1 - s),
        c = v * (1 - (h - hh) * s),
        d = v * (1 - (1 - h + hh) * s),
        module = hh % 6;

    return {
        r: round([v, c, b, b, d, v][module] * 255),
        g: round([d, v, v, c, b, b][module] * 255),
        b: round([b, b, d, v, v, c][module] * 255),
        a: round(a, 2),
    };
}

export function hsvaToRgbaString(hsva: HsvaColor) {
    const { r, g, b, a } = hsvaToRgba(hsva);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function invalidColorString(raw: string) {
    return new Error('Semi ColorPicker: error on static colorStringToValue method, input value is invalid: ' + raw);
}

export function hsvaStringToHsva(hsvString: string): HsvaColor {
    const matcher = /hsva?\(?\s*(-?\d*\.?\d+)(deg|rad|grad|turn)?[,\s]+(-?\d*\.?\d+)%?[,\s]+(-?\d*\.?\d+)%?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;
    const match = matcher.exec(hsvString);

    if (!match) throw invalidColorString(hsvString);

    return roundHsva({
        h: parseHue(match[1], match[2]),
        s: Number(match[3]),
        v: Number(match[4]),
        a: match[5] === undefined ? 1 : Number(match[5]) / (match[6] ? 100 : 1),
    });
}

export function rgbaStringToHsva(rgbaString: string): HsvaColor {
    return rgbaToHsva(rgbaStringToRgba(rgbaString));
}

export function rgbaStringToRgba(rgbaString: string): RgbaColor {
    const matcher = /rgba?\(?\s*(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;
    const match = matcher.exec(rgbaString);

    if (!match) throw invalidColorString(rgbaString);

    return {
        r: Number(match[1]) / (match[2] ? 100 / 255 : 1),
        g: Number(match[3]) / (match[4] ? 100 / 255 : 1),
        b: Number(match[5]) / (match[6] ? 100 / 255 : 1),
        a: match[7] === undefined ? 1 : Number(match[7]) / (match[8] ? 100 : 1),
    };
}
export const rgbStringToRgba = rgbaStringToRgba;

export const rgbStringToHsva = rgbaStringToHsva;

function format(number: number) {
    const hex = Math.round(number).toString(16);
    return hex.length < 2 ? '0' + hex : hex;
}

export function rgbaToHex({ r, g, b, a }: RgbaColor) {
    const percentToHex = (p) => {
        const intValue = Math.round((p / 100) * 255);
        const hexValue = intValue.toString(16);
        return hexValue.padStart(2, '0').toLowerCase();
    };
    if (a === undefined || a === 1) {
        return '#' + format(r) + format(g) + format(b);
    } else {
        return '#' + format(r) + format(g) + format(b) + percentToHex(a * 100);
    }
}

export function rgbaToHsva({ r, g, b, a }: RgbaColor): HsvaColor {
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);

    // prettier-ignore
    const hh = delta
        ? max === r
            ? (g - b) / delta
            : max === g
                ? 2 + (b - r) / delta
                : 4 + (r - g) / delta
        : 0;

    return {
        h: round(60 * (hh < 0 ? hh + 6 : hh)),
        s: round(max ? (delta / max) * 100 : 0),
        v: round((max / 255) * 100),
        a,
    };
}

function roundHsva(hsva: HsvaColor): HsvaColor {
    return {
        h: round(hsva.h),
        s: round(hsva.s),
        v: round(hsva.v),
        a: round(hsva.a, 2),
    };
}
