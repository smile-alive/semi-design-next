import { format, isValid, isSameSecond, isEqual as isDateEqual, isDate, startOfDay } from 'date-fns';
import { isEqual } from 'es-toolkit';
import type { ValidateStatus } from '../../base/constants';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { isInnerControlActivation } from '../../utils/a11y';
import { zonedTimeToUtc } from '../../utils/date-fns-extra';
import isValidTimeZone from '../../utils/is-valid-time-zone';
import type { ArrayElement } from '../../utils/type';
import warning from '../../utils/warning';
import { parseReference, toWallTime } from '../../utils/zoned-time';
import { getDefaultFormatTokenByType } from './_utils/get-default-format-token';
import getInsetInputFormatToken from './_utils/get-inset-input-format-token';
import getInsetInputValueFromInsetInputStr from './_utils/get-inset-input-value-from-inset-input-str';
import type { WeekStartNumber } from './_utils/get-month-table';
import { isValidDate } from './_utils/index';
import parseValue from './_utils/parse-value';
import { compatibleParse } from './_utils/parser';
import { isMultiple, isRangeType, isRangeValueComplete, needConfirm } from './_utils/picker-type';
import toCallbackArgs, { toCallbackDates } from './_utils/to-callback-args';
import toDateArg from './_utils/to-date-arg';
import { numbers, strings } from './constants';
import type { Type, DateInputFoundationProps, InsetInputValue, RangeInput } from './input-foundation';
import type { FocusRecords } from './month-foundation';
import type { MonthsGridFoundationProps, PanelView } from './months-grid-foundation';

// the framework packages read these helpers here: _utils is private to the foundation
export { default as getYearMonthFromValue } from './_utils/get-year-month-from-value';
export { isRangeType, isRangeValueComplete, isSplitRangeInputs, isYearOrMonthType, needConfirm } from './_utils/picker-type';
export type { WeekStartNumber } from './_utils/get-month-table';

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
    rangeInputFocus?: 'rangeStart' | 'rangeEnd' | false;
};

/** `null` start and end make a preset that clears the value */
export type PresetType = {
    start?: BaseValueType | null | (() => BaseValueType);
    end?: BaseValueType | null | (() => BaseValueType);
    text?: string;
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
    /** filled by the framework, not a component prop: a custom trigger (a render function or slot the host declares itself) replaces the inputs */
    customTrigger?: boolean;
    rangeSeparator?: string;
    /** `any` keeps the foundation framework-agnostic; each framework package declares its own node type */
    rangeSeparatorNode?: any;
    insetInput?: DateInputFoundationProps['insetInput'];
    preventScroll?: boolean;
}

export interface DatePickerFoundationState {
    panelShow: boolean;
    /** `null` while the input shows the formatted value */
    inputValue: string | null;
    value: Date[];
    cachedSelectedValue: (Date | null)[];
    /** `undefined` until a range input is focused or the value is set */
    rangeInputFocus?: RangeInput | false;
    autofocus: boolean;
    insetInputValue: InsetInputValue | null;
    triggerDisabled: boolean | null;
    /** which range inputs have been focused since the panel opened; a range closes once both have */
    focusRecords: FocusRecords;
}

export type { Type, DateInputFoundationProps, RangeInput } from './input-foundation';

