import { format as formatFn } from 'date-fns';
import { fromWallTime } from '../../../utils/zoned-time';
import type { Type } from '../input-foundation';
import { getDefaultFormatTokenByType } from './get-default-format-token';
import { isMultiple } from './picker-type';

/** The held wall times as handed to users; an empty end of a range stays empty */
export function toCallbackDates(value: Date | Date[], timeZone?: string | number) {
    const dates = Array.isArray(value) ? value : (value && [value]) || [];
    return dates.map((date) => date && fromWallTime(date, timeZone));
}

/** `dateString` formats the `timeZone` wall time, the text the input shows, so it can be passed back as `value` */
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
