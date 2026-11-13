import { addDays, addMonths, addYears, clamp, differenceInCalendarMonths, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { BaseFoundation, type DefaultAdapter, type DirectionContext } from '../../base/index';
import getDayOfWeek from './_utils/get-day-of-week';
import getMonthTable, { type WeekStartNumber } from './_utils/get-month-table';
import { isAfter, isBefore, isBetween, isSameDay } from './_utils/index';
import { cssClasses, strings } from './constants';
import type { RenderDateType, RenderFullDateType } from './foundation';
import type { YearMonthChangeType } from './months-grid-foundation';

const MONTH_SWITCHES: Record<number, YearMonthChangeType> = {
    [-12]: 'prevYear',
    [-1]: 'prevMonth',
    1: 'nextMonth',
    12: 'nextYear',
};

export type MonthKeyAction = { type: 'select' } | { type: 'move'; date: string; monthSwitch?: YearMonthChangeType };

export interface FocusRecords {
    rangeStart: boolean;
    rangeEnd: boolean;
}

export interface MonthFoundationProps {
    month: Date;
    selected: Set<string>;
    rangeStart: string;
    rangeEnd: string;
    offsetRangeStart: string;
    offsetRangeEnd: string;
    onDayClick: (day: MonthDayInfo) => void;
    onDayHover: (day?: MonthDayInfo) => void;
    /** the keyboard moved the active day into the previous or next month or year */
    onMonthSwitch: (switchType: YearMonthChangeType) => void;
    weekStartsOn: WeekStartNumber;
    disabledDate?: (day: Date, options?: { rangeStart: string; rangeEnd: string }) => boolean;
    onWeeksRowNumChange: () => void;
    renderDate: RenderDateType;
    renderFullDate: RenderFullDateType;
    hoverDay: string;
    rangeInputFocus: string | boolean;
    focusRecords: FocusRecords;
    locale: any;
    multiple: boolean;
    /** marks today of this zone */
    timeZone?: string | number;
}

export type MonthDayInfo =
    | {
          dayNumber: number;
          dayNumberFull?: string;
          fullDate: string;
      }
    | {
          dayNumber: string;
          dayNumberFull?: string;
          fullDate: string;
      };

export interface MonthTable {
    weeks: Array<MonthDayInfo[]>;
    monthText: string;
    month?: Date;
}

export type DayStatusOptions = Pick<MonthFoundationProps, 'selected' | 'rangeStart' | 'rangeEnd' | 'offsetRangeStart' | 'offsetRangeEnd' | 'disabledDate' | 'hoverDay' | 'rangeInputFocus' | 'focusRecords'> & { todayText: string };

export interface MonthFoundationState {
    /** the day the keyboard or a pick moved to; stale once the month is switched another way */
    keyboardDate: string;
}

export interface MonthAdapter extends DefaultAdapter<MonthFoundationProps, MonthFoundationState, DirectionContext> {
    notifyDayClick: (day: MonthDayInfo) => void;
    notifyMonthSwitch: (switchType: YearMonthChangeType) => void;
}

export default class CalendarMonthFoundation extends BaseFoundation<MonthAdapter, MonthFoundationProps, MonthFoundationState> {
    static #getSingleDayStatus(fullDate: string, { todayText, selected, disabledDate, rangeStart, rangeEnd, rangeInputFocus, focusRecords }: DayStatusOptions) {
        const disabledOptions = { rangeStart, rangeEnd, rangeInputFocus };
        const isToday = fullDate === todayText;
        const isSelected = selected.has(fullDate);

        let isDisabled = disabledDate?.(parseISO(fullDate), disabledOptions);
        if (!isDisabled && rangeInputFocus === 'rangeStart' && rangeEnd && focusRecords?.rangeEnd) {
            isDisabled = isAfter(fullDate, rangeEnd.trim().split(/\s+/)[0]);
        }
        if (!isDisabled && rangeInputFocus === 'rangeEnd' && rangeStart && focusRecords?.rangeStart) {
            isDisabled = isBefore(fullDate, rangeStart.trim().split(/\s+/)[0]);
        }

        return { isToday, isSelected, isDisabled };
    }

    static #getDateRangeStatus(fullDate: string, { rangeStart, rangeEnd, hoverDay, offsetRangeStart, offsetRangeEnd, rangeInputFocus }: DayStatusOptions) {
        const isDateRangeAnySelected = Boolean(rangeStart || rangeEnd);
        const isDateRangeSelected = Boolean(rangeStart && rangeEnd);
        const isOffsetDateRangeAnyExist = offsetRangeStart || offsetRangeEnd;
        if (!isDateRangeAnySelected) {
            return {};
        }

        // Range types track hover in JS; plain hover is only the CSS :hover of .semi-datepicker-main
        const isHoverDay = isSameDay(hoverDay, fullDate);

        let isHoverAfterStart, isHoverBeforeEnd, isSelectedStart, isSelectedEnd, isHoverDayAroundOneSelected;
        if (rangeStart) {
            isSelectedStart = isSameDay(fullDate, rangeStart);
            if (rangeInputFocus === 'rangeEnd') {
                isHoverAfterStart = isBetween(fullDate, { start: rangeStart, end: hoverDay });
            }
        }
        if (rangeEnd) {
            isSelectedEnd = isSameDay(fullDate, rangeEnd);
            if (rangeInputFocus === 'rangeStart') {
                isHoverBeforeEnd = isBetween(fullDate, { start: hoverDay, end: rangeEnd });
            }
        }

        if (!isDateRangeSelected && isDateRangeAnySelected) {
            isHoverDayAroundOneSelected = isHoverDay;
        }

        let isHover;
        if (!isOffsetDateRangeAnyExist) {
            isHover = isHoverAfterStart || isHoverBeforeEnd || isHoverDay;
        }

        let isInRange, isSelectedStartAfterHover, isSelectedEndBeforeHover, isHoverDayInStartSelection, isHoverDayInEndSelection, isHoverDayInRange;
        if (isDateRangeSelected) {
            isInRange = isBetween(fullDate, { start: rangeStart, end: rangeEnd });
            if (!isOffsetDateRangeAnyExist) {
                isSelectedStartAfterHover = isSelectedStart && isAfter(rangeStart, hoverDay);
                isSelectedEndBeforeHover = isSelectedEnd && isBefore(rangeEnd, hoverDay);
                isHoverDayInStartSelection = isHoverDay && rangeInputFocus === 'rangeStart';
                isHoverDayInEndSelection = isHoverDay && rangeInputFocus === 'rangeEnd';
                isHoverDayInRange = isHoverDay && isBetween(hoverDay, { start: rangeStart, end: rangeEnd });
            }
        }

        return {
            isHoverDay,
            isSelectedStart,
            isSelectedEnd,
            isInRange,
            isHover,
            isSelectedStartAfterHover,
            isSelectedEndBeforeHover,
            isHoverDayInRange,
            isHoverDayInStartSelection,
            isHoverDayInEndSelection,
            isHoverDayAroundOneSelected,
        };
    }

    static #getOffsetDateStatus(fullDate: string, { offsetRangeStart, offsetRangeEnd, rangeStart, rangeEnd, hoverDay }: DayStatusOptions) {
        if (!(offsetRangeStart || offsetRangeEnd)) {
            return {};
        }

        const isInRange = isBetween(fullDate, { start: rangeStart, end: rangeEnd });
        const isHoverDay = isSameDay(hoverDay, fullDate);
        const isSelectedStart = rangeStart && isSameDay(fullDate, rangeStart);
        const isSelectedEnd = rangeEnd && isSameDay(fullDate, rangeEnd);

        let isHoverInOffsetRange, isInOffsetRange;
        if (rangeStart && rangeEnd) {
            isHoverInOffsetRange = isInRange && isHoverDay;
        }

        if (offsetRangeStart && offsetRangeEnd) {
            isInOffsetRange = isSelectedStart || isBetween(fullDate, { start: offsetRangeStart, end: offsetRangeEnd }) || isSelectedEnd;
        }

        return {
            isOffsetRangeStart: isSameDay(fullDate, offsetRangeStart),
            isOffsetRangeEnd: isSameDay(fullDate, offsetRangeEnd),
            isHoverInOffsetRange,
            isHoverDayOffset: isHoverDay,
            isInOffsetRange, // Includes the selected start and end, which are styled like the other dates in the range
        };
    }

    /**
     * The day a key moves the active day to: the arrows by a day or a week, Home and End to the ends of the week,
     * PageUp and PageDown by a month, or by a year with Shift. Home and End stay in the month, because the grid leaves
     * the cells of other months empty.
     */
    static #getKeyboardTargetDate({ key, shiftKey }: Pick<KeyboardEvent, 'key' | 'shiftKey'>, active: Date, weekStartsOn: WeekStartNumber, rtl: boolean): Date | null {
        const month = { start: startOfMonth(active), end: endOfMonth(active) };
        switch (key) {
            case 'ArrowLeft':
                return addDays(active, rtl ? 1 : -1);
            case 'ArrowRight':
                return addDays(active, rtl ? -1 : 1);
            case 'ArrowUp':
                return addDays(active, -7);
            case 'ArrowDown':
                return addDays(active, 7);
            case 'Home':
                return clamp(startOfWeek(active, { weekStartsOn }), month);
            case 'End':
                return clamp(endOfWeek(active, { weekStartsOn }), month);
            case 'PageUp':
                return shiftKey ? addYears(active, -1) : addMonths(active, -1);
            case 'PageDown':
                return shiftKey ? addYears(active, 1) : addMonths(active, 1);
            default:
                return null;
        }
    }

    static getWeekdays(weekStartsOn: WeekStartNumber) {
        return getDayOfWeek({ weekStartsOn });
    }

    static getMonthTable(month: Date, weekStartsOn: WeekStartNumber): MonthTable {
        return getMonthTable(month, weekStartsOn);
    }

    /**
     * What a key does in the grid (APG date picker dialog): Enter and Space select the active day; the other keys move
     * it, `monthSwitch` being the panel switch needed when it leaves the month. Returns null for any other key.
     */
    static getKeyAction(event: Pick<KeyboardEvent, 'key' | 'shiftKey'>, { activeDate, month, weekStartsOn, rtl = false }: { activeDate: string; month: Date; weekStartsOn: WeekStartNumber; rtl?: boolean }): MonthKeyAction | null {
        if (event.key === 'Enter' || event.key === ' ') {
            return { type: 'select' };
        }
        const target = CalendarMonthFoundation.#getKeyboardTargetDate(event, parseISO(activeDate), weekStartsOn, rtl);
        if (!target) {
            return null;
        }
        return { type: 'move', date: format(target, strings.FORMAT_FULL_DATE), monthSwitch: MONTH_SWITCHES[differenceInCalendarMonths(target, month)] };
    }

    static getInitialState(): MonthFoundationState {
        return { keyboardDate: '' };
    }

    /**
     * The active day ('yyyy-MM-dd') of the grid: the first of the day the keyboard or a pick moved to, the selected
     * days, the range ends and today that falls in `month`, otherwise the first day of the month
     */
    static getActiveDate({ month, selected, rangeStart, rangeEnd }: Pick<MonthFoundationProps, 'month' | 'selected' | 'rangeStart' | 'rangeEnd'>, { keyboardDate }: MonthFoundationState, todayText: string) {
        const monthText = format(month, strings.FORMAT_YEAR_MONTH);
        // range ends carry a time part
        const inMonth = [keyboardDate, ...selected, rangeStart, rangeEnd, todayText].map((value) => value?.slice(0, 10)).find((date) => date?.startsWith(monthText));
        return inMonth ?? `${monthText}-01`;
    }

    /**
     * The status of a day cell; it is also passed to the user's `renderFullDate`, so do not delete or rename keys
     */
    static getDayStatus({ fullDate }: MonthDayInfo, options: DayStatusOptions) {
        return {
            ...CalendarMonthFoundation.#getSingleDayStatus(fullDate, options),
            ...CalendarMonthFoundation.#getDateRangeStatus(fullDate, options),
            ...CalendarMonthFoundation.#getOffsetDateStatus(fullDate, options),
        };
    }

    /** The state classes of a day cell, without the base `DAY` class */
    static getDayClasses(status: ReturnType<typeof CalendarMonthFoundation.getDayStatus>, isActive: boolean): Record<string, unknown> {
        return {
            [cssClasses.DAY_TODAY]: status.isToday,
            [cssClasses.DAY_IN_RANGE]: status.isInRange,
            [cssClasses.DAY_HOVER]: status.isHover,
            [cssClasses.DAY_SELECTED]: status.isSelected,
            [cssClasses.DAY_SELECTED_START]: status.isSelectedStart,
            [cssClasses.DAY_SELECTED_END]: status.isSelectedEnd,
            [cssClasses.DAY_DISABLED]: status.isDisabled,
            [cssClasses.DAY_HOVER_DAY]: status.isHoverDayOffset,
            [cssClasses.DAY_IN_OFFSET_RANGE]: status.isInOffsetRange,
            [cssClasses.DAY_SELECTED_RANGE_HOVER]: status.isHoverInOffsetRange,
            [cssClasses.DAY_OFFSET_RANGE_START]: status.isOffsetRangeStart,
            [cssClasses.DAY_OFFSET_RANGE_END]: status.isOffsetRangeEnd,
            [cssClasses.DAY_SELECTED_START_AFTER_HOVER]: status.isSelectedStartAfterHover,
            [cssClasses.DAY_SELECTED_END_BEFORE_HOVER]: status.isSelectedEndBeforeHover,
            [cssClasses.DAY_HOVER_DAY_BEFORE_RANGE]: status.isHoverDayInStartSelection,
            [cssClasses.DAY_HOVER_DAY_AFTER_RANGE]: status.isHoverDayInEndSelection,
            [cssClasses.DAY_HOVER_DAY_AROUND_SINGLE_SELECTED]: status.isHoverDayAroundOneSelected,
            [cssClasses.DAY_ACTIVE]: isActive,
        };
    }

    selectDay = (day?: MonthDayInfo) => {
        if (day && !CalendarMonthFoundation.getDayStatus(day, { ...this.getProps(), todayText: '' }).isDisabled) {
            this.setState({ keyboardDate: day.fullDate });
            this.adapter.notifyDayClick(day);
        }
    };

    /** APG grid: focus stays on the grid; the keys move the active day, Enter or Space selects it. `todayText` is empty until mounted. */
    handleKeyDown = (event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'> & Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey'>>, todayText: string) => {
        // with Alt, Ctrl or Meta the key is a browser or system shortcut (Alt+ArrowLeft goes back); Shift is the grid's own (Shift+PageUp)
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const { month, weekStartsOn } = this.getProps();
        const activeDate = CalendarMonthFoundation.getActiveDate(this.getProps(), this.getStates(), todayText);
        const action = CalendarMonthFoundation.getKeyAction(event, { activeDate, month, weekStartsOn, rtl: this.getContext('direction') === 'rtl' });
        if (!action) {
            return;
        }
        event.preventDefault();
        if (action.type === 'select') {
            this.selectDay(
                getMonthTable(month, weekStartsOn)
                    .weeks.flat()
                    .find((day) => day.fullDate === activeDate)
            );
            return;
        }
        this.setState({ keyboardDate: action.date });
        if (action.monthSwitch) {
            this.adapter.notifyMonthSwitch(action.monthSwitch);
        }
    };
}
