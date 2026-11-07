import { describe, expect, it } from 'vite-plus/test';
import { zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import { isAfter, isBefore, isBetween, isSameDay } from '../_utils';
import getInsetInputFormatToken from '../_utils/get-inset-input-format-token';
import getMonthTable, { formatFullDate } from '../_utils/get-month-table';
import getYearMonthFromValue from '../_utils/get-year-month-from-value';
import { isRangeValueComplete, isSplitRangeInputs, isYearOrMonthType, needConfirm } from '../_utils/picker-type';
import toCallbackArgs from '../_utils/to-callback-args';

describe('picker-type', () => {
    it('isRangeValueComplete 只认空数组或两个有效日期', () => {
        const d = new Date(2021, 5, 1);
        expect(isRangeValueComplete([])).toBe(true);
        expect(isRangeValueComplete([d, d])).toBe(true);
        expect(isRangeValueComplete([d])).toBe(false);
        expect(isRangeValueComplete([d, null])).toBe(false);
        expect(isRangeValueComplete([d, new Date(NaN)])).toBe(false);
    });

    it('needConfirm 只对带时间的类型生效；monthRange 不拆分输入框', () => {
        expect(needConfirm({ type: 'dateTimeRange', needConfirm: true })).toBe(true);
        expect(needConfirm({ type: 'date', needConfirm: true })).toBe(false);
        expect(isSplitRangeInputs('dateRange')).toBe(true);
        expect(isSplitRangeInputs('monthRange')).toBe(false);
        expect(isYearOrMonthType('monthRange')).toBe(true);
        expect(isYearOrMonthType('dateRange')).toBe(false);
    });
});

describe('getYearMonthFromValue', () => {
    it('只有 monthRange 取右侧，缺少日期时为 0', () => {
        const value = [new Date(2021, 5, 1), new Date(2022, 0, 1)];
        expect(getYearMonthFromValue(value, 'monthRange')).toEqual({ year: { left: 2021, right: 2022 }, month: { left: 6, right: 1 } });
        expect(getYearMonthFromValue(value, 'month')).toEqual({ year: { left: 2021, right: 0 }, month: { left: 6, right: 0 } });
        expect(getYearMonthFromValue([], 'monthRange')).toEqual({ year: { left: 0, right: 0 }, month: { left: 0, right: 0 } });
    });
});

describe('getMonthTable', () => {
    it('二月按周一起始输出补位占位与完整周', () => {
        const { monthText, weeks } = getMonthTable(new Date(2024, 1, 10), 1);
        expect(monthText).toBe('2024-02');
        expect(weeks).toHaveLength(5);
        expect(weeks[0].slice(0, 3)).toEqual([
            { dayNumber: '', dateNumberFull: '', fullDate: '' },
            { dayNumber: '', dateNumberFull: '', fullDate: '' },
            { dayNumber: '', dateNumberFull: '', fullDate: '' },
        ]);
        expect(weeks[0][3]).toEqual({ dayNumber: 1, dayNumberFull: '01', fullDate: '2024-02-01' });
        expect(weeks[4]).toEqual([
            { dayNumber: 26, dayNumberFull: '26', fullDate: '2024-02-26' },
            { dayNumber: 27, dayNumberFull: '27', fullDate: '2024-02-27' },
            { dayNumber: 28, dayNumberFull: '28', fullDate: '2024-02-28' },
            { dayNumber: 29, dayNumberFull: '29', fullDate: '2024-02-29' },
        ]);
    });

    it('周日起始且一号恰为周日时没有占位，末周恰满七天', () => {
        const { weeks } = getMonthTable(new Date(2015, 1, 1), 0);
        expect(weeks).toHaveLength(4);
        expect(weeks[0][0].fullDate).toBe('2015-02-01');
        expect(weeks.at(-1)).toHaveLength(7);
        expect(weeks.at(-1)?.at(-1)?.fullDate).toBe('2015-02-28');
    });

    it('十二月的最后一天结尾、周数与天数总和正确', () => {
        const { weeks } = getMonthTable(new Date(2025, 11, 1), 3);
        const days = weeks.flat().filter((d) => d.fullDate !== '');
        expect(days).toHaveLength(31);
        expect(days.at(-1)?.fullDate).toBe('2025-12-31');
        expect(weeks.every((w) => w.length <= 7)).toBe(true);
    });
});

describe('getInsetInputFormatToken', () => {
    it('12 小时制的时间段换成 24 小时制，内嵌时间框不丢上下午', () => {
        expect(getInsetInputFormatToken({ type: 'dateTime', format: 'yyyy-MM-dd hh:mm a' })).toBe('yyyy-MM-dd HH:mm');
        expect(getInsetInputFormatToken({ type: 'dateTimeRange', format: 'yyyy-MM-dd h:mm:ss a' })).toBe('yyyy-MM-dd HH:mm:ss');
        expect(getInsetInputFormatToken({ type: 'dateTime', format: 'yyyy-MM-dd HH:mm' })).toBe('yyyy-MM-dd HH:mm');
    });
});

describe('toCallbackArgs', () => {
    const june1 = new Date(2021, 5, 1, 8);
    const june15 = new Date(2021, 5, 15, 20);

    it('单选交出单个 Date 与字符串，空值交出 undefined', () => {
        expect(toCallbackArgs([june1], { type: 'date' })).toEqual({ notifyDate: june1, notifyValue: '2021-06-01' });
        expect(toCallbackArgs([], { type: 'date' })).toEqual({ notifyDate: undefined, notifyValue: undefined });
    });

    it('date 多选交出数组，其他类型忽略 multiple', () => {
        expect(toCallbackArgs([june1, june15], { type: 'date', multiple: true })).toEqual({
            notifyDate: [june1, june15],
            notifyValue: ['2021-06-01', '2021-06-15'],
        });
        expect(toCallbackArgs([june1], { type: 'dateTime', multiple: true })).toEqual({
            notifyDate: june1,
            notifyValue: '2021-06-01 08:00:00',
        });
    });

    it('范围类型含 monthRange 交出数组，按 format 格式化', () => {
        expect(toCallbackArgs([june1, june15], { type: 'monthRange' })).toEqual({
            notifyDate: [june1, june15],
            notifyValue: ['2021-06', '2021-06'],
        });
        expect(toCallbackArgs([june1, june15], { type: 'dateRange', format: 'MM/dd' })).toEqual({
            notifyDate: [june1, june15],
            notifyValue: ['06/01', '06/15'],
        });
    });

    it('有 timeZone 时把电脑时区的墙上时间换成该时区的时刻', () => {
        const { notifyDate } = toCallbackArgs(june1, { type: 'date', timeZone: 'Asia/Tokyo' });
        expect(notifyDate).toEqual(zonedTimeToUtc(june1, 'Asia/Tokyo'));
    });
});

describe('formatFullDate', () => {
    it('数字月日补零，字符串原样保留', () => {
        expect(formatFullDate(2024, 3, 5)).toBe('2024-03-05');
        expect(formatFullDate(2024, 12, 31)).toBe('2024-12-31');
        expect(formatFullDate('2024', '03', '05')).toBe('2024-03-05');
    });
});

describe('日期比较工具', () => {
    it('isBetween 不含端点，端点相等或起止颠倒时为 false', () => {
        const s = new Date(2024, 0, 1);
        const m = new Date(2024, 0, 2);
        const e = new Date(2024, 0, 3);
        expect(isBetween(m, { start: s, end: e })).toBe(true);
        expect(isBetween(s, { start: s, end: e })).toBe(false);
        expect(isBetween(e, { start: s, end: e })).toBe(false);
        expect(isBetween(m, { start: e, end: s })).toBe(false);
        expect(isBetween(m, { start: m, end: m })).toBe(false);
    });

    it('isBetween 接受 ISO 字符串，无效输入为 false', () => {
        expect(isBetween('2024-01-02', { start: '2024-01-01', end: '2024-01-03' })).toBe(true);
        expect(isBetween('2024-01-01', { start: '2024-01-01', end: '2024-01-03' })).toBe(false);
        expect(isBetween('2024-01-02', { start: '2024-01-01', end: 'bad' })).toBe(false);
        expect(isBetween(null, { start: '2024-01-01', end: '2024-01-03' })).toBe(false);
    });

    it('isAfter、isBefore、isSameDay 支持字符串与 Date', () => {
        expect(isAfter('2024-01-02', new Date(2024, 0, 1))).toBe(true);
        expect(isBefore(new Date(2024, 0, 1), '2024-01-02')).toBe(true);
        expect(isSameDay('2024-01-02T01:00:00', new Date(2024, 0, 2, 23))).toBe(true);
    });
});
