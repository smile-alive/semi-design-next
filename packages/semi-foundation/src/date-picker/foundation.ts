import { format, isValid, isSameSecond, isEqual as isDateEqual, isDate, startOfDay } from 'date-fns';
import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings as inputStrings } from '../input/constants';
import { isInnerControlActivation } from '../utils/a11y';
import { utcToZonedTime, zonedTimeToUtc } from '../utils/date-fns-extra';
import isValidTimeZone from '../utils/is-valid-time-zone';
import type { ArrayElement } from '../utils/type';
import warning from '../utils/warning';
import { getDefaultFormatTokenByType } from './_utils/get-default-format-token';
import getInsetInputFormatToken from './_utils/get-inset-input-format-token';
import getInsetInputValueFromInsetInputStr from './_utils/get-inset-input-value-from-inset-input-str';
import type { WeekStartNumber } from './_utils/get-month-table';
import { isValidDate, isTimestamp } from './_utils/index';
import { compatibleParse } from './_utils/parser';
import { isMultiple, isRangeType, isRangeValueComplete, needConfirm } from './_utils/picker-type';
import toCallbackArgs, { toCallbackDates } from './_utils/to-callback-args';
import toDateArg from './_utils/to-date-arg';
import { numbers, strings } from './constants';
import type { Type, DateInputFoundationProps, InsetInputValue, RangeInput } from './input-foundation';
import type { FocusRecords } from './month-foundation';
import type { MonthsGridFoundationProps } from './months-grid-foundation';

export type ValidateStatus = ArrayElement<typeof strings.STATUS>;
export type InputSize = ArrayElement<typeof strings.SIZE_SET>;
export type Position = ArrayElement<typeof strings.POSITION_SET>;
export type PresetPosition = ArrayElement<typeof strings.PRESET_POSITION_SET>;

export type BaseValueType = string | number | Date;
export type DayStatusType = {
    isToday?: boolean;
    isSelected?: boolean;
    isDisabled?: boolean;
    isSelectedStart?: boolean;
    isSelectedEnd?: boolean;
    isInRange?: boolean;
    isHover?: boolean;
    isOffsetRangeStart?: boolean;
    isOffsetRangeEnd?: boolean;
    isHoverInOffsetRange?: boolean;
};
export type DisabledDateOptions = {
    rangeStart?: string;
    rangeEnd?: string;
    /**
     * current select of range type
     */
    rangeInputFocus?: 'rangeStart' | 'rangeEnd' | false;
};

/** `null` start and end make a preset that clears the value */
export type PresetType = {
    start?: BaseValueType | null | (() => BaseValueType);
    end?: BaseValueType | null | (() => BaseValueType);
    text?: string;
};

export type TriggerRenderProps = {
    [x: string]: any;
    value?: ValueType;
    inputValue?: string | null;
    placeholder?: string | string[];
    autoFocus?: boolean;
    size?: InputSize;
    disabled?: boolean;
    inputReadOnly?: boolean;
    componentProps?: DatePickerFoundationProps;
};

