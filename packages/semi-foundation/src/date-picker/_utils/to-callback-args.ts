import { format as formatFn } from 'date-fns';
import { zonedTimeToUtc } from '../../utils/date-fns-extra';
import isValidTimeZone from '../../utils/is-valid-time-zone';
import type { Type } from '../input-foundation';
import { getDefaultFormatTokenByType } from './get-default-format-token';
import { isMultiple } from './picker-type';

/**
 * Dates are held in the computer's time zone and must be converted to `timeZone` before being passed out.
 * Example: timeZone is +9, the computer is in +8, and the user picks 22:00. The state holds 22:00 (+8);
 * zonedTimeToUtc(a, "+09:00") turns it into 21:00 (+8), i.e. 22:00 in +9.
 */
export function toCallbackDates(value: Date | Date[], timeZone?: string | number) {
    const dates = Array.isArray(value) ? value : (value && [value]) || [];
    return isValidTimeZone(timeZone) ? dates.map((date) => zonedTimeToUtc(date, timeZone)) : dates;
}

/** Builds the date and string arguments of the callbacks, with the dates converted by `toCallbackDates` */
export default function toCallbackArgs(value: Date | Date[], options: { type?: Type; format?: string; timeZone?: string | number; multiple?: boolean; dateFnsLocale?: any }) {
    const { type, format, timeZone, dateFnsLocale } = options;
    const dates = toCallbackDates(value, timeZone);
    const formatToken = format || getDefaultFormatTokenByType(type);
    const toText = (date: Date) => date && formatFn(date, formatToken, { locale: dateFnsLocale });

    let notifyValue, notifyDate;
    switch (type) {
        case 'date':
        case 'dateTime':
        case 'month':
        case 'year':
            if (!isMultiple(options)) {
                notifyValue = toText(dates[0]);
                [notifyDate] = dates;
            } else {
                notifyValue = dates.map(toText);
                notifyDate = [...dates];
            }
            break;
        case 'dateRange':
        case 'dateTimeRange':
        case 'monthRange':
            notifyValue = dates.map(toText);
            notifyDate = [...dates];
            break;
        default:
            break;
    }

    return { notifyValue, notifyDate };
}
