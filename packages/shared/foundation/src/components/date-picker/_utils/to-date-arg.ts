import { parseISO } from 'date-fns';

/**
 * date-fns 2 read only Dates and timestamps and treated anything else, such as an empty range end, as an invalid
 * date. date-fns 4 reads null as 1970-01-01 and parses strings, so values that may be empty pass through this first.
 */
export default function toDateArg(value: unknown) {
    return value instanceof Date || typeof value === 'number' ? value : new Date(NaN);
}

export function toDateOrParse(value: unknown) {
    return typeof value === 'string' ? parseISO(value) : toDateArg(value);
}