export interface DatePickerAdapter extends DefaultAdapter<DatePickerFoundationProps, DatePickerFoundationState> {
    notifyBlur: DatePickerFoundationProps['onBlur'];
    notifyFocus: DatePickerFoundationProps['onFocus'];
    notifyClear: DatePickerFoundationProps['onClear'];
    notifyChange: (date: Date | Date[], dateStr: string | string[]) => void;
    notifyCancel: DatePickerFoundationProps['onCancel'];
    notifyConfirm: DatePickerFoundationProps['onConfirm'];
    notifyOpenChange: DatePickerFoundationProps['onOpenChange'];
    notifyClickOutSide: DatePickerFoundationProps['onClickOutSide'];
    notifyPresetsClick: DatePickerFoundationProps['onPresetClick'];
    /** focuses the given range input, in the panel while it has inset inputs, else in the trigger */
    focusRangeInput: (rangeInput: RangeInput) => void;
    switchPanels: (view: PanelView) => void;
    /** focus is in the panel and came from the keyboard (`:focus-visible`), not from a click */
    isKeyboardFocusInPanel: () => boolean;
    setInsetInputFocus: () => void;
    setInputFocus: () => void;
    /** focuses the first focus target in the trigger (an input, or a custom trigger's own element), else its wrapper */
    setTriggerFocus: () => void;
    blurFocusedElement: () => void;
}

// utcToZonedTime gives a wall time the system zone skips the same getTime as the wall time one gap later, so the hours tell them apart
function isSameValue(dates: Date[], stateValue: Date[]) {
    return isEqual(dates, stateValue) && dates.every((date, i) => date?.getHours() === stateValue[i]?.getHours());
}

export default class DatePickerFoundation extends BaseFoundation<DatePickerAdapter, DatePickerFoundationProps, DatePickerFoundationState> {
    static override readonly propKeys = ['value', 'timeZone', 'open', 'disabled'];
    // an owner often rebuilds the same dates as a new array or Date on each render, which must not reset the input
    static override readonly propEquals = { value: isEqual };

