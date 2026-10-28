import { type Locale, format, isSameMonth, isWeekend, differenceInCalendarDays, isBefore, isAfter, compareAsc, addDays, startOfWeek, getSeconds, differenceInHours, getMinutes, getHours, addHours, isSameDay, endOfDay, startOfDay, toDate } from 'date-fns';
import { groupBy } from 'es-toolkit';
import warning from '../utils/warning';
import type { EventObject, ParsedRangeEvent } from './foundation';

function copyEvent(event: EventObject, date: Date, start?: Date, end?: Date, allDay = false) {
    const copied = { ...event };
    copied.date = date;
    if (start) {
        copied.start = start;
    }
    if (end) {
        copied.end = end;
    }
    copied.allDay = allDay;
    return copied;
}

function isDateInRange(dirtyDate: Date, dirtyStart: Date, dirtyEnd: Date) {
    const date = toDate(dirtyDate);
    const start = toDate(dirtyStart);
    const end = toDate(dirtyEnd);
    return date.getTime() < end.getTime() && date.getTime() >= start.getTime();
}

export function checkWeekend(val: Date) {
    return isWeekend(val);
}

export function getCurrDate() {
    return new Date();
}

/** A 0-1 fraction of the day or week row as a CSS percentage, capped at 100% */
export function toPercent(num: number) {
    return `${num < 1 ? num * 100 : 100}%`;
}

export function round(value: number) {
    return Math.round(value * 1000) / 1000;
}

export function getPos(value: Date | number) {
    const currSec = (getHours(value) * 60 + getMinutes(value)) * 60 + getSeconds(value);
    const totalSec = 24 * 60 * 60;
    return currSec / totalSec;
}

export function isAllDayEvent(event: EventObject) {
    return 'allDay' in event && event.allDay;
}

/**
 * Fills a missing start (end - 1h) or end (start + 1h), clamped to the day.
 */
export function amendEvent(event: EventObject): EventObject | undefined {
    const { start, end } = event;
    if (!start && !end) {
        warning(true, '[Semi Calendar] an event needs a start or an end, it is skipped');
        return undefined;
    } else if (!start) {
        return { ...event, start: isSameDay(end, addHours(end, -1)) ? addHours(end, -1) : startOfDay(end) };
    }
    return { ...event, end: isSameDay(start, addHours(start, 1)) ? addHours(start, 1) : endOfDay(start) };
}

/** An event every view can lay out: it has a start, and when it has an end, the end is not before it */
export interface NormalizedEvent extends EventObject {
    start: Date;
}

/**
 * Entry of every view: swaps a reversed start/end, starts an end-only all-day event on that day, amends a
 * one-sided timed event, and skips (with a warning) an event with neither. A timed event ending at 00:00 ends
 * 1ms earlier, so it belongs only to the days before that midnight. Works on a copy.
 */
export function normalizeEvent(event: EventObject): NormalizedEvent | undefined {
    const { start, end } = event;
    if (!start && !end) {
        warning(true, '[Semi Calendar] an event needs a start or an end, it is skipped');
        return undefined;
    }
    if (start && end) {
        const [from, to] = isBefore(end, start) ? [end, start] : [start, end];
        // Rendering is unaffected: round() in renderDailyEvent puts the last millisecond at the bottom of the day.
        const lastMoment = !isAllDayEvent(event) && isAfter(to, from) && to.getTime() === startOfDay(to).getTime() ? new Date(to.getTime() - 1) : to;
        return from === start && lastMoment === end ? (event as NormalizedEvent) : { ...event, start: from, end: lastMoment };
    }
    if (isAllDayEvent(event)) {
        return start ? (event as NormalizedEvent) : { ...event, start: startOfDay(end) };
    }
    return amendEvent(event) as NormalizedEvent;
}

/** The max topInd is the row height */
export function calcRowHeight(events: ParsedRangeEvent[]) {
    const topIndArr = events.map((item) => item.topInd);
    return topIndArr.length ? Math.max(...topIndArr) + 1 : 1;
}

export interface DateObj {
    ind: number;
    date: Date;
    dayString: string;
    weekday: string;
    isToday: boolean;
    isWeekend: boolean;
    isSameMonth: boolean;
    month: string;
}

export type weekStartsOnEnum = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function calcRangeData(value: Date, start: Date, rangeLen: number, mode: string, locale: Locale, weekStartsOn: weekStartsOnEnum, today: Date | number | null = getCurrDate()) {
    return Array.from({ length: rangeLen }, (_, ind) => {
        const dateObj = {} as DateObj;
        const date = addDays(start, ind);
        dateObj.ind = ind;
        dateObj.date = date;
        dateObj.dayString = format(date, 'd', { locale, weekStartsOn });
        dateObj.weekday = format(date, 'EEE', { locale, weekStartsOn });
        // null marks no day (server render and the hydration pass), so it must not reach date-fns
        dateObj.isToday = today !== null && isSameDay(date, today);
        dateObj.isWeekend = checkWeekend(date);
        if (mode === 'month') {
            dateObj.isSameMonth = isSameMonth(value, date);
            dateObj.month = format(date, 'LLL', { locale });
        }
        return dateObj;
    });
}

