import { isValid, type Locale } from 'date-fns';
import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { zonedTimeToUtc } from '../../utils/date-fns-extra';
import isValidTimeZone from '../../utils/is-valid-time-zone';
import { fromWallTime, parseReference, toWallTime } from '../../utils/zoned-time';
import ComboboxFoundation from './combox-foundation';
import { cssClasses, strings, type PanelType } from './constants';
import { formatToString, parseToDate, hourIsDisabled, minuteIsDisabled, secondIsDisabled, transformToArray, isTimeFormatLike } from './utils';

export type Position = 'top' | 'topLeft' | 'topRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'leftTopOver' | 'rightTopOver';

/** `E` is the focus event of the host framework, which the foundation only passes on */
export interface TimePickerAdapter<P extends TimePickerBaseProps = TimePickerBaseProps, E = unknown> extends DefaultAdapter<P, TimePickerBaseState> {
    notifyOpenChange: (open: boolean) => void;
    notifyChange: (value: Date | Date[], str: string | string[]) => void;
    notifyFocus: (e: E) => void;
    /** The picker blurs only when a mousedown outside closes the panel */
    notifyBlur: (e: MouseEvent) => void;
    /** focus is in the panel and came from the keyboard (`:focus-visible`), not from a click */
    isKeyboardFocusInPanel: () => boolean;
    /** focuses the input, or the focus target of a custom trigger */
    setTriggerFocus: (options?: FocusOptions) => void;
    /** blurs the focused element of the trigger or the panel */
    blurFocusedElement: () => void;
}

export interface TimePickerBaseProps {
    dateFnsLocale?: Locale;
    defaultOpen?: boolean;
    disabled?: boolean;
    disabledHours?: () => number[];
    disabledMinutes?: (selectedHour: number) => number[];
    disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
    disabledTime?: (value: Date[], panelType: PanelType) => DisabledTimeFns;
    format?: string;
    open?: boolean;
    rangeSeparator?: string;
    timeZone?: string | number;
    type?: typeof strings.TYPE_TIME_PICKER | typeof strings.TYPE_TIME_RANGE_PICKER;
    use12Hours?: boolean;
    value?: unknown;
}

export interface TimePickerBaseState {
    inputValue: string;
    invalid: boolean;
    open: boolean;
    value: Date[];
}

/** A time as `value` accepts it: a Date, a timestamp, or a string in `format` */
export type TimeValue = string | number | Date;

export type DisabledTimeFns = Pick<TimePickerBaseProps, 'disabledHours' | 'disabledMinutes' | 'disabledSeconds'>;

// A timestamp of 0 is a value, so truthiness is not the test
function isEmptyValue(value: unknown) {
    return value == null || value === '';
}

export default class TimePickerFoundation<P extends TimePickerBaseProps = TimePickerBaseProps, E = unknown> extends BaseFoundation<TimePickerAdapter<P, E>, P, TimePickerBaseState> {
    static override readonly propKeys = ['value', 'timeZone', 'format', 'use12Hours', 'dateFnsLocale', 'rangeSeparator', 'disabled'];
    // a Date or array built in the parent's render is a new object every time and must not reset typed text
    static override readonly propEquals = { value: isEqual };

    /**
     * The dates a `value` shows, on mount and on every update. An empty side of a range ('' or undefined) stays
     * undefined, as the panel reports it, so one picked side shows with its separator. No picked side at all is no
     * value, and so is a time that cannot be parsed: an Invalid Date in the state would make every later format throw.
     * A Date or timestamp is an instant and a string a `timeZone` wall time. With `prevTimeZone`, `value` is the shown
     * value in that zone and is re-zoned into `timeZone`.
     */
    static #parseDates(value: unknown, props: Record<string, any>, timeZone?: string | number, prevTimeZone?: string | number) {
        const formatToken = TimePickerFoundation.getValidFormat(props);
        const values: TimeValue[] = Array.isArray(value) ? value : isEmptyValue(value) ? [] : [value as TimeValue];
        const reference = parseReference(timeZone);
        const dates = values.map((v) => parseToDate(v, formatToken, props.dateFnsLocale, reference));

