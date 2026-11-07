import { startOfMonth, getDaysInMonth, format } from 'date-fns';
import { chunk } from 'es-toolkit';

const pad2 = (value: number | string) => String(value).padStart(2, '0');

export function formatFullDate(year: number | string, month: number | string, day: number | string) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
}

export type WeekStartNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
function getWeeks(date: Date, weekStartsOn: WeekStartNumber = 0) {
    const weekDayNotInMonth = {
        dayNumber: '',
        dateNumberFull: '',
        fullDate: '',
    };
    const year = format(date, 'yyyy');
    const month = format(date, 'MM');
    // date-fns 'e' is the 1-based weekday index relative to weekStartsOn
    const firstDayInWeek = Number(format(startOfMonth(date), 'e', { weekStartsOn }));

    const placeholders = Array.from({ length: firstDayInWeek - 1 }, () => weekDayNotInMonth);
    const days = Array.from({ length: getDaysInMonth(date) }, (_, d) => ({
        dayNumber: d + 1,
        dayNumberFull: pad2(d + 1),
        fullDate: formatFullDate(year, month, d + 1),
    }));

    return chunk([...placeholders, ...days], 7);
}

export default function getMonthTable(month: Date, weekStartsOn: WeekStartNumber) {
    const weeks = getWeeks(month, weekStartsOn);
    const monthText = format(month, 'yyyy-MM');
    return { monthText, weeks, month };
}
