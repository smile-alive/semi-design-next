import { format, set, addMonths, subMonths, subYears, addYears, differenceInCalendarMonths, differenceInCalendarYears, isSameDay, parseISO } from 'date-fns';
import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { Locale } from '../locale/interface';
import type { ArrayElement } from '../utils/type';
import { getDefaultFormatTokenByType } from './_utils/get-default-format-token';
import getDefaultPickerDate from './_utils/get-default-picker-date';
import type { WeekStartNumber } from './_utils/get-month-table';
import { isBefore, isValidDate, getDefaultFormatToken, getFullDateOffset } from './_utils/index';
import { compatibleParse } from './_utils/parser';
import { isDateTimeType, isMultiple, isRangeType } from './_utils/picker-type';
import toCallbackArgs from './_utils/to-callback-args';
import toDateArg from './_utils/to-date-arg';
import { strings } from './constants';
import type { DateInputFoundationProps, DateOffsetType, DisabledDateType, DisabledTimeType, PresetPosition, RenderDateType, RenderFullDateType, ValueType } from './foundation';
import type { FocusRecords, MonthDayInfo } from './month-foundation';
import type { YearAndMonthFoundationProps } from './year-and-month-foundation';

const dateDiffFns = {
    month: differenceInCalendarMonths,
    year: differenceInCalendarYears,
};

const dateCalcFns = {
    prevMonth: subMonths,
    nextMonth: addMonths,
    prevYear: subYears,
    nextYear: addYears,
};

type Type = ArrayElement<typeof strings.TYPE_SET>;

interface MonthsGridElementProps {
    renderDate?: RenderDateType;
    renderFullDate?: RenderFullDateType;
}

export type PanelType = 'left' | 'right';
export type YearMonthChangeType = 'prevMonth' | 'nextMonth' | 'prevYear' | 'nextYear';

export interface MonthsGridFoundationProps extends MonthsGridElementProps, Pick<YearAndMonthFoundationProps, 'startYear' | 'endYear'> {
    type?: Type;
    /**
     * the dates DatePicker holds as selected, synced into the panels on every change; may be null if selection is
     * not complete when type is dateRange or dateTimeRange
     */
    selectedValue?: (Date | null)[];
    defaultPickerValue?: ValueType;
    multiple?: boolean;
    max?: number;
    weekStartsOn?: WeekStartNumber;
    disabledDate?: DisabledDateType;
    disabledTime?: (date: Date | Date[], panelType: PanelType) => ReturnType<DisabledTimeType>;
    disabledTimePicker?: boolean;
    hideDisabledOptions?: boolean;
    timePickerOpts?: any;
    isControlledComponent?: boolean;
    rangeStart?: string;
    rangeInputFocus?: boolean | string;
    locale?: any;
    format?: string;
    startDateOffset?: DateOffsetType;
    endDateOffset?: DateOffsetType;
    autoSwitchDate?: boolean;
    density?: string;
    dateFnsLocale?: any;
    timeZone?: string | number;
    syncSwitchMonth?: boolean;
    onChange?: (
        value: [Date] | [Date, Date],
        options?: {
            closePanel?: boolean;
            needCheckFocusRecord?: boolean;
            rangeInputFocus?: 'rangeStart' | 'rangeEnd' | false;
        }
    ) => void;
    onPanelChange?: (date: Date | Date[], dateString: string | string[]) => void;
    setRangeInputFocus?: (rangeInputFocus: 'rangeStart' | 'rangeEnd') => void;
    hasOtherRangeInputBeenFocused?: (currentRangeInput: 'rangeStart' | 'rangeEnd') => boolean;
    focusRecords?: FocusRecords;
    triggerRender?: (props: Record<string, any>) => any;
    insetInput: DateInputFoundationProps['insetInput'];
    presetPosition?: PresetPosition;
    renderQuickControls?: any;
    renderDateInput?: any;
}

export interface PanelState {
    /** The date displayed in the current date panel, update when switching year and month */
    pickerDate: Date;
    /** Default date or selected date (when selected) */
    showDate: Date;
    isTimePickerOpen: boolean;
    isYearPickerOpen: boolean;
}

export interface MonthsGridFoundationState {
    selected: Set<string>;
    monthLeft: PanelState;
    monthRight: PanelState;
    hoverDay: string;
    rangeStart: string;
    rangeEnd: string;
    offsetRangeStart: string;
    offsetRangeEnd: string;
}

