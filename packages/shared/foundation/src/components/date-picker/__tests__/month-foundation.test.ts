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
    it('getKeyAction 按活动日跨过的月数给出面板切换方式，同月或其他月数不切换', () => {
        const options = { month: new Date(2021, 5, 15), weekStartsOn: 0 as const };
        const switchOf = (key: string, activeDate: string, shiftKey = false) => (MonthFoundation.getKeyAction({ key, shiftKey }, { ...options, activeDate }) as { monthSwitch?: string }).monthSwitch;
        expect(switchOf('ArrowLeft', '2021-06-01')).toBe('prevMonth');
        expect(switchOf('ArrowRight', '2021-06-30')).toBe('nextMonth');
        expect(switchOf('PageUp', '2021-06-15', true)).toBe('prevYear');
        expect(switchOf('PageDown', '2021-06-15', true)).toBe('nextYear');
        expect(switchOf('ArrowRight', '2021-06-10')).toBeUndefined();
        expect(switchOf('ArrowDown', '2021-06-10')).toBeUndefined();
    });

    it('getKeyAction 的 Enter 与空格为选中，其余键无动作', () => {
        const options = { activeDate: '2021-06-15', month: new Date(2021, 5, 1), weekStartsOn: 0 as const };
        expect(MonthFoundation.getKeyAction({ key: 'Enter', shiftKey: false }, options)).toEqual({ type: 'select' });
        expect(MonthFoundation.getKeyAction({ key: ' ', shiftKey: false }, options)).toEqual({ type: 'select' });
        expect(MonthFoundation.getKeyAction({ key: 'a', shiftKey: false }, options)).toBeNull();
    });

    it('getDefaultActiveDate 取第一个落在本月的候选，键盘移到的日期放在最前', () => {
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['2021-06-20', '2021-06-08 10:00:00'])).toBe('2021-06-20');
        // a keyboard date left over from another month is skipped
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['2021-05-31', '', '2021-06-08 10:00:00'])).toBe('2021-06-08');
        expect(MonthFoundation.getDefaultActiveDate('2021-06', ['', undefined])).toBe('2021-06-01');
    });
});
