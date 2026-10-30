import { StrictMode, createRef, type CSSProperties } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { countLiveListeners, endLeaveAnimations, mockResizeObserver } from '@test/utils/react';
import Calendar, { type CalendarProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-calendar`;
const MODES = ['day', 'week', 'month', 'range'] as const;
// the frozen clock (vitest/setup.ts) is Thursday 2019-08-08 12:00; its week runs from Sunday 08-04 to Saturday 08-10
const today = new Date(2019, 7, 8);
const weekRange = [new Date(2019, 7, 4), new Date(2019, 7, 11)];

// jsdom has no layout: give the scroll area 480px (20px per hour) and every box the given height
function mockLayout({ scrollHeight = 480, rectHeight }: { scrollHeight?: number; rectHeight?: number } = {}) {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight);
    if (rectHeight !== undefined) {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, rectHeight));
    }
}

const px = (value: string) => parseFloat(value);
const event = (key, start, end?, extra = {}) => ({
    key,
    start,
    end,
    children: <div className="evt">{key}</div>,
    ...extra,
});
const dayItems = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(`.${prefixCls}-event-day`)];
const allDayItems = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(`.${prefixCls}-event-allday`)];
const dayCols = (container: ParentNode) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-grid`)];
const card = () => document.querySelector<HTMLElement>(`.${prefixCls}-month-event-card`);

