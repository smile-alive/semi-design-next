import { zhCN } from 'date-fns/locale';
import { describe, expect, it, vi } from 'vite-plus/test';
import CalendarFoundation from '../foundation';

const { formatCbValue, getParseDailyEvents, getParsedRangeEvents, parseRangeAllDayEvents, getWeekRange, getParseMonthlyEvents, getRangeData, getMonthlyData } = CalendarFoundation;

const day = new Date(2019, 7, 8);
const weekStart = new Date(2019, 7, 4);
const ev = (key, start, end?, extra = {}) => ({ key, start, end, children: key, ...extra });
const round = (value) => Math.round(value * 1000) / 1000;
const layout = (events) => events.map(({ children, leftPos, width, topInd }) => [children, round(leftPos), round(width), topInd]);

describe('CalendarFoundation 静态布局', () => {
    it('formatCbValue 由日期与可选时间构建本地日期', () => {
        expect(formatCbValue([new Date(2019, 7, 8, 15, 20), 9, 30, 0])).toEqual(new Date(2019, 7, 8, 9, 30, 0));
        expect(formatCbValue([new Date(2019, 7, 8, 15, 20)])).toEqual(day);
    });

    it('getParseDailyEvents 定位定时事件，并错开同一时段的事件', () => {
        const events = [
            ev('a', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 12)),
            ev('b', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 12)),
            ev('c', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 12)),
            ev('all', new Date(2019, 7, 8), undefined, { allDay: true }),
            ev('tomorrow', new Date(2019, 7, 9, 6), new Date(2019, 7, 9, 12)),
        ];
        const parsed = getParseDailyEvents(events, day);
        expect(parsed.day.map(({ children, startPos, endPos, left }) => [children, startPos, endPos, left])).toEqual([
            ['a', 0.25, 0.5, 0],
            ['b', 0.25, 0.5, `${(1 / 3) * 100}%`],
            ['c', 0.25, 0.5, `${(2 / 3) * 100}%`],
        ]);
        expect(parsed.allDay.map((item) => item.children)).toEqual(['all']);
    });

    describe('结束于 0 点的定时事件只属于开始当天', () => {
        const nextDay = new Date(2019, 7, 9);
        const toMidnight = ev('late', new Date(2019, 7, 8, 22), nextDay);
        const wholeDay = ev('whole', day, nextDay);

        it('日视图：次日没有多余的事件，当天事件延伸到底部', () => {
            expect(getParseDailyEvents([toMidnight, wholeDay], nextDay)).toEqual({ allDay: [], day: [] });
            const parsed = getParseDailyEvents([toMidnight, wholeDay], day);
            expect(parsed.allDay).toEqual([]);
            expect(parsed.day.map(({ children, startPos, endPos }) => [children, startPos, endPos])).toEqual([
                ['late', round(22 / 24), 1],
                ['whole', 0, 1],
            ]);
        });

        it('周视图：次日没有定时事件，全天行没有横条', () => {
            const parsed = getParsedRangeEvents([toMidnight, wholeDay]);
            expect([...parsed.day.keys()]).toEqual([day.toString()]);
            expect(parseRangeAllDayEvents(parsed.allDay, getWeekRange(day, 0))).toEqual([]);
        });

        it('月视图：不再多占结束 0 点所在的那一天', () => {
            const monthly = ev('m', new Date(2019, 7, 6, 10), new Date(2019, 7, 8));
            expect(layout(getParseMonthlyEvents([monthly], day, 0)[1].display)).toEqual([['m', 0.286, 0.286, 0]]);
        });
    });

    it('getParseDailyEvents 的 left 按各时段分组内的序号计算，不随分组交错而变', () => {
        const events = [
            ev('a1', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 8)),
            ev('b1', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10)),
            ev('a2', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 8)),
            ev('b2', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10)),
            ev('b3', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10)),
        ];
        const { day: laid } = getParseDailyEvents(events, day);
        expect(laid.map(({ children, left }) => [children, left])).toEqual([
            ['a1', 0],
            ['b1', 0],
            ['a2', '50%'],
            ['b2', `${(1 / 3) * 100}%`],
            ['b3', `${(2 / 3) * 100}%`],
        ]);
    });

    it('getParseDailyEvents 的日内事件带 key', () => {
        const { day: laid } = getParseDailyEvents([ev('k', new Date(2019, 7, 8, 6), new Date(2019, 7, 8, 8))], day);
        expect(laid.map((item) => item.key)).toEqual(['k']);
    });

    it('getWeekRange 从 weekStartsOn 指定的周首日开始，到下一周首日结束', () => {
        expect(getWeekRange(day, 0)).toEqual([weekStart, new Date(2019, 7, 11, 23, 59, 59, 999)]);
        expect(getWeekRange(day, 1)).toEqual([new Date(2019, 7, 5), new Date(2019, 7, 12, 23, 59, 59, 999)]);
    });

    it('周视图的月份标签取显示日期所在月份，范围视图取范围首日所在月份', () => {
        const sunday = new Date(2019, 8, 1);
        const range = getWeekRange(sunday, 1);
        expect(range[0]).toEqual(new Date(2019, 7, 26));
        expect(getRangeData(range, zhCN, 1).month).toBe('8月');
        expect(getRangeData(range, zhCN, 1, undefined, sunday).month).toBe('9月');
        expect(getRangeData(range, zhCN, 1).week.map((item) => item.dayString)).toEqual(['26', '27', '28', '29', '30', '31', '1']);
    });

    it('parseRangeAllDayEvents 将周范围内的全天跨度按行排布', () => {
        const events = [ev('span', new Date(2019, 7, 6), new Date(2019, 7, 8), { allDay: true }), ev('overlap', new Date(2019, 7, 7), new Date(2019, 7, 7), { allDay: true }), ev('saturday', new Date(2019, 7, 10), new Date(2019, 7, 12), { allDay: true })];
        const { allDay } = getParsedRangeEvents(events);
        expect(layout(parseRangeAllDayEvents(allDay, getWeekRange(day, 0)))).toEqual([
            ['span', 0.286, 0.429, 0],
            ['saturday', 0.857, 0.143, 0],
            ['overlap', 0.429, 0.143, 1],
        ]);
    });

    it('getParseMonthlyEvents 将跨度拆分到所经过的周行中，且不改变输入顺序', () => {
        const events = [ev('cross', new Date(2019, 7, 10), new Date(2019, 7, 12), { allDay: true }), ev('early', new Date(2019, 7, 1, 9))];
        const parsed = getParseMonthlyEvents(events, day, 0);
        expect(Object.keys(parsed)).toEqual(['0', '1', '2']);
        expect(layout(parsed[0].display)).toEqual([['early', 0.571, 0.143, 0]]);
        expect(layout(parsed[1].display)).toEqual([['cross', 0.857, 0.143, 0]]);
        expect(layout(parsed[2].display)).toEqual([['cross', 0, 0.286, 0]]);
        expect(parsed[1].day[6].map((item) => item.children)).toEqual(['cross']);
        expect(events.map((item) => item.key)).toEqual(['cross', 'early']);
    });

    describe('缺失或颠倒的 start 与 end', () => {
        const weekEnd = new Date(2019, 7, 11);
        const views = {
            月视图: (events: ReturnType<typeof ev>[]) => Object.values(getParseMonthlyEvents(events, day, 0)).flatMap((week) => week.display.map((item) => item.children)),
            周视图: (events: ReturnType<typeof ev>[]) => {
                const parsed = getParsedRangeEvents(events);
                return [...parseRangeAllDayEvents(parsed.allDay, getWeekRange(day, 0)).map((item) => item.children), ...[...parsed.day.values()].flat().map((item) => item.children)];
            },
            范围视图: (events: ReturnType<typeof ev>[]) => {
                const parsed = getParsedRangeEvents(events);
                return [...parseRangeAllDayEvents(parsed.allDay, [weekStart, weekEnd]).map((item) => item.children), ...[...parsed.day.values()].flat().map((item) => item.children)];
            },
        };

        it.each(Object.entries(views))('%s：起止颠倒超过 1 天的全天事件不抛错，落在交换后的日期上', (_name, view) => {
            const reversed = ev('rev', new Date(2019, 7, 9), new Date(2019, 7, 7), { allDay: true });
            expect(view([reversed])).toEqual(['rev']);
        });

        it('日视图：起止颠倒的全天事件显示在交换后的每一天', () => {
            const reversed = ev('rev', new Date(2019, 7, 9), new Date(2019, 7, 7), { allDay: true });
            for (const date of [new Date(2019, 7, 7), new Date(2019, 7, 8), new Date(2019, 7, 9)]) {
                expect(getParseDailyEvents([reversed], date).allDay.map((item) => item.children)).toEqual(['rev']);
            }
        });

        it('月视图：起止颠倒的全天事件按交换后的日期占位', () => {
            const reversed = ev('rev', new Date(2019, 7, 9), new Date(2019, 7, 7), { allDay: true });
            expect(layout(getParseMonthlyEvents([reversed], day, 0)[1].display)).toEqual([['rev', 0.429, 0.429, 0]]);
        });

        it('月视图：起止颠倒的跨天定时事件落在交换后的日期上', () => {
            const reversed = ev('rev', new Date(2019, 7, 10, 10), new Date(2019, 7, 8, 9));
            expect(layout(getParseMonthlyEvents([reversed], day, 0)[1].display)).toEqual([['rev', 0.571, 0.429, 0]]);
            const nextDay = ev('next', new Date(2019, 7, 9, 10), new Date(2019, 7, 8, 9));
            expect(views.月视图([nextDay])).toEqual(['next']);
        });

        it.each(Object.entries(views))('%s：只有 end 的定时与全天事件都显示', (_name, view) => {
            const timed = ev('endTimed', undefined, new Date(2019, 7, 8, 10));
            const allDay = ev('endAll', undefined, new Date(2019, 7, 6), { allDay: true });
            expect(view([timed])).toEqual(['endTimed']);
            expect(view([allDay])).toEqual(['endAll']);
        });

        it('日视图：只有 end 的全天事件显示在 end 当天', () => {
            const allDay = ev('endAll', undefined, new Date(2019, 7, 6), { allDay: true });
            const date = new Date(2019, 7, 6);
            expect(getParseDailyEvents([allDay], date).allDay.map((item) => item.children)).toEqual(['endAll']);
        });

        it.each(Object.entries(views))('%s：start 与 end 都缺失的事件被跳过并给出警告', (_name, view) => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            expect(view([ev('none', undefined), ev('noneAll', undefined, undefined, { allDay: true })])).toEqual([]);
            expect(warn).toHaveBeenCalledTimes(2);
            warn.mockRestore();
        });

        it('日视图：start 与 end 都缺失的全天事件被跳过并给出警告', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const parsed = getParseDailyEvents([ev('noneAll', undefined, undefined, { allDay: true })], day);
            expect(parsed.allDay).toEqual([]);
            expect(warn).toHaveBeenCalledTimes(1);
            warn.mockRestore();
        });

        it('周视图：跨天全天事件只排出一条横条', () => {
            const span = ev('span', new Date(2019, 7, 5), new Date(2019, 7, 7), { allDay: true });
            const { allDay } = getParsedRangeEvents([span]);
            expect(layout(parseRangeAllDayEvents(allDay, getWeekRange(day, 0)))).toEqual([['span', 0.143, 0.429, 0]]);
        });
    });

    it('collectDailyEvents 按行号写入稀疏数组', () => {
        const a = ev('a', new Date(2019, 7, 5), undefined, { allDay: true });
        const b = ev('b', new Date(2019, 7, 5), new Date(2019, 7, 7), { allDay: true });
        const parsed = getParseMonthlyEvents([a, b], day, 0)[1];
        expect(parsed.day[2].length).toBe(2);
        expect(0 in parsed.day[2]).toBe(false);
        expect(parsed.day[2][1].children).toBe('b');
    });

    it('getRangeData 与 getMonthlyData 列出范围及月视图网格中的日期', () => {
        const { month, week } = getRangeData([new Date(2019, 7, 6, 9), new Date(2019, 7, 9)], zhCN, 0);
        expect(month).toBe('8月');
        expect(week.map((item) => item.dayString)).toEqual(['6', '7', '8']);
        expect(week.map((item) => item.isToday)).toEqual([false, false, true]);

        const monthly = getMonthlyData(day, zhCN, 1);
        expect(Object.keys(monthly)).toHaveLength(5);
        expect(monthly[0][0].date).toEqual(new Date(2019, 6, 29));
        expect(monthly[0][0].isSameMonth).toBe(false);
    });

    it('getItemLimit 按单元格高度折算可显示的事件行数', () => {
        expect(CalendarFoundation.getItemLimit(40)).toBe(0);
        expect(CalendarFoundation.getItemLimit(60)).toBe(0);
        expect(CalendarFoundation.getItemLimit(61)).toBe(1);
        expect(CalendarFoundation.getItemLimit(132)).toBe(3);
    });

    it('countHidden 只统计超出上限的非空行', () => {
        const dayEvents = [{ key: 'a' }, undefined, { key: 'c' }, undefined, { key: 'e' }] as any[];
        expect(CalendarFoundation.countHidden(dayEvents, 2)).toBe(2);
        expect(CalendarFoundation.countHidden(dayEvents, 5)).toBe(0);
        expect(CalendarFoundation.countHidden(undefined, 0)).toBe(0);
    });

    it('isOpenCardStale 在已展开的单元格不再折叠时为真', () => {
        const monthly = getMonthlyData(day, zhCN, 0);
        const key = monthly[1][2].date.toString();
        const parsed = { 1: { day: { 2: [{ key: 'a' }, { key: 'b' }] }, display: [] } } as any;
        expect(CalendarFoundation.isOpenCardStale(key, monthly, parsed, 1)).toBe(false);
        expect(CalendarFoundation.isOpenCardStale(key, monthly, parsed, 2)).toBe(true);
        expect(CalendarFoundation.isOpenCardStale(undefined, monthly, parsed, 2)).toBe(false);
    });
});