/**
 * The days of a week as { date, dayString, ind, isToday, isWeekend, weekday }; `monthStart` is for month mode
 */
export function calcWeekData(value: Date, monthStart: Date | null, mode = 'week', locale: Locale, weekStartsOn: weekStartsOnEnum, today?: Date | number | null) {
    const start = startOfWeek(value, { weekStartsOn });
    const realValue = monthStart || value;
    return calcRangeData(realValue, start, 7, mode, locale, weekStartsOn, today);
}

/** Splits an all-day event into one event per day it spans */
export function parseAllDayEvent(event: NormalizedEvent, allDay = true) {
    const { start, end } = event;
    const diff = end ? differenceInCalendarDays(end, start) : 0;
    return Array.from({ length: diff + 1 }, (_, day) => copyEvent(event, addDays(start, day), null, null, allDay));
}

export function parseEvent(rawEvent: EventObject) {
    const event = normalizeEvent(rawEvent);
    if (!event) {
        return [];
    }
    if (isAllDayEvent(event)) {
        return parseAllDayEvent(event);
    }

    const { start, end } = event;
    if (isSameDay(start, end)) {
        return [copyEvent(event, startOfDay(start))];
    }
    if (differenceInHours(end, start) < 24) {
        return [copyEvent(event, startOfDay(start), null, endOfDay(start)), copyEvent(event, startOfDay(end), startOfDay(end))];
    }
    return parseAllDayEvent(event);
}

/** Groups events into a map keyed by the date string of `key`, normalized by `func` */
export function convertEventsArrToMap(arr: EventObject[], key: 'start' | 'date', func: (val: Date) => Date) {
    return new Map(Object.entries(groupBy(arr, (item) => (func ? func(item[key]) : item[key]).toString())));
}

export function filterEvents(events: Map<string, EventObject[]>, start: Date, end: Date) {
    const res = new Map<string, EventObject[]>();
    for (const [day, item] of events) {
        const date = new Date(day);
        if (isDateInRange(date, start, end)) {
            res.set(day, [...(res.get(day) ?? []), ...item]);
        } else if (!isBefore(end, date)) {
            // events from before the range that still run show on the range start
            const filtered = item.filter((i) => !i.end || !isBefore(i.end, start));
            const key = start.toString();
            res.set(key, [...(res.get(key) ?? []), ...filtered]);
        }
    }
    return res;
}

export function parseRangeAllDayEvent(event: EventObject[], startDate: Date, rangeStart: Date, rangeEnd: Date, parsed: Array<Array<ParsedRangeEvent>>) {
    const dateRangeLen = differenceInCalendarDays(rangeEnd, rangeStart);
    event
        .sort((a, b) => compareAsc(a.start, b.start))
        .forEach((item) => {
            const itemInfo = { ...item };
            const { end } = item;
            let dateLength;
            const j = differenceInCalendarDays(startDate, rangeStart);
            let i = 0;
            while (Boolean(parsed[i]) && Boolean(parsed[i][j])) {
                i++;
            }

            if (!end) {
                dateLength = 0;
            } else {
                dateLength = isDateInRange(end, rangeStart, rangeEnd) ? differenceInCalendarDays(end, startDate) : differenceInCalendarDays(rangeEnd, startDate);
            }

            itemInfo.leftPos = round(Number(j) / dateRangeLen);
            itemInfo.width = Math.min(1 - round(Number(j) / dateRangeLen), round(((dateLength + 1) * 1) / dateRangeLen));
            itemInfo.topInd = i;

            for (let dist = 0; dist <= dateLength; dist++) {
                if (!parsed[i]) {
                    parsed[i] = [];
                }
                parsed[i][j + dist] = dist > 0 ? item : itemInfo;
            }
        });
    return parsed;
}

export function collectDailyEvents(events: ParsedRangeEvent[][]) {
    const collections: ParsedRangeEvent[][] = [];
    events.forEach((row, rowInd) => {
        row.forEach((event, ind) => {
            collections[ind] ??= [];
            collections[ind][rowInd] = event;
        });
    });
    return collections;
}

/** A timed event laid out in a day column: positions are 0-1 fractions of the day */
export interface DailyEventLayout {
    key: string;
    children?: EventObject['children'];
    startPos: number;
    endPos: number;
    allDay: boolean;
    /** Offset of an event that shares its time range with others; 0 for the first of its group */
    left: number | string;
}

export function renderDailyEvent(event: EventObject): Omit<DailyEventLayout, 'left'> {
    const { key } = event;
    let { start, end, allDay, children } = event;
    let startPos, endPos;
    if (isAllDayEvent(event)) {
        startPos = 0;
        endPos = 0;
    } else if (!start || !end) {
        // normalizeEvent (via parseEvent) already dropped events with neither start nor end
        const amend = amendEvent(event);
        endPos = getPos(amend.end);
        startPos = getPos(amend.start);
    } else {
        if (!isBefore(start, end)) {
            [start, end] = [end, start];
        }
        startPos = getPos(start);
        endPos = getPos(end);
    }
    return {
        key,
        startPos: round(startPos),
        endPos: round(endPos),
        children,
        allDay: Boolean(allDay),
    };
}
