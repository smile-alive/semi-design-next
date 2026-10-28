import { format, parseISO } from 'date-fns';
import { strings } from '../constants';
import type { DateOffsetType } from '../foundation';

/** Applies a date-fns offset function (e.g. addMonths) and returns the result as a date string. */
export default function getFullDateOffset(fn: DateOffsetType | undefined, date: string | Date) {
    if (!date) {
        return '';
    }
    // parseISO reads 'yyyy-MM-dd' as a local midnight; `new Date(str)` is UTC, a day early west of Greenwich
    const baseDate = typeof date === 'string' ? parseISO(date) : date;
    const offsetDate = typeof fn === 'function' ? fn(baseDate) : baseDate;
    return format(offsetDate, strings.FORMAT_FULL_DATE);
}
