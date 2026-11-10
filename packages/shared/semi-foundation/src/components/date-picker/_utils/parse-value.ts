import type { Locale } from 'date-fns';
import { parseReference, toWallTime } from '../../../utils/zoned-time';
import isTimestamp from './is-timestamp';
import isValidDate from './is-valid-date';
import { compatibleParse } from './parser';

type BaseValueType = string | number | Date;

export function isPickerValue(value: unknown): value is BaseValueType {
    return isValidDate(value) || isTimestamp(value) || typeof value === 'string';
}

/**
 * A `value`-like input as the wall time a picker holds: a Date or timestamp is an instant, a string is a `timeZone`
 * wall time read with `format`. Null for a string that does not parse.
 */
export default function parseValue(value: BaseValueType, { format, dateFnsLocale, timeZone }: { format?: string; dateFnsLocale?: Locale; timeZone?: string | number }): Date | null {
    if (typeof value === 'string') {
        const parsed = compatibleParse(value, format, parseReference(timeZone), dateFnsLocale);
        return parsed && toWallTime(parsed, timeZone);
    }
    if (!isPickerValue(value)) {
        throw new TypeError('value should be valid Date object/timestamp or string');
    }
    return toWallTime(value, timeZone);
}
