// compat toString maps null/undefined to '' and keeps the sign of -0
import { toString } from 'es-toolkit/compat';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import FocusTrapHandle from '../utils/focus-handle';
import { isComposing } from '../utils/key-code';
import { isSecondaryPress } from '../utils/pointer';
import { recordCaretTail, restoreCaretTail } from './caret';
import { numbers } from './constants';

export interface ScientificNotationConfig {
    /** Number of digits threshold to trigger scientific notation display */
    threshold?: number;
}

/** The props the foundation reads with getProps */
export interface InputNumberBaseProps {
    value?: number | string;
    defaultValue?: number | string;
    currency?: string | boolean;
    defaultCurrency?: string;
    currencyDisplay?: 'code' | 'symbol' | 'name';
    localeCode?: string;
    showCurrencySymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    precision?: number;
    scientificNotation?: boolean | ScientificNotationConfig;
    formatter?: (value: number | string) => string;
    parser?: (value: string) => string;
    min?: number;
    max?: number;
    step?: number;
    shiftStep?: number;
    pressInterval?: number;
    pressTimeout?: number;
    keepFocus?: boolean;
    innerButtons?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    preventScroll?: boolean;
}

/** Whether a step toward `bound` is refused; a value given out of range is shown as is, so it can be past the bound */
export function reachesBound(number: number | null | undefined, bound: number | undefined, direction: 1 | -1) {
    return number != null && bound != null && (direction > 0 ? number >= bound : number <= bound);
}

/** The members of a keyboard event the foundation reads; DOM events and React synthetic events both satisfy it */
export type InputNumberKeyEvent = Pick<KeyboardEvent, 'key' | 'preventDefault' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'> & Parameters<typeof isComposing>[0];

/** The members of a step button's pointerdown the foundation reads, which it keeps for the repeats while the button is held */
export type InputNumberPressEvent = Pick<PointerEvent, 'button' | 'currentTarget' | 'pointerId' | 'shiftKey' | 'stopPropagation'>;

/** FE and KE are the host's focus and keydown events, which the foundation passes on to the callbacks */
export interface InputNumberAdapter<P extends InputNumberBaseProps = InputNumberBaseProps, S extends BaseInputNumberState = BaseInputNumberState, FE = unknown, KE = unknown> extends DefaultAdapter<P, S> {
    setValue: (value: string, cb?: () => void) => void;
    setNumber: (number: number | null, cb?: () => void) => void;
    setFocusing: (focusing: boolean, cb?: () => void) => void;
    setHovering: (hovering: boolean) => void;
    notifyChange: (value: string | number, e?: any) => void;
    notifyNumberChange: (value: number, e?: any) => void;
    notifyBlur: (e: FE) => void;
    notifyFocus: (e: FE) => void;
    notifyUpClick: (value: string, e: any) => void;
    notifyDownClick: (value: string, e: any) => void;
    notifyKeyDown: (e: KE) => void;
    /** The native input */
    getInput: () => HTMLInputElement | null;
}

const SCIENTIFIC_NOTATION = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/;

export interface BaseInputNumberState {
    /** The text shown in the input */
    value?: string;
    number?: number | null;
    focusing?: boolean;
    hovering?: boolean;
}

export default class InputNumberFoundation<P extends InputNumberBaseProps = InputNumberBaseProps, S extends BaseInputNumberState = BaseInputNumberState, FE = unknown, KE extends InputNumberKeyEvent = InputNumberKeyEvent> extends BaseFoundation<InputNumberAdapter<P, S, FE, KE>, P, S> {
    #intervalHasRegistered: boolean;
    #interval: any;
    #timerHasRegistered: boolean;
    #timer: any;
    #currencyParts: { key: string; decimalPoint?: string; currencySymbol: string } | undefined;
    // set by a step, cleared by focusing or typing: a controlled value arriving right after a step is formatted
    #lastChangeWasStep = false;
    // the text after the caret, so the caret can follow it after formatting
    #caretTail: string | undefined;