describe('Calendar', () => {
    it('属性类型不含 children', () => {
        expectTypeOf<CalendarProps>().not.toHaveProperty('children');
    });

    it('mode 属性', () => {
        const getWeekHeaderDays = (container) => container.querySelectorAll(`.${prefixCls}-week > .${prefixCls}-week-sticky-top .${prefixCls}-week-grid-row [role="columnheader"]`);

        let result = render(<Calendar />);
        expect(result.container.firstChild).toHaveClass(`${prefixCls}-week`);
        expect(getWeekHeaderDays(result.container)).toHaveLength(7);
        result.unmount();

        result = render(<Calendar mode="day" />);
        expect(result.container.firstChild).toHaveClass(`${prefixCls}-day`);
        result.unmount();

        result = render(<Calendar mode="month" />);
        expect(result.container.querySelector(`.${prefixCls}-month`)).not.toBeNull();
        expect(result.container.querySelector(`.${prefixCls}-week`)).toBeNull();
        result.unmount();

        // new Date(2020, 8, 31) is 10-01 and the range end is exclusive: 09-26 to 09-30
        result = render(<Calendar mode="range" range={[new Date(2020, 8, 26), new Date(2020, 8, 31)]} />);
        expect(result.container.firstChild).toHaveClass(`${prefixCls}-week`);
        expect(getWeekHeaderDays(result.container)).toHaveLength(5);
        result.unmount();
    });

    it('showCurrTime 属性', () => {
        const currLineSelector = `.${prefixCls}-grid-curr-line`;
        const cases: [boolean, 'week' | 'day', number][] = [
            [false, 'week', 0],
            [false, 'day', 0],
            [true, 'week', 1],
            [true, 'day', 1],
        ];
        for (const [showCurrTime, mode, count] of cases) {
            const { container, unmount } = render(<Calendar mode={mode} showCurrTime={showCurrTime} />);
            expect(container.querySelectorAll(currLineSelector)).toHaveLength(count);
            unmount();
        }
    });

    it('onClick 属性', async () => {
        const clickHandler = vi.fn<NonNullable<CalendarProps['onClick']>>();
        const weekResult = render(<Calendar mode="week" onClick={clickHandler} />);
        expect(clickHandler).toHaveBeenCalledTimes(0);
        await userEvent.click(weekResult.container.querySelector(`.${prefixCls}-grid-skeleton-row-line`));
        expect(clickHandler).toHaveBeenCalledTimes(1);
        expect(clickHandler.mock.calls[0][1]).toEqual(new Date(2019, 7, 4, 0, 0, 0));
        weekResult.unmount();

        const clickHandler2 = vi.fn<NonNullable<CalendarProps['onClick']>>();
        const monthResult = render(<Calendar mode="month" onClick={clickHandler2} />);
        expect(clickHandler2).toHaveBeenCalledTimes(0);
        await userEvent.click(monthResult.container.querySelector(`.${prefixCls}-month-skeleton [role="cell"]`));
        expect(clickHandler2).toHaveBeenCalledTimes(1);
        expect(clickHandler2.mock.calls[0][1]).toEqual(new Date(2019, 6, 28));
    });

    it('dateGridRender', () => {
        const importantDateStyle: CSSProperties = {
            position: 'absolute',
            left: '0',
            right: '0',
            top: '0',
            bottom: '0',
            backgroundColor: 'red',
        };
        const displayValue = new Date(2019, 6, 23, 8, 32, 0);
        const importDates = [new Date(2019, 6, 2)];
        const dateRender = (dateString) => {
            if (importDates.filter((date) => date.toString() === dateString).length) {
                return <div style={importantDateStyle}>hello</div>;
            }
            return null;
        };
        const { container } = render(<Calendar displayValue={displayValue} mode="month" dateGridRender={dateRender} />);
        const sameMonthCells = container.querySelectorAll(`.${prefixCls}-month-same`);
        expect(sameMonthCells[1].querySelector('div')).toHaveTextContent(/^hello$/);
        expect(screen.getAllByText('hello')).toHaveLength(1);
    });

    it('未传 displayValue 时，today 跟随时钟跨过午夜更新', () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date'] });
        try {
            const { container, rerender } = render(<Calendar mode="month" />);
            const todayCell = () => container.querySelector(`.${prefixCls}-today`).textContent;
            expect(todayCell()).toMatch(/\b8$/);
            vi.setSystemTime(new Date(2019, 7, 9, 0, 1));
            rerender(<Calendar className="next" mode="month" />);
            expect(todayCell()).toMatch(/\b9$/);
        } finally {
            vi.useRealTimers();
        }
    });

    it('未传 displayValue 时，today 无需父组件重渲染就跨过午夜更新', () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        try {
            const { container } = render(<Calendar mode="month" />);
            const todayCell = () => container.querySelector(`.${prefixCls}-today`).textContent;
            expect(todayCell()).toMatch(/\b8$/);
            act(() => {
                vi.advanceTimersByTime(2 * 60 * 1000);
            });
            expect(todayCell()).toMatch(/\b9$/);
        } finally {
            vi.useRealTimers();
        }
    });

    it('传入 displayValue 时，today 高亮也跨过午夜更新', () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        try {
            const { container } = render(<Calendar displayValue={new Date(2019, 7, 20)} mode="month" />);
            const todayCell = () => container.querySelector(`.${prefixCls}-today`).textContent;
            expect(todayCell()).toMatch(/\b8$/);
            act(() => {
                vi.advanceTimersByTime(2 * 60 * 1000);
            });
            expect(todayCell()).toMatch(/\b9$/);
        } finally {
            vi.useRealTimers();
        }
    });

    describe('系统睡眠或改时钟使午夜定时器没有按时触发', () => {
        const todayText = (container: HTMLElement) => container.querySelector(`.${prefixCls}-today`).textContent;
        const setup = () => {
            vi.useFakeTimers({ now: new Date(2019, 7, 8, 22, 0), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
            const { container } = render(<Calendar mode="month" />);
            expect(todayText(container)).toMatch(/\b8$/);
            // setSystemTime moves the clock without firing timers, as a sleep that the timer clock does not count
            vi.setSystemTime(new Date(2019, 7, 9, 0, 1));
            return container;
        };

        it('页面重新可见时更新今天', () => {
            try {
                const container = setup();
                act(() => {
                    document.dispatchEvent(new Event('visibilitychange'));
                });
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });

        it('窗口重新获得焦点时更新今天', () => {
            try {
                const container = setup();
                act(() => {
                    window.dispatchEvent(new Event('focus'));
                });
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });

        it('每分钟校对一次', () => {
            try {
                const container = setup();
                act(() => {
                    vi.advanceTimersByTime(60_000);
                });
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    it('month 视图换到周数不同的月份后，行数上限随行高重新测量', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const rows = this.closest(`.${prefixCls}-month`)?.querySelectorAll(`.${prefixCls}-month-weekrow`).length || 1;
            return new DOMRect(0, 0, 100, 480 / rows);
        });
        const threeOn = (month: number) => ['a', 'b', 'c'].map((key, i) => event(`${month}${key}`, new Date(2019, month, 12, 9 + i)));
        const events = [...threeOn(7), ...threeOn(2)];
        const { rerender } = render(<Calendar displayValue={new Date(2019, 7, 12)} events={events} mode="month" />);
        expect(screen.getByText('还有1项')).toBeInTheDocument();
        rerender(<Calendar displayValue={new Date(2019, 2, 12)} events={events} mode="month" />);
        expect(screen.getByText('还有2项')).toBeInTheDocument();
    });

    it('month 视图：同一天低行为空、高行有跨天事件时，被折叠的事件仍有 "more" 入口', () => {
        mockLayout({ rectHeight: 84 });
        const events = [event('a', new Date(2019, 7, 5), undefined, { allDay: true }), event('b', new Date(2019, 7, 5), new Date(2019, 7, 7), { allDay: true })];
        render(<Calendar displayValue={today} events={events} mode="month" />);
        expect(screen.getAllByRole('button', { name: '还有1项' })).toHaveLength(3);
    });

    it('month 视图：折叠的日期格与普通格一样带 aria-current 和按语言包格式化的名称', () => {
        mockLayout({ rectHeight: 84 });
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        render(
            <LocaleProvider locale={en_US}>
                <Calendar displayValue={today} events={events} mode="month" />
            </LocaleProvider>
        );
        const collapsed = screen.getByRole('button', { name: '1 more' }).closest('[role="cell"]');
        expect(collapsed).toHaveAttribute('aria-current', 'date');
        expect(collapsed).toHaveAttribute('aria-label', 'August 8th, 2019');
    });

    it('event 渲染', () => {
        const allDayStyle: CSSProperties = {
            borderRadius: '3px',
            boxSizing: 'border-box',
            border: 'var(--color-bg-1) 1px solid',
            padding: '2px 4px',
            backgroundColor: 'var(--color-primary-light-active)',
            height: '100%',
            overflow: 'hidden',
        };
        const events = [
            {
                key: '0',
                start: new Date(2019, 5, 25, 14, 45, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        6月25日 14:45
                    </div>
                ),
            },
            {
                key: '1',
                start: new Date(2019, 6, 18, 10, 0, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月18日 10:00
                    </div>
                ),
            },
            {
                key: '2',
                start: new Date(2019, 6, 19, 20, 0, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月19日 20:00
                    </div>
                ),
            },
            {
                key: '3',
                start: new Date(2019, 6, 21, 6, 0, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月21日 6:00
                    </div>
                ),
            },
            {
                key: '4',
                allDay: true,
                start: new Date(2019, 6, 22, 8, 0, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月22日 全天
                    </div>
                ),
            },
            {
                key: '5',
                start: new Date(2019, 6, 23, 9, 0, 0),
                allDay: true,
                children: <div className="eventDay">7月23日 全天</div>,
            },
            {
                key: '6',
                start: new Date(2019, 6, 24, 8, 32, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月24日 8:32
                    </div>
                ),
            },
            {
                key: '7',
                start: new Date(2019, 6, 25, 8, 32, 0),
                end: new Date(2019, 6, 26, 8, 32, 0),
                children: (
                    <div className="eventDay" style={allDayStyle}>
                        7月25日 8:32 - 7月26日 8:32
                    </div>
                ),
            },
        ];

        const { container } = render(<Calendar displayValue={new Date(2019, 6, 23)} events={events} height={400} mode="day" />);

        const eventOnJuly23 = events.filter((event) => {
            return event.start.getMonth() === 6 && event.start.getDate() === 23;
        });
        expect(container.querySelectorAll(`.eventDay`)).toHaveLength(eventOnJuly23.length);
        expect(screen.getByText('7月23日 全天')).toBeInTheDocument();
    });

    it('weekStartsOn', () => {
        const displayValue = new Date(2022, 7, 1, 8, 32, 0);
        const getFirstHead = (container) => container.querySelector(`.${prefixCls}-month-header [role="columnheader"]`);

        const { container, unmount } = render(<Calendar displayValue={displayValue} height={400} mode="month" weekStartsOn={3} />);
        expect(getFirstHead(container)).toHaveTextContent(/^周三$/);
        unmount();

        const defaultResult = render(<Calendar displayValue={displayValue} height={400} mode="month" />);
        expect(getFirstHead(defaultResult.container)).toHaveTextContent(/^周日$/);
    });

    it('getMonthlyData 同月 fixture', () => {
        const displayValue = new Date(2023, 3, 10, 8, 32, 0);

        const { container } = render(<Calendar displayValue={displayValue} mode="month" />);

        const rows = container.querySelectorAll(`.${prefixCls}-month-weekrow`);
        const firstRowCells = rows[0].querySelectorAll('[role="cell"]');
        const lastRowCells = rows[rows.length - 1].querySelectorAll('[role="cell"]');
        const sameMonthClass = `${prefixCls}-month-same`;
        // 2023-03-26
        expect(firstRowCells[0]).not.toHaveClass(sameMonthClass);
        // 2023-04-01
        expect(firstRowCells[firstRowCells.length - 1]).toHaveClass(sameMonthClass);
        // 2023-04-30
        expect(lastRowCells[0]).toHaveClass(sameMonthClass);
        // 2023-05-06
        expect(lastRowCells[lastRowCells.length - 1]).not.toHaveClass(sameMonthClass);
    });

    it('自定义 renderDateDisplay', () => {
        const displayValue = new Date(2023, 3, 1, 8, 32, 0);
        const customPrefix = 'my-custom-render-';
        const renderDateDisplay = (d) => <span className={`${customPrefix}${d.getMonth()}-${d.getDate()}`} />;

        const monthResult = render(<Calendar displayValue={displayValue} mode="month" renderDateDisplay={renderDateDisplay} />);
        expect(monthResult.container.querySelectorAll(`.${customPrefix}3-1`)).toHaveLength(1);
        monthResult.unmount();

        const weekResult = render(<Calendar displayValue={displayValue} mode="week" renderDateDisplay={renderDateDisplay} />);
        expect(weekResult.container.querySelectorAll(`.${customPrefix}3-1`)).toHaveLength(1);
    });

    it('自定义 allDayEventsRender', () => {
        const displayValue = new Date(2023, 3, 1, 8, 32, 0);
        const customClassName = 'my-custom-render';
        const defaultElementSelector = `.${prefixCls}-event-allday`;

        const { container } = render(<Calendar displayValue={displayValue} mode="week" allDayEventsRender={() => <div className={customClassName} />} />);

        expect(container.querySelectorAll(`.${customClassName}`)).toHaveLength(1);
        expect(container.querySelectorAll(defaultElementSelector)).toHaveLength(0);
    });

    it('range 模式 RangeData fixture', () => {
        const displayValue = new Date(2023, 3, 1, 8, 32, 0);
        const events = [
            {
                key: '0',
                allDay: false,
                start: new Date(2023, 3, 1, 8, 32, 0),
                end: new Date(2023, 3, 1, 9, 32, 0),
                children: <div className="eventDay">eventDay</div>,
            },
        ];
        const range = [new Date(2023, 3, 1, 8, 32, 0), new Date(2023, 3, 5, 8, 32, 0)];

        const scrollHeight = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(480);
        try {
            const { container } = render(<Calendar displayValue={displayValue} events={events} height={400} mode="range" range={range} />);

            const eventDays = container.querySelectorAll('.eventDay');
            expect(eventDays).toHaveLength(1);
            // 08:32-09:32 sits at 8.5333/24 of the scroll height and spans 1/24 of it (positions are rounded)
            const item = eventDays[0].closest<HTMLElement>(`.${prefixCls}-event-day`);
            expect(parseFloat(item.style.top)).toBeCloseTo((8 + 32 / 60) * 20, 0);
            expect(parseFloat(item.style.height)).toBeCloseTo(20, 0);
        } finally {
            scrollHeight.mockRestore();
        }
    });
});

describe('Calendar 行为', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('day 视图按滚动高度放置定时事件，同一时段的事件并排排列', () => {
        mockLayout();
        const events = [event('a', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11)), event('b', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11)), event('c', new Date(2019, 7, 8, 14)), event('other-day', new Date(2019, 7, 9, 10), new Date(2019, 7, 9, 11))];
        const { container } = render(<Calendar displayValue={today} events={events} mode="day" />);
        const items = dayItems(container);
        expect(items.map((item) => item.textContent)).toEqual(['a', 'b', 'c']);
        // positions are rounded to 1/1000 of the day, so 10:00 lands at 0.417 * 480
        expect(items.map((item) => [Math.round(px(item.style.top)), Math.round(px(item.style.height))])).toEqual([
            [200, 20],
            [200, 20],
            [280, 20],
        ]);
        expect(items.map((item) => item.style.left)).toEqual(['0px', '50%', '0px']);
    });

    it('minEventHeight 会放大过短的事件', () => {
        mockLayout();
        const events = [event('short', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 10, 15))];
        const { container, rerender } = render(<Calendar displayValue={today} events={events} mode="day" />);
        expect(px(dayItems(container)[0].style.height)).toBeCloseTo(5, 0);
        rerender(<Calendar displayValue={today} events={events} minEventHeight={30} mode="day" />);
        expect(px(dayItems(container)[0].style.height)).toBe(30);
    });

    it.each(['day', 'week'] as const)('%s 视图：事件改时间后同 key 的 li 保持同一 DOM 节点', (mode) => {
        mockLayout();
        const start = (hour) => new Date(2019, 7, 8, hour);
        const render1 = (hour) => <Calendar displayValue={today} events={[event('moving', start(hour), start(hour + 1))]} mode={mode} />;
        const { container, rerender } = render(render1(9));
        const before = dayItems(container)[0];
        const topBefore = px(before.style.top);
        rerender(render1(14));
        const after = dayItems(container)[0];
        expect(after).toBe(before);
        expect(px(after.style.top)).toBeGreaterThan(topBefore);
    });

    it('day 视图把全天事件放在全天行中', () => {
        mockLayout();
        const events = [event('all', new Date(2019, 7, 8, 9), undefined, { allDay: true })];
        const { container } = render(<Calendar displayValue={today} events={events} mode="day" />);
        expect(allDayItems(container.querySelector(`.${prefixCls}-all-day`)).map((item) => item.textContent)).toEqual(['all']);
        expect(dayItems(container)).toHaveLength(0);
    });

    it('week 视图按天定位全天跨度，重叠的跨度纵向堆叠', () => {
        mockLayout();
        const events = [event('span', new Date(2019, 7, 6), new Date(2019, 7, 8), { allDay: true }), event('overlap', new Date(2019, 7, 7), new Date(2019, 7, 7), { allDay: true })];
        const { container } = render(<Calendar displayValue={today} events={events} mode="week" />);
        const row = container.querySelector<HTMLElement>(`.${prefixCls}-all-day`);
        const items = allDayItems(row);
        expect(items.map((item) => item.textContent)).toEqual(['span', 'overlap']);
        expect(px(items[0].style.left)).toBeCloseTo((2 / 7) * 100, 0);
        expect(px(items[0].style.width)).toBeCloseTo((3 / 7) * 100, 0);
        expect(items[0].style.top).toBe('0em');
        expect(px(items[1].style.left)).toBeCloseTo((3 / 7) * 100, 0);
        expect(items[1].style.top).toBe('1em');
        expect(row.style.height).toBe('2em');
    });

    it('week 视图把跨午夜的事件拆分到两个日期列', () => {
        mockLayout();
        const events = [event('night', new Date(2019, 7, 6, 22), new Date(2019, 7, 7, 2))];
        const { container } = render(<Calendar displayValue={today} events={events} mode="week" />);
        const cols = dayCols(container);
        expect(cols).toHaveLength(7);
        const [tuesday] = dayItems(cols[2]);
        const [wednesday] = dayItems(cols[3]);
        expect(px(tuesday.style.top)).toBeCloseTo(440, 0);
        expect(px(tuesday.style.height)).toBeCloseTo(40, 0);
        expect(px(wednesday.style.top)).toBe(0);
        expect(px(wednesday.style.height)).toBeCloseTo(40, 0);
    });

    it('week 视图把超过一天的定时事件显示为全天跨度', () => {
        mockLayout();
        const events = [event('long', new Date(2019, 7, 5, 10), new Date(2019, 7, 7, 12))];
        const { container } = render(<Calendar displayValue={today} events={events} mode="week" />);
        const [item] = allDayItems(container);
        expect(item).toHaveTextContent('long');
        expect(px(item.style.left)).toBeCloseTo((1 / 7) * 100, 0);
        expect(px(item.style.width)).toBeCloseTo((3 / 7) * 100, 0);
        expect(dayItems(container)).toHaveLength(0);
    });

    it('month 视图把全天跨度拆分到两个周行', () => {
        mockLayout({ rectHeight: 300 });
        const events = [event('cross', new Date(2019, 7, 10), new Date(2019, 7, 12), { allDay: true })];
        const { container } = render(<Calendar displayValue={today} events={events} mode="month" />);
        const rows = [...container.querySelectorAll(`.${prefixCls}-month-weekrow`)];
        const items = rows.map((row) => [...row.querySelectorAll<HTMLElement>(`.${prefixCls}-event-month`)]);
        expect(items.map((list) => list.length)).toEqual([0, 1, 1, 0, 0]);
        expect(px(items[1][0].style.left)).toBeCloseTo((6 / 7) * 100, 0);
        expect(px(items[1][0].style.width)).toBeCloseTo((1 / 7) * 100, 0);
        expect(items[2][0].style.left).toBe('0%');
    });

    it('month 视图显示到行数上限的事件，其余折叠为 "more" 链接', () => {
        mockLayout({ rectHeight: 108 });
        const events = ['a', 'b', 'c'].map((key, i) => event(key, new Date(2019, 7, 8, 9 + i), undefined));
        const { container } = render(<Calendar displayValue={today} events={events} mode="month" />);
        expect([...container.querySelectorAll(`.${prefixCls}-event-month`)].map((item) => item.textContent)).toEqual(['a', 'b']);
        expect(screen.getByText('还有1项')).toBeInTheDocument();
    });

    it('weekStartsOn 设置 week 视图的第一列', async () => {
        const onClick = vi.fn<NonNullable<CalendarProps['onClick']>>();
        const { container } = render(<Calendar displayValue={today} mode="week" weekStartsOn={1} onClick={onClick} />);
        const headers = container.querySelectorAll(`.${prefixCls}-week-grid-row [role="columnheader"]`);
        expect(headers[0]).toHaveTextContent('5周一');
        expect(headers[6]).toHaveTextContent('11周日');
        await userEvent.click(container.querySelector(`.${prefixCls}-grid-skeleton-row-line`));
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 5, 0, 0, 0));
    });

    it('week 视图的月份标签取显示日期所在月份，range 视图取范围首日所在月份', () => {
        const sunday = new Date(2019, 8, 1);
        const week = render(<Calendar displayValue={sunday} mode="week" weekStartsOn={1} />);
        expect(week.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('9月');
        expect(week.container.querySelector(`.${prefixCls}-week-grid-row [role="columnheader"]`)).toHaveTextContent('26周一');
        week.unmount();

        const range = render(<Calendar displayValue={sunday} mode="range" range={[new Date(2019, 7, 26), sunday]} />);
        expect(range.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('8月');
    });

    it('week 视图中缺 start 的全天事件落在结束日', () => {
        const allDay = event('endOnly', undefined, new Date(2019, 7, 6), { allDay: true });
        render(<Calendar displayValue={today} events={[allDay]} mode="week" />);
        const item = document.querySelector<HTMLElement>(`.${prefixCls}-event-allday`);
        expect(parseFloat(item.style.left)).toBeCloseTo((2 / 7) * 100, 1);
    });

    it('markWeekend 标记周六与周日', () => {
        const weekendCls = `${prefixCls}-weekend`;
        const week = render(<Calendar displayValue={today} markWeekend mode="week" />);
        expect(week.container.querySelectorAll(`.${prefixCls}-week-grid-row [role="columnheader"].${weekendCls}`)).toHaveLength(2);
        expect(week.container.querySelectorAll(`.${prefixCls}-grid-skeleton.${weekendCls}`)).toHaveLength(2);
        week.unmount();

        const plain = render(<Calendar displayValue={today} mode="week" />);
        expect(plain.container.querySelectorAll(`.${weekendCls}`)).toHaveLength(0);
        plain.unmount();

        const month = render(<Calendar displayValue={today} markWeekend mode="month" />);
        expect(month.container.querySelectorAll(`.${prefixCls}-month-header [role="columnheader"].${weekendCls}`)).toHaveLength(2);
        month.unmount();

        const saturday = render(<Calendar displayValue={new Date(2019, 7, 10)} markWeekend mode="day" />);
        expect(saturday.container.querySelector(`.${prefixCls}-all-day-content`)).toHaveClass(weekendCls);
        expect(saturday.container.querySelector(`.${prefixCls}-grid-skeleton`)).toHaveClass(weekendCls);
    });

    it('当前时间线每 30 秒跟随时钟更新', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        mockLayout();
        const { container } = render(<Calendar displayValue={today} mode="day" />);
        const line = () => container.querySelector<HTMLElement>(`.${prefixCls}-grid-curr-line`);
        expect(px(line().style.top)).toBe(240);
        void act(() => vi.advanceTimersByTime(90_000));
        expect(px(line().style.top)).toBeCloseTo(240.48, 2);
    });

    it('固定 displayValue 的列跨过午夜后不再显示当前时间线', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2019, 7, 8, 23, 59, 0));
        mockLayout();
        const { container } = render(<Calendar displayValue={today} mode="day" />);
        const line = () => container.querySelector<HTMLElement>(`.${prefixCls}-grid-curr-line`);
        expect(line()).not.toBeNull();
        void act(() => vi.advanceTimersByTime(2 * 60_000));
        expect(line()).toBeNull();
    });

    it.each(['week', 'range'] as const)('%s 视图：跨过午夜后变成今天的列开始显示当前时间线', (mode) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2019, 7, 8, 23, 59, 0));
        mockLayout();
        const { container } = render(<Calendar displayValue={today} mode={mode} range={weekRange} />);
        const lines = () => container.querySelectorAll(`.${prefixCls}-grid-curr-line`);
        expect(dayCols(container)[4].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
        void act(() => vi.advanceTimersByTime(2 * 60_000));
        expect(lines()).toHaveLength(1);
        expect(dayCols(container)[5].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
    });

    it('day 视图：固定为明天的日列跨过午夜后开始显示当前时间线', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2019, 7, 8, 23, 59, 0));
        mockLayout();
        const { container } = render(<Calendar displayValue={new Date(2019, 7, 9)} mode="day" />);
        const line = () => container.querySelector(`.${prefixCls}-grid-curr-line`);
        expect(line()).toBeNull();
        void act(() => vi.advanceTimersByTime(2 * 60_000));
        expect(line()).not.toBeNull();
    });

    it('当前时间线仅显示在今天所在的列', () => {
        const week = render(<Calendar displayValue={today} mode="week" />);
        const cols = dayCols(week.container);
        expect(cols[4].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
        expect(week.container.querySelectorAll(`.${prefixCls}-grid-curr-line`)).toHaveLength(1);
        week.unmount();

        const otherDay = render(<Calendar displayValue={new Date(2019, 7, 9)} mode="day" />);
        expect(otherDay.container.querySelector(`.${prefixCls}-grid-curr-line`)).toBeNull();
    });

    it('scrollTop 设置 day、week 与 range 视图的初始滚动位置', () => {
        for (const mode of ['day', 'week', 'range'] as const) {
            const def = render(<Calendar mode={mode} range={weekRange} />);
            expect((def.container.firstChild as HTMLElement).scrollTop).toBe(400);
            def.unmount();
            const custom = render(<Calendar mode={mode} range={weekRange} scrollTop={120} />);
            expect((custom.container.firstChild as HTMLElement).scrollTop).toBe(120);
            custom.unmount();
        }
    });

    it('day 与 range 视图的 onClick 接收半小时时段', async () => {
        const onClick = vi.fn<NonNullable<CalendarProps['onClick']>>();
        const day = render(<Calendar displayValue={new Date(2019, 7, 8, 15, 20)} mode="day" onClick={onClick} />);
        await userEvent.click(day.container.querySelector('[data-time="09:30:00"]'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 8, 9, 30, 0));
        day.unmount();

        const range = render(<Calendar mode="range" range={[new Date(2019, 7, 1), new Date(2019, 7, 4)]} onClick={onClick} />);
        await userEvent.click(dayCols(range.container)[1].querySelector('[data-time="18:00:00"]'));
        expect(onClick.mock.calls[1][1]).toEqual(new Date(2019, 7, 2, 18, 0, 0));
    });

    it('day 视图的 dateGridRender 收到当天 0 点，与其他视图一致', () => {
        const dateGridRender = vi.fn<NonNullable<CalendarProps['dateGridRender']>>(() => null);
        render(<Calendar displayValue={new Date(2019, 7, 8, 15, 20, 30)} mode="day" dateGridRender={dateGridRender} />);
        expect(dateGridRender).toHaveBeenLastCalledWith(today.toString(), today);
    });

    it('dateGridRender 渲染到 day 与 week 视图的每个日期列', () => {
        const dateGridRender = vi.fn<NonNullable<CalendarProps['dateGridRender']>>((dateString) => <span className="grid-extra">{dateString}</span>);
        const day = render(<Calendar displayValue={today} mode="day" dateGridRender={dateGridRender} />);
        expect(day.container.querySelectorAll('.grid-extra')).toHaveLength(1);
        expect(dateGridRender).toHaveBeenLastCalledWith(today.toString(), today);
        day.unmount();

        dateGridRender.mockClear();
        const week = render(<Calendar displayValue={today} mode="week" dateGridRender={dateGridRender} />);
        const cols = dayCols(week.container);
        expect(cols.map((col) => col.querySelector('.grid-extra').textContent)).toEqual([4, 5, 6, 7, 8, 9, 10].map((d) => new Date(2019, 7, d).toString()));
    });

    it('renderTimeDisplay 替换小时标签', () => {
        const { container } = render(<Calendar mode="day" renderTimeDisplay={(hour) => `h${hour}`} />);
        const labels = [...container.querySelectorAll(`.${prefixCls}-time-item`)].map((item) => item.textContent);
        expect(labels).toHaveLength(24);
        expect(labels.slice(0, 3)).toEqual(['', 'h1', 'h2']);
    });

    it('month 的 "more" 打开列出当日事件的卡片，可通过按钮或点击外部关闭', async () => {
        const onMoreClick = vi.fn<NonNullable<CalendarProps['onMoreClick']>>();
        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        render(<Calendar displayValue={today} events={events} mode="month" onClose={onClose} onMoreClick={onMoreClick} />);
        // jsdom measures 0px rows, so the row limit is 0 and the day collapses entirely
        await userEvent.click(screen.getByText('还有2项'));
        expect(onMoreClick).toHaveBeenCalledTimes(1);
        expect(onMoreClick.mock.calls[0].slice(1)).toEqual([today, 2]);
        await waitFor(() => expect(card()).not.toBeNull());
        expect([...card().querySelectorAll(`.${prefixCls}-month-event-card-list li`)].map((li) => li.textContent)).toEqual(['a', 'b']);
        expect(card().querySelector(`.${prefixCls}-month-event-card-header-info-date`)).toHaveTextContent('8');

        expect(card().querySelector(`.${prefixCls}-month-event-card-close`)).toBe(screen.getByRole('button', { name: zh_CN.Calendar.close }));
        await userEvent.click(card().querySelector(`.${prefixCls}-month-event-card-close`));
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            endLeaveAnimations();
            expect(card()).toBeNull();
        });

        await userEvent.click(screen.getByText('还有2项'));
        await waitFor(() => expect(card()).not.toBeNull());
        fireEvent.mouseDown(document.body);
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onClose.mock.calls[1][0]).toBeNull();
        await waitFor(() => {
            endLeaveAnimations();
            expect(card()).toBeNull();
        });
    });

    it('点击已打开的卡片内部时保持打开', async () => {
        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        const events = [event('a', new Date(2019, 7, 8, 9))];
        render(<Calendar displayValue={today} events={events} mode="month" onClose={onClose} />);
        await userEvent.click(screen.getByText('还有1项'));
        await waitFor(() => expect(card()).not.toBeNull());
        fireEvent.mouseDown(card().querySelector(`.${prefixCls}-month-event-card-body`));
        expect(onClose).not.toHaveBeenCalled();
        expect(card()).not.toBeNull();
    });

    it('标签、星期与 "more" 文案使用语言包', () => {
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        const day = render(
            <LocaleProvider locale={en_US}>
                <Calendar displayValue={today} mode="day" />
            </LocaleProvider>
        );
        expect(day.container.querySelector(`.${prefixCls}-all-day-tag`)).toHaveTextContent('All Day');
        const labels = [...day.container.querySelectorAll(`.${prefixCls}-time-item`)].map((item) => item.textContent);
        expect([labels[1], labels[12], labels[13]]).toEqual(['1 AM', '12 PM', '1 PM']);
        day.unmount();

        const week = render(
            <LocaleProvider locale={en_US}>
                <Calendar displayValue={today} mode="week" />
            </LocaleProvider>
        );
        expect(week.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('Aug');
        expect(week.container.querySelector(`.${prefixCls}-week-grid-row [role="columnheader"]`)).toHaveTextContent('4Sun');
        week.unmount();

        const month = render(
            <LocaleProvider locale={en_US}>
                <Calendar displayValue={today} events={events} mode="month" />
            </LocaleProvider>
        );
        expect(month.container.querySelector(`.${prefixCls}-month-header [role="columnheader"]`)).toHaveTextContent('Sun');
        expect(screen.getByText('2 more')).toBeInTheDocument();
    });

    it('header、className、style、width、height 与 data-* 作用于每种模式的根元素', () => {
        for (const mode of MODES) {
            const { container, unmount } = render(<Calendar className="custom" style={{ color: 'red' }} data-testid={`cal-${mode}`} header={<b className="custom-header">h</b>} height={300} mode={mode} range={weekRange} width={500} />);
            const root = container.firstChild as HTMLElement;
            expect(root).toBe(screen.getByTestId(`cal-${mode}`));
            expect(root).toHaveClass('custom', `${prefixCls}-${mode === 'range' ? 'week' : mode}`);
            expect(root.style.color).toBe('red');
            expect(root.style.width).toBe('500px');
            expect(root.style.height).toBe('300px');
            expect(root.querySelector('.custom-header')).not.toBeNull();
            unmount();
        }
    });

    it('已声明的属性不泄漏到 DOM', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        for (const mode of MODES) {
            const { unmount } = render(
                <Calendar
                    displayValue={today}
                    events={[event('a', new Date(2019, 7, 8, 9))]}
                    markWeekend
                    minEventHeight={10}
                    mode={mode}
                    range={weekRange}
                    scrollTop={10}
                    showCurrTime={false}
                    weekStartsOn={1}
                    allDayEventsRender={() => null}
                    dateGridRender={() => null}
                    renderDateDisplay={(d) => d.getDate()}
                    renderTimeDisplay={(h) => h}
                    onClick={() => {}}
                    onClose={() => {}}
                    onMoreClick={() => {}}
                />
            );
            unmount();
        }
        expect(error).not.toHaveBeenCalled();
    });

    it('StrictMode 下正常工作', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        mockLayout();
        const events = [event('a', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11))];
        const day = render(
            <StrictMode>
                <Calendar displayValue={today} events={events} mode="day" />
            </StrictMode>
        );
        expect(day.container.querySelectorAll(`.${prefixCls}-grid-curr-line`)).toHaveLength(1);
        expect(px(dayItems(day.container)[0].style.top)).toBeCloseTo(200, 0);
        expect((day.container.firstChild as HTMLElement).scrollTop).toBe(400);
        void act(() => vi.advanceTimersByTime(90_000));
        expect(px(day.container.querySelector<HTMLElement>(`.${prefixCls}-grid-curr-line`).style.top)).toBeCloseTo(240.48, 2);
        day.unmount();
        vi.useRealTimers();

        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        render(
            <StrictMode>
                <Calendar displayValue={today} events={events} mode="month" onClose={onClose} />
            </StrictMode>
        );
        await userEvent.click(screen.getByText('还有1项'));
        await waitFor(() => expect(card()).not.toBeNull());
        fireEvent.mouseDown(document.body);
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            endLeaveAnimations();
            expect(card()).toBeNull();
        });
    });

    it('StrictMode 下当前时间线只有一个刷新定时器，卸载后清除', () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        const { unmount } = render(
            <StrictMode>
                <Calendar displayValue={today} mode="day" />
            </StrictMode>
        );
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Calendar 作为函数组件', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('每种模式的根 div 都挂载 ref', () => {
        for (const mode of MODES) {
            const ref = createRef<HTMLDivElement>();
            const { container, unmount } = render(<Calendar ref={ref} mode={mode} range={weekRange} />);
            expect(ref.current).toBe(container.firstChild);
            expect(ref.current.tagName).toBe('DIV');
            unmount();
        }
    });

    it('将未声明的属性传给根元素', () => {
        for (const mode of MODES) {
            const { container, unmount } = render(<Calendar id={`cal-${mode}`} aria-label="schedule" mode={mode} range={weekRange} />);
            expect(container.firstChild).toHaveAttribute('id', `cal-${mode}`);
            expect(container.firstChild).toHaveAttribute('aria-label', 'schedule');
            unmount();
        }
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Calendar: { mode: 'day', scrollTop: 50 } };
        try {
            const { container } = render(<Calendar />);
            expect(container.firstChild).toHaveClass(`${prefixCls}-day`);
            expect((container.firstChild as HTMLElement).scrollTop).toBe(50);
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });

    it('key 不变但内容变化的事件会重新渲染', () => {
        for (const mode of MODES) {
            const { rerender, unmount } = render(<Calendar displayValue={today} events={[event('a', new Date(2019, 7, 8, 9))]} mode={mode} range={weekRange} />);
            const next = [{ ...event('a', new Date(2019, 7, 8, 9)), children: <div className="evt">changed</div> }];
            rerender(<Calendar displayValue={today} events={next} mode={mode} range={weekRange} />);
            if (mode === 'month') {
                fireEvent.click(screen.getByText('还有1项'));
            }
            expect(document.body.textContent).toContain('changed');
            unmount();
        }
    });

    it('key 不变但时间变化的事件会移动位置', () => {
        mockLayout();
        const { container, rerender } = render(<Calendar displayValue={today} events={[event('a', new Date(2019, 7, 8, 10))]} mode="day" />);
        expect(Math.round(px(dayItems(container)[0].style.top))).toBe(200);
        rerender(<Calendar displayValue={today} events={[event('a', new Date(2019, 7, 8, 14))]} mode="day" />);
        expect(Math.round(px(dayItems(container)[0].style.top))).toBe(280);
    });

    it('weekStartsOn 变化时 month 视图重新分配事件到周行', () => {
        mockLayout({ rectHeight: 300 });
        const displayValue = new Date(2019, 6, 15);
        const events = [event('sunday', new Date(2019, 6, 7, 9), undefined, { allDay: true })];
        const rowOf = (container) => [...container.querySelectorAll(`.${prefixCls}-month-weekrow`)].findIndex((row) => row.querySelector('.evt'));
        const { container, rerender } = render(<Calendar displayValue={displayValue} events={events} mode="month" />);
        expect(rowOf(container)).toBe(1);
        rerender(<Calendar displayValue={displayValue} events={events} mode="month" weekStartsOn={1} />);
        expect(rowOf(container)).toBe(0);
        const item = container.querySelector<HTMLElement>(`.${prefixCls}-event-month`);
        expect(px(item.style.left)).toBeCloseTo((6 / 7) * 100, 0);
    });

    it('month 视图不会重排传入的 events 数组', () => {
        const events = [event('late', new Date(2019, 7, 9, 9)), event('early', new Date(2019, 7, 8, 9))];
        render(<Calendar displayValue={today} events={events} mode="month" />);
        expect(events.map((e) => e.key)).toEqual(['late', 'early']);
    });

    it('卡片打开时卸载，停止监听外部点击', async () => {
        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const { unmount } = render(<Calendar displayValue={today} events={[event('a', new Date(2019, 7, 8, 9))]} mode="month" onClose={onClose} />);
        await userEvent.click(screen.getByText('还有1项'));
        await waitFor(() => expect(card()).not.toBeNull());
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(1);
        unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        fireEvent.mouseDown(document.body);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('从今天切换到其他日期时，day 视图移除当前时间线', () => {
        const { container, rerender } = render(<Calendar displayValue={today} mode="day" />);
        expect(container.querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
        rerender(<Calendar displayValue={new Date(2019, 7, 9)} mode="day" />);
        expect(container.querySelector(`.${prefixCls}-grid-curr-line`)).toBeNull();
        rerender(<Calendar displayValue={today} mode="day" />);
        expect(container.querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
    });
});

describe('Calendar 运行时切换与无障碍补充', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each(['week', 'range'] as const)('%s 视图的全天事件重排后按事件 key 复用 DOM 节点', (mode) => {
        const make = (aStart: Date) => [event('a', aStart, aStart, { allDay: true }), event('b', new Date(2019, 7, 6), new Date(2019, 7, 6), { allDay: true })];
        const find = (container: ParentNode, text: string) => allDayItems(container).find((item) => item.textContent === text);
        const { container, rerender } = render(<Calendar displayValue={today} events={make(new Date(2019, 7, 5))} mode={mode} range={weekRange} />);
        const nodeOfB = find(container, 'b');
        rerender(<Calendar displayValue={today} events={make(new Date(2019, 7, 7))} mode={mode} range={weekRange} />);
        expect(allDayItems(container).map((item) => item.textContent)).toEqual(['b', 'a']);
        expect(find(container, 'b')).toBe(nodeOfB);
    });

    it('showCurrTime 在运行时切换立即生效，关闭时停止刷新定时器', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        mockLayout();
        const line = (container: ParentNode) => container.querySelectorAll(`.${prefixCls}-grid-curr-line`);
        const { container, rerender } = render(<Calendar displayValue={today} mode="day" showCurrTime={false} />);
        expect(line(container)).toHaveLength(0);
        const idleTimers = vi.getTimerCount();
        rerender(<Calendar displayValue={today} mode="day" showCurrTime />);
        expect(line(container)).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(idleTimers + 1);
        rerender(<Calendar displayValue={today} mode="day" showCurrTime={false} />);
        expect(line(container)).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(idleTimers);
    });

    it('时间网格变为可见后重新量高并补写 scrollTop', () => {
        let gridHeight = 0;
        vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(() => gridHeight);
        const observer = mockResizeObserver();
        const events = [event('timed', new Date(2019, 7, 8, 12), new Date(2019, 7, 8, 13))];
        const { container } = render(<Calendar displayValue={today} events={events} mode="week" scrollTop={120} />);
        const root = container.firstChild as HTMLElement;
        const top = () => px(dayItems(container)[0].style.top);
        expect(top()).toBe(0);
        // a browser clamps the write to 0 while the container is display: none
        root.scrollTop = 0;
        gridHeight = 480;
        act(() => observer.fireLive(() => ({})));
        expect(top()).toBe(240);
        expect(root.scrollTop).toBe(120);
    });

    it('month 视图折叠日期格不是 Tab 停靠点，"more" 按钮是唯一停靠点', () => {
        const events = [event('a', new Date(2019, 7, 8, 9))];
        render(<Calendar displayValue={today} events={events} mode="month" />);
        const cell = screen.getByRole('button', { name: '还有1项' }).closest('[role="cell"]');
        expect(cell).toHaveAttribute('tabindex', '-1');
    });

    it('再次点击已打开卡片的 "more" 按钮收起卡片，只发一次关闭', async () => {
        const onMoreClick = vi.fn<NonNullable<CalendarProps['onMoreClick']>>();
        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        render(<Calendar displayValue={today} events={events} mode="month" onClose={onClose} onMoreClick={onMoreClick} />);
        const more = screen.getByRole('button', { name: '还有2项' });
        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        expect(more).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(more);
        expect(more).toHaveAttribute('aria-expanded', 'false');
        expect(onMoreClick).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            endLeaveAnimations();
            expect(card()).toBeNull();
        });
    });

    it('打开卡片的日期格不再折叠时关闭卡片并调用 onClose，之后不会自行重新弹出', async () => {
        const onClose = vi.fn<NonNullable<CalendarProps['onClose']>>();
        const events = [event('a', new Date(2019, 7, 8, 9))];
        const { rerender } = render(<Calendar displayValue={today} events={events} mode="month" onClose={onClose} />);
        await userEvent.click(screen.getByRole('button', { name: '还有1项' }));
        await waitFor(() => expect(card()).not.toBeNull());
        rerender(<Calendar displayValue={today} events={[]} mode="month" onClose={onClose} />);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledWith(null);
        rerender(<Calendar displayValue={today} events={events} mode="month" onClose={onClose} />);
        expect(screen.getByRole('button', { name: '还有1项' })).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => {
            endLeaveAnimations();
            expect(card()).toBeNull();
        });
    });

    it('week 与 range 视图仅今天的列标题带 aria-current="date"', () => {
        for (const mode of ['week', 'range'] as const) {
            const { unmount } = render(<Calendar displayValue={today} mode={mode} range={weekRange} />);
            const current = screen.getAllByRole('columnheader').filter((el) => el.hasAttribute('aria-current'));
            expect(current).toHaveLength(1);
            expect(current[0]).toHaveAttribute('aria-current', 'date');
            expect(current[0]).toHaveClass(`${prefixCls}-today`);
            unmount();
        }
    });
});

