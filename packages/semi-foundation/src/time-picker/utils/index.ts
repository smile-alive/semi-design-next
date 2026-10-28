import { format, parse } from 'date-fns';
import { zhCN as defaultLocale } from 'date-fns/locale/zh-CN';
import { escapeRegExp } from 'es-toolkit';
import { strings } from '../constants';

export function parseToDate(input: string | Date | number, formatToken = strings.DEFAULT_FORMAT, dateFnsLocale = defaultLocale) {
    if (input instanceof Date) {
        return input;
    } else if (typeof input === 'number') {
        return new Date(input);
    } else if (typeof input === 'string') {
        if (input === '') return undefined;

        let curDate = new Date();

        curDate = parse(input, formatToken, curDate, { locale: dateFnsLocale });

        return curDate;
    } else if (typeof input === 'undefined') {
        return undefined;
    }

    return new Date();
}

export function formatToString(dateOrTimestamp: Date | number, formatToken = strings.DEFAULT_FORMAT, dateFnsLocale = defaultLocale) {
    return format(dateOrTimestamp, formatToken, { locale: dateFnsLocale });
}

// The callbacks are user code, so a non-array result counts as nothing disabled
function includesNumber(options: unknown, value: number) {
    return Array.isArray(options) && options.some((v) => Number(v) === Number(value));
}

// Each callback runs before the null checks, so it is called even for an empty hour, minute or second
export function hourIsDisabled(disabledHours: () => number[], hour: number) {
    return typeof disabledHours === 'function' && includesNumber(disabledHours(), hour) && hour != null;
}

export function minuteIsDisabled(disabledMinutes: (hour: number) => number[], hour: number, minute: number) {
    return typeof disabledMinutes === 'function' && includesNumber(disabledMinutes(hour), minute) && hour != null && minute != null;
}

export function secondIsDisabled(disabledSeconds: (hour: number, minute: number) => number[], hour: number, minute: number, second: number) {
    return typeof disabledSeconds === 'function' && includesNumber(disabledSeconds(hour, minute), second) && hour != null && minute != null && second != null;
}

export function transformToArray<T>(value: T[]) {
    return Array.isArray(value) ? [...value] : [];
}

/**
 * Determine whether the time length is the same as the format
 * e.g.
 *  format      | time      | return
 *  HH:mm       | 12:00     | true
 *  HH:mm:ss    | 12:00:00  | true
 *  yyyy HH:mm  | 2021 12:00| true
 *  HH          | 1         | false
 *  HH:mm       | 12:0      | false
 *  HH:mm:ss    | 12:00:0   | false
 */
export function isTimeFormatLike(time: string, formatToken: string) {
    let isLike = true;
    const dateFnsSupportFormatCh = 'BDEGHKLMOPQRSTXYabcehimopqstuwxyz';
    const formatSupportChReg = new RegExp(`[${dateFnsSupportFormatCh}]`, 'g');
    const formatNotSupportChReg = new RegExp(`[^${dateFnsSupportFormatCh}]`, 'g');
    const hmsReg = /[H|m|s]{1,2}/;
    const formatSplitted = formatToken.split(formatNotSupportChReg);
    const timeSeparator = formatToken.replace(formatSupportChReg, '');
    const escapedTimeSeparator = escapeRegExp(timeSeparator); // a separator such as "\\" would make the RegExp invalid
    const timeReg = new RegExp(`[${escapedTimeSeparator}]`, 'g');
    const timeSplitted = time.split(timeReg);

    if (formatSplitted.length !== timeSplitted.length) {
        isLike = false;
    } else {
        for (let i = 0, len = timeSplitted.length; i < len; i++) {
            const formatStr = formatSplitted[i];
            const timeStr = timeSplitted[i];
            if (hmsReg.test(formatStr) && timeStr.length < formatStr.length) {
                isLike = false;
                break;
            }
        }
    }
    return isLike;
}