export type DateOffsetType = (selectedDate: Date) => Date;
export type DensityType = 'default' | 'compact';
export type DisabledDateType = (date: Date, options?: DisabledDateOptions) => boolean;
export type DisabledTimeType = (
    date?: Date | Date[],
    panelType?: string
) => {
    disabledHours?: () => number[];
    disabledMinutes?: (hour: number) => number[];
    disabledSeconds?: (hour: number, minute: number) => number[];
};
export type OnCancelType = (date: Date | Date[], dateStr: string | string[]) => void;
export type OnPanelChangeType = (date: Date | Date[], dateStr: string | string[]) => void;
export type OnConfirmType = (date: Date | Date[], dateStr: string | string[]) => void;
export type OnPresetClickType = (item: PresetType, e: any) => void;
export type PresetsType = Array<PresetType | (() => PresetType)>;
export type RenderDateType = (dayNumber?: number, fullDate?: string) => any;
export type RenderFullDateType = (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => any;
export type TriggerRenderType = (props: TriggerRenderProps) => any;
export type ValueType = BaseValueType | BaseValueType[];

export interface ElementProps {
    bottomSlot?: any;
    insetLabel?: any;
    prefix?: any;
    topSlot?: any;
}

export interface RenderProps {
    renderDate?: RenderDateType;
    renderFullDate?: RenderFullDateType;
    triggerRender?: TriggerRenderType;
}

export interface EventHandlerProps {
    onCancel?: OnCancelType;
    onOpenChange?: (status: boolean) => void;
    onPanelChange?: OnPanelChangeType;
    onConfirm?: OnConfirmType;
    /** `e` is the mousedown outside when that closed the panel; the other ways of closing pass none */
    onBlur?: (e?: MouseEvent) => void;
    onClear?: (e: any) => void;
    onFocus?: (e: any, rangeType?: RangeInput | false) => void;
    onPresetClick?: OnPresetClickType;
    onClickOutSide?: (e: MouseEvent) => void;
}

export interface DatePickerFoundationProps extends ElementProps, RenderProps, EventHandlerProps, Pick<MonthsGridFoundationProps, 'startYear' | 'endYear'> {
    autoAdjustOverflow?: boolean;
    autoFocus?: boolean;
    autoSwitchDate?: boolean;
    borderless?: boolean;
    className?: string;
    defaultOpen?: boolean;
    defaultPickerValue?: ValueType;
    defaultValue?: ValueType;
    density?: DensityType;
    disabled?: boolean;
    disabledDate?: DisabledDateType;
    disabledTime?: DisabledTimeType;
    dropdownClassName?: string;
    dropdownStyle?: Record<string, any>;
    endDateOffset?: DateOffsetType;
    format?: string;
    inputReadOnly?: boolean;
    inputStyle?: Record<string, any>;
    max?: number;
    motion?: boolean;
    multiple?: boolean;
    needConfirm?: boolean;
    open?: boolean;
    placeholder?: string | string[];
    position?: Position;
    prefixCls?: string;
    presets?: PresetsType;
    presetPosition?: PresetPosition;
    showClear?: boolean;
    size?: InputSize;
    spacing?: number;
    startDateOffset?: DateOffsetType;
    stopPropagation?: boolean | string;
    style?: Record<string, any>;
    // Known limitation: typed as any; tighten once the timePicker props type is available to foundation
    timePickerOpts?: any;
    timeZone?: string | number;
    type?: Type;
    validateStatus?: ValidateStatus;
    /** `null` is a controlled empty value; only `undefined` leaves the picker uncontrolled */
    value?: ValueType | null;
    weekStartsOn?: WeekStartNumber;
    syncSwitchMonth?: boolean;
    hideDisabledOptions?: MonthsGridFoundationProps['hideDisabledOptions'];
    disabledTimePicker?: MonthsGridFoundationProps['disabledTimePicker'];
    /** filled by the framework from the LocaleProvider, not a component prop */
    dateFnsLocale?: any;
    rangeSeparator?: string;
    /**
     * Only for UI render. Keep `semi-foundation` framework-agnostic (no React types).
     * `semi-ui-react` layer should declare this as `React.ReactNode`.
     */
    rangeSeparatorNode?: any;
    insetInput?: DateInputFoundationProps['insetInput'];
    preventScroll?: boolean;
}

export interface DatePickerFoundationState {
    panelShow: boolean;
    isRange: boolean;
    /** value of trigger input; `null` while the input shows the formatted value */
    inputValue: string | null;
    value: Date[];
    cachedSelectedValue: (Date | null)[];
    prevTimeZone: string | number | null;
    /** `undefined` until a range input is focused or the value is set */
    rangeInputFocus: RangeInput | false | undefined;
    autofocus: boolean;
    /** value of inset input */
    insetInputValue: InsetInputValue | null;
    triggerDisabled: boolean | null;
    /** which range inputs have been focused since the panel opened; a range closes once both have */
    focusRecords: FocusRecords;
}

export type { Type, DateInputFoundationProps, RangeInput } from './input-foundation';

export interface DatePickerAdapter extends DefaultAdapter<DatePickerFoundationProps, DatePickerFoundationState> {
    togglePanel: (panelShow: boolean, cb?: () => void) => void;
    notifyBlur: DatePickerFoundationProps['onBlur'];
    notifyFocus: DatePickerFoundationProps['onFocus'];
    notifyClear: DatePickerFoundationProps['onClear'];
    notifyChange: (date: Date | Date[], dateStr: string | string[]) => void;
    notifyCancel: DatePickerFoundationProps['onCancel'];
    notifyConfirm: DatePickerFoundationProps['onConfirm'];
    notifyOpenChange: DatePickerFoundationProps['onOpenChange'];
    notifyClickOutSide: DatePickerFoundationProps['onClickOutSide'];
    notifyPresetsClick: DatePickerFoundationProps['onPresetClick'];
    updateValue: (value: Date[]) => void;
    updatePrevTimezone: (prevTimeZone: string | number) => void;
    updateCachedSelectedValue: (cachedSelectedValue: Date[]) => void;
    updateInputValue: (inputValue: DatePickerFoundationState['inputValue']) => void;
    /** focuses the given range input (`false` focuses none) and stores it as `rangeInputFocus` */
    setRangeInputFocus: (rangeInputFocus: DatePickerFoundationState['rangeInputFocus']) => void;
    /** focus is in the panel and came from the keyboard (`:focus-visible`), not from a click */
    isKeyboardFocusInPanel: () => boolean;
    isEventTarget: (e: any) => boolean;
    updateInsetInputValue: (insetInputValue: InsetInputValue) => void;
    setInsetInputFocus: () => void;
    /** `callback` runs once the trigger renders with the new disabled state */
    setTriggerDisabled: (disabled: boolean, callback?: () => void) => void;
    setInputFocus: () => void;
    /** focuses the first focus target in the trigger (an input, or a custom trigger's own element), else its wrapper */
    setTriggerFocus: () => void;
    blurFocusedElement: () => void;
}

/**
 * Keeps the date value and the input text in sync: a selected date updates the input text, and a valid input text
 * updates the date value; both notify the change.
 */
export default class DatePickerFoundation extends BaseFoundation<DatePickerAdapter, DatePickerFoundationProps, DatePickerFoundationState> {
    #focusRecordTimers = new Set<ReturnType<typeof setTimeout>>();
    // StrictMode and React Activity replay init on this instance after destroy, over a value and panel the user may
    // have changed since: defaultValue and defaultOpen belong to the first mount. A value or timeZone change while
    // hidden reaches the host's update handler when the subtree shows again.
    // shortcut: init still resolves the value from the props, which getInitialState has already put into the state of
    // a host that creates its state from it; drop that part of init once every framework does.
    #initialized = false;

    #setRangeInputFocus(rangeInputFocus: RangeInput | false) {
        this._adapter.setRangeInputFocus(rangeInputFocus);
        if (rangeInputFocus) {
            this.#recordFocusLater(rangeInputFocus);
        }
    }

    // Recording the focus synchronously would make handleSelectedChange see both range inputs as done right after
    // the start date is picked (the panel moves the focus to the end input first), closing the panel too early.
    #recordFocusLater(rangeInputFocus: RangeInput) {
        const timer = setTimeout(() => {
            this.#focusRecordTimers.delete(timer);
            this.setState({ focusRecords: { ...this.getState('focusRecords'), [rangeInputFocus]: true } });
        }, 0);
        this.#focusRecordTimers.add(timer);
    }

    #cancelFocusRecords() {
        for (const timer of this.#focusRecordTimers) {
            clearTimeout(timer);
        }
        this.#focusRecordTimers.clear();
    }

    // Records count only since this opening: Tab presses through the inputs while the panel was closed would make
    // it treat both ends as picked. The input that opens the panel is already focused.
    #restartFocusRecords() {
        this.#cancelFocusRecords();
        const rangeInputFocus = this.getState('rangeInputFocus');
        this.setState({ focusRecords: { rangeStart: rangeInputFocus === 'rangeStart', rangeEnd: rangeInputFocus === 'rangeEnd' } });
    }

    // A record scheduled before the panel closed (keyboard close returns the focus to an input) must not outlive it
    #clearFocusRecords() {
        this.#cancelFocusRecords();
        const { rangeStart, rangeEnd } = this.getState('focusRecords');
        if (rangeStart || rangeEnd) {
            this.setState({ focusRecords: { rangeStart: false, rangeEnd: false } });
        }
    }

    #isMultiple() {
        return isMultiple(this.getProps());
    }

    #needConfirm() {
        return needConfirm(this.getProps());
    }

    #parseValue(value: BaseValueType) {
        const dateFnsLocale = this._adapter.getProp('dateFnsLocale');
        let dateObj: Date;
        if (isValidDate(value)) {
            dateObj = value as Date;
        } else if (typeof value === 'string') {
            dateObj = compatibleParse(value, this.getProp('format'), undefined, dateFnsLocale);
        } else if (isTimestamp(value)) {
            dateObj = new Date(value);
        } else {
            throw new TypeError('value should be valid Date object/timestamp or string');
        }
        return dateObj;
    }

    #updateCachedSelectedValueFromInput(input: string) {
        const looseResult = this.getLooseDateFromInput(input);
        const changedLooseResult = this.#getChangedDates(looseResult);
        if (!this.#someDateDisabled(changedLooseResult, looseResult)) {
            this.#resetCachedSelectedValue(looseResult);
        }
    }

    #updateValueAndInput(value: Date | Array<Date>, forceUpdateValue?: boolean, input?: string) {
        let _value: Array<Date>;
        if (forceUpdateValue || value) {
            if (!Array.isArray(value)) {
                _value = value ? [value] : [];
            } else {
                _value = value;
            }

            const changedDates = this.#getChangedDates(_value);
            if (!this._isControlledComponent() && !this.#someDateDisabled(changedDates, _value) && !this.#needConfirm() && this.#isValueCommittable(_value)) {
                this._adapter.updateValue(_value);
            }
        }
        this._adapter.updateInputValue(input);
    }

    #isValueCommittable(value: Date[]) {
        return !this.#isRangeType() || isRangeValueComplete(value);
    }

    // callers must first check that the value differs from the state value
    #notifyChange(value: Date[]) {
        if (!this.#isValueCommittable(value)) {
            return;
        }
        const { notifyValue, notifyDate } = this.disposeCallbackArgs(value);
        this._adapter.notifyChange(notifyDate, notifyValue);
    }

    #getChangedDates(dates: Date[]) {
        const type = this._adapter.getProp('type');
        const { cachedSelectedValue: lastDate } = this._adapter.getStates();
        const changedDates = [];

        switch (type) {
            case 'dateRange':
            case 'dateTimeRange':
                const [lastStart, lastEnd] = lastDate;
                const [start, end] = dates;
                if (!isDateEqual(toDateArg(start), toDateArg(lastStart))) {
                    changedDates.push(start);
                }
                if (!isDateEqual(toDateArg(end), toDateArg(lastEnd))) {
                    changedDates.push(end);
                }
                break;
            default:
                const lastValueSet = new Set<number>();
                lastDate.forEach((value) => lastValueSet.add(isDate(value) && value.valueOf()));
                for (const date of dates) {
                    if (!lastValueSet.has(isDate(date) && date.valueOf())) {
                        changedDates.push(date);
                    }
                }
        }
        return changedDates;
    }

    /**
     * @param selectedValue passed to the second parameter of `disabledDate` when selecting a range
     * @param pickedFor `{ rangeInputFocus }`, the range input the dates were picked for, when it is not the current one
     */
    #someDateDisabled(value: Date[], selectedValue: Date[], pickedFor?: { rangeInputFocus?: RangeInput | false }) {
        const { rangeInputFocus } = pickedFor && 'rangeInputFocus' in pickedFor ? pickedFor : this.getStates();
        const disabledOptions = { rangeStart: '', rangeEnd: '', rangeInputFocus };

        if (this.#isRangeType() && Array.isArray(selectedValue)) {
            if (isValid(selectedValue[0])) {
                const rangeStart = format(selectedValue[0], 'yyyy-MM-dd');
                disabledOptions.rangeStart = rangeStart;
            }

            if (isValid(selectedValue[1])) {
                const rangeEnd = format(selectedValue[1], 'yyyy-MM-dd');
                disabledOptions.rangeEnd = rangeEnd;
            }
        }

        let isSomeDateDisabled = false;
        for (const date of value) {
            if (date != null) {
                // Range types check only the date part, so adjusting the time never flips a date to disabled
                // (e.g. start X and end X+7 with a 7-day limit stays valid after the end time is set to 10:00).
                const dateToCheck = this.#isRangeType() && isValid(date) ? startOfDay(date) : date;
                if (this.disabledDisposeDate(dateToCheck, disabledOptions)) {
                    isSomeDateDisabled = true;
                    break;
                }
            }
        }
        return isSomeDateDisabled;
    }

    #isRangeType() {
        return isRangeType(this.getProp('type'));
    }

    // monthRange has a single trigger input; only its inset inputs, rendered with the panel, come in pairs
    #hasTwoInputs() {
        return this.#isRangeType() && (this.getProp('type') !== 'monthRange' || (this.getProp('insetInput') && this.#isPanelShown()));
    }

    #isPanelShown() {
        return DatePickerFoundation.isPanelShown(this.getProps(), this.getStates());
    }

    // An empty value resets the range focus to rangeStart so the user can start over after clearing
    #shouldFocusRangeStart(result: Date[]) {
        return this.#isRangeType() && typeof this.getProp('triggerRender') === 'function' && result.length === 0;
    }

    #initRangeInputFocus(result: Date[]) {
        if (this.#shouldFocusRangeStart(result)) {
            this.#setRangeInputFocus('rangeStart');
        }
    }

    // undefined: neither value nor defaultValue is given, so there is nothing to resolve
    #getInitialValue() {
        return this._isControlledComponent() ? this.getProp('value') : this.getProp('defaultValue');
    }

    #resolveValue(value: DatePickerFoundationProps['value'], timeZone: string | number, prevTimeZone?: string | number) {
        const _value = (Array.isArray(value) ? [...value] : (value || value === 0) && [value]) || [];
        return this.parseWithTimezone(_value, timeZone, prevTimeZone);
    }

    #initPanelOpenStatus(defaultOpen?: boolean) {
        this._adapter.togglePanel(Boolean((this.getProp('open') || defaultOpen) && !this.getProp('disabled')));
    }

    // A click on the trigger of a shown panel is no request to open it
    #openPanel() {
        if (!this.getProp('disabled') && !this.#isPanelShown()) {
            if (!this._isControlledComponent('open')) {
                this.open();
            }
            this._adapter.notifyOpenChange(true);
        }
    }

    #resetCachedSelectedValue(willUpdateDates?: Date[]) {
        const { value, cachedSelectedValue } = this._adapter.getStates();
        const newCachedSelectedValue = Array.isArray(willUpdateDates) ? willUpdateDates : value;
        if (!isEqual(newCachedSelectedValue, cachedSelectedValue)) {
            this._adapter.updateCachedSelectedValue(newCachedSelectedValue);
        }
    }

    #resetInnerSelectedStates(e?: MouseEvent) {
        this.#resetCachedSelectedValue();
        this.#resetFocus(e);
        this.#clearInputValue();
    }

    #resetFocus(e?: MouseEvent) {
        this.#setRangeInputFocus(false);
        this._adapter.notifyBlur(e);
    }

    #clearInputValue() {
        this._adapter.updateInputValue(null);
        this._adapter.updateInsetInputValue(null);
    }

    /**
     * Parses a multiple input part by part with `parse`; an empty or unparsable part, or more than `max` dates,
     * gives `[]`. `parseInputLoose` as `parse` keeps `null` for a half typed date.
     *
     * @example
     * ```javascript
     * this.#parseMultipleInput('2021-01-01,2021-10-15', parseInputLoose); // [Date, Date];
     * this.#parseMultipleInput('2021-01-01,2021-10-', parseInputLoose); // [Date, null];
     * this.#parseMultipleInput('', parseInputLoose); // [];
     * ```
     */
    #parseMultipleInput(input: string, parse: (part: string) => Array<Date | null>, { needDedupe = false }: { needDedupe?: boolean } = {}) {
        const max = this.getProp('max');
        const result: Array<Date | null> = [];

        for (const part of input.split(strings.DEFAULT_SEPARATOR_MULTIPLE)) {
            const parsed = part ? parse(part) : [];
            if (!parsed.length) {
                return [];
            }
            if (!needDedupe || !result.some((r) => parsed.some((p) => isSameSecond(r, p)))) {
                result.push(...parsed);
            }
            if (max && max > 0 && result.length > max) {
                return [];
            }
        }

        return result;
    }

    /**
     * `value` is either a UTC value (the controlled prop) or a zoned value (state.value, the date picked in the
     * computer's time zone).
     * When the time zone changes, pass prevTimeZone to convert the old zoned value into the new zone.
     * When the value changes, omit prevTimeZone and convert the UTC value to a zoned value.
     */
    protected parseWithTimezone(value: ValueType, timeZone: string | number, prevTimeZone?: string | number) {
        const result: Date[] = [];
        if (Array.isArray(value) && value.length) {
            for (const v of value) {
                // an empty end of a range, or a preset that clears the value
                if (v == null || v === '') {
                    continue;
                }
                let parsedV = (v || v === 0) && this.#parseValue(v);
                if (parsedV) {
                    if (isValidTimeZone(prevTimeZone)) {
                        parsedV = zonedTimeToUtc(parsedV, prevTimeZone);
                    }
                    result.push(isValidTimeZone(timeZone) ? utcToZonedTime(parsedV, timeZone) : parsedV);
                } else {
                    warning(true, `[Semi DatePicker] value cannot be parsed, value: ${String(v)}`);
                }
            }
        }

        return result;
    }

    protected parseInput(input = '', format?: string) {
        let result: Date[] = [];
        const { dateFnsLocale, rangeSeparator } = this.getProps();

        if (input && input.length) {
            const type = this.getProp('type');
            const formatToken = format || this.getProp('format') || getDefaultFormatTokenByType(type);
            let parsedResult, formatedInput;
            const nowDate = new Date();
            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    parsedResult = compatibleParse(input, formatToken, nowDate, dateFnsLocale);
                    formatedInput = parsedResult && isValid(parsedResult) && this.localeFormat(parsedResult, formatToken);
                    if (parsedResult && formatedInput === input) {
                        result = [parsedResult];
                    }
                    break;
                case 'dateRange':
                case 'dateTimeRange':
                case 'monthRange':
                    const separator = rangeSeparator;
                    const values = input.split(separator);
                    parsedResult = values.map((cur) => cur && compatibleParse(cur, formatToken, nowDate, dateFnsLocale)).filter(Boolean);
                    formatedInput = parsedResult && parsedResult.map((v) => v && isValid(v) && this.localeFormat(v, formatToken)).join(separator);
                    if (parsedResult && formatedInput === input) {
                        parsedResult.sort((d1, d2) => d1.getTime() - d2.getTime());
                        result = parsedResult;
                    }
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    protected getLooseDateFromInput(input: string): Array<Date | null> {
        const value = this.#isMultiple() ? this.#parseMultipleInput(input, (part) => this.parseInputLoose(part)) : this.parseInputLoose(input);
        return value;
    }

    /**
     * parse input into `Array<Date|null>`, loose means return value includes `null`
     *
     * @example
     * ```javascript
     * parseInputLoose('2022-03-15 ~ '); // [Date, null]
     * parseInputLoose(' ~ 2022-03-15 '); // [null, Date]
     * parseInputLoose(''); // []
     * parseInputLoose('2022-03- ~ 2022-0'); // [null, null]
     * ```
     */
    protected parseInputLoose(input = ''): Array<Date | null> {
        let result: Array<Date | null> = [];
        const { dateFnsLocale, rangeSeparator, type, format } = this.getProps();

        if (input && input.length) {
            const formatToken = format || getDefaultFormatTokenByType(type);
            let parsedResult, formatedInput;
            const nowDate = new Date();
            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    const _parsedResult = compatibleParse(input, formatToken, nowDate, dateFnsLocale);
                    if (isValidDate(_parsedResult)) {
                        formatedInput = this.localeFormat(_parsedResult, formatToken);
                        if (formatedInput === input) {
                            parsedResult = _parsedResult;
                        }
                    } else {
                        parsedResult = null;
                    }
                    result = [parsedResult];
                    break;
                case 'dateRange':
                case 'dateTimeRange':
                    const separator = rangeSeparator;
                    const values = input.split(separator);
                    parsedResult = values.map((cur) => {
                        const parsedVal = compatibleParse(cur, formatToken, nowDate, dateFnsLocale);
                        return isValidDate(parsedVal) && this.localeFormat(parsedVal, formatToken) === cur ? parsedVal : null;
                    });
                    if (Array.isArray(parsedResult) && parsedResult.every((item) => isValid(item))) {
                        parsedResult.sort((d1, d2) => d1.getTime() - d2.getTime());
                    }
                    result = parsedResult;
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    protected formatDates(dates: Date[] = [], customFormat?: string) {
        let str = '';
        const rangeSeparator = this.getProp('rangeSeparator');

        if (Array.isArray(dates) && dates.length) {
            const type = this.getProp('type');
            const formatToken = customFormat || this.getProp('format') || getDefaultFormatTokenByType(type);

            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    str = this.localeFormat(dates[0], formatToken);
                    break;

                case 'dateRange':
                case 'dateTimeRange':
                case 'monthRange':
                    const startIsTruthy = dates[0] != null;
                    const endIsTruthy = dates[1] != null;
                    if (startIsTruthy && endIsTruthy) {
                        str = `${this.localeFormat(dates[0], formatToken)}${rangeSeparator}${this.localeFormat(dates[1], formatToken)}`;
                    } else {
                        if (startIsTruthy) {
                            str = `${this.localeFormat(dates[0], formatToken)}${rangeSeparator}`;
                        } else if (endIsTruthy) {
                            str = `${rangeSeparator}${this.localeFormat(dates[1], formatToken)}`;
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        return str;
    }

    protected formatMultipleDates(dates: Date[] = [], separator: string = strings.DEFAULT_SEPARATOR_MULTIPLE, customFormat?: string) {
        const strs = [];
        if (Array.isArray(dates) && dates.length) {
            const type = this.getProp('type');

            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    dates.forEach((date) => strs.push(this.formatDates([date], customFormat)));
                    break;
                case 'dateRange':
                case 'dateTimeRange':
                case 'monthRange':
                    for (let i = 0; i < dates.length; i += 2) {
                        strs.push(this.formatDates(dates.slice(i, i + 2), customFormat));
                    }
                    break;
                default:
                    break;
            }
        }
        return strs.join(separator);
    }

    protected disposeCallbackArgs(value: Date | Date[]) {
        return toCallbackArgs(value, {
            type: this.getProp('type'),
            format: this.getProp('format'),
            timeZone: this.getProp('timeZone'),
            multiple: this.getProp('multiple'),
            dateFnsLocale: this.getProp('dateFnsLocale'),
        });
    }

    protected localeFormat(date: Date, token: string) {
        const dateFnsLocale = this._adapter.getProp('dateFnsLocale');
        return format(date, token, { locale: dateFnsLocale });
    }

    /**
     * Calls a date callback such as `disabledDate` with the dates converted from computer time to `timeZone`.
     * Static so a render can pass the props it renders with: the instance reads the last committed ones.
     */
    static disposeDateFn<R>(timeZone: string | number | undefined, fn: (date: any, ...rest: any) => R, date: Date | Date[], ...rest: any[]) {
        const dates = toCallbackDates(date, timeZone);
        return fn(Array.isArray(date) ? dates : dates[0], ...rest);
    }

    /** A controlled `open` is not copied into state; a disabled picker shows no panel */
    static isPanelShown(props: Pick<DatePickerFoundationProps, 'open' | 'disabled'>, state: Pick<DatePickerFoundationState, 'panelShow'>) {
        return (props.open !== undefined ? Boolean(props.open) : Boolean(state.panelShow)) && !props.disabled;
    }

    /**
     * The props derived from others. The rtl default of `position` stays with the
     * frameworks, which read the direction from their config.
     */
    static normalizeProps<P extends string = Position>({
        type,
        format,
        rangeSeparator,
        insetInput,
        position,
        spacing,
    }: Pick<DatePickerFoundationProps, 'type' | 'format' | 'rangeSeparator' | 'insetInput' | 'spacing'> & { position?: P }): { type: Type; rangeSeparator: string; position: P | typeof strings.POSITION_INLINE_INPUT; spacing: number } {
        const hasNoTime = typeof format === 'string' && format && !/[Hhms]+/.test(format);
        const normalizedType: Type = hasNoTime && type === 'dateTime' ? 'date' : hasNoTime && type === 'dateTimeRange' ? 'dateRange' : type;
        const normalizedPosition = insetInput ? (position ?? strings.POSITION_INLINE_INPUT) : position;
        return {
            type: normalizedType,
            // padded so splitting the range text cannot match the same character inside a date
            rangeSeparator: rangeSeparator && typeof rangeSeparator === 'string' ? ` ${rangeSeparator.trim()} ` : rangeSeparator,
            position: normalizedPosition,
            // 1px spacing keeps the upper left border radius from leaking when the panel covers the trigger
            spacing: insetInput && normalizedPosition?.includes('Over') && !spacing ? numbers.SPACING_INSET_INPUT : (spacing ?? numbers.SPACING),
        };
    }

    /**
     * The state keys that `init` writes from the value, before any element exists: what the first render shows. The
     * panel state is not among them, because the panel renders only after mounting. Touches no adapter member other
     * than `getProp` and `getProps`.
     *
     * @param props the props with the defaults applied and `timeZone` resolved from the ConfigProvider
     * @returns `value`, `cachedSelectedValue`, `rangeInputFocus`, `inputValue` and `prevTimeZone`
     */
    static getInitialState(props: DatePickerFoundationProps): Pick<DatePickerFoundationState, 'value' | 'cachedSelectedValue' | 'rangeInputFocus' | 'inputValue' | 'prevTimeZone'> {
        // shortcut: the constructor wants a whole adapter, so the two getters are asserted into one; upgrade by making
        // the value parsing a static function of the props
        const readerAdapter = {
            getProp: (key: string) => props[key],
            getProps: () => props,
        } satisfies Pick<DatePickerAdapter, 'getProp' | 'getProps'>;
        const reader = new DatePickerFoundation(readerAdapter as DatePickerAdapter);
        const initialValue = reader.#getInitialValue();
        if (initialValue === undefined) {
            return { value: [], cachedSelectedValue: [], rangeInputFocus: undefined, inputValue: null, prevTimeZone: null };
        }
        const value = reader.#resolveValue(initialValue, props.timeZone);
        return {
            value,
            cachedSelectedValue: value,
            rangeInputFocus: reader.#shouldFocusRangeStart(value) ? 'rangeStart' : undefined,
            inputValue: null,
            // initFromProps stores the previous time zone it is given, and init gives none
            prevTimeZone: undefined,
        };
    }

    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        const value = this.#getInitialValue();
        if (value !== undefined) {
            this.initFromProps({ timeZone: this.getProp('timeZone'), value });
        }

        this.#initPanelOpenStatus(this.getProp('defaultOpen'));
    }

    initFromProps({ value, timeZone, prevTimeZone }: Pick<DatePickerFoundationProps, 'value' | 'timeZone'> & { prevTimeZone?: string | number }) {
        const result = this.#resolveValue(value, timeZone, prevTimeZone);
        this._adapter.updatePrevTimezone(prevTimeZone);
        this.#clearInputValue();
        this._adapter.updateValue(result);
        this.#resetCachedSelectedValue(result);
        this.#initRangeInputFocus(result);

        if (this.#needConfirm()) {
            this._adapter.updateCachedSelectedValue(result);
        }
    }

    /** Called for a mousedown outside the trigger and the panel while the panel is shown */
    handleClickOutside(e: MouseEvent) {
        this._adapter.notifyClickOutSide(e);
        // with needConfirm only the confirm and cancel buttons close the panel
        if (!this.#needConfirm()) {
            this.closePanel(e);
        }
    }

    /** @param e the mousedown outside that closes the panel, passed on to onBlur */
    closePanel(e?: MouseEvent) {
        // APG date picker dialog: keyboard focus inside the closing panel (the day grid, a time list) returns to the
        // input, or to a custom trigger, instead of falling to the body. A click keeps the old behavior, because
        // returning focus would fire the input's onFocus, which some pages use to reopen the panel.
        if (this._adapter.isKeyboardFocusInPanel()) {
            if (typeof this.getProp('triggerRender') === 'function') {
                this._adapter.setTriggerFocus();
            } else if (this.getProp('insetInput')) {
                // the trigger input is disabled while the panel is open, so it takes the focus only once enabled
                this._adapter.setTriggerDisabled(false, () => this._adapter.setTriggerFocus());
            } else {
                this.focus(this.getState('rangeInputFocus') || undefined);
            }
        }
        if (!this._isControlledComponent('open')) {
            this.close(e);
        } else {
            this.#resetInnerSelectedStates(e);
        }
        this._adapter.notifyOpenChange(false);
    }

    open() {
        this.#restartFocusRecords();
        this._adapter.togglePanel(true);
    }

    /** The controlled `open` turned true: starts what an uncontrolled open would */
    handleControlledOpen() {
        this.#restartFocusRecords();
    }

    // Escape with needConfirm discards the unconfirmed selection, as the cancel button does
    handleEscKeyDown() {
        if (this.#needConfirm()) {
            this.handleCancel();
        } else {
            this.closePanel();
        }
    }

    close(e?: MouseEvent) {
        this._adapter.togglePanel(false);
        this.#clearFocusRecords();
        this.#resetInnerSelectedStates(e);
    }

    /** Closes the panel without a blur or a returned focus, as when a Vue KeepAlive deactivates the host */
    deactivate() {
        if (!this._isControlledComponent('open')) {
            this._adapter.togglePanel(false);
            this.#clearFocusRecords();
        }
        this.#resetCachedSelectedValue();
        this.#setRangeInputFocus(false);
        this.#clearInputValue();
        this._adapter.notifyOpenChange(false);
    }

    override destroy() {
        this.#cancelFocusRecords();
    }

    // With insetInput the trigger input is disabled while the panel is open, so the inputs in the panel take the focus;
    // a closed inset picker focuses its trigger inputs like any other
    focus(focusType?: RangeInput) {
        if (typeof this.getProp('triggerRender') === 'function') {
            this._adapter.setTriggerFocus();
        } else if (this.#hasTwoInputs()) {
            this.#setRangeInputFocus(focusType ?? 'rangeStart');
        } else if (this.getProp('insetInput') && this.#isPanelShown()) {
            this._adapter.setInsetInputFocus();
        } else {
            this._adapter.setInputFocus();
        }
    }

    blur() {
        this._adapter.blurFocusedElement();
        if (this.#isRangeType()) {
            this.#setRangeInputFocus(false);
        }
    }

    /** The controlled `open` turned false: clears what an uncontrolled close would */
    handleControlledClose() {
        this.#clearFocusRecords();
        // github 1375
        const { type } = this._adapter.getProps();
        const { rangeInputFocus } = this._adapter.getStates();
        if (type === 'dateTimeRange' && rangeInputFocus) {
            this.#setRangeInputFocus(false);
        }
    }

    /** Whether the range input other than `currentRangeInput` has been focused since the panel opened */
    hasOtherRangeInputBeenFocused(currentRangeInput: RangeInput) {
        return this.getState('focusRecords')[currentRangeInput === 'rangeStart' ? 'rangeEnd' : 'rangeStart'];
    }

    // A valid date (or empty) updates the panel value; otherwise only the input text changes
    handleInputChange(input: string, e: any) {
        const result = this.#isMultiple() ? this.#parseMultipleInput(input, (part) => this.parseInput(part)) : this.parseInput(input);
        const { value: stateValue } = this.getStates();
        this.#updateCachedSelectedValueFromInput(input);
        if ((result && result.length) || input === '') {
            if (e?.[inputStrings.CLEARBTN_CLICKED_EVENT_FLAG] && this._isControlledComponent('value')) {
                this.#notifyChange(result);
                return;
            }
            this.#updateValueAndInput(result, input === '', input);
            const changedDates = this.#getChangedDates(result);
            if (!this.#someDateDisabled(changedDates, result)) {
                if (!isEqual(result, stateValue)) {
                    this.#notifyChange(result);
                }
            }
        } else {
            this._adapter.updateInputValue(input);
        }
    }

    /**
     * Always updates insetInputValue; inputValue and value are updated only when the text parses to a valid date.
     */
    handleInsetInputChange({ insetInputStr, format, insetInputValue }: { insetInputStr: string; format: string; insetInputValue: InsetInputValue }) {
        const _isMultiple = this.#isMultiple();
        const result = _isMultiple ? this.#parseMultipleInput(insetInputStr, (part) => this.parseInput(part, format)) : this.parseInput(insetInputStr, format);
        const { value: stateValue } = this.getStates();
        this.#updateCachedSelectedValueFromInput(insetInputStr);

        if (result && result.length) {
            const changedDates = this.#getChangedDates(result);
            if (!this.#someDateDisabled(changedDates, result)) {
                if (!isEqual(result, stateValue)) {
                    if (!this._isControlledComponent() && !this.#needConfirm() && this.#isValueCommittable(result)) {
                        this._adapter.updateValue(result);
                    }
                    this.#notifyChange(result);
                }
                const triggerInput = _isMultiple ? this.formatMultipleDates(result) : this.formatDates(result);
                this._adapter.updateInputValue(triggerInput);
            }
        }
        this._adapter.updateInsetInputValue(insetInputValue);
    }

    handleRangeEndTabPress() {
        this.#setRangeInputFocus(false);
    }

    handleInputFocus(e: unknown, range: RangeInput) {
        // the inset input of a single picker reports itself as rangeStart; the trigger input already notified
        if (range && !this.#isRangeType()) {
            return;
        }
        const rangeInputFocus = this._adapter.getState('rangeInputFocus');
        if (range) {
            this.#setRangeInputFocus(range);
        }
        // Range types notify only when no range input was focused yet, so moving between the two inputs is silent

        if (!range || !rangeInputFocus) {
            this._adapter.notifyFocus(e, range);
        }
    }

    handleSetRangeFocus(rangeInputFocus: RangeInput | false) {
        this.#setRangeInputFocus(rangeInputFocus);
    }

    handleInputClear(e: any) {
        this._adapter.notifyClear(e);
    }

    // The clear button is not part of Input, so value, inputValue and cachedValue are cleared here
    handleRangeInputClear(e: any) {
        const value: Date[] = [];
        const inputValue = '';
        if (!this._isControlledComponent('value')) {
            this.#updateValueAndInput(value, true, inputValue);
            this._adapter.updateInsetInputValue(null);
            this.#resetCachedSelectedValue(value);
        }
        this.#notifyChange(value);
        this.#setRangeInputFocus(false);
        this._adapter.notifyClear(e);
    }

    // Parses input only after user returns
    handleInputComplete(input: string = '') {
        let parsedResult = input ? (this.#isMultiple() ? this.#parseMultipleInput(input, (part) => this.parseInput(part), { needDedupe: true }) : this.parseInput(input)) : [];

        parsedResult = parsedResult && parsedResult.length ? parsedResult : this.getState('value');

        // Text that does not parse is no request for today: it keeps the previous value, or nothing
        const isEmptyInput = this.#isRangeType() ? input.split(this.getProp('rangeSeparator')).every((part) => !part.trim()) : !input.trim();
        if (!isEmptyInput && !parsedResult?.length) {
            return;
        }

        // Fall back to the current date when both the input and the previous value are empty
        if (!parsedResult || !parsedResult.length) {
            const nowDate = new Date();
            const type = this.getProp('type');
            // A year or a month is held as its first day at 00:00, as typing or picking it gives
            const thisMonth = new Date(nowDate.getFullYear(), nowDate.getMonth());
            if (type === 'monthRange') {
                parsedResult = [thisMonth, thisMonth];
            } else if (this.#isRangeType()) {
                parsedResult = [nowDate, nowDate];
            } else if (type === 'year') {
                parsedResult = [new Date(nowDate.getFullYear(), 0)];
            } else if (type === 'month') {
                parsedResult = [thisMonth];
            } else {
                parsedResult = [nowDate];
            }
        }

        // Captured before the update below so the change check compares against the old value
        const { value: stateValue } = this.getStates();
        this.#updateValueAndInput(parsedResult);
        const changedDates = this.#getChangedDates(parsedResult);
        if (!this.#someDateDisabled(changedDates, parsedResult) && !isEqual(parsedResult, stateValue)) {
            this.#notifyChange(parsedResult);
        }
    }

    /**
     * @param options `rangeInputFocus` is the range input the dates were picked for, when the panel has moved
     * the focus on before telling about the change
     */
    handleSelectedChange(
        value: Date[],
        options?: {
            needCheckFocusRecord?: boolean;
            closePanel?: boolean;
            rangeInputFocus?: RangeInput | false;
        }
    ) {
        const { type, format, rangeSeparator, insetInput } = this._adapter.getProps();
        const { value: stateValue } = this.getStates();
        const controlled = this._isControlledComponent();
        const closePanel = options?.closePanel ?? true;
        // A range panel closes only after both inputs were focused (start and end picked); shortcuts such as
        // presets skip that check.
        const needCheckFocusRecord = options?.needCheckFocusRecord ?? true;

        const dates = Array.isArray(value) ? [...value] : value ? [value] : [];
        const changedDates = this.#getChangedDates(dates);

        let inputValue, insetInputValue;
        if (!this.#someDateDisabled(changedDates, dates, options)) {
            this.#resetCachedSelectedValue(dates);
            inputValue = this.#isMultiple() ? this.formatMultipleDates(dates) : this.formatDates(dates);
            if (insetInput) {
                const insetInputFormatToken = getInsetInputFormatToken({ format, type });
                const insetInputStr = this.#isMultiple() ? this.formatMultipleDates(dates, undefined, insetInputFormatToken) : this.formatDates(dates, insetInputFormatToken);
                insetInputValue = getInsetInputValueFromInsetInputStr({
                    inputValue: insetInputStr,
                    type,
                    rangeSeparator,
                });
            }
            const isRangeTypeAndInputIncomplete = this.#isRangeType() && !isRangeValueComplete(dates);
            // An incomplete range does not notify, so the input text is updated here; otherwise a picked date
            // would not show in the input when controlled (#1357). The value itself stays unchanged.
            if (isRangeTypeAndInputIncomplete) {
                this._adapter.updateInputValue(inputValue);
                this._adapter.updateInsetInputValue(insetInputValue);
                return;
            } else if (!controlled) {
                this.#updateValueAndInput(dates, true, inputValue);
                this._adapter.updateInsetInputValue(insetInputValue);
            }
            if (!isEqual(value, stateValue)) {
                this.#notifyChange(value);
            }
        }

        const { rangeStart, rangeEnd } = this.getState('focusRecords');
        const focusRecordChecked = !needCheckFocusRecord || (rangeStart && rangeEnd);
        if ((type === 'date' && !this.#isMultiple() && closePanel) || (type === 'dateRange' && isRangeValueComplete(dates) && closePanel && focusRecordChecked)) {
            this.closePanel();
        }
    }

    handleYMSelectedChange({ currentMonth, currentYear }: { currentMonth?: { left: number; right: number }; currentYear?: { left: number; right: number } } = {}) {
        const { type } = this.getProps();

        if (type === 'year') {
            // January 1, the date that typing the year parses to
            this.handleSelectedChange([new Date(currentYear['left'], 0)]);
        } else if (type === 'month') {
            const date = new Date(currentYear['left'], currentMonth['left'] - 1);

            this.handleSelectedChange([date]);
        } else {
            const dateLeft = new Date(currentYear['left'], currentMonth['left'] - 1);
            const dateRight = new Date(currentYear['right'], currentMonth['right'] - 1);

            this.handleSelectedChange([dateLeft, dateRight]);
        }
    }

    handleConfirm() {
        const { cachedSelectedValue, value } = this._adapter.getStates();
        const isComplete = this.#isRangeType() ? isRangeValueComplete(cachedSelectedValue) : !cachedSelectedValue.some((date) => date == null);
        const newValue = isComplete ? cachedSelectedValue : value;
        if (this.#needConfirm() && !this._isControlledComponent()) {
            this._adapter.updateValue(newValue);
        }
        // An incomplete input falls back to the last valid value
        this.closePanel();

        if (isComplete) {
            const { notifyValue, notifyDate } = this.disposeCallbackArgs(cachedSelectedValue);
            this._adapter.notifyConfirm(notifyDate, notifyValue);
        }
    }

    handleCancel() {
        this.closePanel();
        const value = this.getState('value');
        const { notifyValue, notifyDate } = this.disposeCallbackArgs(value);
        this._adapter.notifyCancel(notifyDate, notifyValue);
    }

    handlePresetClick(item: PresetType, e: unknown) {
        const { type, timeZone } = this.getProps();
        const start = typeof item.start === 'function' ? item.start() : item.start;
        const end = typeof item.end === 'function' ? item.end() : item.end;

        // presets are absolute instants like a value prop, so no previous time zone applies
        let value;
        switch (type) {
            case 'year':
                // A year or a month is held as its first day at 00:00, as typing or picking it gives
                value = this.parseWithTimezone([start], timeZone).map((date) => new Date(date.getFullYear(), 0));
                this.handleSelectedChange(value);
                break;
            case 'month':
                value = this.parseWithTimezone([start], timeZone).map((date) => new Date(date.getFullYear(), date.getMonth()));
                this.handleSelectedChange(value);
                break;
            case 'dateTime':
            case 'date':
                value = this.parseWithTimezone([start], timeZone);
                this.handleSelectedChange(value);
                break;
            case 'dateTimeRange':
            case 'dateRange':
                value = this.parseWithTimezone([start, end], timeZone);
                this.handleSelectedChange(value, { needCheckFocusRecord: false });
                break;
            default:
                break;
        }
        this._adapter.notifyPresetsClick(item, e);
    }

    disabledDisposeDate(date: Date, ...rest: any[]) {
        return DatePickerFoundation.disposeDateFn(this.getProp('timeZone'), this.getProp('disabledDate'), date, ...rest);
    }

    disabledDisposeTime(date: Date | Date[], ...rest: any[]): ReturnType<DisabledTimeType> {
        return DatePickerFoundation.disposeDateFn(this.getProp('timeZone'), this.getProp('disabledTime'), date, ...rest);
    }

    /**
     * Opens the panel on trigger click and, for range types, focuses rangeStart when no range input is focused.
     * Non-range triggers are native inputs that already handle focus. isEventTarget tells a click on the input
     * wrapper itself from one bubbled up from a child, which already handled focus.
     */
    handleTriggerWrapperClick(e: unknown) {
        const { disabled, triggerRender } = this._adapter.getProps();
        const { rangeInputFocus } = this._adapter.getStates();
        if (disabled) {
            return;
        }
        if (this.#isRangeType() && !rangeInputFocus) {
            if (this._adapter.isEventTarget(e)) {
                this.handleInputFocus(e, 'rangeStart');
            } else if (typeof triggerRender === 'function') {
                // triggerRender has no input, so rangeStart is focused by default when the panel opens
                this.#setRangeInputFocus('rangeStart');
            }
            this.#openPanel();
        } else {
            this.#openPanel();
        }
    }

    /**
     * The trigger's click handler. Enter and Space on an inner control of the default trigger (its clear button) click
     * it, and that click must not open the panel too; a pointer click on it still does. A custom trigger skips the
     * check: its focusable element is the Tab stop and the opener, so its keyboard click has to open the panel (a
     * control that must not open it stops propagation itself). Keys reach handleTriggerWrapperClick through
     * handleTriggerKeyDown instead, so the check stays out of it.
     */
    handleTriggerClick(e: Pick<MouseEvent, 'detail' | 'target' | 'currentTarget'>, isCustomTrigger: boolean) {
        if (isCustomTrigger || !isInnerControlActivation(e)) {
            this.handleTriggerWrapperClick(e);
        }
    }

    /**
     * APG combobox: Down Arrow on the closed trigger opens the panel (once it is open, the Popover moves focus into
     * it). A custom trigger that is itself the Tab stop is a button, so Enter and Space open it too.
     */
    handleTriggerKeyDown(e: Pick<KeyboardEvent, 'key' | 'preventDefault'>, isTriggerButton: boolean) {
        const open = this._isControlledComponent('open') ? this.getProp('open') : this.getState('panelShow');
        const opens = e.key === 'ArrowDown' || (isTriggerButton && (e.key === 'Enter' || e.key === ' '));
        if (!open && opens) {
            e.preventDefault();
            this.handleTriggerWrapperClick(e);
        }
    }

    handlePanelVisibleChange(visible: boolean) {
        if (visible) {
            // without the inset input there is nothing to focus, and refocusing the trigger input would fire its onFocus again
            if (this.getProp('insetInput')) {
                this._adapter.setInsetInputFocus();
            }
            // The trigger input is disabled while the panel is open
            this._adapter.setTriggerDisabled(true);
        } else {
            this._adapter.setTriggerDisabled(false);
        }
    }
}