export interface MonthsGridDateAdapter {
    updateDaySelected: (selected: Set<string>) => void;
}
export interface MonthsGridRangeAdapter {
    setRangeStart: (rangeStart: string) => void;
    setRangeEnd: (rangeEnd: string) => void;
    setHoverDay: (hoverDay: string) => void;
    setOffsetRangeStart: (offsetRangeStart: string) => void;
    setOffsetRangeEnd: (offsetRangeEnd: string) => void;
}

export interface MonthsGridAdapter extends DefaultAdapter<MonthsGridFoundationProps, MonthsGridFoundationState>, MonthsGridRangeAdapter, MonthsGridDateAdapter {
    updateMonthOnLeft: (v: PanelState) => void;
    updateMonthOnRight: (v: PanelState) => void;
    notifySelectedChange: MonthsGridFoundationProps['onChange'];
    notifyPanelChange: MonthsGridFoundationProps['onPanelChange'];
    setRangeInputFocus: MonthsGridFoundationProps['setRangeInputFocus'];
    hasOtherRangeInputBeenFocused: MonthsGridFoundationProps['hasOtherRangeInputBeenFocused'];
}

export default class MonthsGridFoundation extends BaseFoundation<MonthsGridAdapter, MonthsGridFoundationProps, MonthsGridFoundationState> {
    #initDatePickerFromValue(values: Date[], refreshPicker = true) {
        const { monthLeft } = this._adapter.getStates();
        const newMonthLeft = { ...monthLeft };
        this._adapter.updateMonthOnLeft(newMonthLeft);
        const newSelected = new Set<string>();
        const isMultiple = this.#isMultiple();
        if (!isMultiple) {
            if (values[0]) {
                newSelected.add(format(values[0], strings.FORMAT_FULL_DATE));
            }
        } else {
            values.forEach((date) => {
                if (date) {
                    newSelected.add(format(date, strings.FORMAT_FULL_DATE));
                }
            });
        }
        if (refreshPicker) {
            if (isMultiple) {
                const leftPickerDateInSelected = values?.some((item) => item && differenceInCalendarMonths(item, monthLeft.pickerDate) === 0);
                if (!leftPickerDateInSelected) {
                    this.#handleShowDateAndTime(strings.PANEL_TYPE_LEFT, values[0] || newMonthLeft.pickerDate);
                }
            } else {
                this.#handleShowDateAndTime(strings.PANEL_TYPE_LEFT, values[0] || newMonthLeft.pickerDate);
            }
        } else {
            this.#handleShowDateAndTime(strings.PANEL_TYPE_LEFT, newMonthLeft.pickerDate);
        }
        this._adapter.updateDaySelected(newSelected);
    }

    #initDateRangePickerFromValue(values: (Date | null)[], withTime = false) {
        const monthLeft = this.getState('monthLeft');
        const monthRight = this.getState('monthRight');
        const adjustResult = this.#autoAdjustMonth({ ...monthLeft, pickerDate: values[0] || monthLeft.pickerDate }, { ...monthRight, pickerDate: values[1] || monthRight.pickerDate });

        const validValue = Array.isArray(values) && values.filter((item) => item).length > 1;
        if (validValue) {
            this.#handleShowDateAndTime(strings.PANEL_TYPE_LEFT, adjustResult.monthLeft.pickerDate);
            this.#handleShowDateAndTime(strings.PANEL_TYPE_RIGHT, adjustResult.monthRight.pickerDate);
        } else {
            const selectedDate = values.find((item) => item);
            // With an incomplete range, move the panels only when the typed date is outside both of them
            if (selectedDate) {
                const notLeftPanelDate = Math.abs(differenceInCalendarMonths(selectedDate, monthLeft.pickerDate)) > 0;
                const notRightPanelDate = Math.abs(differenceInCalendarMonths(selectedDate, monthRight.pickerDate)) > 0;

                if (notLeftPanelDate && notRightPanelDate) {
                    this.#handleShowDateAndTime(strings.PANEL_TYPE_LEFT, adjustResult.monthLeft.pickerDate);
                    this.#handleShowDateAndTime(strings.PANEL_TYPE_RIGHT, adjustResult.monthRight.pickerDate);
                }
            }
        }

        const formatToken = withTime ? strings.FORMAT_DATE_TIME : strings.FORMAT_FULL_DATE;
        let rangeStart = values[0] ? format(values[0], formatToken) : '';
        let rangeEnd = values[1] ? format(values[1], formatToken) : '';

        if (this.#isNeedSwap(rangeStart, rangeEnd)) {
            [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
        }
        this._adapter.setRangeStart(rangeStart);
        this._adapter.setRangeEnd(rangeEnd);
        this._adapter.setHoverDay(rangeEnd);
    }

    #initDateTimePickerFromValue(values: Date[]) {
        this.#initDatePickerFromValue(values);
    }

    #initDateTimeRangePickerFormValue(values: (Date | null)[]) {
        this.#initDateRangePickerFromValue(values, true);
    }

    #getDiff(type: 'month' | 'year', target: Date, panelType: PanelType) {
        const panelDetail = this.#getPanelDetail(panelType);
        const diff = dateDiffFns[type] && dateDiffFns[type](target, panelDetail.pickerDate);
        return diff;
    }

    #getPanelDetail(panelType: PanelType) {
        return panelType === strings.PANEL_TYPE_RIGHT ? this.getState('monthRight') : this.getState('monthLeft');
    }

    #isMultiple() {
        return isMultiple(this.getProps());
    }

    #mergeDateAndTime(date: Date | string, time: Date) {
        const dateFnsLocale = this._adapter.getProp('dateFnsLocale');
        const day = isValidDate(date) ? (date as Date) : compatibleParse(date as string, strings.FORMAT_FULL_DATE, undefined, dateFnsLocale);
        return set(day, {
            hours: time.getHours(),
            minutes: time.getMinutes(),
            seconds: time.getSeconds(),
            milliseconds: time.getMilliseconds(),
        });
    }

    #isNeedSwap(rangeStart: Date | string, rangeEnd: Date | string) {
        return rangeStart && rangeEnd && isBefore(rangeEnd, rangeStart);
    }

    #autoAdjustMonth(monthLeft: PanelState, monthRight: PanelState) {
        let newMonthLeft = monthLeft;
        let newMonthRight = monthRight;
        const difference = differenceInCalendarMonths(monthLeft.pickerDate, monthRight.pickerDate);
        if (difference > 0) {
            newMonthLeft = { ...monthRight };
            newMonthRight = { ...monthLeft };
        } else if (difference === 0) {
            newMonthLeft = monthLeft;
            newMonthRight = { ...monthRight, pickerDate: addMonths(monthRight.pickerDate, 1) };
        }
        return { monthLeft: newMonthLeft, monthRight: newMonthRight };
    }

    #updateTimeInDateRange(panelType: PanelType, timeDate: Date) {
        const { isControlledComponent, dateFnsLocale } = this.getProps();
        let rangeStart = this.getState('rangeStart');
        let rangeEnd = this.getState('rangeEnd');
        const dateFormat = MonthsGridFoundation.getValidDateFormat(this.getProps());
        // Known limitation: the time is applied only once both rangeStart and rangeEnd are set
        if (rangeStart && rangeEnd) {
            let startDate = compatibleParse(rangeStart, dateFormat, undefined, dateFnsLocale);
            let endDate = compatibleParse(rangeEnd, dateFormat, undefined, dateFnsLocale);

            if (panelType === strings.PANEL_TYPE_RIGHT) {
                endDate = this.#mergeDateAndTime(timeDate, timeDate);
                rangeEnd = format(endDate, strings.FORMAT_DATE_TIME);
                if (this.#isNeedSwap(rangeStart, rangeEnd)) {
                    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
                    [startDate, endDate] = [endDate, startDate];
                }
                if (!isControlledComponent) {
                    this._adapter.setRangeEnd(rangeEnd);
                }
            } else {
                startDate = this.#mergeDateAndTime(timeDate, timeDate);
                rangeStart = format(startDate, strings.FORMAT_DATE_TIME);
                if (this.#isNeedSwap(rangeStart, rangeEnd)) {
                    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
                    [startDate, endDate] = [endDate, startDate];
                }
                if (!isControlledComponent) {
                    this._adapter.setRangeStart(rangeStart);
                }
            }
            this._adapter.notifySelectedChange([startDate, endDate]);
        }
    }

    #updatePanelDetail(panelType: PanelType, kvs: Partial<PanelState>) {
        const { monthLeft, monthRight } = this.getStates();
        if (panelType === strings.PANEL_TYPE_RIGHT) {
            this._adapter.updateMonthOnRight({ ...monthRight, ...kvs });
        } else {
            this._adapter.updateMonthOnLeft({ ...monthLeft, ...kvs });
        }
    }

    #toMonth(panelType: PanelType, target: Date) {
        const { type } = this._adapter.getProps();
        const diff = this.#getDiff('month', target, panelType);
        this.#handleYearOrMonthChange(diff < 0 ? 'prevMonth' : 'nextMonth', panelType, Math.abs(diff), false);

        if (isRangeType(type)) {
            this.handleSyncChangeMonths({ panelType, target });
        }
    }

    #toYear(panelType: PanelType, target: Date) {
        const diff = this.#getDiff('year', target, panelType);
        this.#handleYearOrMonthChange(diff < 0 ? 'prevYear' : 'nextYear', panelType, Math.abs(diff), false);
    }

    #handleYearOrMonthChange(type: YearMonthChangeType, panelType: PanelType = strings.PANEL_TYPE_LEFT, step = 1, notSeparateInRange = false) {
        const { autoSwitchDate, type: datePanelType } = this.getProps();
        const { monthLeft, monthRight } = this.getStates();
        const isRange = isRangeType(datePanelType);
        const isLeftPanelInRange = isRange && panelType === strings.PANEL_TYPE_LEFT;
        const panelDetail = this.#getPanelDetail(panelType);
        const { pickerDate } = panelDetail;
        const fn = dateCalcFns[type];
        const targetMonth = fn(pickerDate, step);
        const panelDateHasUpdate = (panelType === strings.PANEL_TYPE_LEFT && !isEqual(targetMonth, monthLeft.pickerDate)) || (panelType === strings.PANEL_TYPE_RIGHT && !isEqual(targetMonth, monthRight.pickerDate));
        this.#updatePanelDetail(panelType, { pickerDate: targetMonth });
        if (panelDateHasUpdate) {
            if (!isRange) {
                const { notifyValue, notifyDate } = toCallbackArgs(targetMonth, this.getProps());
                this._adapter.notifyPanelChange(notifyDate, notifyValue);
            } else {
                // A left-panel switch driven by the sync of the other panel is not notified on its own
                if (!(isLeftPanelInRange && notSeparateInRange)) {
                    // Read back after the write: the panels also move by value, which no cached copy would see
                    const states = this.getStates();
                    const { notifyValue, notifyDate } = toCallbackArgs([states.monthLeft.pickerDate, states.monthRight.pickerDate], this.getProps());
                    this._adapter.notifyPanelChange(notifyDate, notifyValue);
                }
            }
        }
        if (autoSwitchDate) {
            this.#updateDateAfterChangeYM(type, targetMonth);
        }
    }

    #updateDateAfterChangeYM(_type: YearMonthChangeType, targetDate: Date) {
        const { disabledDate, type: dateType } = this.getProps();
        const { selected: selectedSet, rangeStart, rangeEnd, monthLeft } = this.getStates();
        const options = { closePanel: false };
        // a range keeps its dates when the panels switch, as the docs say autoSwitchDate is for the date type
        if (!this.#isMultiple() && !isRangeType(dateType) && selectedSet.size) {
            const selectedStr = Array.from(selectedSet)[0];
            // a local midnight: `new Date('yyyy-MM-dd')` is UTC, a day early west of Greenwich
            const selectedDate = parseISO(selectedStr);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            let fullDate = set(selectedDate, { year, month });
            if (dateType === 'dateTime') {
                fullDate = this.#mergeDateAndTime(fullDate, monthLeft.pickerDate);
            }
            if (disabledDate(fullDate, { rangeStart, rangeEnd })) {
                return;
            }
            this._adapter.notifySelectedChange([fullDate], options);
        }
    }

    #handleDateSelected(day: { fullDate: string; fullValidDate?: Date }, panelType: PanelType) {
        const { max, type, isControlledComponent, dateFnsLocale } = this.getProps();
        const multiple = this.#isMultiple();
        const { selected } = this.getStates();
        const monthDetail = this.#getPanelDetail(panelType);
        const newSelected = new Set<string>(multiple ? [...selected] : []);

        const { fullDate } = day;
        // A time change carries the complete new value; a day click keeps the time the panel shows
        const time = day.fullValidDate || monthDetail.pickerDate;
        const dateStr = fullDate;

        if (!multiple) {
            newSelected.add(dateStr);
        } else {
            if (newSelected.has(dateStr)) {
                newSelected.delete(dateStr);
            } else if (!max || newSelected.size < max) {
                newSelected.add(dateStr);
            }
        }

        // Passed up as Dates so the format matches what initFormDefaultValue receives
        const newSelectedDates = [...newSelected].map((_dateStr) => (type === 'dateTime' ? this.#mergeDateAndTime(_dateStr, time) : compatibleParse(_dateStr, strings.FORMAT_FULL_DATE, undefined, dateFnsLocale)));

        this.#handleShowDateAndTime(panelType, time);

        if (!isControlledComponent) {
            this._adapter.updateDaySelected(newSelected);
        }

        this._adapter.notifySelectedChange(newSelectedDates as [Date]);
    }

    #handleShowDateAndTime(panelType: PanelType, pickerDate: Date, showDate?: Date) {
        const _showDate = showDate || pickerDate;
        this.#updatePanelDetail(panelType, { showDate: _showDate, pickerDate });
    }

    #handleRangeSelected({ fullDate }: MonthDayInfo) {
        let { rangeStart, rangeEnd } = this.getStates();
        const { startDateOffset, endDateOffset, type, dateFnsLocale, rangeInputFocus } = this._adapter.getProps();
        let rangeStartReset = false;
        let rangeEndReset = false;

        const isDateRangeAndHasOffset = (startDateOffset || endDateOffset) && type === 'dateRange';
        if (isDateRangeAndHasOffset) {
            rangeStart = getFullDateOffset(startDateOffset, fullDate);
            rangeEnd = getFullDateOffset(endDateOffset, fullDate);
        } else {
            if (rangeInputFocus === 'rangeEnd') {
                rangeEnd = fullDate;
                // rangeStart may carry a time ('yyyy-MM-dd HH:mm:ss') while rangeEnd is a bare date
                if (rangeStart && rangeEnd && isBefore(rangeEnd, rangeStart.trim().split(/\s+/)[0])) {
                    rangeStart = '';
                    rangeStartReset = true;
                }
            } else if (rangeInputFocus === 'rangeStart' || !rangeInputFocus) {
                rangeStart = fullDate;
                // rangeEnd may carry a time ('yyyy-MM-dd HH:mm:ss') while rangeStart is a bare date
                if (rangeStart && rangeEnd && isBefore(rangeEnd.trim().split(/\s+/)[0], rangeStart)) {
                    rangeEnd = '';
                    rangeEndReset = true;
                }
            }
        }

        if (isRangeType(type)) {
            if (isDateRangeAndHasOffset) {
                this._adapter.setRangeStart(rangeStart);
                this._adapter.setRangeEnd(rangeEnd);
            } else {
                if (rangeInputFocus === 'rangeEnd') {
                    this._adapter.setRangeEnd(rangeEnd);
                    if (rangeStartReset) {
                        this._adapter.setRangeStart(rangeStart);
                    }
                    if (!this._adapter.hasOtherRangeInputBeenFocused('rangeEnd') || !rangeStart) {
                        this._adapter.setRangeInputFocus('rangeStart');
                    }
                } else if (rangeInputFocus === 'rangeStart' || !rangeInputFocus) {
                    this._adapter.setRangeStart(rangeStart);
                    if (rangeEndReset) {
                        this._adapter.setRangeEnd(rangeEnd);
                    }
                    if (!this._adapter.hasOtherRangeInputBeenFocused('rangeStart') || !rangeEnd) {
                        this._adapter.setRangeInputFocus('rangeEnd');
                    }
                }
            }
        }

        const dateFormat = MonthsGridFoundation.getValidDateFormat(this.getProps());
        if (rangeStart || rangeEnd) {
            const [startDate, endDate] = [compatibleParse(rangeStart, dateFormat, undefined, dateFnsLocale), compatibleParse(rangeEnd, dateFormat, undefined, dateFnsLocale)];
            let date: [Date, Date] = [startDate, endDate];

            if (type === 'dateTimeRange') {
                const startTime = this.getState('monthLeft').pickerDate;
                const endTime = this.getState('monthRight').pickerDate;
                const start = rangeStart ? this.#mergeDateAndTime(rangeStart, startTime) : null;
                const end = rangeEnd ? this.#mergeDateAndTime(rangeEnd, endTime) : null;
                if (isSameDay(toDateArg(startDate), toDateArg(endDate)) && isBefore(end, start)) {
                    date = [start, start];
                } else {
                    date = [start, end];
                }
            }
            const needCheckFocusRecord = !(type === 'dateRange' && isDateRangeAndHasOffset);
            // the focus has moved on above; the dates were picked for the input focused at the click
            this._adapter.notifySelectedChange(date, {
                needCheckFocusRecord,
                rangeInputFocus: rangeInputFocus as 'rangeStart' | 'rangeEnd' | false,
            });
        }
    }

    /**
     * Shifts the other panel when the panel being changed lands on the other panel's month.
     *
     * @example
     *  - panelType=right, target=new Date('2022-09-01') and left panel is in '2022-09' => call it, left panel minus one month to '2022-08'
     *  - panelType=left, target=new Date('2021-12-01') and right panel is in '2021-12' => call it, right panel add one month to '2021-01'
     */
    protected handleSyncChangeMonths({ panelType, target }: { panelType: PanelType; target: Date }) {
        const { type } = this._adapter.getProps();
        const { monthLeft, monthRight } = this._adapter.getStates();
        if (isRangeType(type)) {
            if (panelType === 'right' && differenceInCalendarMonths(target, monthLeft.pickerDate) === 0) {
                this.#handleYearOrMonthChange('prevMonth', 'left', 1, true);
            } else if (panelType === 'left' && differenceInCalendarMonths(monthRight.pickerDate, target) === 0) {
                this.#handleYearOrMonthChange('nextMonth', 'right', 1, true);
            }
        }
    }

    protected getTargetChangeDate({ panelType, switchType }: { panelType: PanelType; switchType: YearMonthChangeType }) {
        const { monthRight, monthLeft } = this._adapter.getStates();
        const currentDate = panelType === 'left' ? monthLeft.pickerDate : monthRight.pickerDate;
        return dateCalcFns[switchType](currentDate, 1);
    }

    protected handleSwitchMonthOrYear(switchType: YearMonthChangeType, panelType: PanelType) {
        const { type, syncSwitchMonth } = this.getProps();
        const rangeType = isRangeType(type);

        if (rangeType && syncSwitchMonth) {
            this.#handleYearOrMonthChange(switchType, 'left', 1, true);
            this.#handleYearOrMonthChange(switchType, 'right', 1, true);
        } else {
            // computed from the panel before the switch below updates it
            const target = this.getTargetChangeDate({ panelType, switchType });
            this.#handleYearOrMonthChange(switchType, panelType);

            // Two panels on the same month confuse range selection (https://github.com/DouyinFE/semi-design/issues/260)
            if (rangeType) {
                this.handleSyncChangeMonths({ panelType, target });
            }
        }
    }

    static getInitialState(props: MonthsGridFoundationProps): MonthsGridFoundationState {
        const { nowDate, nextDate } = getDefaultPickerDate({
            defaultPickerValue: props.defaultPickerValue,
            format: props.format || getDefaultFormatTokenByType(props.type),
            dateFnsLocale: props.dateFnsLocale,
        });
        return {
            selected: new Set<string>(),
            monthLeft: { pickerDate: nowDate, showDate: nowDate, isTimePickerOpen: false, isYearPickerOpen: false },
            monthRight: { pickerDate: nextDate, showDate: nextDate, isTimePickerOpen: false, isYearPickerOpen: false },
            hoverDay: '',
            rangeStart: props.rangeStart ?? '',
            rangeEnd: '',
            offsetRangeStart: '',
            offsetRangeEnd: '',
        };
    }

    /** The time part of `format`, in the tokens the time panel uses */
    static getValidTimeFormat(format?: string) {
        const formatProp = format || strings.FORMAT_TIME_PICKER;
        const timeFormatTokens = [];
        if (formatProp.includes('h') || formatProp.includes('H')) {
            timeFormatTokens.push('HH');
        }
        if (formatProp.includes('m')) {
            timeFormatTokens.push('mm');
        }
        if (formatProp.includes('s')) {
            timeFormatTokens.push('ss');
        }
        return timeFormatTokens.join(':');
    }

    static getValidDateFormat(props: Pick<MonthsGridFoundationProps, 'format' | 'type'>) {
        // shortcut: without `format` this is the whole token map, which compatibleParse stringifies and so falls back
        // to parseISO; the parsing has always relied on it, fix both together
        return (props.format || getDefaultFormatToken(props.type)) as string;
    }

    /** The disabled hours, minutes and seconds `disabledTime` gives the time panel of `panelType` */
    static calcDisabledTime({ disabledTime, type }: Pick<MonthsGridFoundationProps, 'disabledTime' | 'type'>, state: Pick<MonthsGridFoundationState, 'rangeStart' | 'rangeEnd' | 'monthLeft'>, panelType: PanelType) {
        if (typeof disabledTime === 'function' && panelType && isDateTimeType(type)) {
            const { rangeStart, rangeEnd, monthLeft } = state;
            const selected = [];
            if (type === 'dateTimeRange') {
                if (rangeStart) {
                    selected.push(rangeStart);
                }
                if (rangeStart && rangeEnd) {
                    selected.push(rangeEnd);
                }
            } else if (monthLeft && monthLeft.showDate) {
                selected.push(monthLeft.showDate);
            }
            const selectedDates = selected.map((str) => (str instanceof Date ? str : parseISO(str)));
            const cbDates = type === 'dateTimeRange' ? selectedDates : selectedDates[0];
            return disabledTime(cbDates, panelType);
        }
        return undefined;
    }

    /**
     * Which panels show their year and month picker; while one does, its weeks need a minHeight, or a change of the
     * number of weeks makes the scroll list unstable
     */
    static getYAMOpenType(state: Pick<MonthsGridFoundationState, 'monthLeft' | 'monthRight'>) {
        const leftYearPickerOpen = state.monthLeft.isYearPickerOpen;
        const rightYearPickerOpen = state.monthRight.isYearPickerOpen;
        if (leftYearPickerOpen && rightYearPickerOpen) {
            return 'both';
        } else if (leftYearPickerOpen) {
            return 'left';
        } else if (rightYearPickerOpen) {
            return 'right';
        }
        return 'none';
    }

    /** The panel shows a scroll list, its year and month picker or its time picker, instead of the month */
    static isYearOrTime(panel: PanelState) {
        return Boolean(panel && (panel.isTimePickerOpen || panel.isYearPickerOpen));
    }

    /** The `x-open-type` of a panel: what it shows in place of, or beside, its month */
    static getOpenType(panel: PanelState) {
        return panel.isYearPickerOpen ? 'year' : panel.isTimePickerOpen ? 'time' : 'date';
    }

    /** The title of a month in the navigation, from the locale's `monthText` pattern */
    static formatMonthText(locale: Pick<Locale['DatePicker'], 'monthText' | 'months'>, month?: Date) {
        if (!month) {
            return '';
        }
        const monthName = locale.months[(month.getMonth() + 1) as keyof Locale['DatePicker']['months']];
        return locale.monthText.replace('${year}', format(month, 'yyyy')).replace('${month}', monthName);
    }

    /** The texts of a panel's date and time switch; the date is the picked range endpoint, else the shown date */
    static getSwitchTexts({ rangeEndpoint, showDate, dateFormat, format: formatProp, locale, dateFnsLocale }: { rangeEndpoint: string; showDate?: Date; dateFormat: string; format?: string; locale: Pick<Locale['DatePicker'], 'localeFormatToken'>; dateFnsLocale: MonthsGridFoundationProps['dateFnsLocale'] }) {
        const token = locale.localeFormatToken.FORMAT_SWITCH_DATE;
        const endpointText = rangeEndpoint ? format(toDateArg(compatibleParse(rangeEndpoint, dateFormat, undefined, dateFnsLocale)), token) : '';
        return {
            date: endpointText || (showDate ? format(showDate, token) : ''),
            time: showDate ? format(showDate, MonthsGridFoundation.getValidTimeFormat(formatProp)) : '',
        };
    }

    /**
     * The min sizes of the panels of a range: a panel showing its year or time picker keeps the width of its month,
     * and when both do they share a minHeight, since a scroll list shorter than the month would render too few loops
     * of its items (scroll-list/item-foundation.ts #initWheelList). `measure` reads the DOM only for the values used;
     * `monthWidth` is null while the month of that panel is not rendered.
     */
    static getPanelSizeStyle(state: Pick<MonthsGridFoundationState, 'monthLeft' | 'monthRight'>, insetInput: MonthsGridFoundationProps['insetInput'], measure: { monthWidth: (panelType: PanelType) => number | null; scrollListHeight: () => number }): Record<PanelType, { minWidth: string; minHeight: string }> {
        const isYearOrTime = MonthsGridFoundation.isYearOrTime;
        const minHeight = isYearOrTime(state.monthLeft) && isYearOrTime(state.monthRight) && !insetInput ? `${measure.scrollListHeight()}px` : '';
        const minWidth = (panel: PanelState, panelType: PanelType) => {
            const width = isYearOrTime(panel) ? measure.monthWidth(panelType) : null;
            return width === null ? '' : `${width}px`;
        };
        return {
            left: { minWidth: minWidth(state.monthLeft, strings.PANEL_TYPE_LEFT), minHeight },
            right: { minWidth: minWidth(state.monthRight, strings.PANEL_TYPE_RIGHT), minHeight },
        };
    }

    override init() {
        this.updateSelectedFromProps(this.getProp('selectedValue'));
    }

    /** Moves the panels when `defaultPickerValue` changes; the first value is applied by getInitialState */
    initDefaultPickerValue() {
        const { defaultPickerValue, type, format, dateFnsLocale } = this.getProps();
        if (defaultPickerValue === undefined) {
            return;
        }
        const { nowDate, nextDate } = getDefaultPickerDate({
            defaultPickerValue,
            format: format || getDefaultFormatTokenByType(type),
            dateFnsLocale,
        });
        if (isValidDate(nowDate) && isValidDate(nextDate)) {
            this.#updatePanelDetail(strings.PANEL_TYPE_LEFT, { pickerDate: nowDate });
            this.#updatePanelDetail(strings.PANEL_TYPE_RIGHT, { pickerDate: nextDate });
        }
    }

    updateSelectedFromProps(values: (Date | null)[], refreshPicker = true) {
        const type: Type = this.getProp('type');
        const { selected, rangeStart, rangeEnd } = this.getStates();
        if (values && values?.length) {
            switch (type) {
                case 'date':
                    this.#initDatePickerFromValue(values, refreshPicker);
                    break;
                case 'dateRange':
                    this.#initDateRangePickerFromValue(values);
                    break;
                case 'dateTime':
                    this.#initDateTimePickerFromValue(values);
                    break;
                case 'dateTimeRange':
                    this.#initDateTimeRangePickerFormValue(values);
                    break;
                default:
                    break;
            }
        } else if ((Array.isArray(values) && !values.length) || !values) {
            if (selected instanceof Set && selected.size) {
                this._adapter.updateDaySelected(new Set());
            }
            if (rangeStart) {
                this._adapter.setRangeStart('');
            }
            if (rangeEnd) {
                this._adapter.setRangeEnd('');
            }
        }
    }

    toYearMonth(panelType: PanelType, target: Date) {
        this.#toYear(panelType, target);
        this.#toMonth(panelType, target);
    }

    prevMonth(panelType: PanelType) {
        this.handleSwitchMonthOrYear('prevMonth', panelType);
    }

    nextMonth(panelType: PanelType) {
        this.handleSwitchMonthOrYear('nextMonth', panelType);
    }

    prevYear(panelType: PanelType) {
        this.handleSwitchMonthOrYear('prevYear', panelType);
    }

    nextYear(panelType: PanelType) {
        this.handleSwitchMonthOrYear('nextYear', panelType);
    }

    handleDayClick(day: MonthDayInfo, panelType: PanelType) {
        const type = this.getProp('type');
        switch (true) {
            case type === 'date' || type === 'dateTime':
                this.#handleDateSelected(day, panelType);
                break;
            case type === 'dateRange' || type === 'dateTimeRange':
                this.#handleRangeSelected(day);
                break;
            default:
                break;
        }
    }

    handleDayHover({ fullDate } = { fullDate: '' }) {
        const { startDateOffset, endDateOffset, type } = this.getProps();

        this._adapter.setHoverDay(fullDate);

        if ((startDateOffset || endDateOffset) && type === 'dateRange') {
            const offsetRangeStart = getFullDateOffset(startDateOffset, fullDate);
            const offsetRangeEnd = getFullDateOffset(endDateOffset, fullDate);
            this._adapter.setOffsetRangeStart(offsetRangeStart);
            this._adapter.setOffsetRangeEnd(offsetRangeEnd);
        }
    }

    handleTimeChange(newTime: { timeStampValue: number }, panelType: PanelType) {
        const { rangeEnd, rangeStart } = this.getStates();
        const { type, dateFnsLocale } = this.getProps();
        const { showDate } = this.#getPanelDetail(panelType);
        const destRange = panelType === strings.PANEL_TYPE_RIGHT ? rangeEnd : rangeStart;
        const baseDate = type === 'dateTimeRange' && destRange ? compatibleParse(destRange, MonthsGridFoundation.getValidDateFormat(this.getProps()), undefined, dateFnsLocale) : showDate;
        const fullValidDate = this.#mergeDateAndTime(baseDate, new Date(newTime.timeStampValue));

        if (type === 'dateTimeRange') {
            this.#handleShowDateAndTime(panelType, fullValidDate, showDate);
            this.#updateTimeInDateRange(panelType, fullValidDate);
        } else {
            const fullDate = format(fullValidDate, strings.FORMAT_FULL_DATE);
            this.#handleDateSelected({ fullDate, fullValidDate }, panelType);
        }
    }

    showYearPicker(panelType: PanelType) {
        this.#updatePanelDetail(panelType, { isTimePickerOpen: false, isYearPickerOpen: true });
    }

    showTimePicker(panelType: PanelType) {
        if (this.getProp('disabledTimePicker')) {
            return;
        }
        this.#updatePanelDetail(panelType, { isTimePickerOpen: true, isYearPickerOpen: false });
    }

    showDatePanel(panelType: PanelType) {
        this.#updatePanelDetail(panelType, { isTimePickerOpen: false, isYearPickerOpen: false });
    }
}
