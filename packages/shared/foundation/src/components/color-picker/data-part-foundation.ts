import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import ColorPickerFoundation, { type ColorValue } from './foundation';
import type { ColorFormat, HsvaColor, RgbaColor } from './interface';
import { hexToRgba, rgbaToHex } from './utils/convert';
import split from './utils/split';

export interface DataPartBaseProps {
    currentColor: ColorValue;
    defaultFormat: ColorFormat;
    width: number;
    alpha?: boolean;
    eyeDropper: boolean;
    onChange: (color: HsvaColor | RgbaColor | string, format: ColorFormat) => void;
    onAlphaChange: (alpha: number) => void;
}

export interface DataPartBaseState {
    format: ColorFormat;
    inputValue: string;
}

export interface DataPartAdapter<P extends DataPartBaseProps = DataPartBaseProps> extends DefaultAdapter<P, DataPartBaseState> {
    notifyChange: (color: HsvaColor | RgbaColor | string, format: ColorFormat) => void;
    notifyAlphaChange: (alpha: number) => void;
}

export default class DataPartFoundation<P extends DataPartBaseProps = DataPartBaseProps> extends BaseFoundation<DataPartAdapter<P>, P, DataPartBaseState> {
    // an equal color object, such as a fresh controlled value, keeps what is being typed
    static override readonly propKeys = ['currentColor'];
    static override readonly propEquals = { currentColor: isEqual };

    /** A text box shows no opacity, so a value typed without one keeps the opacity of the current color */
    #hexWithCurrentAlpha(hex: string) {
        return rgbaToHex({ ...hexToRgba(hex), a: this.getProp('currentColor').rgba.a });
    }

    /** Whether the text box already says `color`, so it must not overwrite what is being typed */
    #isInputValueOf(color: ColorValue) {
        const { format, inputValue } = this.getStates();
        const parsed = this.#parseInputValue(inputValue);
        // a hex typed without '#' is not a match, so the sync completes it
        if (!parsed || (format === 'hex' && !inputValue.startsWith('#'))) {
            return false;
        }
        return isEqual(ColorPickerFoundation.getColorValue(parsed, format, Boolean(this.getProp('alpha'))), color);
    }

    #parseInputValue(value: string) {
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
    }

    static getInitialState(props: Pick<DataPartBaseProps, 'currentColor' | 'defaultFormat'>): DataPartBaseState {
        return { format: props.defaultFormat, inputValue: DataPartFoundation.getInputValue(props.currentColor, props.defaultFormat) };
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

    // the color the typed text produced must not rewrite the input, or its canonical text (no alpha, 6 digits) erases the next keystrokes
    override handlePropsChange() {
        const currentColor = this.getProp('currentColor');
        if (!this.#isInputValueOf(currentColor)) {
            this.setState({ inputValue: DataPartFoundation.getInputValue(currentColor, this.getState('format')) });
        }
    }

    handlePickValueWithStraw = async () => {
        if (!window.EyeDropper) {
            return;
        }
        const eyeDropper = new window.EyeDropper();

        try {
            // the signal aborts on unmount, cancelling a pick still open
            const { sRGBHex } = await eyeDropper.open({ signal: this.signal });
            // as rgba, not 8-digit hex: the hex round trip would quantize the kept opacity
            this.adapter.notifyChange({ ...hexToRgba(sRGBHex), a: this.getProp('currentColor').rgba.a }, 'rgba');
        } catch (e) {
            // AbortError means Esc or unmount; anything else is a real failure
            if (!(e instanceof DOMException && e.name === 'AbortError')) {
                throw e;
            }
        }
    };

    // the color goes out before the text is stored: both land in one commit, so handlePropsChange sees the typed text
    handleInputValueChange = (value: string) => {
        const parsed = this.#parseInputValue(value);
        if (parsed) {
            this.adapter.notifyChange(parsed, this.getState('format'));
        }
        this.setState({ inputValue: value });
    };

    handleAlphaInputChange = (percent: number) => {
        this.adapter.notifyAlphaChange(Number((percent / 100).toFixed(2)));
    };

    handleFormatChange = (format: ColorFormat) => {
        this.setState({
            format,
            inputValue: DataPartFoundation.getInputValue(this.getProp('currentColor'), format),
        });
    };
}