        if (dates.every((d) => d === undefined) || dates.some((d) => d !== undefined && isNaN(Number(d)))) {
            return [];
        }
        return dates.map((date) => date && toWallTime(isValidTimeZone(prevTimeZone) ? zonedTimeToUtc(date, prevTimeZone) : date, timeZone));
    }

    static #formatDates(dates: Date[], props: Record<string, any>) {
        const formatToken = TimePickerFoundation.getValidFormat(props);
        return dates.map((date) => (date === undefined ? '' : formatToString(date, formatToken, props.dateFnsLocale))).join(props.rangeSeparator);
    }

    #isRange() {
        return this.getProp('type') === strings.TYPE_TIME_RANGE_PICKER;
    }

    #syncValueFromProps({ value, timeZone, prevTimeZone }: { value: TimeValue | (TimeValue | undefined)[]; timeZone?: string | number; prevTimeZone?: string | number }) {
        const dates = TimePickerFoundation.#parseDates(value, this.getProps(), timeZone, prevTimeZone);
        this.setState({
            value: dates,
            invalid: this.validateDates(dates),
            inputValue: this.formatValue(dates),
        });
    }

    #refreshInputValue() {
        this.setState({ inputValue: this.formatValue(this.getState('value')) });
    }

    /** The string is the input text, a `timeZone` wall time, so it can be passed back as `value` */
    #notifyChange(value: Date[], inputValue: string) {
        const timeZone = this.getProp('timeZone');
        const dates = value.map((date) => date && fromWallTime(date, timeZone));
        if (this.#isRange()) {
            const parts = inputValue.split(this.getProp('rangeSeparator'));
            // text typed for one side has no separator, but a range value always has both sides
            this.adapter.notifyChange(dates, value.length === 2 ? [parts[0], parts[1] ?? ''] : parts);
        } else {
            this.adapter.notifyChange(dates[0], inputValue);
        }
    }

    #hasChanged(dates: Date[] = [], oldDates: Date[] = []) {
        const formatToken = this.getValidFormat();
        const dateFnsLocale = this.getProp('dateFnsLocale');

        return (
            dates.length !== oldDates.length ||
            dates.some((date, index) => {
                const oldDate = oldDates[index];

                if (date === undefined && oldDate === undefined) {
                    return false;
                }
                if (isValid(date) && isValid(oldDate) && formatToString(date, formatToken, dateFnsLocale) === formatToString(oldDate, formatToken, dateFnsLocale)) {
                    return false;
                }

                return true;
            })
        );
    }

    protected isDisabledHMS({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }, panelType: PanelType = 'left', dates: Date[] = []) {
        const { disabledHours, disabledMinutes, disabledSeconds } = TimePickerFoundation.getDisabledTimeFns(this.getProps(), dates, panelType, this.#isRange());
        const hDis = hours != null && hourIsDisabled(disabledHours, hours);
        const mDis = hours != null && minutes != null && minuteIsDisabled(disabledMinutes, hours, minutes);
        const sDis = hours != null && minutes != null && seconds != null && secondIsDisabled(disabledSeconds, hours, minutes, seconds);

        return hDis || mDis || sDis;
    }

    protected getValidFormat() {
        return TimePickerFoundation.getValidFormat(this.getProps());
    }

    /** An empty side of a range (undefined) is a range still being picked, not an invalid time */
    protected validateDates(dates: Array<Date> = []) {
        let invalid = dates.some((d) => d !== undefined && isNaN(Number(d)));

        if (!invalid) {
            if (this.#isRange()) {
                invalid = dates.some((d, idx) => {
                    if (d === undefined) {
                        return false;
                    }
                    const panelType: PanelType = idx === 1 ? 'right' : 'left';
                    return this.isDisabledHMS({ hours: d.getHours(), minutes: d.getMinutes(), seconds: d.getSeconds() }, panelType, dates);
                });
            } else {
                const d = dates[0];
                invalid = d ? this.isDisabledHMS({ hours: d.getHours(), minutes: d.getMinutes(), seconds: d.getSeconds() }, 'left', dates) : false;
            }
        }

        return invalid;
    }

    protected formatValue(dates: Date[]) {
        return TimePickerFoundation.#formatDates(dates, this.getProps());
    }

    protected parseInput(str: string) {
        const validFormat = this.getValidFormat();
        const rangeSeparator = this.getProp('rangeSeparator');
        const dateFnsLocale = this.getProp('dateFnsLocale');

        if (str && typeof str === 'string') {
            return str.split(rangeSeparator).map((v) => parseToDate(v, validFormat, dateFnsLocale));
        }

        return [];
    }

    static getValidFormat(props: Record<string, any>) {
        let _format = props.format;
        if (_format === undefined) {
            _format = props.use12Hours ? strings.DEFAULT_FORMAT_A : strings.DEFAULT_FORMAT;
        }
        return typeof _format === 'string' ? _format : strings.DEFAULT_FORMAT;
    }

    /**
     * The disabled-time callbacks of one panel, as the panel lists and validation both use them. `disabledTime` is
     * range-only: it gives the left and right panel their own rules, and each callback it leaves out falls back to the
     * top-level prop.
     */
    static getDisabledTimeFns({ disabledHours, disabledMinutes, disabledSeconds, disabledTime, timeZone }: TimePickerBaseProps, dates: Date[], panelType: PanelType, isRange: boolean): DisabledTimeFns {
        const panel =
            (typeof disabledTime === 'function' &&
                isRange &&
                disabledTime(
                    dates.map((date) => date && fromWallTime(date, timeZone)),
                    panelType
                )) ||
            {};
        return {
            disabledHours: panel.disabledHours || disabledHours,
            disabledMinutes: panel.disabledMinutes || disabledMinutes,
            disabledSeconds: panel.disabledSeconds || disabledSeconds,
        };
    }

    /** The class names of the panel: it is narrow while a time column is missing, and its width follows the column count */
    static getPanelClassNames(props: { prefixCls: string; format?: string; use12Hours?: boolean; type?: string }) {
        const { prefixCls, use12Hours, type } = props;
        const { showHour, showMinute, showSecond } = ComboboxFoundation.getColumns(TimePickerFoundation.getValidFormat(props));
        const columnCount = [showHour, showMinute, showSecond, use12Hours].filter(Boolean).length;
        const classNames = [`${prefixCls}-panel`];
        if (!(showHour && showMinute && showSecond) && !use12Hours) {
            classNames.push(`${prefixCls}-panel-narrow`);
        }
        if (type === strings.TYPE_TIME_RANGE_PICKER) {
            classNames.push(cssClasses.RANGE_PICKER);
        }
        classNames.push(`${prefixCls}-panel-column-${columnCount}`);
        return classNames;
    }

    static getPosition(props: Record<string, any>, direction?: string): Position {
        const type = props.type || strings.DEFAULT_TYPE;
        const rtlDirection = direction === 'rtl' ? 'bottomRight' : '';
        return props.position || rtlDirection || strings.DEFAULT_POSITION[type];
    }

    /** A controlled `open` is not copied into state, so the shown panel comes from props when they carry it; a disabled picker shows none */
    static isPanelShown(props: Record<string, any>, state: Record<string, any>) {
        return (props.open !== undefined ? Boolean(props.open) : Boolean(state.open)) && !props.disabled;
    }

    static getInitialState(props: Record<string, any>): TimePickerBaseState {
        // null is a controlled empty value; only undefined leaves the picker uncontrolled
        const value = props.value === undefined ? props.defaultValue : props.value;
        const dates = TimePickerFoundation.#parseDates(value, props, props.timeZone);
        return {
            open: Boolean((props.open || props.defaultOpen) && !props.disabled),
            value: dates,
            inputValue: TimePickerFoundation.#formatDates(dates, props),
            invalid: false,
        };
    }

    /** A new value wins (back to undefined clears it), else a new timeZone re-zones the shown value, else only the text is re-formatted */
    override handlePropsChange(prev: Partial<P>) {
        const { value, timeZone, disabled } = this.getProps();
        if (!isEqual(value, prev.value) || (timeZone !== prev.timeZone && this.isControlledComponent('value'))) {
            // a controlled string is a wall time of whichever zone is current, so a new zone reads it again
            this.#syncValueFromProps({ value: value as TimeValue, timeZone });
        } else if (timeZone !== prev.timeZone) {
            this.#syncValueFromProps({ value: this.getState('value'), timeZone, prevTimeZone: prev.timeZone });
        } else if (this.getValidFormat() !== TimePickerFoundation.getValidFormat(prev) || this.getProp('dateFnsLocale') !== prev.dateFnsLocale || this.getProp('rangeSeparator') !== prev.rangeSeparator) {
            // only the text changes: syncing the value again would re-zone it a second time
            this.#refreshInputValue();
        }
        // isPanelShown is already false for a disabled picker, so the check leaves `disabled` out
        if (disabled && !prev.disabled && TimePickerFoundation.isPanelShown({ open: this.getProp('open') }, this.getStates())) {
            this.close();
        }
    }

    handlePanelChange = (result: { timeStampValue: number }, index = 0) => {
        const formatToken = this.getValidFormat();
        const dateFnsLocale = this.getProp('dateFnsLocale');
        const oldValue: Date[] = this.getState('value');

        // an empty side stays undefined so a start picked first shows its separator like an end picked first
        const value: Date[] = this.#isRange() ? [oldValue[0], oldValue[1]] : transformToArray(oldValue);

        if (result) {
            const date = parseToDate(result.timeStampValue, formatToken, dateFnsLocale);
            value[index] = date;
            const inputValue = this.formatValue(value);

            if (!this.isControlledComponent('value')) {
                const invalid = this.validateDates(value);
                this.setState({
                    value,
                    inputValue,
                    invalid,
                });
            }

            if (this.#hasChanged(value, oldValue)) {
                this.#notifyChange(value, inputValue);
            }
        }
    };

    focus = (options?: FocusOptions) => {
        this.adapter.setTriggerFocus(options);
    };

    blur = () => {
        this.adapter.blurFocusedElement();
    };

    handleFocus = (e: E) => {
        this.handlePanelOpen();
        this.adapter.notifyFocus(e);
    };

    /** A custom trigger without a focus target of its own is a button: Enter, Space and Down Arrow open the panel */
    handleTriggerKeyDown = (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.handlePanelOpen();
        }
    };

    /** Closes the panel and reports openChange(false), without blur and without moving focus */
    close = () => {
        // a controlled `open` is only asked to close; its owner decides
        if (!this.isControlledComponent('open')) {
            this.setState({ open: false });
        }
        this.adapter.notifyOpenChange(false);
    };

    /**
     * The panel is a custom-trigger popup, so the Popover leaves Esc to the picker. Keyboard focus in a list returns
     * to the input first: the input opens the panel on focus, which must not happen once the panel is closed. The
     * focus stays in the picker, so this is no blur.
     */
    handleEscKeyDown = () => {
        if (this.adapter.isKeyboardFocusInPanel()) {
            this.adapter.setTriggerFocus();
        }
        this.close();
    };

    // A click on the trigger of a shown panel is no request to open it
    handlePanelOpen = () => {
        if (this.getProp('disabled') || TimePickerFoundation.isPanelShown(this.getProps(), this.getStates())) {
            return;
        }
        if (!this.isControlledComponent('open')) {
            this.setState({ open: true });
        }
        this.adapter.notifyOpenChange(true);
    };

    /** Called for a mousedown outside the trigger and the panel while the panel is shown */
    handleClickOutside = (e: MouseEvent) => {
        this.close();
        this.adapter.notifyBlur(e);
    };

    handleInputChange = (input: string) => {
        this.setState({ inputValue: input });

        const rangeSeparator = this.getProp('rangeSeparator');
        const inputValues = (input ?? '').split(rangeSeparator);
        const formatToken = this.getValidFormat();
        // Input that is not format-like yet is ignored so typing is not interrupted; clearing ('') must still pass
        if (input !== '' && inputValues.some((time) => !isTimeFormatLike(time, formatToken))) {
            return;
        }

        const isRange = this.#isRange();
        // a range has two sides: more parts are no value, and one typed side leaves the other empty
        if (isRange && inputValues.length > 2) {
            this.setState({ invalid: true });
            return;
        }
        const parsed = this.parseInput(input);
        const dates = isRange && parsed.length ? [parsed[0], parsed[1]] : parsed;
        const invalid = this.validateDates(dates);
        const oldValue = this.getState('value');
        const value = invalid ? transformToArray(oldValue) : [...dates];

        if (this.isControlledComponent('value') || invalid) {
            // a controlled value follows the prop, but the typed time still has to show why it is rejected
            this.setState({ invalid });
        } else {
            this.setState({ invalid, value: dates });
        }

        if (this.#hasChanged(value, oldValue)) {
            this.#notifyChange(value, input);
        }
    };

    handleInputBlur = () => {
        const inputValue = this.getState('inputValue');
        const value = this.getState('value');

        // With text in the input, or when the owner decides whether the value is cleared, the input shows the value again
        if (inputValue || this.isControlledComponent('value')) {
            this.setState({ inputValue: this.formatValue(value), invalid: false });
        } else {
            this.setState({ inputValue: '', value: [], invalid: false });
        }
    };
}
