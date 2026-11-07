import { zhCN } from 'date-fns/locale';
import { describe, expect, it } from 'vite-plus/test';
import CalendarFoundation from '../foundation';

const range = [new Date(2026, 5, 8), new Date(2026, 5, 15)];
const todayDays = (days: { date: Date; isToday: boolean }[]) => days.filter((d) => d.isToday).map((d) => d.date.getDate());

describe('日历 today 参数在 Node 中', () => {
    it('today 为 null 时不标记任何一天', () => {
        expect(todayDays(CalendarFoundation.getRangeData(range, zhCN, 1, null).week)).toEqual([]);
        expect(todayDays(Object.values(CalendarFoundation.getMonthlyData(new Date(2026, 5, 10), zhCN, 1, null)).flat())).toEqual([]);
    });

    it('传入日期时只标记该日期', () => {
        const today = new Date(2026, 5, 12);
        expect(todayDays(CalendarFoundation.getRangeData(range, zhCN, 1, today).week)).toEqual([12]);
        expect(todayDays(Object.values(CalendarFoundation.getMonthlyData(new Date(2026, 5, 10), zhCN, 1, today)).flat())).toEqual([12]);
    });
});