describe('Calendar 表格语义', () => {
    const cellRoles = '[role="cell"], [role="columnheader"], [role="rowheader"]';
    const roleOf = (el) => el.parentElement.closest('[role]')?.getAttribute('role');

    // the chain axe requires: table -> rowgroup -> row -> cell, and a li only directly in a ul
    const expectValidTable = (container) => {
        const table = container.firstChild;
        expect(table).toHaveAttribute('role', 'table');
        for (const rowgroup of container.querySelectorAll('[role="rowgroup"]')) {
            expect(roleOf(rowgroup)).toBe('table');
        }
        for (const row of container.querySelectorAll('[role="row"]')) {
            expect(roleOf(row)).toBe('rowgroup');
        }
        for (const cell of container.querySelectorAll(cellRoles)) {
            expect(roleOf(cell)).toBe('row');
        }
        // a list inside a row is only valid when a cell holds it
        for (const ul of container.querySelectorAll('ul')) {
            expect(ul.closest(`${cellRoles}, [role="row"]`)?.getAttribute('role') ?? 'cell').not.toBe('row');
        }
        for (const li of container.querySelectorAll('li')) {
            expect(li.parentElement.tagName).toBe('UL');
        }
        expect(container.querySelectorAll('ul[role], li[role]')).toHaveLength(0);
    };

    it.each(MODES)('%s 视图是由 rowgroup、row 与 cell 组成的表格', (mode) => {
        const { container } = render(<Calendar displayValue={today} mode={mode} range={weekRange} />);
        expect(screen.getByRole('table')).toBe(container.firstChild);
        expectValidTable(container);
    });

    it.each(MODES)('%s 视图的表头内容位于自身行的单元格中', (mode) => {
        const { container } = render(<Calendar displayValue={today} header={<b>custom header</b>} mode={mode} range={weekRange} />);
        const cell = screen.getByText('custom header').parentElement;
        expect(cell).toHaveAttribute('role', 'cell');
        expect(roleOf(cell)).toBe('row');
        expectValidTable(container);
    });

    it('week 与 range 视图以月份标签命名，且每天一个列标题', () => {
        const week = render(<Calendar displayValue={today} mode="week" />);
        const label = week.container.querySelector(`.${prefixCls}-week-tag`).textContent;
        expect(label).not.toBe('');
        expect(screen.getByRole('table', { name: label })).toBe(week.container.firstChild);
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
        expect(screen.getByRole('rowheader')).toHaveTextContent('全天');
        week.unmount();

        render(<Calendar mode="range" range={[new Date(2019, 7, 1), new Date(2019, 7, 4)]} />);
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    });

    it('day 与 month 视图以显示的日期命名', () => {
        const day = render(<Calendar displayValue={today} mode="day" />);
        expect(screen.getByRole('table', { name: /2019/ })).toBe(day.container.firstChild);
        expect(screen.getByRole('table')).toHaveAccessibleName(expect.stringContaining('8'));
        day.unmount();

        const month = render(<Calendar displayValue={today} mode="month" />);
        expect(screen.getByRole('table', { name: /2019/ })).toBe(month.container.firstChild);
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
        const weeks = month.container.querySelectorAll(`.${prefixCls}-month-weekrow`).length;
        expect(screen.getAllByRole('cell')).toHaveLength(weeks * 7);
    });

    it('调用方提供的名称替换生成的名称', () => {
        for (const mode of MODES) {
            const { unmount } = render(<Calendar aria-label="my plan" displayValue={today} mode={mode} range={weekRange} />);
            expect(screen.getByRole('table', { name: 'my plan' })).toBeInTheDocument();
            unmount();
        }
    });

    it('可滚动视图可通过键盘获取焦点，以便滚动查看内容', () => {
        for (const mode of ['day', 'week', 'range'] as const) {
            const { container, unmount } = render(<Calendar displayValue={today} mode={mode} range={weekRange} />);
            expect(container.firstChild).toHaveAttribute('tabindex', '0');
            unmount();
        }
        const month = render(<Calendar displayValue={today} mode="month" />);
        expect(month.container.firstChild).not.toHaveAttribute('tabindex');
    });

    it('"more" 是打开卡片的按钮，卡片打开后焦点落在关闭按钮上', async () => {
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        render(<Calendar displayValue={today} events={events} mode="month" />);
        const more = screen.getByRole('button', { name: '还有2项' });
        expect(more).toHaveAttribute('aria-haspopup', 'dialog');
        expect(more).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        expect(more).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Calendar.close })).toHaveFocus());
        const header = card().querySelector(`.${prefixCls}-month-event-card-header-info`);
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', header.id);
        expect(header).toHaveTextContent('8');
    });
});
