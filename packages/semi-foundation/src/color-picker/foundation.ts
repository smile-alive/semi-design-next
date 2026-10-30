import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { ColorFormat, HsvaColor, RgbaColor } from './interface';
import { hexToHsva, hexToRgba, hsvaStringToHsva, hsvaToHex, hsvaToRgba, invalidColorString, rgbaToHex, rgbaToHsva, rgbStringToHsva, rgbStringToRgba } from './utils/convert';

const HEX_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export type ColorValue = {
    hsva: HsvaColor;
    rgba: RgbaColor;
    hex: string;
};
export interface ColorPickerProps {
    eyeDropper?: boolean;
    defaultValue?: ColorValue;
    /** `null` is a controlled empty value: shows `defaultValue` and only reports changes */
    value?: ColorValue | null;
    onChange?: (value: ColorValue) => void;
    alpha?: boolean;
    width?: number;
    height?: number;
    defaultFormat?: ColorFormat;
}

export interface ColorPickerState {
    currentColor: ColorValue;
}

export interface ColorPickerAdapter<P extends ColorPickerProps = ColorPickerProps, S extends ColorPickerState = ColorPickerState> extends DefaultAdapter<P, S> {
    notifyChange: (value: ColorValue) => void;
}

export default class ColorPickerFoundation<P extends ColorPickerProps = ColorPickerProps, S extends ColorPickerState = ColorPickerState> extends BaseFoundation<ColorPickerAdapter<P, S>, P, S> {
    constructor(adapter: ColorPickerAdapter<P, S>) {
        super({
            ...adapter,
        });
    }

    #commit(color: ColorValue) {
        this.adapter.notifyChange(color);
        if (!this.isControlledComponent('value')) {
            this.adapter.setState({ currentColor: color });
        }
    }

    protected handleChangeH(currentColor: ColorValue, newH: number) {
        const hsva = { ...currentColor.hsva, h: newH };
        this.#commit({ rgba: hsvaToRgba(hsva), hsva, hex: hsvaToHex(hsva) });
    }

    protected handleChangeA(currentColor: ColorValue, newAlpha: number) {
        const a = this.getProp('alpha') ? newAlpha : 1;
        const rgba = { ...currentColor.rgba, a };
        this.#commit({ rgba, hex: rgbaToHex(rgba), hsva: { ...currentColor.hsva, a } });
    }

    protected getCurrentColor(): ColorValue {
        return this.isControlledComponent('value') ? (this.getProp('value') ?? this.getProp('defaultValue')) : this.getState('currentColor');
    }

    /** The full color of a value given in `format`; without alpha support the opacity is dropped */
    static getColorValue(color: HsvaColor | RgbaColor | string, format: ColorFormat, alpha: boolean): ColorValue {
        if (format === 'hsva') {
            const hsva = alpha ? (color as HsvaColor) : { ...(color as HsvaColor), a: 1 };
            return { hsva, rgba: hsvaToRgba(hsva), hex: hsvaToHex(hsva) };
        } else if (format === 'rgba') {
            const rgba = alpha ? (color as RgbaColor) : { ...(color as RgbaColor), a: 1 };
            return { rgba, hsva: rgbaToHsva(rgba), hex: rgbaToHex(rgba) };
        } else if (format === 'hex') {
            const hex = alpha ? (color as string) : (color as string).slice(0, 7);
            return { hex, hsva: hexToHsva(hex), rgba: hexToRgba(hex) };
        }
        throw new Error('format error');
    }

    /** Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsv()` and `hsva()`; anything else throws */
    static colorStringToValue(raw: string): ColorValue {
        if (HEX_PATTERN.test(raw)) {
            const hex = raw.length <= 5 ? '#' + raw.slice(1).replace(/./g, '$&$&') : raw;
            return { hsva: hexToHsva(hex), rgba: hexToRgba(hex), hex };
        } else if (raw.startsWith('rgb')) {
            const rgba = rgbStringToRgba(raw);
            if (![rgba.r, rgba.g, rgba.b].every((c) => c >= 0 && c <= 255) || !(rgba.a >= 0 && rgba.a <= 1)) {
                throw invalidColorString(raw);
            }
            return { hsva: rgbStringToHsva(raw), rgba, hex: rgbaToHex(rgba) };
        } else if (raw.startsWith('hsv')) {
            const hsva = hsvaStringToHsva(raw);
            if (![hsva.s, hsva.v].every((c) => c >= 0 && c <= 100) || !(hsva.a >= 0 && hsva.a <= 1)) {
                throw invalidColorString(raw);
            }
            return { hsva, rgba: hsvaToRgba(hsva), hex: hsvaToHex(hsva) };
        }
        throw invalidColorString(raw);
    }

    static getHandlePositionByHSVA(hsva: HsvaColor, { width, height }: { width: number; height: number }, handleSize: number) {
        const defaultColorPosition = { x: (hsva.s / 100) * width, y: (1 - hsva.v / 100) * height };
        return { x: defaultColorPosition.x - handleSize / 2, y: defaultColorPosition.y - handleSize / 2 };
    }

    /**
     * APG slider keys: arrows step by 1, PageUp/PageDown by 10, Home/End jump to 0/max.
     * Returns null for any other key.
     */
    static getValueByKey(key: string, value: number, max: number) {
        const current = Math.round(value);
        switch (key) {
            case 'ArrowRight':
            case 'ArrowUp':
                return clamp(current + 1, 0, max);
            case 'ArrowLeft':
            case 'ArrowDown':
                return clamp(current - 1, 0, max);
            case 'PageUp':
                return clamp(current + 10, 0, max);
            case 'PageDown':
                return clamp(current - 10, 0, max);
            case 'Home':
                return 0;
            case 'End':
                return max;
            default:
                return null;
        }
    }

    /** After a controlled `value` is dropped, the uncontrolled state restarts from `defaultValue` */
    resetToDefault = () => {
        this.adapter.setState({ currentColor: this.getProp('defaultValue') });
    };

    handleChange = (color: HsvaColor | RgbaColor | string, format: ColorFormat) => {
        this.#commit(ColorPickerFoundation.getColorValue(color, format, Boolean(this.getProp('alpha'))));
    };

    handleAlphaChangeByHandle = (newAlpha: { a: number }) => {
        this.handleChangeA(this.getCurrentColor(), newAlpha.a);
    };

    handleColorChangeByHandle(newHue: { h: number }) {
        this.handleChangeH(this.getCurrentColor(), newHue.h);
    }
}
