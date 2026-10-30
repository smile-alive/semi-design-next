import { type Locale, format, getWeeksInMonth, getWeekOfMonth, isSameMonth, startOfMonth, endOfMonth, compareAsc, isBefore, isAfter, addDays, startOfWeek, endOfWeek, differenceInCalendarDays, isSameDay, startOfDay, isSameWeek } from 'date-fns';
import { countBy } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { numbers } from './constants';
import { parseEvent, parseAllDayEvent, normalizeEvent, calcWeekData, getCurrDate, collectDailyEvents, round, getPos, convertEventsArrToMap, renderDailyEvent, calcRangeData, filterEvents, parseRangeAllDayEvent, type DailyEventLayout, type weekStartsOnEnum, type DateObj } from './event-util';

export type { DailyEventLayout, weekStartsOnEnum } from './event-util';

export interface EventObject {
    [x: string]: any;
    key: string;
    allDay?: boolean;
    start?: Date;
    end?: Date;
    children?: any;
}

export interface ParsedEventsWithArray {
    day: EventObject[];
    allDay: EventObject[];
}

export interface ParsedEvents {
    day?: Map<string, Array<EventObject>>;
    allDay?: Map<string, Array<EventObject>>;
}

export interface ParsedRangeEvent extends EventObject {
    leftPos?: number;
    width?: number;
    topInd?: number;
}

export interface MonthlyEvent {
    day: ParsedRangeEvent[][];
    display: ParsedRangeEvent[];
}

export interface RangeData {
    month: string;
    week: DateObj[];
}

export type MonthData = Record<number, DateObj[]>;

/** The props the foundation reads with getProps */
export interface CalendarBaseProps {
    displayValue?: Date;
    showCurrTime?: boolean;
}

export interface CalendarAdapter<P extends CalendarBaseProps = CalendarBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    updateCurrPos: (currPos: number) => void;
    setShowCurrTime: (show: boolean) => void;
}

/**
 * Static pure layout functions for the views; an instance drives a day column's current time line.
 */
export default class CalendarFoundation<P extends CalendarBaseProps = CalendarBaseProps, S extends object = object> extends BaseFoundation<CalendarAdapter<P, S>, P, S> {
    #currTimeTimer: ReturnType<typeof setInterval>;

