import { describe, expect, it } from 'vite-plus/test';
import { cssClasses } from '../constants';
import MonthFoundation from '../month-foundation';

describe('MonthFoundation.getDayClasses', () => {
    it('状态标志映射到对应 class，不含基础 DAY class', () => {
        const classes = MonthFoundation.getDayClasses({ isSelectedStart: true } as ReturnType<typeof MonthFoundation.getDayStatus>, true);
        expect(classes[cssClasses.DAY_SELECTED_START]).toBe(true);
        expect(classes[cssClasses.DAY_ACTIVE]).toBe(true);
        expect(classes[cssClasses.DAY_TODAY]).toBeFalsy();
        expect(cssClasses.DAY in classes).toBe(false);
    });
});

describe('MonthFoundation 键盘活动日', () => {
    it('getMonthSwitch 按活动日跨过的月数给出面板切换方式，同月或其他月数不切换', () => {
        const june = new Date(2021, 5, 15);
        expect(MonthFoundation.getMonthSwitch(new Date(2021, 4, 31), june)).toBe('prevMonth');
        expect(MonthFoundation.getMonthSwitch(new Date(2021, 6, 1), june)).toBe('nextMonth');
        expect(MonthFoundation.getMonthSwitch(new Date(2020, 5, 15), june)).toBe('prevYear');
        expect(MonthFoundation.getMonthSwitch(new Date(2022, 5, 15), june)).toBe('nextYear');
        expect(MonthFoundation.getMonthSwitch(new Date(2021, 5, 1), june)).toBeUndefined();
        expect(MonthFoundation.getMonthSwitch(new Date(2021, 7, 1), june)).toBeUndefined();
    });

    it('getDefaultActiveDate 取第一个落在本月的候选，键盘移到的日期放在最前', () => {
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['2021-06-20', '2021-06-08 10:00:00'])).toBe('2021-06-20');
        // a keyboard date left over from another month is skipped
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['2021-05-31', '', '2021-06-08 10:00:00'])).toBe('2021-06-08');
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['', undefined])).toBe('2021-06-01');
    });
});
