import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import ColorPickerFoundation, { type ColorValue } from './foundation';
import type { ColorFormat } from './interface';
import { hexToRgba, rgbaToHex } from './utils/convert';
import split from './utils/split';

export interface DataPartBaseProps {
    currentColor: ColorValue;
    defaultFormat: ColorFormat;
    width: number;
    alpha?: boolean;
    foundation: ColorPickerFoundation;
    eyeDropper: boolean;
}

export interface DataPartBaseState {
    format: ColorFormat;
    inputValue: string;
}

export type DataPartAdapter<P extends DataPartBaseProps = DataPartBaseProps, S extends DataPartBaseState = DataPartBaseState> = DefaultAdapter<P, S>;

export default class DataPartFoundation<P extends DataPartBaseProps = DataPartBaseProps, S extends DataPartBaseState = DataPartBaseState> extends BaseFoundation<DataPartAdapter<P, S>, P, S> {
    constructor(adapter: DataPartAdapter<P, S>) {
        super({
            ...adapter,
        });
    }

    /** A text box shows no opacity, so a value typed without one keeps the opacity of the current color */
    #hexWithCurrentAlpha(hex: string) {
        return rgbaToHex({ ...hexToRgba(hex), a: this.getProp('currentColor').rgba.a });
    }

    static getInputValue(currentColor: ColorValue, format: ColorFormat) {
        const rgba = currentColor.rgba;
        const hsva = currentColor.hsva;
        const hex = currentColor.hex;
        if (format === 'rgba') {
            return `${rgba.r},${rgba.g},${rgba.b}`;
        } else if (format === 'hsva') {
            return `${hsva.h},${hsva.s},${hsva.v}`;
        } else {
            return hex.slice(0, 7);
        }
    }

    syncInputValue = () => {
        this.setState({
            inputValue: DataPartFoundation.getInputValue(this.getProp('currentColor'), this.getState('format')),
        });
    };

    /** Whether the text box already says `color`, so it must not overwrite what is being typed */
    isInputValueOf = (color: ColorValue) => {
        const { format, inputValue } = this.getStates();
        const parsed = this.getValueByInputValue(inputValue);
        // a hex typed without '#' is not a match, so the sync completes it
        if (!parsed || (format === 'hex' && !inputValue.startsWith('#'))) {
            return false;
        }
        return isEqual(ColorPickerFoundation.getColorValue(parsed, format, Boolean(this.getProp('alpha'))), color);
    };

    getValueByInputValue = (value: string) => {
        const { format } = this.getStates();
        if (format === 'rgba' || format === 'hsva') {
            const parsed = format === 'rgba' ? split(value, 'rgba') : split(value, 'hsva');
            if (!parsed) {
                return false;
            }
            const hasAlpha = value.split(',').filter((part) => part.trim() !== '').length >= 4;
            return hasAlpha ? parsed : { ...parsed, a: this.getProp('currentColor').rgba.a };
        } else if (format === 'hex') {
            if (!value.startsWith('#')) {
                value = '#' + value;
            }
            if (/^#[0-9a-f]{6}$/i.test(value)) {
                return this.#hexWithCurrentAlpha(value);
            }
            if (/^#[0-9a-f]{8}$/i.test(value)) {
                return value;
            }
        }
        return false;
    };

    handlePickValueWithStraw = async () => {
        const colorPickerFoundation = this.getProps().foundation;
        if (!window.EyeDropper) {
            return;
        }
        const eyeDropper = new window.EyeDropper();

        try {
            // the signal aborts on unmount, cancelling a pick still open
            const { sRGBHex } = await eyeDropper.open({ signal: this.signal });
            // as rgba, not 8-digit hex: the hex round trip would quantize the kept opacity
            colorPickerFoundation.handleChange({ ...hexToRgba(sRGBHex), a: this.getProp('currentColor').rgba.a }, 'rgba');
        } catch (e) {
            // AbortError means Esc or unmount; anything else is a real failure
            if (!(e instanceof DOMException && e.name === 'AbortError')) {
                throw e;
            }
        }
    };

    handleInputValueChange = (value: string) => {
        this._adapter.setState({ inputValue: value });
    };

    handleFormatChange = (format: ColorFormat) => {
        this.setState({
            format,
            inputValue: DataPartFoundation.getInputValue(this.getProp('currentColor'), format),
        });
    };
}
