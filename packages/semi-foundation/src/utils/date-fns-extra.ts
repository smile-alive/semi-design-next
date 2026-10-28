import { tzOffset } from '@date-fns/tz';
import { parseISO, toDate } from 'date-fns';

const GMTStringReg = /[-+]\d{2}:\d{2}/;

/**
 * The Intl time zone for a Semi time zone value: an offset in hours or a GMT±HH:MM string becomes the fixed ±HH:MM
 * offset Intl accepts, which never shifts for DST; any other string is used as is, normally an IANA name
 */
export function toIANA(tz: string | number) {
    if (typeof tz === 'number') {
        const minutes = Math.round(tz * 60);
        const abs = Math.abs(minutes);
        const hh = String(Math.floor(abs / 60)).padStart(2, '0');
        const mm = String(Math.floor(abs % 60)).padStart(2, '0');
        return `${minutes < 0 ? '-' : '+'}${hh}:${mm}`;
    }
    return tz?.match(GMTStringReg)?.[0] ?? tz;
}

const validTimeZones = new Set<string>();
export function isValidTimezoneIANAString(timeZoneString: string) {
    if (validTimeZones.has(timeZoneString)) return true;
    try {
        new Intl.DateTimeFormat(undefined, { timeZone: timeZoneString });
        validTimeZones.add(timeZoneString);
        return true;
    } catch (error) {
        return false;
    }
}

const MILLISECONDS_IN_MINUTE = 60000;
const MILLISECONDS_IN_DAY = 86400000;

/**
 * UTC offset of `timeZone` (IANA name or ±HH[:MM]) at the instant `time` in milliseconds, positive east of UTC. No
 * zone or Z means UTC; an unknown zone gives NaN.
 */
function zoneOffset(timeZone: string | undefined, time: number) {
    if (!timeZone || timeZone === 'Z') {
        return 0;
    }
    // Validate through Intl first: tzOffset falls back to reading any ±HH[:MM] substring, so it accepts "+24:00"
    if (!isValidTimezoneIANAString(timeZone)) {
        return NaN;
    }
    return Math.round(tzOffset(timeZone, new Date(time)) * MILLISECONDS_IN_MINUTE);
}

/**
 * The instant at which `timeZone` shows `wallTime` (wall-clock fields read as UTC), resolved like Temporal's
 * `disambiguation: 'compatible'`: a repeated wall time takes the earlier instant, one skipped by DST moves forward
 * by the length of the gap
 */
function wallTimeToInstant(wallTime: number, timeZone?: string) {
    // A day either side lies beyond any single transition near the wall time, giving the offsets before and after it
    const offsetBefore = zoneOffset(timeZone, wallTime - MILLISECONDS_IN_DAY);
    const offsetAfter = zoneOffset(timeZone, wallTime + MILLISECONDS_IN_DAY);
    const candidates = [wallTime - Math.max(offsetBefore, offsetAfter), wallTime - Math.min(offsetBefore, offsetAfter)];
    return candidates.find((time) => time + zoneOffset(timeZone, time) === wallTime) ?? wallTime - offsetBefore;
}

/** Wall-clock fields of a system-local Date read as UTC */
function wallTimeAsUtc(date: Date) {
    const utc = new Date(0);
    utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    utc.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    return utc.getTime();
}

function toDateValue(date: string | number | Date) {
    return typeof date === 'string' ? parseISO(date) : toDate(date);
}

/**
 * Returns a Date which will format as the local time of any time zone from a specific UTC time
 *
 * @example
 * ```javascript
 * import { utcToZonedTime } from '@fibrae/semi-foundation/utils/date-fns-extra'
 * const { isoDate, timeZone } = fetchInitialValues() // 2014-06-25T10:00:00.000Z, America/New_York
 * const date = utcToZonedTime(isoDate, timeZone) // In June 10am UTC is 6am in New York (-04:00)
 * renderDatePicker(date) // 2014-06-25 06:00:00 (in the system time zone)
 * renderTimeZoneSelect(timeZone) // America/New_York
 * ```
 *
 * Both instants of a repeated hour show the same wall time. A wall time that the system time zone skips for DST
 * cannot be held by a system-local Date; like the Date constructor, it moves forward by the system zone's gap.
 */
export function utcToZonedTime(date: string | number | Date, timeZone: string | number) {
    const utcDate = toDateValue(date);
    const shifted = new Date(utcDate.getTime() + zoneOffset(toIANA(timeZone), utcDate.getTime()));
    const zonedDate = new Date(0);
    zonedDate.setFullYear(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
    zonedDate.setHours(shifted.getUTCHours(), shifted.getUTCMinutes(), shifted.getUTCSeconds(), shifted.getUTCMilliseconds());
    return zonedDate;
}

/**
 * Given a date and any time zone, returns a Date with the equivalent UTC time
 *
 * @example
 * ```
 * import { zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra'
 * const date = getDatePickerValue() // e.g. 2014-06-25 10:00:00 (picked in any time zone)
 * const timeZone = getTimeZoneValue() // e.g. America/Los_Angeles
 * const utcDate = zonedTimeToUtc(date, timeZone) // In June 10am in Los Angeles is 5pm UTC
 * postToServer(utcDate.toISOString(), timeZone) // post 2014-06-25T17:00:00.000Z, America/Los_Angeles
 * ```
 *
 * DST follows Temporal's `disambiguation: 'compatible'`, whatever the system time zone: a repeated wall time
 * resolves to the earlier instant, and one skipped by DST moves forward by the gap (02:30 becomes 03:30).
 */
export function zonedTimeToUtc(date: string | number | Date, timeZone: string | number) {
    const ianaTimeZone = toIANA(timeZone);
    const dateValue = toDateValue(date);
    // Without a zone, a string with no offset of its own stays system-local time
    if (!ianaTimeZone && typeof date === 'string' && !/(Z|[+-]\d{2}(:?\d{2})?)$/.test(date)) {
        return dateValue;
    }
    return new Date(wallTimeToInstant(wallTimeAsUtc(dateValue), ianaTimeZone));
}
