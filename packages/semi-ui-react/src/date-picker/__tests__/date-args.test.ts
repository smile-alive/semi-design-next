import { describe, expect, it } from 'vite-plus/test';
import getDefaultPickerDate from '@fibrae/semi-foundation/date-picker/_utils/get-default-picker-date';
import isBetween from '@fibrae/semi-foundation/date-picker/_utils/is-between';
import isSameDay from '@fibrae/semi-foundation/date-picker/_utils/is-same-day';
import { compatibleParse } from '@fibrae/semi-foundation/date-picker/_utils/parser';

// date-fns 4 reads null as 1970-01-01; these cases keep it invalid and stringify non-string tokens and values
describe('DatePicker 日期参数', () => {
    it('token 不是字符串时回退为 ISO 解析', () => {
        const map = { date: 'yyyy-MM-dd', dateTime: 'yyyy-MM-dd HH:mm:ss' } as unknown as string;
        expect(compatibleParse('2024-03-05', map)).toEqual(new Date(2024, 2, 5));
        expect(compatibleParse('2024-03-05 10:20:30', map)).toEqual(new Date(2024, 2, 5, 10, 20, 30));
    });

    it('非字符串值仅通过 Date.parse 解析', () => {
        expect(compatibleParse(['2024-03-05'] as unknown as string)?.getTime()).toBe(Date.parse('2024-03-05'));
    });

    it('空的范围结束值视为非法，1970 年之前同样如此', () => {
        expect(isBetween(new Date(1965, 0, 5), { start: new Date(1960, 0, 1), end: null })).toBe(false);
        expect(isSameDay(null, new Date(1970, 0, 1))).toBe(false);
    });

    it('无法解析的默认 picker 值保持非法状态', () => {
        const { nowDate, nextDate } = getDefaultPickerDate({
            defaultPickerValue: 'not a date',
            format: 'yyyy-MM-dd',
        } as unknown as Parameters<typeof getDefaultPickerDate>[0]);
        expect(nowDate).toBeNull();
        expect(Number.isNaN(nextDate.getTime())).toBe(true);
    });
});
