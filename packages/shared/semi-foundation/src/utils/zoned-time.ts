import { TZDate } from '@date-fns/tz';
import { toIANA, utcToZonedTime, zonedTimeToUtc } from './date-fns-extra';
import isValidTimeZone from './is-valid-time-zone';

/*
 * The boundary of the date and time pickers' `timeZone`. Inside, a picker holds wall times: system-local Dates whose
 * getters show the `timeZone` clock. Users pass instants and `timeZone` wall-time text in, and get TZDates back. Without
 * a valid `timeZone` both sides are the same system-local Date.
 */

/** A Date or timestamp from the user, an instant, as the wall time it shows in `timeZone` */
export function toWallTime(instant: Date | number, timeZone?: string | number) {
    if (isValidTimeZone(timeZone)) {
        return utcToZonedTime(instant, timeZone);
    }
    return typeof instant === 'number' ? new Date(instant) : instant;
}

/** A held wall time as handed to users: a TZDate of its instant, whose getters and date-fns `format` read the `timeZone` clock */
export function fromWallTime(wallTime: Date, timeZone?: string | number) {
    return isValidTimeZone(timeZone) ? new TZDate(zonedTimeToUtc(wallTime, timeZone).getTime(), toIANA(timeZone)) : wallTime;
}

/** The reference date for parsing text as a `timeZone` wall time: date-fns parses against a TZDate into a TZDate of the instant */
export function parseReference(timeZone?: string | number) {
    return isValidTimeZone(timeZone) ? new TZDate(Date.now(), toIANA(timeZone)) : new Date();
}
