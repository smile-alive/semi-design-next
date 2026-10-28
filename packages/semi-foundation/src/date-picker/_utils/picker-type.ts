import type { Type } from '../input-foundation';
import isValidDate from './is-valid-date';

/** dateRange, dateTimeRange and monthRange select a start and an end */
export function isRangeType(type?: Type) {
    return typeof type === 'string' && type.endsWith('Range');
}

/** `multiple` applies to the date type only; the other types ignore it */
export function isMultiple({ type, multiple }: { type?: Type; multiple?: boolean }) {
    return Boolean(multiple) && type === 'date';
}

export function isDateTimeType(type?: Type) {
    return type === 'dateTime' || type === 'dateTimeRange';
}

/** Only the types with a time panel have the confirm footer; the others ignore `needConfirm` */
export function needConfirm({ type, needConfirm: confirm }: { type?: Type; needConfirm?: boolean }) {
    return isDateTimeType(type) && confirm === true;
}

/** These types pick in the year and month panel instead of the day grid */
export function isYearOrMonthType(type?: Type) {
    return type === 'year' || type === 'month' || type === 'monthRange';
}

/** monthRange shows its range in one trigger input; the other range types split it into a start and an end input */
export function isSplitRangeInputs(type?: Type) {
    return isRangeType(type) && type !== 'monthRange';
}

/** An empty range (cleared) or one with two valid dates; a half-picked range is neither committed nor confirmed */
export function isRangeValueComplete(value: readonly (Date | null | undefined)[]) {
    return value.length === 0 || (value.length === 2 && value.every((date) => isValidDate(date)));
}
