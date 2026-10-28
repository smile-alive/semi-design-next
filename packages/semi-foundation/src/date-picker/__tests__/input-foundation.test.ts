import { describe, expect, it, vi } from 'vite-plus/test';
import type { Locale } from '../../locale/interface';
import DateInputFoundation, { type DateInputAdapter } from '../input-foundation';

describe('DateInputFoundation', () => {
    it('getShowText 优先用正在输入的文本，否则格式化 value', () => {
        const props = { type: 'dateRange' as const, rangeSeparator: ' ~ ' };
        expect(DateInputFoundation.getShowText({ ...props, inputValue: '2021-', value: [new Date(2021, 5, 1)] })).toBe('2021-');
        expect(DateInputFoundation.getShowText({ ...props, value: [new Date(2021, 5, 1), new Date(2021, 5, 2)] })).toBe('2021-06-01 ~ 2021-06-02');
        expect(DateInputFoundation.getShowText({ ...props, value: [] })).toBe('');
    });

    it('getRangeClearVisible 有文本且可清除时显示，禁用时只有 showClearIgnoreDisabled 才显示', () => {
        expect(DateInputFoundation.getRangeClearVisible({ start: '', end: 'x', showClear: true })).toBe(true);
        expect(DateInputFoundation.getRangeClearVisible({ start: '', end: '', showClear: true })).toBe(false);
        expect(DateInputFoundation.getRangeClearVisible({ start: 'x', end: '', showClear: true, disabled: true })).toBe(false);
        expect(DateInputFoundation.getRangeClearVisible({ start: 'x', end: '', showClear: true, disabled: true, showClearIgnoreDisabled: true })).toBe(true);
    });

    it('getInsetNames 范围类型的时间框名称带上日期名', () => {
        const locale = { placeholder: { dateTimeRange: ['开始日期', '结束日期'] }, chooseDate: '选择日期', selectTime: '选择时间' } as unknown as Locale['DatePicker'];
        expect(DateInputFoundation.getInsetNames(locale, 'dateTimeRange')).toEqual({ start: '开始日期', end: '结束日期', startTime: '开始日期 选择时间', endTime: '结束日期 选择时间' });
        expect(DateInputFoundation.getInsetNames(locale, 'dateTime')).toEqual({ start: '选择日期', end: '选择日期', startTime: '选择时间', endTime: '选择时间' });
    });

    it('范围清除按钮：主键按下与键盘触发的 click 清除，其他按键只阻止默认行为', () => {
        const adapter = { notifyRangeInputClear: vi.fn<DateInputAdapter['notifyRangeInputClear']>() } as unknown as DateInputAdapter;
        const foundation = new DateInputFoundation(adapter);
        const event = (init: Partial<MouseEvent>) => ({ stopPropagation: vi.fn<() => void>(), preventDefault: vi.fn<() => void>(), button: 0, detail: 1, ...init });

        foundation.handleRangeInputClearClick(event({ detail: 1 }));
        expect(adapter.notifyRangeInputClear).not.toHaveBeenCalled();
        foundation.handleRangeInputClearClick(event({ detail: 0 }));
        expect(adapter.notifyRangeInputClear).toHaveBeenCalledTimes(1);

        const secondary = event({ button: 2 });
        foundation.handleRangeInputClearMouseDown(secondary);
        expect(secondary.preventDefault).toHaveBeenCalled();
        expect(adapter.notifyRangeInputClear).toHaveBeenCalledTimes(1);
        foundation.handleRangeInputClearMouseDown(event({ button: 0 }));
        expect(adapter.notifyRangeInputClear).toHaveBeenCalledTimes(2);
    });
});
