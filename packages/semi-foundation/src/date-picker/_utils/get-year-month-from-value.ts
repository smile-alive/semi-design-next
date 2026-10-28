import type { Type } from '../input-foundation';

/** The year and month panel's `currentYear` and `currentMonth` for `value`; only monthRange has a right side, 0 is none */
export default function getYearMonthFromValue(value: readonly unknown[], type?: Type) {
    const [left, right] = value;
    const rightDate = type === 'monthRange' && right instanceof Date ? right : undefined;
    const leftDate = left instanceof Date ? left : undefined;
    return {
        year: { left: leftDate?.getFullYear() ?? 0, right: rightDate?.getFullYear() ?? 0 },
        month: { left: leftDate ? leftDate.getMonth() + 1 : 0, right: rightDate ? rightDate.getMonth() + 1 : 0 },
    };
}