    #setRangeInputFocus(rangeInputFocus: RangeInput | false) {
        // the DOM focus comes first: the input's focus handler still has to read the previous rangeInputFocus
        if (rangeInputFocus) {
            this.adapter.focusRangeInput(rangeInputFocus);
        }
        if (rangeInputFocus !== this.getState('rangeInputFocus')) {
            this.setState({ rangeInputFocus });
        }
        const focusRecords = this.getState('focusRecords');
        if (rangeInputFocus && !focusRecords[rangeInputFocus]) {
            this.setState({ focusRecords: { ...focusRecords, [rangeInputFocus]: true } });
        }
    }

    // Records count only since this opening: Tab presses through the inputs while the panel was closed would make
    // it treat both ends as picked. The input that opens the panel is already focused.
    #restartFocusRecords() {
        const rangeInputFocus = this.getState('rangeInputFocus');
        this.setState({ focusRecords: { rangeStart: rangeInputFocus === 'rangeStart', rangeEnd: rangeInputFocus === 'rangeEnd' } });
    }

    // runs after a keyboard close returned the focus to an input, which recorded it
    #clearFocusRecords() {
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

    #parseValue(value: BaseValueType, timeZone?: string | number) {
        return parseValue(value, { format: this.getProp('format'), dateFnsLocale: this.getProp('dateFnsLocale'), timeZone });
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
            if (!this.isControlledComponent() && !this.#someDateDisabled(changedDates, _value) && !this.#needConfirm() && this.#isValueCommittable(_value)) {
                this.setState({ value: _value });
            }
        }
        this.setState({ inputValue: input });
    }

    // only the inset inputs show it, and an equal value keeps the inputs from re-rendering mid-typing
    #setInsetInputValue(insetInputValue: InsetInputValue | null) {
        if (this.getProp('insetInput') && !isEqual(insetInputValue, this.getState('insetInputValue'))) {
            this.setState({ insetInputValue });
        }
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
        this.adapter.notifyChange(notifyDate, notifyValue);
    }

    #getChangedDates(dates: Date[]) {
        const type = this.adapter.getProp('type');
        const { cachedSelectedValue: lastDate } = this.adapter.getStates();
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

    /** @param selectedValue passed to the second parameter of `disabledDate` when selecting a range */
    #someDateDisabled(value: Date[], selectedValue: Date[]) {
        const { rangeInputFocus } = this.getStates();
        const { timeZone, disabledDate } = this.getProps();
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
                if (DatePickerFoundation.disposeDateFn(timeZone, disabledDate, dateToCheck, disabledOptions)) {
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

    #shouldFocusRangeStart(result: Date[]) {
        return this.#isRangeType() && Boolean(this.getProp('customTrigger')) && result.length === 0;
    }

    #initRangeInputFocus(result: Date[]) {
        if (this.#shouldFocusRangeStart(result)) {
            this.#setRangeInputFocus('rangeStart');
        }
    }

    #getInitialValue() {
        return this.isControlledComponent() ? this.getProp('value') : this.getProp('defaultValue');
    }

    #resolveValue(value: DatePickerFoundationProps['value'], timeZone: string | number, prevTimeZone?: string | number) {
        const _value = (Array.isArray(value) ? [...value] : (value || value === 0) && [value]) || [];
        return this.parseWithTimezone(_value, timeZone, prevTimeZone);
    }

    /** `prevTimeZone` re-zones a value already zoned in it; without it `value` is a UTC value such as the prop */
    #syncValue(value: DatePickerFoundationProps['value'], timeZone: string | number, prevTimeZone?: string | number) {
        const result = this.#resolveValue(value, timeZone, prevTimeZone);
        this.#clearInputValue();
        this.setState({ value: result });
        this.#resetCachedSelectedValue(result);
        this.#initRangeInputFocus(result);
    }

    // The controlled `open` turned false: clears what an uncontrolled close would
    #handleControlledClose() {
        this.#clearFocusRecords();
        if (this.getProp('type') === 'dateTimeRange' && this.getState('rangeInputFocus')) {
            this.#setRangeInputFocus(false);
        }
    }

    // A picker disabled with its panel shown closes it without a blur or a returned focus: the user did not leave it
    #closeOnDisable() {
        if (!this.isControlledComponent('open')) {
            this.setState({ panelShow: false });
            this.#clearFocusRecords();
        }
        this.#resetCachedSelectedValue();
        this.#setRangeInputFocus(false);
        this.#clearInputValue();
        this.adapter.notifyOpenChange(false);
    }

    #openPanel() {
        if (!this.getProp('disabled') && !this.#isPanelShown()) {
            if (!this.isControlledComponent('open')) {
                this.open();
            }
            this.adapter.notifyOpenChange(true);
        }
    }

    #resetCachedSelectedValue(willUpdateDates?: Date[]) {
        const { value, cachedSelectedValue } = this.adapter.getStates();
        const newCachedSelectedValue = Array.isArray(willUpdateDates) ? willUpdateDates : value;
        if (!isEqual(newCachedSelectedValue, cachedSelectedValue)) {
            this.setState({ cachedSelectedValue: newCachedSelectedValue });
        }
    }

    #resetInnerSelectedStates(e?: MouseEvent) {
        this.#resetCachedSelectedValue();
        this.#resetFocus(e);
        this.#clearInputValue();
    }

    #resetFocus(e?: MouseEvent) {
        this.#setRangeInputFocus(false);
        this.adapter.notifyBlur(e);
    }

    #clearInputValue() {
        this.setState({ inputValue: null });
        this.#setInsetInputValue(null);
    }

    // Typed text is a wall time of the target zone and is parsed there: whether it exists must not depend on the system zone
    #getNowInTimeZone() {
        return parseReference(this.getProp('timeZone'));
    }

    #toZonedValue(parsed: Date) {
        return toWallTime(parsed, this.getProp('timeZone'));
    }

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
     * Non-range triggers are native inputs that already handle focus. A click on the input wrapper itself is told from
     * one bubbled up from a child, which already handled focus.
     */
    #handleTriggerWrapperClick(e: Pick<Event, 'target' | 'currentTarget'>) {
        const { disabled, customTrigger } = this.adapter.getProps();
        const { rangeInputFocus } = this.adapter.getStates();
        if (disabled) {
            return;
        }
        if (this.#isRangeType() && !rangeInputFocus) {
            if (e.target === e.currentTarget) {
                this.handleInputFocus(e, 'rangeStart');
            } else if (customTrigger) {
                // a custom trigger has no input, so rangeStart is focused by default when the panel opens
                this.#setRangeInputFocus('rangeStart');
            }
            this.#openPanel();
        } else {
            this.#openPanel();
        }
    }

    /**
     * `value` is either a user value (the prop, a preset) or, with `prevTimeZone`, the wall times held in that zone,
     * re-zoned into `timeZone` at the same instants.
     */
    protected parseWithTimezone(value: ValueType, timeZone: string | number, prevTimeZone?: string | number) {
        const result: Date[] = [];
        if (Array.isArray(value) && value.length) {
            for (const v of value) {
                // an empty end of a range, or a preset that clears the value
                if (v == null || v === '') {
                    continue;
                }
                // NaN reaches the warning below instead of the parser, which rejects it with a TypeError
                const parsedV = (v || v === 0) && this.#parseValue(isValidTimeZone(prevTimeZone) ? zonedTimeToUtc(v, prevTimeZone) : v, timeZone);
                if (parsedV) {
                    result.push(parsedV);
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
            const nowDate = this.#getNowInTimeZone();
            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    parsedResult = compatibleParse(input, formatToken, nowDate, dateFnsLocale);
                    formatedInput = parsedResult && isValid(parsedResult) && this.localeFormat(parsedResult, formatToken);
                    if (parsedResult && formatedInput === input) {
                        result = [this.#toZonedValue(parsedResult)];
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
                        result = parsedResult.toSorted((d1, d2) => d1.getTime() - d2.getTime()).map((date) => this.#toZonedValue(date));
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
            const nowDate = this.#getNowInTimeZone();
            switch (type) {
                case 'date':
                case 'dateTime':
                case 'month':
                case 'year':
                    const _parsedResult = compatibleParse(input, formatToken, nowDate, dateFnsLocale);
                    if (isValidDate(_parsedResult)) {
                        formatedInput = this.localeFormat(_parsedResult, formatToken);
                        if (formatedInput === input) {
                            parsedResult = this.#toZonedValue(_parsedResult);
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
                    const ordered = parsedResult.every((item) => isValid(item)) ? parsedResult.toSorted((d1, d2) => d1.getTime() - d2.getTime()) : parsedResult;
                    result = ordered.map((date) => date && this.#toZonedValue(date));
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
        const dateFnsLocale = this.adapter.getProp('dateFnsLocale');
        return format(date, token, { locale: dateFnsLocale });
    }

    // getInitialState already put rangeInputFocus into the state; this moves the focus there and records it
    protected override initOnce() {
        if (this.#getInitialValue() !== undefined) {
            this.#initRangeInputFocus(this.getState('value'));
        }
    }

    /**
     * Calls a date callback such as `disabledDate` with the dates converted from computer time to `timeZone`; a callback
     * that was not given allows everything: its undefined result is typed as `R` because every reader treats it as
     * falsy, so the hosts can hand this to children whose props are typed with the callback's own result. Static so a
     * render can pass the props it renders with: the instance reads the last committed ones.
     */
    static disposeDateFn<R>(timeZone: string | number | undefined, fn: ((date: any, ...rest: any) => R) | undefined, date: Date | Date[], ...rest: any[]) {
        const dates = toCallbackDates(date, timeZone);
        return fn?.(Array.isArray(date) ? dates : dates[0], ...rest) as R;
    }

    /** The held value as a custom trigger gets it: TZDates of `timeZone`, like the callbacks */
    static getTriggerValue(value: Date[], timeZone?: string | number) {
        return toCallbackDates(value, timeZone);
    }

    /** Whether a picked date is shown only once the owner passes it back as `value`: a confirm step keeps it unconfirmed instead */
    static isSelectionControlled(props: Pick<DatePickerFoundationProps, 'type' | 'needConfirm' | 'value'>) {
        return !needConfirm(props) && props.value !== undefined;
    }

    /** A controlled `open` is not copied into state; a disabled picker shows no panel */
    static isPanelShown(props: Pick<DatePickerFoundationProps, 'open' | 'disabled'>, state: Pick<DatePickerFoundationState, 'panelShow'>) {
        return (props.open !== undefined ? Boolean(props.open) : Boolean(state.panelShow)) && !props.disabled;
    }

    /** The rtl default of `position`, for the position `normalizeProps` left unset; `direction` is read from the host's config */
    static getPosition<P extends string>(position?: P, direction?: string) {
        return position ?? (direction === 'rtl' ? 'bottomRight' : 'bottomLeft');
    }

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
     * The whole first state, before any element exists, so the server HTML and hydration agree. Touches no adapter
     * member other than `getProp` and `getProps`.
     *
     * @param props the props with the defaults applied and `timeZone` resolved from the ConfigProvider
     */
    static getInitialState(props: DatePickerFoundationProps): DatePickerFoundationState {
        // shortcut: the constructor wants a whole adapter, so the two getters are asserted into one; upgrade by making
        // the value parsing a static function of the props
        const readerAdapter = {
            getProp: (key: string) => props[key],
            getProps: () => props,
        } satisfies Pick<DatePickerAdapter, 'getProp' | 'getProps'>;
        const reader = new DatePickerFoundation(readerAdapter as DatePickerAdapter);
        const initialValue = reader.#getInitialValue();
        const value = initialValue === undefined ? [] : reader.#resolveValue(initialValue, props.timeZone);
        const opening = Boolean(props.open || props.defaultOpen);
        return {
            panelShow: opening && !props.disabled,
            inputValue: null,
            value,
            cachedSelectedValue: value,
            // without any value, a custom range trigger starts with no range input until it is clicked
            rangeInputFocus: initialValue !== undefined && reader.#shouldFocusRangeStart(value) ? 'rangeStart' : undefined,
            autofocus: Boolean(props.autoFocus || (isRangeType(props.type) && !props.customTrigger && opening)),
            insetInputValue: null,
            triggerDisabled: null,
            focusRecords: { rangeStart: false, rangeEnd: false },
        };
    }

    override handlePropsChange(prev: Partial<DatePickerFoundationProps>) {
        const { value, timeZone, open, disabled } = this.getProps();
        if (!isEqual(value, prev.value) || (timeZone !== prev.timeZone && this.isControlledComponent())) {
            // a controlled string is a wall time of whichever zone is current, so a new zone reads it again
            this.#syncValue(value, timeZone);
        } else if (timeZone !== prev.timeZone) {
            this.#syncValue(this.getState('value'), timeZone, prev.timeZone);
        }
        if (open !== prev.open) {
            if (open) {
                this.#restartFocusRecords();
            } else {
                this.#handleControlledClose();
            }
        }
        // isPanelShown is already false for a disabled picker, so the check passes `disabled: false`
        if (disabled && !prev.disabled && DatePickerFoundation.isPanelShown({ open, disabled: false }, this.getStates())) {
            this.#closeOnDisable();
        }
    }

    /** Called for a mousedown outside the trigger and the panel while the panel is shown */
    handleClickOutside = (e: MouseEvent) => {
        this.adapter.notifyClickOutSide(e);
        // with needConfirm only the confirm and cancel buttons close the panel
        if (!this.#needConfirm()) {
            this.closePanel(e);
        }
    };

    /** @param e the mousedown outside that closes the panel, passed on to onBlur */
    closePanel(e?: MouseEvent) {
        // APG date picker dialog: keyboard focus inside the closing panel (the day grid, a time list) returns to the
        // input, or to a custom trigger, instead of falling to the body. A click keeps the old behavior, because
        // returning focus would fire the input's onFocus, which some pages use to reopen the panel.
        if (this.adapter.isKeyboardFocusInPanel()) {
            if (this.getProp('customTrigger')) {
                this.adapter.setTriggerFocus();
            } else if (this.getProp('insetInput')) {
                // the trigger input is disabled while the panel is open, so it takes the focus only once enabled
                void this.commitState({ triggerDisabled: false }).then(() => this.adapter.setTriggerFocus());
            } else {
                this.focus(this.getState('rangeInputFocus') || undefined);
            }
        }
        if (!this.isControlledComponent('open')) {
            this.close(e);
        } else {
            this.#resetInnerSelectedStates(e);
        }
        this.adapter.notifyOpenChange(false);
    }

    open = () => {
        this.#restartFocusRecords();
        this.setState({ panelShow: true });
    };

    // Escape with needConfirm discards the unconfirmed selection, as the cancel button does
    handleEscKeyDown = () => {
        if (this.#needConfirm()) {
            this.handleCancel();
        } else {
            this.closePanel();
        }
    };

    close = (e?: MouseEvent) => {
        this.setState({ panelShow: false });
        this.#clearFocusRecords();
        this.#resetInnerSelectedStates(e);
    };

    // With insetInput the trigger input is disabled while the panel is open, so the inputs in the panel take the focus;
    // a closed inset picker focuses its trigger inputs like any other
    focus = (focusType?: RangeInput) => {
        if (this.getProp('customTrigger')) {
            this.adapter.setTriggerFocus();
        } else if (this.#hasTwoInputs()) {
            this.#setRangeInputFocus(focusType ?? 'rangeStart');
        } else if (this.getProp('insetInput') && this.#isPanelShown()) {
            this.adapter.setInsetInputFocus();
        } else {
            this.adapter.setInputFocus();
        }
    };

    blur = () => {
        this.adapter.blurFocusedElement();
        if (this.#isRangeType()) {
            this.#setRangeInputFocus(false);
        }
    };

    handleInputChange = (input: string) => {
        const result = this.#isMultiple() ? this.#parseMultipleInput(input, (part) => this.parseInput(part)) : this.parseInput(input);
        const { value: stateValue } = this.getStates();
        this.#updateCachedSelectedValueFromInput(input);
        if ((result && result.length) || input === '') {
            this.#updateValueAndInput(result, input === '', input);
            const changedDates = this.#getChangedDates(result);
            if (!this.#someDateDisabled(changedDates, result)) {
                if (!isSameValue(result, stateValue)) {
                    this.#notifyChange(result);
                }
            }
        } else {
            this.setState({ inputValue: input });
        }
    };

    handleInsetInputChange = ({ insetInputStr, format, insetInputValue }: { insetInputStr: string; format: string; insetInputValue: InsetInputValue }) => {
        const _isMultiple = this.#isMultiple();
        const result = _isMultiple ? this.#parseMultipleInput(insetInputStr, (part) => this.parseInput(part, format)) : this.parseInput(insetInputStr, format);
        const { value: stateValue } = this.getStates();
        this.#updateCachedSelectedValueFromInput(insetInputStr);

        if (result && result.length) {
            const changedDates = this.#getChangedDates(result);
            if (!this.#someDateDisabled(changedDates, result)) {
                if (!isSameValue(result, stateValue)) {
                    if (!this.isControlledComponent() && !this.#needConfirm() && this.#isValueCommittable(result)) {
                        this.setState({ value: result });
                    }
                    this.#notifyChange(result);
                }
                const triggerInput = _isMultiple ? this.formatMultipleDates(result) : this.formatDates(result);
                this.setState({ inputValue: triggerInput });
            }
        }
        this.#setInsetInputValue(insetInputValue);
    };

    handleRangeEndTabPress = () => {
        this.#setRangeInputFocus(false);
    };

    handleInputFocus = (e: unknown, range: RangeInput) => {
        // the inset input of a single picker reports itself as rangeStart; the trigger input already notified
        if (range && !this.#isRangeType()) {
            return;
        }
        const rangeInputFocus = this.adapter.getState('rangeInputFocus');
        if (range) {
            this.#setRangeInputFocus(range);
        }
        // Range types notify only when no range input was focused yet, so moving between the two inputs is silent

        if (!range || !rangeInputFocus) {
            this.adapter.notifyFocus(e, range);
        }
    };

    handleInsetDateFocus = (e: unknown, range: RangeInput) => {
        this.adapter.switchPanels('date');
        this.handleInputFocus(e, range);
    };

    handleInsetTimeFocus = () => {
        this.adapter.switchPanels('time');
    };

    handleInputClear = (e: unknown) => {
        // Input reports the clear as a change to '' first; a controlled value keeps showing until the owner changes it
        if (this.isControlledComponent('value')) {
            this.setState({ inputValue: null });
        }
        this.adapter.notifyClear(e);
    };

    // The clear button is not part of Input, so value, inputValue and cachedValue are cleared here
    handleRangeInputClear = (e: unknown) => {
        const value: Date[] = [];
        const inputValue = '';
        if (!this.isControlledComponent('value')) {
            this.#updateValueAndInput(value, true, inputValue);
            this.#setInsetInputValue(null);
            this.#resetCachedSelectedValue(value);
        }
        this.#notifyChange(value);
        this.#setRangeInputFocus(false);
        this.adapter.notifyClear(e);
    };

    handleInputComplete = (input: string = '') => {
        let parsedResult = input ? (this.#isMultiple() ? this.#parseMultipleInput(input, (part) => this.parseInput(part), { needDedupe: true }) : this.parseInput(input)) : [];

        parsedResult = parsedResult && parsedResult.length ? parsedResult : this.getState('value');

        // Text that does not parse is no request for today: it keeps the previous value, or nothing
        const isEmptyInput = this.#isRangeType() ? input.split(this.getProp('rangeSeparator')).every((part) => !part.trim()) : !input.trim();
        if (!isEmptyInput && !parsedResult?.length) {
            return;
        }

        if (!parsedResult || !parsedResult.length) {
            const nowDate = this.#toZonedValue(new Date());
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

        const { value: stateValue } = this.getStates();
        this.#updateValueAndInput(parsedResult);
        const changedDates = this.#getChangedDates(parsedResult);
        if (!this.#someDateDisabled(changedDates, parsedResult) && !isSameValue(parsedResult, stateValue)) {
            this.#notifyChange(parsedResult);
        }
    };

    /**
     * @param options `nextRangeInputFocus` is the range input the panel moves the focus to when it stays open, after
     * the change is told
     */
    handleSelectedChange = (
        value: Date[],
        options?: {
            needCheckFocusRecord?: boolean;
            closePanel?: boolean;
            nextRangeInputFocus?: RangeInput;
        }
    ) => {
        const { type, format, rangeSeparator, insetInput } = this.adapter.getProps();
        const { value: stateValue } = this.getStates();
        const controlled = this.isControlledComponent();
        const closePanel = options?.closePanel ?? true;
        const dates = Array.isArray(value) ? [...value] : value ? [value] : [];
        // A range panel closes only after both inputs were focused (start and end picked); shortcuts such as
        // presets skip that check. The records are read before the focus moves on.
        const { rangeStart, rangeEnd } = this.getState('focusRecords');
        const focusRecordChecked = !(options?.needCheckFocusRecord ?? true) || (rangeStart && rangeEnd);
        const closes = closePanel && ((type === 'date' && !this.#isMultiple()) || (type === 'dateRange' && isRangeValueComplete(dates) && focusRecordChecked));

        const changedDates = this.#getChangedDates(dates);
        let inputValue, insetInputValue;
        if (!this.#someDateDisabled(changedDates, dates)) {
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
                this.setState({ inputValue });
                this.#setInsetInputValue(insetInputValue);
            } else {
                if (!controlled) {
                    this.#updateValueAndInput(dates, true, inputValue);
                    this.#setInsetInputValue(insetInputValue);
                }
                if (!isSameValue(value, stateValue)) {
                    this.#notifyChange(value);
                }
            }
        }

        if (closes) {
            this.closePanel();
        } else if (options?.nextRangeInputFocus) {
            this.#setRangeInputFocus(options.nextRangeInputFocus);
        }
    };

    handleYMSelectedChange = ({ currentMonth, currentYear }: { currentMonth?: { left: number; right: number }; currentYear?: { left: number; right: number } } = {}) => {
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
    };

    handleConfirm = () => {
        const { cachedSelectedValue, value } = this.adapter.getStates();
        const isComplete = this.#isRangeType() ? isRangeValueComplete(cachedSelectedValue) : !cachedSelectedValue.some((date) => date == null);
        const newValue = isComplete ? cachedSelectedValue : value;
        if (this.#needConfirm() && !this.isControlledComponent()) {
            this.setState({ value: newValue });
        }
        this.closePanel();

        if (isComplete) {
            const { notifyValue, notifyDate } = this.disposeCallbackArgs(cachedSelectedValue);
            this.adapter.notifyConfirm(notifyDate, notifyValue);
        }
    };

    handleCancel = () => {
        this.closePanel();
        const value = this.getState('value');
        const { notifyValue, notifyDate } = this.disposeCallbackArgs(value);
        this.adapter.notifyCancel(notifyDate, notifyValue);
    };

    handlePresetClick = (item: PresetType, e: unknown) => {
        const { type, timeZone } = this.getProps();
        const start = typeof item.start === 'function' ? item.start() : item.start;
        const end = typeof item.end === 'function' ? item.end() : item.end;

        // presets are absolute instants like a value prop, so no previous time zone applies
        let value;
        switch (type) {
            case 'year':
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
        this.adapter.notifyPresetsClick(item, e);
    };

    /**
     * The trigger's click handler. Enter and Space on an inner control of the default trigger (its clear button) click
     * it, and that click must not open the panel too; a pointer click on it still does. A custom trigger skips the
     * check: its focusable element is the Tab stop and the opener, so its keyboard click has to open the panel (a
     * control that must not open it stops propagation itself). Keys reach #handleTriggerWrapperClick through
     * handleTriggerKeyDown instead, so the check stays out of it.
     */
    handleTriggerClick = (e: Pick<MouseEvent, 'detail' | 'target' | 'currentTarget'>) => {
        if (this.getProp('customTrigger') || !isInnerControlActivation(e)) {
            this.#handleTriggerWrapperClick(e);
        }
    };

    /**
     * APG combobox: Down Arrow on the closed trigger opens the panel (once it is open, the Popover moves focus into
     * it). A custom trigger that is itself the Tab stop is a button, so Enter and Space open it too.
     */
    handleTriggerKeyDown = (e: Pick<KeyboardEvent, 'key' | 'preventDefault' | 'target' | 'currentTarget'>, isTriggerButton: boolean) => {
        const open = this.isControlledComponent('open') ? this.getProp('open') : this.getState('panelShow');
        const opens = e.key === 'ArrowDown' || (isTriggerButton && (e.key === 'Enter' || e.key === ' '));
        if (!open && opens) {
            e.preventDefault();
            this.#handleTriggerWrapperClick(e);
        }
    };

    handlePanelVisibleChange = (visible: boolean) => {
        if (visible) {
            // without the inset input there is nothing to focus, and refocusing the trigger input would fire its onFocus again
            if (this.getProp('insetInput')) {
                this.adapter.setInsetInputFocus();
            }
            this.setState({ triggerDisabled: true });
        } else {
            this.setState({ triggerDisabled: false });
        }
    };
}
