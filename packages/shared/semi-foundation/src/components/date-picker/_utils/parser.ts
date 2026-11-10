import { type Locale, constructFrom, isValid, parseISO, parse } from 'date-fns';

/** A TZDate `baseDate` reads text without an offset as a wall time of its zone */
export function compatibleParse(value: string, formatToken?: string, baseDate: Date = new Date(), locale?: Locale): Date | null {
    let result = null;
    if (value) {
        if (formatToken) {
            // Callers also pass non-string values and the whole default token map; stringify them as date-fns 2 did
            result = parse(String(value), String(formatToken), baseDate, { locale });
        }
        if (!isValid(result) && typeof value === 'string') {
            result = parseISO(value, { in: (date) => constructFrom(baseDate, date) });
        }
        if (!isValid(result)) {
            result = new Date(Date.parse(value));
        }
        const yearInvalid = isValid(result) && String(result.getFullYear()).length > 4;
        if (!isValid(result) || yearInvalid) {
            result = null;
        }
    }
    return result;
}