    static #parseEvents(events: EventObject[]) {
        const parsed: ParsedEventsWithArray = {
            allDay: [],
            day: [],
        };
        events
            .map((event) => parseEvent(event))
            .forEach((item) => {
                item.forEach((i) => {
                    if (i.allDay) {
                        parsed.allDay.push(i);
                    } else {
                        parsed.day.push(i);
                    }
                });
            });
        return parsed;
    }

    static #collectPositioned(events: ParsedRangeEvent[][]) {
        return events.flatMap((row) => row.filter((item) => 'leftPos' in item));
    }

    static #parseRangeEvents(events: Map<string, EventObject[]>, [start, end]: Date[]) {
        let parsed: Array<Array<ParsedRangeEvent>> = [[]];
        const filtered = filterEvents(events, start, end);
        [...filtered.keys()].toSorted(compareAsc).forEach((item) => {
            const startDate = new Date(item);
            const curr = filtered.get(item).filter((event) => isSameDay(event.date, startDate));
            parsed = parseRangeAllDayEvent(curr, startDate, start, end, parsed);
        });
        return parsed;
    }

    static #pushDayEventIntoWeekMap(item: EventObject, index: number, map: Record<number, EventObject[]>) {
        (map[index] ??= []).push(item);
    }

    #startCurrentTimeTicker() {
        const update = () => {
            if (!isSameDay(this.getProp('displayValue'), getCurrDate())) {
                // getPos reads only the time of day: the line would restart at 00:00 on a past column
                clearInterval(this.#currTimeTimer);
                this.adapter.setShowCurrTime(false);
                return;
            }
            this.adapter.updateCurrPos(round(getPos(getCurrDate())));
        };
        update();
        clearInterval(this.#currTimeTimer);
        this.#currTimeTimer = setInterval(update, 30000);
    }

    static formatCbValue([date, ...time]: [Date, number, number, number] | [Date]) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...(time as [number, number, number]));
    }

    /** The week of `value` as a time-grid range; the end is the next week's first day, as in the month view */
    static getWeekRange(value: Date, weekStartsOn: weekStartsOnEnum) {
        const start = startOfWeek(value, { weekStartsOn });
        return [start, addDays(endOfWeek(start, { weekStartsOn }), 1)];
    }

    static getRangeData(range: Date[], dateFnsLocale: Locale, weekStartsOn: weekStartsOnEnum, today?: Date | number | null, labelDate: Date = range[0]): RangeData {
        const [value, end] = range;
        const len = differenceInCalendarDays(end, value);
        return {
            month: format(labelDate, 'LLL', { locale: dateFnsLocale, weekStartsOn }),
            week: calcRangeData(value, startOfDay(value), len, 'week', dateFnsLocale, weekStartsOn, today),
        };
    }

    static getMonthlyData(value: Date, dateFnsLocale: Locale, weekStartsOn: weekStartsOnEnum, today?: Date | number | null) {
        const monthStart = startOfMonth(value);
        const data: MonthData = {};
        const numberOfWeek = getWeeksInMonth(value, { weekStartsOn });
        for (let ind = 0; ind < numberOfWeek; ind++) {
            data[ind] = calcWeekData(addDays(monthStart, ind * 7), monthStart, 'month', dateFnsLocale, weekStartsOn, today);
        }
        return data;
    }

    static getParseDailyEvents(events: EventObject[], day: Date) {
        const parsed = CalendarFoundation.#parseEvents(events);
        const key = startOfDay(day).toString();
        const allDay = convertEventsArrToMap(parsed.allDay, 'date', startOfDay).get(key) ?? [];
        const dayEvents = convertEventsArrToMap(parsed.day, 'date', null).get(key) ?? [];

        const rendered = dayEvents.map(renderDailyEvent);
        const groupKeyOf = (item: Omit<DailyEventLayout, 'left'>) => `${item.startPos}-${item.endPos}`;
        const groupSizes = countBy(rendered, groupKeyOf);

        const seen = new Map<string, number>();
        const laidOut: DailyEventLayout[] = rendered.map((item) => {
            const groupKey = groupKeyOf(item);
            const index = seen.get(groupKey) ?? 0;
            seen.set(groupKey, index + 1);
            return { ...item, left: index !== 0 ? `${(index / groupSizes[groupKey]) * 100}%` : 0 };
        });
        return { allDay, day: laidOut };
    }

    static getParsedRangeEvents(events: EventObject[]): ParsedEvents {
        const parsed = CalendarFoundation.#parseEvents(events);
        return {
            allDay: convertEventsArrToMap(parsed.allDay, 'start', startOfDay),
            day: convertEventsArrToMap(parsed.day, 'date', null),
        };
    }

    static parseRangeAllDayEvents(events: ParsedEvents['allDay'], range: Date[]) {
        return CalendarFoundation.#collectPositioned(CalendarFoundation.#parseRangeEvents(events, range));
    }

    static getParseMonthlyEvents(events: EventObject[], displayValue: Date, weekStartsOn: weekStartsOnEnum) {
        const weeks: Record<number, EventObject[]> = {};
        const firstDayOfMonth = startOfMonth(displayValue);
        const lastDayOfMonth = endOfMonth(displayValue);
        const res = events
            .map(normalizeEvent)
            .filter(Boolean)
            .toSorted((prev, next) => compareAsc(prev.start, next.start))
            .flatMap((event) => parseAllDayEvent(event, event.allDay));
        res.forEach((item) => {
            if (isSameMonth(item.date, displayValue)) {
                const weekInd = getWeekOfMonth(item.date, { weekStartsOn }) - 1;
                CalendarFoundation.#pushDayEventIntoWeekMap(item, weekInd, weeks);
                return;
            }
            if (isBefore(item.date, firstDayOfMonth)) {
                if (isSameWeek(item.date, firstDayOfMonth, { weekStartsOn })) {
                    CalendarFoundation.#pushDayEventIntoWeekMap(item, 0, weeks);
                }
                return;
            }
            if (isAfter(item.date, lastDayOfMonth)) {
                if (isSameWeek(item.date, lastDayOfMonth, { weekStartsOn })) {
                    const weekInd = getWeekOfMonth(lastDayOfMonth, { weekStartsOn }) - 1;
                    CalendarFoundation.#pushDayEventIntoWeekMap(item, weekInd, weeks);
                }
                return;
            }
        });
        const parsed: Record<number, MonthlyEvent> = {};
        Object.entries(weeks).forEach(([key, week]) => {
            const weekMap = convertEventsArrToMap(week, 'start', startOfDay);
            const parsedWeeklyEvent = CalendarFoundation.#parseRangeEvents(weekMap, CalendarFoundation.getWeekRange(week[0].date, weekStartsOn));
            parsed[key] = {
                day: collectDailyEvents(parsedWeeklyEvent),
                display: CalendarFoundation.#collectPositioned(parsedWeeklyEvent),
            };
        });
        return parsed;
    }

    /** How long to wait before re-reading today's date: until the next local midnight, but at most a minute */
    static getTodayRefreshDelay(now: Date = getCurrDate()) {
        // The timer clock stops while the machine sleeps and ignores clock or time zone changes, so a timer set for
        // midnight can fire long after it; the cap makes the host check again at least this often.
        return Math.min(addDays(startOfDay(now), 1).getTime() - now.getTime(), 60_000);
    }

    /**
     * Subscribes to the day changing; returns the unsubscribe function. The caller refreshes once itself on mount.
     */
    static watchToday(onChange: () => void) {
        let timer: ReturnType<typeof setTimeout>;
        const arm = () => {
            timer = setTimeout(() => {
                onChange();
                arm();
            }, CalendarFoundation.getTodayRefreshDelay());
        };
        arm();
        // waking up shows the page again, and the capped delay catches the rest
        document.addEventListener('visibilitychange', onChange);
        window.addEventListener('focus', onChange);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onChange);
            window.removeEventListener('focus', onChange);
        };
    }

    /** How many event rows fit in a month cell of this height */
    static getItemLimit(cellHeight: number) {
        return Math.max(0, Math.ceil((cellHeight - numbers.MONTH_CELL_PADDING) / numbers.MONTH_EVENT_HEIGHT));
    }

    /** How many of a day's events overflow the limit; a day's events are a sparse array indexed by row */
    static countHidden(dayEvents: ParsedRangeEvent[] | undefined, itemLimit: number) {
        return dayEvents?.slice(itemLimit).filter(Boolean).length ?? 0;
    }

    /**
     * Once the open card's cell no longer collapses (resize, events changed) its "more" button is gone, and the
     * recorded card would pop up again when the cell collapses later without ever reporting a close
     */
    static isOpenCardStale(openCardKey: string | undefined, monthlyData: MonthData, parsedEvents: Record<number, MonthlyEvent>, itemLimit: number) {
        return openCardKey !== undefined && !Object.values(monthlyData).some((weekDays, weekInd) => weekDays.some(({ date, ind }) => date.toString() === openCardKey && CalendarFoundation.countHidden(parsedEvents[weekInd]?.day?.[ind], itemLimit) > 0));
    }

    /** The key of the open "more" card, if any (at most one) */
    static getOpenCardKey(showCard: Record<string, boolean>) {
        return Object.keys(showCard).find((key) => showCard[key]);
    }

    // decided once per mount; the views remount a column when its date changes
    override init() {
        const { showCurrTime, displayValue } = this.getProps();
        if (showCurrTime && isSameDay(displayValue, getCurrDate())) {
            this.adapter.setShowCurrTime(true);
            this.#startCurrentTimeTicker();
        }
    }

    override destroy() {
        clearInterval(this.#currTimeTimer);
    }
}