    #recordCaret() {
        this.#caretTail = recordCaretTail(this.adapter.getInput());
    }

    /** Puts the caret back in front of the text that followed it before the last change */
    #restoreCaret() {
        restoreCaretTail(this.adapter.getInput(), this.#caretTail);
    }

    #focusInput() {
        const input = this.adapter.getInput();
        if (input && FocusTrapHandle.getActiveElement(input) !== input) {
            input.focus({ preventScroll: this.getProp('preventScroll') });
        }
    }

    #getFinalCurrency() {
        const { currency } = this.getProps();
        return typeof currency === 'string' ? currency : this.getProp('defaultCurrency');
    }

    /** Commits the formatted text a step produced */
    #commitStep(v = '', event: unknown = null, updateCb: () => void = null) {
        const parsed = this.doParse(v, false);
        const isValidNumber = !isNaN(parsed);

        // before the state write: notifyNumberChange compares with the number shown so far
        if (!(isValidNumber && parsed === this.getState('number'))) {
            this.#notifyChange(isValidNumber ? parsed : v, event);
        }

        if (!this.isControlled()) {
            if (isValidNumber) {
                this.adapter.setNumber(parsed);
            }
            this.adapter.setValue(v, updateCb);
        }

        if (this.getProp('keepFocus')) {
            this.adapter.setFocusing(true, () => {
                // refocusing fires handleInputFocus, which clears the step mark, so mark the step afterwards
                if (this.#lastChangeWasStep && this.getState('focusing')) {
                    this.#focusInput();
                }
                this.#lastChangeWasStep = true;
            });
        }
    }

    #registerInterval(cb?: (...args: any) => void) {
        const pressInterval = this.getProp('pressInterval') || numbers.DEFAULT_PRESS_INTERVAL;
        this.#unregisterInterval();
        this.#intervalHasRegistered = true;
        this.#interval = setInterval(() => {
            if (typeof cb === 'function' && this.#intervalHasRegistered) {
                cb();
            }
        }, pressInterval);
    }

    #unregisterInterval() {
        if (this.#interval) {
            this.#intervalHasRegistered = false;
            clearInterval(this.#interval);
            this.#interval = null;
        }
    }

    #registerTimer(cb: (...args: any[]) => void) {
        const pressTimeout = this.getProp('pressTimeout') ?? numbers.DEFAULT_PRESS_TIMEOUT;
        this.#unregisterTimer();
        this.#timerHasRegistered = true;
        this.#timer = setTimeout(() => {
            if (this.#timerHasRegistered && typeof cb === 'function') {
                cb();
            }
        }, pressTimeout);
    }

    #unregisterTimer() {
        if (this.#timer) {
            this.#timerHasRegistered = false;
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }

    // cached by key: parsing runs on every keystroke
    #getCurrencyParts() {
        const { localeCode, currencyDisplay } = this.getProps();
        const currency = this.#getFinalCurrency();
        const key = `${localeCode}|${currency}|${currencyDisplay}`;
        if (this.#currencyParts?.key !== key) {
            const parts = new Intl.NumberFormat(localeCode, {
                style: 'currency',
                currency,
                currencyDisplay,
                // currencies without minor units (JPY, VND, IDR) print no decimal part otherwise
                minimumFractionDigits: 1,
            }).formatToParts(1234.5);
            this.#currencyParts = {
                key,
                decimalPoint: parts.find((part) => part.type === 'decimal')?.value,
                currencySymbol: parts.find((part) => part.type === 'currency')?.value ?? '',
            };
        }
        return this.#currencyParts;
    }

    /**
     * The text a step shows: a focused input is being edited, so it shows the plain number, not the currency format.
     */
    #formatStep(num: number) {
        return this.doFormat(num, true, this.isCurrency() && !this.getState('focusing'));
    }

    #getInitialPropValue() {
        const { defaultValue, value } = this.getProps();
        return this.isControlled() ? value : defaultValue;
    }

    /**
     * The text and number of the first render. An out-of-range value is shown as given: min and max correct it, and
     * report it, only when the user interacts (typing, blur, step, clear), as in antd, Arco and TDesign.
     */
    #getFirstRenderValue(): { value: string; number: number | null } {
        const propsValue = this.#getInitialPropValue();
        if (propsValue == null || propsValue === '') {
            return { value: '', number: null };
        }

        // format first so parser/formatter pairs like percentage (1 -> 100) work on mount; currency keeps the value
        // as is because parseInternationalCurrency expects locale-formatted strings
        const valueStr = this.isCurrency() ? propsValue : typeof propsValue === 'number' ? this.doFormat(propsValue) : toString(propsValue);
        const parsedNum = this.doParse(valueStr, false, true);
        if (Number.isNaN(parsedNum)) {
            return { value: '', number: null };
        }
        return { value: this.doFormat(parsedNum, true, true), number: parsedNum };
    }

    #getPrecLen(num: string | number) {
        if (typeof num !== 'string') {
            const n = Number(num || '');
            if (!isFinite(n) || n === 0) return 0;
            const s = Math.abs(n).toString();
            // numbers below 1e-6 stringify in exponent form, e.g. "1e-8"
            if (/e/i.test(s)) {
                const [mantissa, exp] = s.split(/e/i);
                const mantissaDecimals = (mantissa.split('.')[1] || '').length;
                return Math.max(0, mantissaDecimals - parseInt(exp, 10));
            }
            num = s;
        }
        const idx = num.indexOf('.') + 1;
        return idx ? num.length - idx : 0;
    }

    #adjustPrec(num: string | number) {
        const precision = this.getProp('precision');
        if (typeof precision === 'number' && num !== '' && num !== null && !Number.isNaN(Number(num))) {
            num = Number(num).toFixed(precision);
        }
        return toString(num);
    }

    #isScientificNotation() {
        const { scientificNotation } = this.getProps();
        return scientificNotation === true || (typeof scientificNotation === 'object' && scientificNotation !== null);
    }

    #getScientificNotationThreshold() {
        const { scientificNotation } = this.getProps();
        if (typeof scientificNotation === 'object' && scientificNotation !== null) {
            const t = scientificNotation.threshold;
            return typeof t === 'number' && Number.isFinite(t) && t >= 1 ? t : 15;
        }
        return 15;
    }

    #toScientificNotation(num: number) {
        const threshold = this.#getScientificNotationThreshold();
        const absNum = Math.abs(num);
        const numStr = String(absNum);

        const hasExp = /e/i.test(numStr);
        const significantDigits = numStr.replace(/[.\-+eE]/g, '').replace(/^0+/, '');

        if ((hasExp || significantDigits.length >= threshold) && absNum !== 0) {
            const fractionDigits = Math.max(0, Math.min(100, Math.floor(threshold) - 1));
            const exp = num.toExponential(fractionDigits);
            return exp.replace(/(\.\d*?)0+e/, '$1e').replace(/\.e/, 'e');
        }

        return String(num);
    }

    /**
     * The exponent form keeps only `threshold` digits, so the number is reported with all its digits.
     */
    #reportedText(shown: string, number: number | null) {
        if (this.#isScientificNotation() && !this.isCurrency() && typeof number === 'number' && !isNaN(number)) {
            return this.doFormat(number, true, false);
        }
        return shown;
    }

    #step(direction: 1 | -1, event: InputNumberPressEvent) {
        const value = direction > 0 ? this.add(null, event) : this.minus(null, event);
        this.#commitStep(value, event);
        if (direction > 0) {
            this.adapter.notifyUpClick(value, event);
        } else {
            this.adapter.notifyDownClick(value, event);
        }
    }

    #canStep(direction: 1 | -1) {
        const { readonly, disabled, min, max } = this.getProps();
        return !readonly && !disabled && !reachesBound(this.getState('number'), direction > 0 ? max : min, direction);
    }

    #press(direction: 1 | -1, event: InputNumberPressEvent) {
        const { currentTarget } = event;
        if (!(currentTarget instanceof Element) || isSecondaryPress(event) || !this.#canStep(direction)) {
            return;
        }
        this.#lastChangeWasStep = true;
        currentTarget.setPointerCapture(event.pointerId);
        event.stopPropagation();
        this.#step(direction, event);
        this.#registerTimer(() => {
            this.#registerInterval(() => {
                if (!this.#canStep(direction)) {
                    this.handlePressEnd();
                    return;
                }
                this.#step(direction, event);
            });
        });
    }

    #notifyChange(value: string | number | null, e: unknown) {
        if (value == null || value === '') {
            this.adapter.notifyChange('', e);
        } else {
            const parsedNum = this.toNumber(value, true);

            if (typeof parsedNum === 'number' && !isNaN(parsedNum)) {
                this.adapter.notifyChange(parsedNum, e);
                this.#notifyNumberChange(parsedNum, e);
            } else {
                this.adapter.notifyChange(this.afterParser(value), e);
            }
        }
    }

    #notifyNumberChange(value: number, e: unknown) {
        const { number } = this.getStates();
        if (this.isValidNumber(value) && value !== number) {
            this.adapter.notifyNumberChange(value, e);
        }
    }

    protected isControlled() {
        return this.isControlledComponent('value');
    }

    protected isCurrency() {
        const { currency } = this.getProps();
        return currency === true || (typeof currency === 'string' && currency.trim() !== '');
    }

    protected add(step?: number, event?: Pick<KeyboardEvent, 'shiftKey'>): string {
        const pressShift = event && event.shiftKey;
        const propStep = pressShift ? this.getProp('shiftStep') : this.getProp('step');
        step = step == null ? propStep : Number(step);
        const curVal = this.getState('number');
        let curNum = this.toNumber(curVal) || 0;
        const min = this.getProp('min');
        const max = this.getProp('max');
        const minPrecLen = this.#getPrecLen(min);
        const maxPrecLen = this.#getPrecLen(max);
        const curPrecLen = this.#getPrecLen(curNum);
        const stepPrecLen = this.#getPrecLen(step);
        const scale = Math.pow(10, Math.max(minPrecLen, maxPrecLen, curPrecLen, stepPrecLen));

        // scale to integers to avoid floating point error
        curNum = Math.round(curNum * scale + step * scale) / scale;
        if (typeof min === 'number' && min > curNum) {
            curNum = min;
        }
        if (typeof max === 'number' && max < curNum) {
            curNum = max;
        }

        return this.#formatStep(curNum);
    }

    protected minus(step?: number, event?: Pick<KeyboardEvent, 'shiftKey'>): string {
        const pressShift = event && event.shiftKey;
        const propStep = pressShift ? this.getProp('shiftStep') : this.getProp('step');
        step = step == null ? propStep : Number(step);
        return this.add(-step, event);
    }

    protected formatCurrency(value: number | string) {
        const { localeCode, minimumFractionDigits, precision, maximumFractionDigits, currencyDisplay, showCurrencySymbol } = this.getProps();

        let formattedValue = value;
        if (typeof value === 'string' && Number.isNaN(Number(value))) {
            formattedValue = this.parseInternationalCurrency(value);
        }

        const formatter = new Intl.NumberFormat(localeCode, {
            style: 'currency',
            currency: this.#getFinalCurrency(),
            currencyDisplay: currencyDisplay,
            // 0 is a digit count too (a bare `||` would fall back to the currency's own two decimals)
            minimumFractionDigits: minimumFractionDigits ?? precision,
            maximumFractionDigits: maximumFractionDigits ?? precision,
        });

        const formatted = formatter.format(Number(formattedValue));
        return showCurrencySymbol ? formatted : formatted.replace(this.#getCurrencyParts().currencySymbol, '').trim();
    }

    /** `forDisplay` formats for the unfocused input: currency format and scientific notation apply only then */
    protected doFormat(value: string | number = 0, needAdjustPrec = true, forDisplay = false): string {
        const { formatter } = this.getProps();
        let str;

        if (this.isCurrency() && forDisplay) {
            str = this.formatCurrency(value);
        } else if (needAdjustPrec) {
            str = this.#adjustPrec(value);
        } else {
            str = toString(value);
        }

        if (this.#isScientificNotation() && forDisplay && !this.isCurrency()) {
            const numValue = typeof value === 'number' ? value : parseFloat(str);
            if (!isNaN(numValue) && isFinite(numValue)) {
                str = this.#toScientificNotation(numValue);
            }
        }

        if (typeof formatter === 'function') {
            str = formatter(str);
        }
        return str;
    }

    protected clamp(current: number) {
        const { min, max } = this.getProps();

        if (current < min) {
            return min;
        } else if (current > max) {
            return max;
        }
        return current;
    }

    protected parseInternationalCurrency(currencyString: string) {
        const { decimalPoint, currencySymbol } = this.#getCurrencyParts();
        let cleaned = currencyString.replace(currencySymbol, '').replace(new RegExp(`[^\\d${decimalPoint ?? ''}\\-]`, 'g'), '');

        if (decimalPoint && decimalPoint !== '.') {
            cleaned = cleaned.replace(decimalPoint, '.');
        }
        return parseFloat(cleaned);
    }

    protected doParse(value: string | number, needCheckPrec = true, needAdjustPrec = false, needAdjustMaxMin = false) {
        if (this.isCurrency() && typeof value === 'string') {
            value = this.parseInternationalCurrency(value);
        }

        if (typeof value === 'number') {
            if (needAdjustMaxMin) {
                value = this.clamp(value);
            }
            if (needAdjustPrec) {
                value = this.#adjustPrec(value);
            }
            return Number(value);
        }

        const parser = this.getProp('parser');

        if (typeof parser === 'function') {
            // a JS user's parser may return a number although the type says string
            const parsedValue: string | number = parser(value);
            value = typeof parsedValue === 'number' ? toString(parsedValue) : parsedValue;
        }

        if (typeof value === 'string' && SCIENTIFIC_NOTATION.test(value.trim())) {
            const scientificNum = parseFloat(value.trim());
            if (!isNaN(scientificNum)) {
                if (needAdjustMaxMin) {
                    return this.clamp(scientificNum);
                }
                if (needAdjustPrec) {
                    return Number(this.#adjustPrec(scientificNum));
                }
                return scientificNum;
            }
        }

        if (needCheckPrec && typeof value === 'string') {
            const zeroIsValid = !value.includes('.') || value === '0' || value.lastIndexOf('0') < value.length - 1;
            const dotIsValid = value.lastIndexOf('.') < value.length - 1 && value.split('.').length < 3;

            if (!zeroIsValid || !dotIsValid) {
                return NaN;
            }
        }

        if (needAdjustPrec) {
            value = this.#adjustPrec(value);
        }

        if (typeof value === 'string' && value.length) {
            return needAdjustMaxMin ? this.clamp(Number(value)) : Number(value);
        }

        return NaN;
    }

    protected afterParser(value: string | number) {
        const parser = this.getProp('parser');
        if (typeof value === 'string' && typeof parser === 'function') {
            return toString(parser(value));
        }
        return toString(value);
    }

    protected toNumber(value: number | string, needAdjustPrec = true) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const { parser } = this.getProps();

            if (this.isCurrency()) {
                value = this.parseInternationalCurrency(value);
            }

            if (typeof parser === 'function') {
                const parsedValue: string | number = parser(toString(value));
                value = typeof parsedValue === 'number' ? toString(parsedValue) : parsedValue;
            }
            if (needAdjustPrec) {
                value = this.#adjustPrec(value);
            }
        }
        return Number(value);
    }

    /**
     * True for a number within [min, max] whose decimal length is at most `precision` (when `needCheckPrec`).
     */
    protected isValidNumber(num: number, needCheckPrec = true) {
        if (typeof num === 'number' && !isNaN(num)) {
            const { min, max, precision } = this.getProps();
            const numPrec = this.#getPrecLen(num);
            const precIsValid = needCheckPrec ? (typeof precision === 'number' && numPrec <= precision) || typeof precision !== 'number' : true;

            if (num >= min && num <= max && precIsValid) {
                return true;
            }
        }
        return false;
    }

    /** ARIA takes a plain decimal, so 1.2e-7 is written out in full; an empty or infinite number has none */
    static getAriaValueNow(number?: number | null): string | undefined {
        return number != null && Number.isFinite(number) ? number.toLocaleString('en-US', { maximumFractionDigits: 100, useGrouping: false }) : undefined;
    }

    /** The first render's state, so the formatted value shows without a second render (#2548); there is no init() */
    static getInitialState(props: Record<string, any>): BaseInputNumberState {
        // shortcut: the constructor wants a whole adapter, so the two getters are asserted into one; upgrade by making
        // the parse and format methods static functions of the props
        const readerAdapter = {
            getProp: (key: string) => props[key],
            getProps: () => props,
        } satisfies Pick<InputNumberAdapter, 'getProp' | 'getProps'>;
        const reader = new InputNumberFoundation(readerAdapter as InputNumberAdapter);
        return { ...reader.#getFirstRenderValue(), focusing: Boolean(props.autofocus), hovering: false };
    }

    override destroy() {
        this.#unregisterInterval();
        this.#unregisterTimer();
    }

    handleInputFocus = (e: FE) => {
        const value = this.getState('value');

        if (value !== '') {
            if (this.#isScientificNotation() && !this.isCurrency()) {
                const strVal = toString(value);
                if (SCIENTIFIC_NOTATION.test(strVal.trim())) {
                    // the exponent form keeps only `threshold` digits, the stored number keeps them all
                    const number = this.getState('number');
                    const parsedNum = typeof number === 'number' ? number : this.doParse(strVal, false, false, false);
                    if (!Number.isNaN(parsedNum)) {
                        const fullNumberStr = this.doFormat(parsedNum, true, false);
                        this.adapter.setValue(fullNumberStr);
                    }
                }
            }
        }
        this.#recordCaret();
        this.adapter.setFocusing(true);
        this.#lastChangeWasStep = false;
        this.adapter.notifyFocus(e);
    };

    handleInputChange = (value: string, event: unknown) => {
        this.#lastChangeWasStep = false;
        const parsedNum = this.doParse(value, true, true, true);
        const toNum = this.doParse(value, false, false, false);
        const valueAfterParser = this.afterParser(value);
        this.#recordCaret();

        let notifyVal;
        let num = toNum;
        let formattedNum = value;
        if (value === '') {
            if (!this.isControlled()) {
                num = null;
            }
        } else if (this.isValidNumber(toNum) && this.isValidNumber(parsedNum)) {
            notifyVal = toNum;
            formattedNum = this.doFormat(toNum, false);
        } else {
            if (typeof toNum === 'number' && !isNaN(toNum)) {
                formattedNum = this.doFormat(toNum, false);
                const dotIndex = valueAfterParser.lastIndexOf('.');
                const lengthAfterDot = valueAfterParser.length - 1 - dotIndex;
                const precLength = this.#getPrecLen(toNum);
                if (!precLength) {
                    const dotBeginStr = dotIndex > -1 ? valueAfterParser.slice(dotIndex) : '';
                    formattedNum += dotBeginStr;
                } else if (precLength < lengthAfterDot) {
                    for (let i = 0; i < lengthAfterDot - precLength; i++) {
                        formattedNum += '0';
                    }
                }
                num = toNum;
            } else {
                formattedNum = this.doFormat(valueAfterParser, false);
            }

            notifyVal = this.isControlled() ? formattedNum : valueAfterParser;
        }

        // before the state write: notifyNumberChange compares with the number shown so far
        this.#notifyChange(notifyVal, event);

        if (!this.isControlled() && (num === null || (typeof num === 'number' && !isNaN(num)))) {
            this.adapter.setNumber(num);
        }

        this.adapter.setValue(this.isControlled() && !this.isCurrency() ? formattedNum : this.doFormat(valueAfterParser, false), () => {
            this.#restoreCaret();
        });
    };

    handleInputKeyDown = (event: KE) => {
        if (this.getProp('readonly')) {
            this.adapter.notifyKeyDown(event);
            return;
        }
        // Alt, Ctrl and Meta combinations are browser or OS shortcuts (Ctrl+Home moves the caret, Cmd+ArrowUp scrolls)
        const key = isComposing(event) || event.altKey || event.ctrlKey || event.metaKey ? '' : event.key;

        // APG Spinbutton: Home and End jump to the bounds that exist; without one they keep moving the caret.
        // Shift extends the text selection instead.
        const bound = event.shiftKey ? null : key === 'Home' ? this.getProp('min') : key === 'End' ? this.getProp('max') : null;
        const jumpsToBound = typeof bound === 'number' && Number.isFinite(bound);

        if ((key === 'ArrowUp' || key === 'ArrowDown') && !this.#canStep(key === 'ArrowUp' ? 1 : -1)) {
            event.preventDefault();
        } else if (key === 'ArrowUp' || key === 'ArrowDown' || jumpsToBound) {
            this.#lastChangeWasStep = true;
            this.#recordCaret();
            const formattedVal = jumpsToBound ? this.#formatStep(bound) : key === 'ArrowUp' ? this.add(null, event) : this.minus(null, event);

            this.#commitStep(formattedVal, event, () => {
                this.#restoreCaret();
            });

            event.preventDefault();
        }

        this.adapter.notifyKeyDown(event);
    };

    handleInputBlur = (e: FE) => {
        const currentValue = toString(this.getState('value'));
        let currentNumber = this.getState('number');

        if (currentNumber != null || (currentValue != null && currentValue !== '')) {
            const parsedNum = this.doParse(currentValue, false, true, true);

            let numHasChanged = false;
            let strHasChanged = false;
            let willSetNum, willSetVal;

            if (this.isValidNumber(parsedNum) && currentNumber !== parsedNum) {
                willSetNum = parsedNum;
                if (!this.isControlled()) {
                    currentNumber = willSetNum;
                }
                numHasChanged = true;
            }

            // text such as "1000CNY" parses to NaN, but min and max still apply to the number parseFloat extracts
            if (!this.isValidNumber(parsedNum)) {
                const extractedNum = parseFloat(currentValue);
                if (!isNaN(extractedNum)) {
                    const limitedNum = this.clamp(extractedNum);
                    if (limitedNum !== currentNumber) {
                        willSetNum = limitedNum;
                        if (!this.isControlled()) {
                            currentNumber = willSetNum;
                        }
                        numHasChanged = true;
                    }
                } else if (typeof currentNumber === 'number' && !isNaN(currentNumber)) {
                    const limitedNum = this.clamp(currentNumber);
                    if (limitedNum !== currentNumber) {
                        willSetNum = limitedNum;
                        if (!this.isControlled()) {
                            currentNumber = willSetNum;
                        }
                        numHasChanged = true;
                    }
                }
            }

            const currentFormattedNum = this.doFormat(currentNumber, true, true);

            if (currentFormattedNum !== currentValue) {
                willSetVal = currentFormattedNum;
                strHasChanged = true;
            }

            if (strHasChanged || numHasChanged) {
                const reported = willSetVal != null ? this.#reportedText(willSetVal, currentNumber) : willSetNum;
                // a focused number shows all its digits, so blurring it into the exponent form changes nothing to report
                if (numHasChanged || reported !== currentValue) {
                    this.#notifyChange(reported, e);
                }

                if (willSetVal != null) {
                    this.adapter.setValue(willSetVal);
                }

                if (willSetNum != null && !this.isControlled()) {
                    this.adapter.setNumber(willSetNum);
                }
            }
        }
        this.adapter.setFocusing(false);
        this.adapter.notifyBlur(e);
    };

    handleInputMouseEnter = () => {
        this.adapter.setHovering(true);
    };

    handleInputMouseLeave = () => {
        this.adapter.setHovering(false);
    };

    handleInputMouseMove = () => {
        if (!this.getState('hovering')) {
            this.adapter.setHovering(true);
        }
    };

    /** Ends the repeat of a held button; follows pointerup and pointercancel */
    handlePressEnd = () => {
        this.#unregisterInterval();
        this.#unregisterTimer();
    };

    /**
     * Under keepFocus or innerButtons a press on a step button never blurs the input, even when it steps nothing. This
     * belongs on mousedown: cancelling pointerdown would also suppress the mousedown that outside-click listeners of
     * other open popups wait for.
     */
    handleStepMouseDown = (event: Pick<Event, 'preventDefault'>) => {
        if (this.getProp('keepFocus') || this.getProp('innerButtons')) {
            event.preventDefault();
        }
    };

    handleUpPress = (event: InputNumberPressEvent) => {
        this.#press(1, event);
    };

    handleDownPress = (event: InputNumberPressEvent) => {
        this.#press(-1, event);
    };

    /**
     * A changed controlled `value`, after the commit that received it. It never notifies: the parent already holds
     * this value, and an out-of-range one is shown as given until the user interacts.
     *
     * While focused the typed text stays: a number only updates `number`, kept within min and max like the text will
     * be on blur (and the text right after a step), an unparsable value replaces the text. Otherwise the value is
     * formatted like on blur, except that it is not clamped, and an unparsable one empties it.
     */
    handleValueChange = (value: number | string) => {
        let states: BaseInputNumberState;
        let callback: () => void;

        if (value == null || value === '') {
            states = { value: '', number: null };
        } else {
            const valueStr = typeof value === 'number' ? this.doFormat(value) : value;
            const parsedNum = this.doParse(valueStr, false, true);
            const toNum = typeof value === 'number' ? value : this.doParse(valueStr, false, false, false);

            if (this.getState('focusing')) {
                const limitedNum = this.clamp(parsedNum);
                if (!Number.isNaN(limitedNum) && limitedNum !== this.getState('number')) {
                    states = { number: limitedNum };
                    if (this.#lastChangeWasStep) {
                        states.value = this.doFormat(limitedNum, true);
                    }
                    callback = () => this.#restoreCaret();
                } else if (!Number.isNaN(toNum)) {
                    states = { value: this.doFormat(toNum, false) };
                } else {
                    states = { value: valueStr };
                }
            } else if (!Number.isNaN(parsedNum)) {
                states = { number: parsedNum, value: this.doFormat(parsedNum, true, true) };
            } else {
                states = { number: null, value: '' };
            }
        }

        this.setState(states, callback);
    };
}
