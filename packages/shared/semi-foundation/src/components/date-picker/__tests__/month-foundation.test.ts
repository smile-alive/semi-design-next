import { describe, expect, it, vi } from 'vite-plus/test';
import { cssClasses } from '../constants';
import MonthFoundation, { type MonthAdapter, type MonthFoundationProps } from '../month-foundation';

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

    it('getActiveDate 依次取键盘移到的日期、选中值、范围两端与今天中第一个落在本月的', () => {
        const month = new Date(2021, 5, 1);
        const none = { selected: new Set<string>(), rangeStart: '', rangeEnd: '' };
        expect(MonthFoundation.getActiveDate({ ...none, month, selected: new Set(['2021-06-20']), rangeStart: '2021-06-08 10:00:00' }, { keyboardDate: '' }, '')).toBe('2021-06-20');
        // a keyboard date left over from another month is skipped
        expect(MonthFoundation.getActiveDate({ ...none, month, rangeEnd: '2021-06-08 10:00:00' }, { keyboardDate: '2021-05-31' }, '2021-06-15')).toBe('2021-06-08');
        expect(MonthFoundation.getActiveDate({ ...none, month }, { keyboardDate: '' }, '')).toBe('2021-06-01');
    });

    const createFoundation = (props: Partial<MonthFoundationProps>, direction?: 'rtl') => {
        let state = MonthFoundation.getInitialState();
        const allProps = { month: new Date(2021, 5, 1), weekStartsOn: 0, selected: new Set<string>(), rangeStart: '', rangeEnd: '', ...props } as MonthFoundationProps;
        const adapter = {
            getProp: (key) => allProps[key],
            getProps: () => allProps,
            getState: (key) => state[key],
            getStates: () => state,
            setState: (partial) => {
                state = { ...state, ...partial };
            },
            getContext: () => direction,
            notifyDayClick: vi.fn<MonthAdapter['notifyDayClick']>(),
            notifyMonthSwitch: vi.fn<MonthAdapter['notifyMonthSwitch']>(),
        } as unknown as MonthAdapter;
        const foundation = new MonthFoundation(adapter);
        const press = (key: string) => {
            const event = { key, shiftKey: false, preventDefault: vi.fn<() => void>() };
            foundation.handleKeyDown(event, '');
            return event;
        };
        return { foundation, adapter, press, activeDate: () => MonthFoundation.getActiveDate(allProps, state, '') };
    };

    it('handleKeyDown 移动活动日，越过月边界时通知面板切换，Enter 选中活动日', () => {
        const { foundation, adapter, press, activeDate } = createFoundation({});
        expect(press('ArrowDown').preventDefault).toHaveBeenCalled();
        expect(activeDate()).toBe('2021-06-08');
        press('ArrowUp');
        press('ArrowLeft');
        expect(adapter.notifyMonthSwitch).toHaveBeenCalledWith('prevMonth');
        expect(press('a').preventDefault).not.toHaveBeenCalled();
        const before = activeDate();
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
            const event = { key: 'ArrowLeft', shiftKey: false, [modifier]: true, preventDefault: vi.fn<() => void>() };
            foundation.handleKeyDown(event, '');
            expect(event.preventDefault).not.toHaveBeenCalled();
        }
        expect(activeDate()).toBe(before);

        const next = createFoundation({});
        next.press('ArrowRight');
        next.press('Enter');
        expect(next.adapter.notifyDayClick).toHaveBeenCalledWith(expect.objectContaining({ fullDate: '2021-06-02' }));
    });

    it('RTL 下左右方向键反向；选中被禁用的日期不通知也不移动活动日', () => {
        const rtl = createFoundation({}, 'rtl');
        rtl.press('ArrowLeft');
        expect(rtl.activeDate()).toBe('2021-06-02');

        const disabled = createFoundation({ disabledDate: (day) => day.getDate() === 3 });
        disabled.foundation.selectDay({ dayNumber: 3, fullDate: '2021-06-03' });
        expect(disabled.adapter.notifyDayClick).not.toHaveBeenCalled();
        expect(disabled.activeDate()).toBe('2021-06-01');
        disabled.foundation.selectDay({ dayNumber: 4, fullDate: '2021-06-04' });
        expect(disabled.activeDate()).toBe('2021-06-04');
    });
});
