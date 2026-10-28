import { zhCN } from 'date-fns/locale';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { calcWeekData } from '../event-util';
import CalendarFoundation from '../foundation';

const { getRangeData, getMonthlyData } = CalendarFoundation;
const now = new Date(2026, 5, 10, 12);
const other = new Date(2026, 5, 12);
const range = [new Date(2026, 5, 8), new Date(2026, 5, 15)];
const todayDays = (days: { date: Date; isToday: boolean }[]) => days.filter((d) => d.isToday).map((d) => d.date.getDate());

describe('日历 today 参数', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('today 为 null 时范围包含当前日期也不标记任何一天', () => {
        expect(todayDays(getRangeData(range, zhCN, 1, null).week)).toEqual([]);
        expect(todayDays(Object.values(getMonthlyData(now, zhCN, 1, null)).flat())).toEqual([]);
        expect(todayDays(calcWeekData(now, null, 'week', zhCN, 1, null))).toEqual([]);
    });

    it('today 为 undefined 时标记当前日期', () => {
        expect(todayDays(getRangeData(range, zhCN, 1).week)).toEqual([10]);
        expect(todayDays(Object.values(getMonthlyData(now, zhCN, 1)).flat())).toEqual([10]);
        expect(todayDays(calcWeekData(now, null, 'week', zhCN, 1))).toEqual([10]);
    });

    it('传入日期时标记该日期而不是当前日期', () => {
        expect(todayDays(getRangeData(range, zhCN, 1, other).week)).toEqual([12]);
        expect(todayDays(Object.values(getMonthlyData(now, zhCN, 1, other)).flat())).toEqual([12]);
        expect(todayDays(calcWeekData(now, null, 'week', zhCN, 1, other.getTime()))).toEqual([12]);
    });
});
