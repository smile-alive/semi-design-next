import { toDateOrParse } from './to-date-arg';

/**
 * is the date between start and end?(not including start and end)
 *   - if start > end, return false
 */
export default function isBetween(day: string | Date, { start, end }: { start: string | Date; end: string | Date }) {
    const d = +toDateOrParse(day);
    return +toDateOrParse(start) < d && d < +toDateOrParse(end);
}
