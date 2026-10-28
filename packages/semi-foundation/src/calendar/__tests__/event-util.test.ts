import { describe, expect, it, vi } from 'vite-plus/test';
import { amendEvent, filterEvents, parseEvent, parseRangeAllDayEvent } from '../event-util';

describe('calendar eventUtil', () => {
    it('filterEvents 对范围开始前的日期去掉已结束的事件', () => {
        const start = new Date(2019, 7, 10);
        const end = new Date(2019, 7, 17);
        const ended = { key: 'ended', start: new Date(2019, 7, 5, 9), end: new Date(2019, 7, 5, 10) };
        const ongoing = { key: 'ongoing', start: new Date(2019, 7, 5, 9), end: new Date(2019, 7, 12) };
        const events = new Map([[new Date(2019, 7, 5).toString(), [ended, ongoing]]]);
        expect(filterEvents(events, start, end).get(start.toString())).toEqual([ongoing]);
    });

    it('parseEvent 补全或交换 start 与 end 时不修改调用方的事件', () => {
        const noEnd = { key: 'a', start: new Date(2019, 7, 8, 10) };
        const reversed = { key: 'b', start: new Date(2019, 7, 8, 12), end: new Date(2019, 7, 8, 9) };
        const before = [{ ...noEnd }, { ...reversed }];
        parseEvent(noEnd);
        parseEvent(reversed);
        expect([noEnd, reversed]).toEqual(before);
    });

    it('同一起点的大量全天事件按输入顺序排布', () => {
        const day = new Date(2019, 7, 12);
        const events = Array.from({ length: 100 }, (_, i) => ({ key: `e${i}`, start: day, date: day }));
        const parsed = parseRangeAllDayEvent([...events], day, new Date(2019, 7, 10), new Date(2019, 7, 17), [[]]);
        expect(parsed.map((row) => row[2].key)).toEqual(events.map((e) => e.key));
    });

    it('amendEvent 将缺失的 end 补为 start + 1h', () => {
        const amended = amendEvent({ key: 'a', start: new Date(2019, 7, 8, 10) });
        expect(amended.end).toEqual(new Date(2019, 7, 8, 11));
    });

    it('跳过 start 与 end 都缺失的事件，而不是抛错', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(parseEvent({ key: 'a' })).toEqual([]);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
