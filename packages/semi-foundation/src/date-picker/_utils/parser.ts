/**
 * @file
 * Various date-related analysis methods
 */
import { type Locale, isValid, parseISO, parse } from 'date-fns';

/**
 * Parsing value to Date object
 */
export function compatibleParse(value: string, formatToken?: string, baseDate?: Date, locale?: Locale): Date | null {
    let result = null;
    if (value) {
        if (formatToken) {
            baseDate = baseDate || new Date();
            // Callers also pass non-string values and the whole default token map; stringify them as date-fns 2 did
            result = parse(String(value), String(formatToken), baseDate, { locale });
        }
        if (!isValid(result) && typeof value === 'string') {
            result = parseISO(value);
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
