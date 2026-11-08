import { describe, expect, it, vi } from 'vite-plus/test';
import { formatOption } from '../combox-foundation';
import { hourIsDisabled, minuteIsDisabled, secondIsDisabled, transformToArray } from '../utils';

describe('timePicker utils', () => {
    it('hourIsDisabled 按数值比较禁用的小时', () => {
        expect(hourIsDisabled(() => [1, 5], 5)).toBe(true);
        expect(hourIsDisabled(() => [1, 5], 6)).toBe(false);
        expect(hourIsDisabled(undefined, 5)).toBe(false);
        expect(hourIsDisabled(() => undefined, 5)).toBe(false);
    });

    it('hour 为空时仍调用禁用函数，结果为未禁用', () => {
        const disabledHours = vi.fn<() => number[]>(() => [0]);
        expect(hourIsDisabled(disabledHours, null)).toBe(false);
        expect(disabledHours).toHaveBeenCalledTimes(1);
    });

    it('minuteIsDisabled 以小时调用禁用函数，hour 或 minute 为空时未禁用', () => {
        const disabledMinutes = vi.fn<(hour: number) => number[]>((hour) => (hour === 10 ? [30] : []));
        expect(minuteIsDisabled(disabledMinutes, 10, 30)).toBe(true);
        expect(minuteIsDisabled(disabledMinutes, 11, 30)).toBe(false);
        expect(minuteIsDisabled(disabledMinutes, null, 30)).toBe(false);
        expect(minuteIsDisabled(disabledMinutes, 10, null)).toBe(false);
        expect(disabledMinutes.mock.calls).toEqual([[10], [11], [null], [10]]);
        expect(minuteIsDisabled(undefined, 10, 30)).toBe(false);
    });

    it('secondIsDisabled 以小时和分钟调用禁用函数，任一为空时未禁用', () => {
        const disabledSeconds = vi.fn<(hour: number, minute: number) => number[]>((hour, minute) => (hour === 10 && minute === 30 ? [15] : []));
        expect(secondIsDisabled(disabledSeconds, 10, 30, 15)).toBe(true);
        expect(secondIsDisabled(disabledSeconds, 10, 31, 15)).toBe(false);
        expect(secondIsDisabled(disabledSeconds, null, 30, 15)).toBe(false);
        expect(secondIsDisabled(disabledSeconds, 10, null, 15)).toBe(false);
        expect(secondIsDisabled(disabledSeconds, 10, 30, null)).toBe(false);
        expect(disabledSeconds).toHaveBeenCalledTimes(5);
        expect(secondIsDisabled(undefined, 10, 30, 15)).toBe(false);
    });

    it('transformToArray 复制数组，非数组得到空数组', () => {
        const source = [1, 2];
        const copy = transformToArray(source);
        expect(copy).toEqual([1, 2]);
        expect(copy).not.toBe(source);
        expect(transformToArray(undefined)).toEqual([]);
    });

    it('formatOption 补零到两位并标记禁用项', () => {
        expect(formatOption(0, [])).toEqual({ value: '00', disabled: false });
        expect(formatOption(9, [9])).toEqual({ value: '09', disabled: true });
        expect(formatOption(12, [9])).toEqual({ value: '12', disabled: false });
        expect(formatOption(59, undefined)).toEqual({ value: '59', disabled: false });
    });
});
