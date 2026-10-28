/** @jsxImportSource vue */
import { createSSRApp, defineComponent, nextTick, reactive, toRaw, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import type { strings } from '@fibrae/semi-foundation/calendar/constants';
import { calcRowHeight } from '@fibrae/semi-foundation/calendar/event-util';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { countLiveListeners, endLeaveAnimations, mockResizeObserver, render } from '@test/utils/vue';
import semiGlobal, { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import LocaleProvider from '../../locale/locale-provider.vue';
import Calendar, { type CalendarEmits, type CalendarEventSlotProps, type CalendarMode, type CalendarProps, type EventObject } from '../index';
import CachedMonth from './fixtures/cached-month.vue';
import EmptyHeader from './fixtures/empty-header.vue';

type ClickHandler = (...args: CalendarEmits['click']) => void;
type CloseHandler = (...args: CalendarEmits['close']) => void;
type MoreClickHandler = (...args: CalendarEmits['moreClick']) => void;
type Slots = Record<string, (props: never) => VNode | VNode[] | string>;
type Listeners = { onClick?: ClickHandler; onClose?: CloseHandler; onMoreClick?: MoreClickHandler };

const prefixCls = 'semi-calendar';
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
const event = (key: string, start?: Date, end?: Date, extra: Partial<EventObject> = {}): EventObject => ({
    key,
    start,
    end,
    children: key,
    ...extra,
});
const evtSlot = {
    event: ({ event: item }: CalendarEventSlotProps) => <div class="evt">{String(item.children)}</div>,
};
const renderCal = (props: CalendarProps & Listeners = {}, slots: Slots = {}) => render(Calendar, { props, slots });
// The positions measured on mount (grid height, current time line) render on the next tick.
async function renderLaidOut(props: CalendarProps & Listeners = {}, slots: Slots = {}) {
    const view = renderCal(props, slots);
    await nextTick();
    return view;
}
const rootOf = (container: Element) => container.firstElementChild as HTMLElement;
const dayItems = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(`.${prefixCls}-event-day`)];
const allDayItems = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(`.${prefixCls}-event-allday`)];
const dayCols = (container: ParentNode) => [...container.querySelectorAll<HTMLElement>(`.${prefixCls}-grid`)];
const card = () => document.querySelector<HTMLElement>(`.${prefixCls}-month-event-card`);
const currLine = (root: ParentNode) => root.querySelector<HTMLElement>(`.${prefixCls}-grid-curr-line`);
const timeLabels = (root: ParentNode) => [...root.querySelectorAll(`.${prefixCls}-time-item`)].map((item) => item.textContent);
async function waitForCardClosed() {
    await waitFor(() => {
        endLeaveAnimations();
        expect(card()).toBeNull();
    });
}

describe('Calendar', () => {
    it('mode 属性', () => {
        const headerDays = (container: Element) => container.querySelectorAll(`.${prefixCls}-week > .${prefixCls}-week-sticky-top .${prefixCls}-week-grid-row [role="columnheader"]`);

        let result = renderCal();
        expect(rootOf(result.container)).toHaveClass(`${prefixCls}-week`);
        expect(headerDays(result.container)).toHaveLength(7);
        result.unmount();

        result = renderCal({ mode: 'day' });
        expect(rootOf(result.container)).toHaveClass(`${prefixCls}-day`);
        result.unmount();

        result = renderCal({ mode: 'month' });
        expect(result.container.querySelector(`.${prefixCls}-month`)).not.toBeNull();
        expect(result.container.querySelector(`.${prefixCls}-week`)).toBeNull();
        result.unmount();

        // new Date(2020, 8, 31) is 10-01 and the range end is exclusive: 09-26 to 09-30
        result = renderCal({ mode: 'range', range: [new Date(2020, 8, 26), new Date(2020, 8, 31)] });
        expect(rootOf(result.container)).toHaveClass(`${prefixCls}-week`);
        expect(headerDays(result.container)).toHaveLength(5);
    });

    it('showCurrTime 属性', async () => {
        const cases: [boolean, 'week' | 'day', number][] = [
            [false, 'week', 0],
            [false, 'day', 0],
            [true, 'week', 1],
            [true, 'day', 1],
        ];
        for (const [showCurrTime, mode, count] of cases) {
            const view = await renderLaidOut({ mode, showCurrTime });
            expect(view.container.querySelectorAll(`.${prefixCls}-grid-curr-line`)).toHaveLength(count);
            view.unmount();
        }
    });

    it('click 事件', async () => {
        const onClick = vi.fn<ClickHandler>();
        const week = renderCal({ mode: 'week', onClick });
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(week.container.querySelector(`.${prefixCls}-grid-skeleton-row-line`) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 4, 0, 0, 0));
        week.unmount();

        const onMonthClick = vi.fn<ClickHandler>();
        const month = renderCal({ mode: 'month', onClick: onMonthClick });
        await userEvent.click(month.container.querySelector(`.${prefixCls}-month-skeleton [role="cell"]`) as HTMLElement);
        expect(onMonthClick).toHaveBeenCalledTimes(1);
        // August 2019 starts on Thursday, so the month grid begins on Sunday 2019-07-28
        expect(onMonthClick.mock.calls[0][1]).toEqual(new Date(2019, 6, 28));
    });

    it('#dateGrid', () => {
        const importDates = [new Date(2019, 6, 2)];
        renderCal(
            { displayValue: new Date(2019, 6, 23, 8, 32, 0), mode: 'month' },
            {
                dateGrid: ({ dateString }: { dateString: string }) => (importDates.some((date) => date.toString() === dateString) ? <div>hello</div> : []),
            }
        );
        const sameMonthCells = document.querySelectorAll(`.${prefixCls}-month-same`);
        expect(sameMonthCells[1].querySelector('div')).toHaveTextContent(/^hello$/);
        expect(screen.getAllByText('hello')).toHaveLength(1);
    });

    it('未传 displayValue 时，today 无需父组件重渲染就跨过午夜更新', async () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        try {
            const { container } = renderCal({ mode: 'month' });
            const todayCell = () => container.querySelector(`.${prefixCls}-today`)?.textContent;
            // today is marked once mounted
            expect(todayCell()).toBeUndefined();
            await nextTick();
            expect(todayCell()).toMatch(/\b8$/);
            vi.advanceTimersByTime(2 * 60 * 1000);
            await nextTick();
            expect(todayCell()).toMatch(/\b9$/);
        } finally {
            vi.useRealTimers();
        }
    });

    it('传入 displayValue 时，today 高亮也跨过午夜更新', async () => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        try {
            const { container } = renderCal({ displayValue: new Date(2019, 7, 20), mode: 'month' });
            const todayCell = () => container.querySelector(`.${prefixCls}-today`)?.textContent;
            await nextTick();
            expect(todayCell()).toMatch(/\b8$/);
            vi.advanceTimersByTime(2 * 60 * 1000);
            await nextTick();
            expect(todayCell()).toMatch(/\b9$/);
        } finally {
            vi.useRealTimers();
        }
    });

    describe('系统睡眠或改时钟使午夜定时器没有按时触发', () => {
        const todayText = (container: Element) => container.querySelector(`.${prefixCls}-today`)?.textContent;
        const setup = async () => {
            vi.useFakeTimers({ now: new Date(2019, 7, 8, 22, 0), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
            const { container } = renderCal({ mode: 'month' });
            await nextTick();
            expect(todayText(container)).toMatch(/\b8$/);
            // setSystemTime moves the clock without firing timers, as a sleep that the timer clock does not count
            vi.setSystemTime(new Date(2019, 7, 9, 0, 1));
            return container;
        };

        it('页面重新可见时更新今天', async () => {
            try {
                const container = await setup();
                document.dispatchEvent(new Event('visibilitychange'));
                await nextTick();
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });

        it('窗口重新获得焦点时更新今天', async () => {
            try {
                const container = await setup();
                window.dispatchEvent(new Event('focus'));
                await nextTick();
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });

        it('每分钟校对一次', async () => {
            try {
                const container = await setup();
                vi.advanceTimersByTime(60_000);
                await nextTick();
                expect(todayText(container)).toMatch(/\b9$/);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    it('month 视图换到周数不同的月份后，行数上限随行高重新测量', async () => {
        // the grid is 480px tall: a 5-row month gives 96px rows (2 event rows), a 6-row month 80px rows (1 event row)
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const rows = this.closest(`.${prefixCls}-month`)?.querySelectorAll(`.${prefixCls}-month-weekrow`).length || 1;
            return new DOMRect(0, 0, 100, 480 / rows);
        });
        const threeOn = (month: number) => ['a', 'b', 'c'].map((key, i) => event(`${month}${key}`, new Date(2019, month, 12, 9 + i)));
        const events = [...threeOn(7), ...threeOn(2)];
        const view = renderCal({ displayValue: new Date(2019, 7, 12), events, mode: 'month' });
        expect(await screen.findByText('还有1项')).toBeInTheDocument();
        await view.rerender({ displayValue: new Date(2019, 2, 12), events, mode: 'month' });
        expect(await screen.findByText('还有2项')).toBeInTheDocument();
    });

    it('month 视图：同一天低行为空、高行有跨天事件时，被折叠的事件仍有 "more" 入口', async () => {
        // a 84px week row fits (84 - 60) / 24 = 1 event row
        mockLayout({ rectHeight: 84 });
        const events = [event('a', new Date(2019, 7, 5), undefined, { allDay: true }), event('b', new Date(2019, 7, 5), new Date(2019, 7, 7), { allDay: true })];
        renderCal({ displayValue: today, events, mode: 'month' });
        await nextTick();
        expect(screen.getAllByRole('button', { name: '还有1项' })).toHaveLength(3);
    });

    it('month 视图：折叠的日期格与普通格一样带 aria-current 和按语言包格式化的名称', async () => {
        mockLayout({ rectHeight: 84 });
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        render(LocaleProvider, {
            props: { locale: en_US },
            slots: { default: () => <Calendar displayValue={today} events={events} mode="month" /> },
        });
        await nextTick();
        const collapsed = screen.getByRole('button', { name: '1 more' }).closest('[role="cell"]');
        expect(collapsed).toHaveAttribute('aria-current', 'date');
        expect(collapsed).toHaveAttribute('aria-label', 'August 8th, 2019');
    });

    it('#event 渲染', () => {
        const events = [
            event('0', new Date(2019, 5, 25, 14, 45, 0)),
            event('1', new Date(2019, 6, 18, 10, 0, 0)),
            event('4', new Date(2019, 6, 22, 8, 0, 0), undefined, { allDay: true }),
            event('5', new Date(2019, 6, 23, 9, 0, 0), undefined, { allDay: true, children: '7月23日 全天' }),
            event('6', new Date(2019, 6, 23, 8, 32, 0), undefined, { children: '7月23日 8:32' }),
            event('7', new Date(2019, 6, 25, 8, 32, 0), new Date(2019, 6, 26, 8, 32, 0)),
        ];
        const { container } = renderCal({ displayValue: new Date(2019, 6, 23), events, height: 400, mode: 'day' }, evtSlot);
        expect(container.querySelectorAll('.evt')).toHaveLength(2);
        expect(screen.getByText('7月23日 全天')).toBeInTheDocument();
        expect(screen.getByText('7月23日 8:32')).toBeInTheDocument();
    });

    it('weekStartsOn', () => {
        const displayValue = new Date(2022, 7, 1, 8, 32, 0);
        const firstHead = (container: Element) => container.querySelector(`.${prefixCls}-month-header [role="columnheader"]`);
        const custom = renderCal({ displayValue, height: 400, mode: 'month', weekStartsOn: 3 });
        expect(firstHead(custom.container)).toHaveTextContent(/^周三$/);
        custom.unmount();

        const plain = renderCal({ displayValue, height: 400, mode: 'month' });
        expect(firstHead(plain.container)).toHaveTextContent(/^周日$/);
    });

    it('getMonthlyData 同月 fixture', () => {
        const { container } = renderCal({ displayValue: new Date(2023, 3, 10, 8, 32, 0), mode: 'month' });
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

    it('#dateDisplay', () => {
        const displayValue = new Date(2023, 3, 1, 8, 32, 0);
        const custom = 'my-custom-render-';
        const slots = {
            dateDisplay: ({ date }: { date: Date }) => <span class={`${custom}${date.getMonth()}-${date.getDate()}`} />,
        };
        const month = renderCal({ displayValue, mode: 'month' }, slots);
        // 2023-04-01
        expect(month.container.querySelectorAll(`.${custom}3-1`)).toHaveLength(1);
        month.unmount();

        const week = renderCal({ displayValue, mode: 'week' }, slots);
        expect(week.container.querySelectorAll(`.${custom}3-1`)).toHaveLength(1);
    });

    it('#allDayEvents', () => {
        const { container } = renderCal({ displayValue: new Date(2023, 3, 1, 8, 32, 0), mode: 'week' }, { allDayEvents: () => <li class="my-custom-render" /> });
        expect(container.querySelectorAll('.my-custom-render')).toHaveLength(1);
        expect(container.querySelectorAll(`.${prefixCls}-event-allday`)).toHaveLength(0);
    });

    it('range 模式 RangeData fixture', async () => {
        mockLayout();
        const events = [event('0', new Date(2023, 3, 1, 8, 32, 0), new Date(2023, 3, 1, 9, 32, 0), { allDay: false })];
        const range = [new Date(2023, 3, 1, 8, 32, 0), new Date(2023, 3, 5, 8, 32, 0)];
        const { container } = await renderLaidOut({ displayValue: new Date(2023, 3, 1, 8, 32, 0), events, height: 400, mode: 'range', range }, evtSlot);
        const evts = container.querySelectorAll('.evt');
        expect(evts).toHaveLength(1);
        // 08:32-09:32 sits at 8.5333/24 of the scroll height and spans 1/24 of it (positions are rounded)
        const item = evts[0].closest<HTMLElement>(`.${prefixCls}-event-day`) as HTMLElement;
        expect(parseFloat(item.style.top)).toBeCloseTo((8 + 32 / 60) * 20, 0);
        expect(parseFloat(item.style.height)).toBeCloseTo(20, 0);
    });
});

describe('Calendar 行为', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('day 视图按滚动高度放置定时事件，同一时段的事件并排排列', async () => {
        mockLayout();
        const events = [event('a', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11)), event('b', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11)), event('c', new Date(2019, 7, 8, 14)), event('other-day', new Date(2019, 7, 9, 10), new Date(2019, 7, 9, 11))];
        const { container } = await renderLaidOut({ displayValue: today, events, mode: 'day' });
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

    it('minEventHeight 会放大过短的事件', async () => {
        mockLayout();
        const events = [event('short', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 10, 15))];
        const view = await renderLaidOut({ displayValue: today, events, mode: 'day' });
        expect(px(dayItems(view.container)[0].style.height)).toBeCloseTo(5, 0);
        await view.rerender({ displayValue: today, events, minEventHeight: 30, mode: 'day' });
        expect(px(dayItems(view.container)[0].style.height)).toBe(30);
    });

    it.each(['day', 'week'] as const)('%s 视图：事件改时间后同 key 的 li 保持同一 DOM 节点', async (mode) => {
        mockLayout();
        const at = (hour: number) => ({
            displayValue: today,
            events: [event('moving', new Date(2019, 7, 8, hour), new Date(2019, 7, 8, hour + 1))],
            mode,
        });
        const view = await renderLaidOut(at(9));
        const before = dayItems(view.container)[0];
        const topBefore = px(before.style.top);
        await view.rerender(at(14));
        const after = dayItems(view.container)[0];
        expect(after).toBe(before);
        expect(px(after.style.top)).toBeGreaterThan(topBefore);
    });

    it('day 视图把全天事件放在全天行中', () => {
        mockLayout();
        const events = [event('all', new Date(2019, 7, 8, 9), undefined, { allDay: true })];
        const { container } = renderCal({ displayValue: today, events, mode: 'day' });
        const row = container.querySelector(`.${prefixCls}-all-day`) as HTMLElement;
        expect(allDayItems(row).map((item) => item.textContent)).toEqual(['all']);
        expect(dayItems(container)).toHaveLength(0);
    });

    it('week 视图按天定位全天跨度，重叠的跨度纵向堆叠', () => {
        mockLayout();
        const events = [event('span', new Date(2019, 7, 6), new Date(2019, 7, 8), { allDay: true }), event('overlap', new Date(2019, 7, 7), new Date(2019, 7, 7), { allDay: true })];
        const { container } = renderCal({ displayValue: today, events, mode: 'week' });
        const row = container.querySelector<HTMLElement>(`.${prefixCls}-all-day`) as HTMLElement;
        const items = allDayItems(row);
        expect(items.map((item) => item.textContent)).toEqual(['span', 'overlap']);
        expect(px(items[0].style.left)).toBeCloseTo((2 / 7) * 100, 0);
        expect(px(items[0].style.width)).toBeCloseTo((3 / 7) * 100, 0);
        expect(items[0].style.top).toBe('0em');
        expect(px(items[1].style.left)).toBeCloseTo((3 / 7) * 100, 0);
        expect(items[1].style.top).toBe('1em');
        expect(row.style.height).toBe('2em');
    });

    it('week 视图把跨午夜的事件拆分到两个日期列', async () => {
        mockLayout();
        const events = [event('night', new Date(2019, 7, 6, 22), new Date(2019, 7, 7, 2))];
        const { container } = await renderLaidOut({ displayValue: today, events, mode: 'week' });
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
        const { container } = renderCal({ displayValue: today, events, mode: 'week' });
        const [item] = allDayItems(container);
        expect(item).toHaveTextContent('long');
        expect(px(item.style.left)).toBeCloseTo((1 / 7) * 100, 0);
        expect(px(item.style.width)).toBeCloseTo((3 / 7) * 100, 0);
        expect(dayItems(container)).toHaveLength(0);
    });

    it('month 视图把全天跨度拆分到两个周行', async () => {
        mockLayout({ rectHeight: 300 });
        const events = [event('cross', new Date(2019, 7, 10), new Date(2019, 7, 12), { allDay: true })];
        const { container } = renderCal({ displayValue: today, events, mode: 'month' });
        await nextTick();
        const rows = [...container.querySelectorAll(`.${prefixCls}-month-weekrow`)];
        const items = rows.map((row) => [...row.querySelectorAll<HTMLElement>(`.${prefixCls}-event-month`)]);
        expect(items.map((list) => list.length)).toEqual([0, 1, 1, 0, 0]);
        expect(px(items[1][0].style.left)).toBeCloseTo((6 / 7) * 100, 0);
        expect(px(items[1][0].style.width)).toBeCloseTo((1 / 7) * 100, 0);
        expect(items[2][0].style.left).toBe('0%');
    });

    it('month 视图显示到行数上限的事件，其余折叠为 "more" 链接', async () => {
        // a week row of 108px fits (108 - 60) / 24 = 2 event rows
        mockLayout({ rectHeight: 108 });
        const events = ['a', 'b', 'c'].map((key, i) => event(key, new Date(2019, 7, 8, 9 + i)));
        const { container } = renderCal({ displayValue: today, events, mode: 'month' });
        await nextTick();
        expect([...container.querySelectorAll(`.${prefixCls}-event-month`)].map((item) => item.textContent)).toEqual(['a', 'b']);
        expect(screen.getByText('还有1项')).toBeInTheDocument();
    });

    it('weekStartsOn 设置 week 视图的第一列', async () => {
        const onClick = vi.fn<ClickHandler>();
        const { container } = renderCal({ displayValue: today, mode: 'week', weekStartsOn: 1, onClick });
        const headers = container.querySelectorAll(`.${prefixCls}-week-grid-row [role="columnheader"]`);
        expect(headers[0]).toHaveTextContent('5周一');
        expect(headers[6]).toHaveTextContent('11周日');
        await userEvent.click(container.querySelector(`.${prefixCls}-grid-skeleton-row-line`) as HTMLElement);
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 5, 0, 0, 0));
    });

    it('week 视图的月份标签取显示日期所在月份，range 视图取范围首日所在月份', () => {
        const sunday = new Date(2019, 8, 1);
        const week = renderCal({ displayValue: sunday, mode: 'week', weekStartsOn: 1 });
        expect(week.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('9月');
        expect(week.container.querySelector(`.${prefixCls}-week-grid-row [role="columnheader"]`)).toHaveTextContent('26周一');
        week.unmount();

        const range = renderCal({ displayValue: sunday, mode: 'range', range: [new Date(2019, 7, 26), sunday] });
        expect(range.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('8月');
    });

    it('week 视图中缺 start 的全天事件落在结束日', () => {
        renderCal({
            displayValue: today,
            events: [event('endOnly', undefined, new Date(2019, 7, 6), { allDay: true })],
            mode: 'week',
        });
        const item = document.querySelector<HTMLElement>(`.${prefixCls}-event-allday`) as HTMLElement;
        expect(parseFloat(item.style.left)).toBeCloseTo((2 / 7) * 100, 1);
    });

    it('markWeekend 标记周六与周日', () => {
        const weekendCls = `${prefixCls}-weekend`;
        const week = renderCal({ displayValue: today, markWeekend: true, mode: 'week' });
        expect(week.container.querySelectorAll(`.${prefixCls}-week-grid-row [role="columnheader"].${weekendCls}`)).toHaveLength(2);
        expect(week.container.querySelectorAll(`.${prefixCls}-grid-skeleton.${weekendCls}`)).toHaveLength(2);
        week.unmount();

        const plain = renderCal({ displayValue: today, mode: 'week' });
        expect(plain.container.querySelectorAll(`.${weekendCls}`)).toHaveLength(0);
        plain.unmount();

        const month = renderCal({ displayValue: today, markWeekend: true, mode: 'month' });
        expect(month.container.querySelectorAll(`.${prefixCls}-month-header [role="columnheader"].${weekendCls}`)).toHaveLength(2);
        month.unmount();

        const saturday = renderCal({ displayValue: new Date(2019, 7, 10), markWeekend: true, mode: 'day' });
        expect(saturday.container.querySelector(`.${prefixCls}-all-day-content`)).toHaveClass(weekendCls);
        expect(saturday.container.querySelector(`.${prefixCls}-grid-skeleton`)).toHaveClass(weekendCls);
    });

    it('当前时间线每 30 秒跟随时钟更新', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        mockLayout();
        const { container } = renderCal({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(px((currLine(container) as HTMLElement).style.top)).toBe(240);
        vi.advanceTimersByTime(90_000);
        await nextTick();
        expect(px((currLine(container) as HTMLElement).style.top)).toBeCloseTo(240.48, 2);
    });

    it('固定 displayValue 的列跨过午夜后不再显示当前时间线', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 23, 59, 0));
        mockLayout();
        const { container } = renderCal({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(currLine(container)).not.toBeNull();
        vi.advanceTimersByTime(2 * 60_000);
        await nextTick();
        expect(currLine(container)).toBeNull();
    });

    it('当前时间线仅显示在今天所在的列', async () => {
        const week = renderCal({ displayValue: today, mode: 'week' });
        await nextTick();
        expect(dayCols(week.container)[4].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
        expect(week.container.querySelectorAll(`.${prefixCls}-grid-curr-line`)).toHaveLength(1);
        week.unmount();

        const otherDay = renderCal({ displayValue: new Date(2019, 7, 9), mode: 'day' });
        await nextTick();
        expect(currLine(otherDay.container)).toBeNull();
    });

    it('scrollTop 设置 day、week 与 range 视图的初始滚动位置', () => {
        for (const mode of ['day', 'week', 'range'] as const) {
            const def = renderCal({ mode, range: weekRange });
            expect(rootOf(def.container).scrollTop).toBe(400);
            def.unmount();
            const custom = renderCal({ mode, range: weekRange, scrollTop: 120 });
            expect(rootOf(custom.container).scrollTop).toBe(120);
            custom.unmount();
        }
    });

    it('day 与 range 视图的 click 接收半小时时段', async () => {
        const onClick = vi.fn<ClickHandler>();
        const day = await renderLaidOut({ displayValue: new Date(2019, 7, 8, 15, 20), mode: 'day', onClick });
        await userEvent.click(day.container.querySelector('[data-time="09:30:00"]') as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 8, 9, 30, 0));
        day.unmount();

        const range = await renderLaidOut({ mode: 'range', range: [new Date(2019, 7, 1), new Date(2019, 7, 4)], onClick });
        await userEvent.click(dayCols(range.container)[1].querySelector('[data-time="18:00:00"]') as HTMLElement);
        expect(onClick.mock.calls[1][1]).toEqual(new Date(2019, 7, 2, 18, 0, 0));
    });

    it('day 视图的 #dateGrid 收到当天 0 点，与其他视图一致', () => {
        const dateGrid = vi.fn<(props: { date: Date; dateString: string }) => VNode>(() => <span />);
        renderCal({ displayValue: new Date(2019, 7, 8, 15, 20, 30), mode: 'day' }, { dateGrid });
        expect(dateGrid).toHaveBeenLastCalledWith({ date: today, dateString: today.toString() });
    });

    describe('跨过午夜', () => {
        const midnightClock = () => vi.useFakeTimers({ now: new Date(2019, 7, 8, 23, 59), toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });

        it.each(['week', 'range'] as const)('%s 视图：变成今天的列开始显示当前时间线', async (mode) => {
            midnightClock();
            try {
                mockLayout();
                const { container } = renderCal({ displayValue: today, mode, range: weekRange });
                await nextTick();
                expect(dayCols(container)[4].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
                vi.advanceTimersByTime(2 * 60_000);
                await nextTick();
                expect(container.querySelectorAll(`.${prefixCls}-grid-curr-line`)).toHaveLength(1);
                expect(dayCols(container)[5].querySelector(`.${prefixCls}-grid-curr-line`)).not.toBeNull();
            } finally {
                vi.useRealTimers();
            }
        });

        it('day 视图：固定为明天的日列开始显示当前时间线', async () => {
            midnightClock();
            try {
                mockLayout();
                const { container } = renderCal({ displayValue: new Date(2019, 7, 9), mode: 'day' });
                expect(currLine(container)).toBeNull();
                vi.advanceTimersByTime(2 * 60_000);
                await nextTick();
                expect(currLine(container)).not.toBeNull();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    it('#dateGrid 渲染到 day 与 week 视图的每个日期列', () => {
        const dateGrid = vi.fn<(props: { date: Date; dateString: string }) => VNode>(({ dateString }) => <span class="grid-extra">{dateString}</span>);
        const day = renderCal({ displayValue: today, mode: 'day' }, { dateGrid });
        expect(day.container.querySelectorAll('.grid-extra')).toHaveLength(1);
        expect(dateGrid).toHaveBeenLastCalledWith({ date: today, dateString: today.toString() });
        day.unmount();

        const week = renderCal({ displayValue: today, mode: 'week' }, { dateGrid });
        expect(dayCols(week.container).map((col) => col.querySelector('.grid-extra')?.textContent)).toEqual([4, 5, 6, 7, 8, 9, 10].map((d) => new Date(2019, 7, d).toString()));
    });

    it('收回 #timeDisplay 后三个视图都回到默认小时标签', async () => {
        const custom = reactive({ on: true });
        const labels = (container: Element) => timeLabels(container).slice(0, 3);
        for (const mode of ['day', 'week', 'range'] as const) {
            const view = renderCal({ mode, range: [new Date(2019, 7, 1), new Date(2019, 7, 4)], displayValue: today }, { timeDisplay: ({ time }: { time: number }) => `h${time}` });
            expect(labels(view.container)).toEqual(['', 'h1', 'h2']);
            view.unmount();
        }
        const Wrapper = defineComponent(() => () => <Calendar mode="day">{custom.on ? { timeDisplay: ({ time }: { time: number }) => `h${time}` } : {}}</Calendar>);
        const { container } = render(Wrapper);
        expect(labels(container)).toEqual(['', 'h1', 'h2']);
        custom.on = false;
        await nextTick();
        expect(labels(container)).toEqual(['', '上午1时', '上午2时']);
    });

    it('#timeDisplay 替换小时标签', () => {
        const { container } = renderCal({ mode: 'day' }, { timeDisplay: ({ time }: { time: number }) => `h${time}` });
        const labels = timeLabels(container);
        expect(labels).toHaveLength(24);
        expect(labels.slice(0, 3)).toEqual(['', 'h1', 'h2']);
    });

    it('month 的 "more" 打开列出当日事件的卡片，可通过按钮或点击外部关闭', async () => {
        const onMoreClick = vi.fn<MoreClickHandler>();
        const onClose = vi.fn<CloseHandler>();
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        renderCal({ displayValue: today, events, mode: 'month', onClose, onMoreClick });
        // jsdom measures 0px rows, so the row limit is 0 and the day collapses entirely
        await userEvent.click(screen.getByText('还有2项'));
        expect(onMoreClick).toHaveBeenCalledTimes(1);
        expect(onMoreClick.mock.calls[0].slice(1)).toEqual([today, 2]);
        await waitFor(() => expect(card()).not.toBeNull());
        expect([...(card() as HTMLElement).querySelectorAll(`.${prefixCls}-month-event-card-list li`)].map((li) => li.textContent)).toEqual(['a', 'b']);
        expect(card()?.querySelector(`.${prefixCls}-month-event-card-header-info-date`)).toHaveTextContent('8');

        const close = card()?.querySelector(`.${prefixCls}-month-event-card-close`) as HTMLElement;
        expect(close).toBe(screen.getByRole('button', { name: zh_CN.Calendar.close }));
        await userEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        await waitForCardClosed();

        await userEvent.click(screen.getByText('还有2项'));
        await waitFor(() => expect(card()).not.toBeNull());
        await fireEvent.mouseDown(document.body);
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onClose.mock.calls[1][0]).toBeNull();
        await waitForCardClosed();
    });

    it('点击已打开的卡片内部时保持打开', async () => {
        const onClose = vi.fn<CloseHandler>();
        renderCal({ displayValue: today, events: [event('a', new Date(2019, 7, 8, 9))], mode: 'month', onClose });
        await userEvent.click(screen.getByText('还有1项'));
        await waitFor(() => expect(card()).not.toBeNull());
        await fireEvent.mouseDown(card()?.querySelector(`.${prefixCls}-month-event-card-body`) as HTMLElement);
        expect(onClose).not.toHaveBeenCalled();
        expect(card()).not.toBeNull();
    });

    it('标签、星期与 "more" 文案使用语言包', () => {
        const inEnglish = (props: CalendarProps) => render(LocaleProvider, { props: { locale: en_US }, slots: { default: () => <Calendar {...props} /> } });
        const day = inEnglish({ displayValue: today, mode: 'day' });
        expect(day.container.querySelector(`.${prefixCls}-all-day-tag`)).toHaveTextContent('All Day');
        const labels = timeLabels(day.container);
        expect([labels[1], labels[12], labels[13]]).toEqual(['1 AM', '12 PM', '1 PM']);
        day.unmount();

        const week = inEnglish({ displayValue: today, mode: 'week' });
        expect(week.container.querySelector(`.${prefixCls}-week-tag`)).toHaveTextContent('Aug');
        expect(week.container.querySelector(`.${prefixCls}-week-grid-row [role="columnheader"]`)).toHaveTextContent('4Sun');
        week.unmount();

        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        const month = inEnglish({ displayValue: today, events, mode: 'month' });
        expect(month.container.querySelector(`.${prefixCls}-month-header [role="columnheader"]`)).toHaveTextContent('Sun');
        expect(screen.getByText('2 more')).toBeInTheDocument();
    });

    it('#header、class、style、width、height 与 data-* 作用于每种模式的根元素', () => {
        for (const mode of MODES) {
            const view = render(Calendar, {
                attrs: { class: 'custom', style: { color: 'red' }, 'data-testid': `cal-${mode}` },
                props: { height: 300, mode, range: weekRange, width: 500 },
                slots: { header: () => <b class="custom-header">h</b> },
            });
            const root = rootOf(view.container);
            expect(root).toBe(screen.getByTestId(`cal-${mode}`));
            expect(root).toHaveClass('custom', `${prefixCls}-${mode === 'range' ? 'week' : mode}`);
            expect(root.style.color).toBe('red');
            expect(root.style.width).toBe('500px');
            expect(root.style.height).toBe('300px');
            expect(root.querySelector('.custom-header')).not.toBeNull();
            view.unmount();
        }
    });

    it('已声明的属性不落到 DOM，且不产生告警', () => {
        const warn = vi.spyOn(console, 'warn');
        for (const mode of MODES) {
            const view = renderCal(
                {
                    displayValue: today,
                    events: [event('a', new Date(2019, 7, 8, 9))],
                    markWeekend: true,
                    minEventHeight: 10,
                    mode,
                    range: weekRange,
                    scrollTop: 10,
                    showCurrTime: false,
                    weekStartsOn: 1,
                    onClick: () => {},
                    onClose: () => {},
                    onMoreClick: () => {},
                },
                {
                    allDayEvents: () => [],
                    dateGrid: () => [],
                    dateDisplay: ({ date }: { date: Date }) => String(date.getDate()),
                    timeDisplay: ({ time }: { time: number }) => String(time),
                }
            );
            const root = rootOf(view.container);
            for (const name of ['mode', 'events', 'range', 'markweekend', 'mark-weekend', 'weekstartson', 'scrolltop']) {
                expect(root).not.toHaveAttribute(name);
            }
            view.unmount();
        }
        expect(warn).not.toHaveBeenCalled();
    });

    it('当前时间线只有一个刷新定时器，卸载后清除', () => {
        // the midnight timer is a setTimeout, which stays real and out of the count
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        const view = renderCal({ displayValue: today, mode: 'day' });
        expect(vi.getTimerCount()).toBe(1);
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Calendar 作为组件', () => {
    it('每种模式的组件 $el 是视图的根 div', () => {
        for (const mode of MODES) {
            const refs: { instance?: { $el: Element } } = {};
            const view = render(() => <Calendar mode={mode} range={weekRange} ref={(value) => (refs.instance = value as typeof refs.instance)} />);
            expect(refs.instance?.$el).toBe(rootOf(view.container));
            expect(refs.instance?.$el.tagName).toBe('DIV');
            view.unmount();
        }
    });

    it('将未声明的属性传给根元素', () => {
        for (const mode of MODES) {
            const view = render(Calendar, {
                attrs: { id: `cal-${mode}`, 'aria-label': 'schedule' },
                props: { mode, range: weekRange },
            });
            expect(rootOf(view.container)).toHaveAttribute('id', `cal-${mode}`);
            expect(rootOf(view.container)).toHaveAttribute('aria-label', 'schedule');
            view.unmount();
        }
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Calendar: { mode: 'day', scrollTop: 50 } };
        try {
            const { container } = renderCal();
            expect(rootOf(container)).toHaveClass(`${prefixCls}-day`);
            expect(rootOf(container).scrollTop).toBe(50);
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });

    it('key 不变但内容变化的事件会重新渲染', async () => {
        mockLayout({ rectHeight: 300 });
        for (const mode of MODES) {
            const props = { displayValue: today, mode, range: weekRange };
            const view = await renderLaidOut({ ...props, events: [event('a', new Date(2019, 7, 8, 9))] });
            await view.rerender({
                ...props,
                events: [event('a', new Date(2019, 7, 8, 9), undefined, { children: 'changed' })],
            });
            expect(document.body.textContent).toContain('changed');
            view.unmount();
        }
    });

    it('key 不变但时间变化的事件会移动位置', async () => {
        mockLayout();
        const view = await renderLaidOut({
            displayValue: today,
            events: [event('a', new Date(2019, 7, 8, 10))],
            mode: 'day',
        });
        expect(Math.round(px(dayItems(view.container)[0].style.top))).toBe(200);
        await view.rerender({ displayValue: today, events: [event('a', new Date(2019, 7, 8, 14))], mode: 'day' });
        expect(Math.round(px(dayItems(view.container)[0].style.top))).toBe(280);
    });

    it('weekStartsOn 变化时 month 视图重新分配事件到周行', async () => {
        mockLayout({ rectHeight: 300 });
        // Sunday 2019-07-07 opens the second row when weeks start on Sunday and closes the first on Monday
        const displayValue = new Date(2019, 6, 15);
        const events = [event('sunday', new Date(2019, 6, 7, 9), undefined, { allDay: true })];
        const rowOf = (container: Element) => [...container.querySelectorAll(`.${prefixCls}-month-weekrow`)].findIndex((row) => row.querySelector('.evt'));
        const view = render(Calendar, { props: { displayValue, events, mode: 'month' }, slots: evtSlot });
        await nextTick();
        expect(rowOf(view.container)).toBe(1);
        await view.rerender({ displayValue, events, mode: 'month', weekStartsOn: 1 });
        expect(rowOf(view.container)).toBe(0);
        const item = view.container.querySelector<HTMLElement>(`.${prefixCls}-event-month`) as HTMLElement;
        expect(px(item.style.left)).toBeCloseTo((6 / 7) * 100, 0);
    });

    it('month 视图不会重排传入的 events 数组', () => {
        const events = [event('late', new Date(2019, 7, 9, 9)), event('early', new Date(2019, 7, 8, 9))];
        renderCal({ displayValue: today, events, mode: 'month' });
        expect(events.map((e) => e.key)).toEqual(['late', 'early']);
    });

    it('卡片打开时卸载，停止监听外部点击', async () => {
        const onClose = vi.fn<CloseHandler>();
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const view = renderCal({
            displayValue: today,
            events: [event('a', new Date(2019, 7, 8, 9))],
            mode: 'month',
            onClose,
        });
        const before = countLiveListeners(add, remove, 'mousedown');
        await userEvent.click(screen.getByText('还有1项'));
        await waitFor(() => expect(card()).not.toBeNull());
        expect(countLiveListeners(add, remove, 'mousedown')).toBeGreaterThan(before);
        view.unmount();
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
        await fireEvent.mouseDown(document.body);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('从今天切换到其他日期时，day 视图移除当前时间线', async () => {
        const view = renderCal({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(currLine(view.container)).not.toBeNull();
        await view.rerender({ displayValue: new Date(2019, 7, 9), mode: 'day' });
        await nextTick();
        expect(currLine(view.container)).toBeNull();
        await view.rerender({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(currLine(view.container)).not.toBeNull();
    });
});

describe('Calendar 表格语义', () => {
    const cellRoles = '[role="cell"], [role="columnheader"], [role="rowheader"]';
    const roleOf = (el: Element) => el.parentElement?.closest('[role]')?.getAttribute('role');

    // the chain axe requires: table -> rowgroup -> row -> cell, and a li only directly in a ul
    function expectValidTable(container: Element) {
        expect(rootOf(container)).toHaveAttribute('role', 'table');
        for (const rowgroup of container.querySelectorAll('[role="rowgroup"]')) {
            expect(roleOf(rowgroup)).toBe('table');
        }
        for (const row of container.querySelectorAll('[role="row"]')) {
            expect(roleOf(row)).toBe('rowgroup');
        }
        for (const cell of container.querySelectorAll(cellRoles)) {
            expect(roleOf(cell)).toBe('row');
        }
        for (const ul of container.querySelectorAll('ul')) {
            expect(ul.closest(`${cellRoles}, [role="row"]`)?.getAttribute('role') ?? 'cell').not.toBe('row');
        }
        for (const li of container.querySelectorAll('li')) {
            expect(li.parentElement?.tagName).toBe('UL');
        }
        expect(container.querySelectorAll('ul[role], li[role]')).toHaveLength(0);
    }

    it.each(MODES)('%s 视图是由 rowgroup、row 与 cell 组成的表格', (mode) => {
        const { container } = renderCal({ displayValue: today, mode, range: weekRange });
        expect(screen.getByRole('table')).toBe(rootOf(container));
        expectValidTable(container);
    });

    it.each(MODES)('%s 视图的表头内容位于自身行的单元格中', (mode) => {
        const { container } = renderCal({ displayValue: today, mode, range: weekRange }, { header: () => <b>custom header</b> });
        const cell = screen.getByText('custom header').parentElement as HTMLElement;
        expect(cell).toHaveAttribute('role', 'cell');
        expect(roleOf(cell)).toBe('row');
        expectValidTable(container);
    });

    it('week 与 range 视图以月份标签命名，且每天一个列标题', () => {
        const week = renderCal({ displayValue: today, mode: 'week' });
        const label = week.container.querySelector(`.${prefixCls}-week-tag`)?.textContent ?? '';
        expect(label).not.toBe('');
        expect(screen.getByRole('table', { name: label })).toBe(rootOf(week.container));
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
        expect(screen.getByRole('rowheader')).toHaveTextContent('全天');
        week.unmount();

        renderCal({ mode: 'range', range: [new Date(2019, 7, 1), new Date(2019, 7, 4)] });
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    });

    it('day 与 month 视图以显示的日期命名', () => {
        const day = renderCal({ displayValue: today, mode: 'day' });
        expect(screen.getByRole('table', { name: /2019/ })).toBe(rootOf(day.container));
        expect(screen.getByRole('table')).toHaveAccessibleName(expect.stringContaining('8'));
        day.unmount();

        const month = renderCal({ displayValue: today, mode: 'month' });
        expect(screen.getByRole('table', { name: /2019/ })).toBe(rootOf(month.container));
        expect(screen.getAllByRole('columnheader')).toHaveLength(7);
        const weeks = month.container.querySelectorAll(`.${prefixCls}-month-weekrow`).length;
        expect(screen.getAllByRole('cell')).toHaveLength(weeks * 7);
    });

    it('调用方提供的名称替换生成的名称', () => {
        for (const mode of MODES) {
            const view = render(Calendar, {
                attrs: { 'aria-label': 'my plan' },
                props: { displayValue: today, mode, range: weekRange },
            });
            expect(screen.getByRole('table', { name: 'my plan' })).toBeInTheDocument();
            view.unmount();
        }
    });

    it('可滚动视图可通过键盘获取焦点，以便滚动查看内容', () => {
        for (const mode of ['day', 'week', 'range'] as const) {
            const view = renderCal({ displayValue: today, mode, range: weekRange });
            expect(rootOf(view.container)).toHaveAttribute('tabindex', '0');
            view.unmount();
        }
        const month = renderCal({ displayValue: today, mode: 'month' });
        expect(rootOf(month.container)).not.toHaveAttribute('tabindex');
    });

    it('"more" 是打开卡片的按钮，卡片打开后焦点落在关闭按钮上', async () => {
        const warn = vi.spyOn(console, 'warn');
        onTestFinished(() => warn.mockRestore());
        const events = [event('a', new Date(2019, 7, 8, 9)), event('b', new Date(2019, 7, 8, 10))];
        renderCal({ displayValue: today, events, mode: 'month' });
        const more = screen.getByRole('button', { name: '还有2项' });
        expect(more).toHaveAttribute('aria-haspopup', 'dialog');
        expect(more).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        expect(more).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Calendar.close })).toHaveFocus());
        const header = card()?.querySelector(`.${prefixCls}-month-event-card-header-info`) as HTMLElement;
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', header.id);
        expect(header).toHaveTextContent('8');
        expect(warn.mock.calls.filter(([message]) => String(message).includes('no accessible name'))).toEqual([]);
    });
});

describe('Calendar（Vue）', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('CalendarMode 与 foundation 的 MODE 一致', () => {
        expectTypeOf<CalendarMode>().toEqualTypeOf<(typeof strings.MODE)[number]>();
    });

    it('click 只在日期格与时间槽触发，遮住根元素的原生 click', async () => {
        const onClick = vi.fn<ClickHandler>();
        const week = renderCal({ displayValue: today, mode: 'week', onClick });
        await userEvent.click(week.container.querySelector(`.${prefixCls}-week-tag`) as HTMLElement);
        await userEvent.click(week.container.querySelector(`.${prefixCls}-all-day-tag`) as HTMLElement);
        expect(onClick).not.toHaveBeenCalled();
        await userEvent.click(week.container.querySelector('[data-time="10:00:00"]') as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onClick.mock.calls[0][1]).toEqual(new Date(2019, 7, 4, 10, 0, 0));
        week.unmount();

        const onMonthClick = vi.fn<ClickHandler>();
        const month = renderCal({ displayValue: today, mode: 'month', onClick: onMonthClick });
        await userEvent.click(month.container.querySelector(`.${prefixCls}-month-header [role="columnheader"]`) as HTMLElement);
        expect(onMonthClick).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('cell', { name: '2019年8月8日' }));
        expect(onMonthClick).toHaveBeenCalledTimes(1);
        expect(onMonthClick.mock.calls[0][1]).toEqual(today);
    });

    it('close 的载荷：关闭按钮为鼠标事件，Esc 为键盘事件，外部 mousedown 为 null', async () => {
        const onClose = vi.fn<CloseHandler>();
        renderCal({ displayValue: today, events: [event('a', new Date(2019, 7, 8, 9))], mode: 'month', onClose });
        const more = screen.getByRole('button', { name: '还有1项' });

        await userEvent.click(more);
        await waitFor(() => expect(screen.getByRole('button', { name: zh_CN.Calendar.close })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expect(more).toHaveFocus();
        await waitForCardClosed();

        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Calendar.close }));
        expect(onClose.mock.calls[1][0]).toBeInstanceOf(MouseEvent);
        expect(more).toHaveFocus();
        await waitForCardClosed();

        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        await fireEvent.mouseDown(document.body);
        expect(onClose.mock.calls[2][0]).toBeNull();
        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('moreClick 的载荷与 click 互不干扰', async () => {
        const onClick = vi.fn<ClickHandler>();
        const onMoreClick = vi.fn<MoreClickHandler>();
        renderCal({
            displayValue: today,
            events: [event('a', new Date(2019, 7, 8, 9))],
            mode: 'month',
            onClick,
            onMoreClick,
        });
        await userEvent.click(screen.getByRole('button', { name: '还有1项' }));
        expect(onMoreClick).toHaveBeenCalledTimes(1);
        expect(onMoreClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onMoreClick.mock.calls[0].slice(1)).toEqual([today, 1]);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('全局默认值：模块级与 app 级互相隔离，挂载后修改不影响已挂载实例', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Calendar: { mode: 'day', scrollTop: 30, height: 200 } };
        const view = render(Calendar, { global: { provide: { [semiGlobalKey]: semi } } });
        const root = () => rootOf(view.container);
        expect(root()).toHaveClass(`${prefixCls}-day`);
        expect(root().scrollTop).toBe(30);
        expect(root().style.height).toBe('200px');

        semi.config.overrideDefaultProps = { Calendar: { mode: 'month', height: 100 } };
        await view.rerender({ markWeekend: true });
        expect(root()).toHaveClass(`${prefixCls}-day`);
        expect(root().style.height).toBe('200px');
        view.unmount();

        // the app-level config does not leak into the module-level one
        const plain = renderCal();
        expect(rootOf(plain.container)).toHaveClass(`${prefixCls}-week`);
        expect(rootOf(plain.container).style.height).toBe('600px');
    });

    it('布尔简写与缺省值、kebab-case 属性名', async () => {
        const view = render(Calendar, {
            props: {
                'display-value': new Date(2019, 7, 10),
                'mark-weekend': '',
                'min-event-height': 50,
                mode: 'day',
                'week-starts-on': 1,
            } as unknown as CalendarProps,
        });
        await nextTick();
        expect(view.container.querySelector(`.${prefixCls}-grid-skeleton`)).toHaveClass(`${prefixCls}-weekend`);
        expect(currLine(view.container)).toBeNull();
        view.unmount();

        const on = renderCal({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(currLine(on.container)).not.toBeNull();
        on.unmount();
        const off = renderCal({ displayValue: today, mode: 'day', showCurrTime: false });
        await nextTick();
        expect(currLine(off.container)).toBeNull();
    });

    it.each(MODES)('%s 视图：#header 为空时不渲染表头行', async (mode) => {
        const view = render(EmptyHeader, { props: { mode, range: weekRange, show: false } });
        expect(view.container.querySelector('[role="row"] > [role="cell"] > b')).toBeNull();
        const headerRows = () => [...view.container.querySelectorAll('[role="rowgroup"]:first-child > [role="row"]')].filter((row) => row.children.length === 1 && row.firstElementChild?.getAttribute('role') === 'cell');
        expect(headerRows()).toHaveLength(0);
        await view.rerender({ mode, range: weekRange, show: true });
        expect(screen.getByText('custom header').parentElement).toHaveAttribute('role', 'cell');
    });

    it('#event 的参数是 events 中的原对象，每处渲染各调用一次', async () => {
        mockLayout();
        const timed = event('timed', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11), { color: 'red' });
        // spans Saturday 08-10 to Monday 08-12, across two week rows of the month
        const span = event('span', new Date(2019, 7, 10), new Date(2019, 7, 12), { allDay: true, color: 'blue' });
        const events = [timed, span];
        const seen: EventObject[] = [];
        const slots = {
            event: ({ event: item }: CalendarEventSlotProps) => {
                // the test renderer hands the props over as a reactive object, so the items are its proxies
                seen.push(toRaw(item));
                return <i class="evt">{String(item.color)}</i>;
            },
        };
        const day = renderCal({ displayValue: today, events, mode: 'day' }, slots);
        expect(seen).toHaveLength(1);
        expect(seen[0]).toBe(timed);
        expect(day.container.querySelector('.evt')).toHaveTextContent('red');
        day.unmount();

        seen.length = 0;
        mockLayout({ rectHeight: 300 });
        const month = renderCal({ displayValue: today, events, mode: 'month' }, slots);
        await nextTick();
        expect(month.container.querySelectorAll(`.${prefixCls}-event-month .evt`)).toHaveLength(3);
        expect(seen.filter((item) => item === span).length).toBeGreaterThanOrEqual(2);
        expect(seen.every((item) => item === timed || item === span)).toBe(true);
    });

    it('未提供 #event 时渲染 children 文本（string 与 number）', () => {
        const events = [event('a', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10), { children: 'text' }), event('b', new Date(2019, 7, 8, 11), new Date(2019, 7, 8, 12), { children: 42 })];
        const { container } = renderCal({ displayValue: today, events, mode: 'day' });
        expect(dayItems(container).map((item) => item.textContent)).toEqual(['text', '42']);
    });

    it('#dateDisplay 用于 week、range 列标题与 month 每格，day 视图不调用', () => {
        const dateDisplay = vi.fn<(props: { date: Date }) => string>(({ date }) => `d${date.getDate()}`);
        const week = renderCal({ displayValue: today, mode: 'week' }, { dateDisplay });
        expect(dateDisplay).toHaveBeenCalledTimes(7);
        expect(week.container.querySelector('[role="columnheader"]')).toHaveTextContent(/^d4$/);
        week.unmount();

        dateDisplay.mockClear();
        const range = renderCal({ mode: 'range', range: [new Date(2019, 7, 1), new Date(2019, 7, 4)] }, { dateDisplay });
        expect(dateDisplay).toHaveBeenCalledTimes(3);
        range.unmount();

        dateDisplay.mockClear();
        const month = renderCal({ displayValue: today, mode: 'month' }, { dateDisplay });
        const cells = month.container.querySelectorAll('[role="cell"]');
        expect(dateDisplay).toHaveBeenCalledTimes(cells.length);
        month.unmount();

        dateDisplay.mockClear();
        renderCal({ displayValue: today, mode: 'day' }, { dateDisplay });
        expect(dateDisplay).not.toHaveBeenCalled();
    });

    it('#timeDisplay 的 time 为 1 至 23，0 点不调用', () => {
        const times: number[] = [];
        renderCal(
            { mode: 'week' },
            {
                timeDisplay: ({ time }: { time: number }) => {
                    times.push(time);
                    return String(time);
                },
            }
        );
        expect(times).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    });

    it('#dateGrid 的参数：month 每格、range 每列各一次', () => {
        const calls: { date: Date; dateString: string }[] = [];
        const dateGrid = (props: { date: Date; dateString: string }) => {
            calls.push(props);
            return [];
        };
        const month = renderCal({ displayValue: today, mode: 'month' }, { dateGrid });
        expect(calls).toHaveLength(month.container.querySelectorAll('[role="cell"]').length);
        expect(calls.every(({ date, dateString }) => date.toString() === dateString)).toBe(true);
        month.unmount();

        calls.length = 0;
        renderCal({ mode: 'range', range: [new Date(2019, 7, 1), new Date(2019, 7, 4)] }, { dateGrid });
        expect(calls.map(({ date }) => date.getDate())).toEqual([1, 2, 3]);
    });

    it.each(['week', 'range'] as const)('%s 视图：#allDayEvents 收到原数组，提供时全天行不写高度', (mode) => {
        const events = [event('a', new Date(2019, 7, 6), new Date(2019, 7, 7), { allDay: true })];
        const received: EventObject[][] = [];
        const custom = renderCal(
            { displayValue: today, events, mode, range: weekRange },
            {
                allDayEvents: ({ events: list }: { events: EventObject[] }) => {
                    received.push(list);
                    return list.map((item) => <li key={item.key}>{item.key}</li>);
                },
            }
        );
        expect(toRaw(received[0])).toBe(events);
        expect(custom.container.querySelector<HTMLElement>(`.${prefixCls}-all-day`)?.style.height).toBe('');
        custom.unmount();

        const plain = renderCal({ displayValue: today, events, mode, range: weekRange });
        expect(plain.container.querySelector<HTMLElement>(`.${prefixCls}-all-day`)?.style.height).toBe(`${calcRowHeight([{ key: 'a', topInd: 0 }])}em`);
    });

    const onlyDateGrid = (mode: CalendarMode) =>
        renderCal(
            {
                displayValue: today,
                events: [event('allday', new Date(2019, 7, 6), new Date(2019, 7, 7), { allDay: true }), event('timed', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10))],
                mode,
                range: weekRange,
            },
            { dateGrid: () => <i class="grid" /> }
        );

    it.each(MODES)('%s 视图：只提供 #dateGrid 时渲染该插槽', (mode) => {
        const { container } = onlyDateGrid(mode);
        expect(container.querySelectorAll('.grid').length).toBeGreaterThan(0);
    });

    it('month 视图：只提供 #dateGrid 时日期格仍显示默认内容', () => {
        const { container } = onlyDateGrid('month');
        expect(container.querySelector('[role="cell"]')?.textContent).not.toBe('');
    });

    it.each(['day', 'week', 'range'] as const)('%s 视图：只提供 #dateGrid 时事件回落默认内容', (mode) => {
        const { container } = onlyDateGrid(mode);
        expect(container.textContent).toContain('timed');
    });

    it.each(['week', 'range'] as const)('%s 视图：只提供 #dateGrid 时全天行回落默认内容', (mode) => {
        const { container } = onlyDateGrid(mode);
        expect(container.querySelector<HTMLElement>(`.${prefixCls}-all-day`)?.style.height).toMatch(/em$/);
        expect(container.textContent).toContain('allday');
    });

    it.each(MODES)('%s 视图：属性透传与覆盖', async (mode) => {
        const onKeydown = vi.fn<(event: KeyboardEvent) => void>();
        const onMouseenter = vi.fn<(event: MouseEvent) => void>();
        const { container } = render(Calendar, {
            attrs: {
                id: 'cal',
                class: 'extra',
                style: { height: '123px' },
                'data-x': '1',
                'aria-label': 'plan',
                tabindex: '-1',
                role: 'grid',
                onKeydown,
                onMouseenter,
            },
            props: { displayValue: today, mode, range: weekRange, width: 300 },
        });
        const root = rootOf(container);
        expect(root).toHaveAttribute('id', 'cal');
        expect(root).toHaveClass('extra');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root).toHaveAttribute('aria-label', 'plan');
        expect(root).not.toHaveAttribute('aria-labelledby');
        expect(root).toHaveAttribute('tabindex', '-1');
        expect(root).toHaveAttribute('role', 'grid');
        expect(root.style.height).toBe('123px');
        expect(root.style.width).toBe('300px');
        await fireEvent.keyDown(root, { key: 'a' });
        await fireEvent.mouseEnter(root);
        expect(onKeydown).toHaveBeenCalledTimes(1);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });

    it('width、height：数字加 px，字符串原样', () => {
        const { container } = renderCal({ height: '50%', width: 320 });
        expect(rootOf(container).style.height).toBe('50%');
        expect(rootOf(container).style.width).toBe('320px');
    });

    it('displayValue、weekStartsOn、markWeekend、mode 变化后视图更新，旧视图的定时器与监听被清理', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const view = renderCal({ displayValue: today, mode: 'week' });
        await nextTick();
        expect(vi.getTimerCount()).toBe(1);
        const firstHeader = () => view.container.querySelector('[role="columnheader"]');
        expect(firstHeader()).toHaveTextContent('4周日');
        await view.rerender({ displayValue: today, mode: 'week', weekStartsOn: 1 });
        expect(firstHeader()).toHaveTextContent('5周一');
        await view.rerender({ displayValue: new Date(2019, 7, 20), mode: 'week', weekStartsOn: 1, markWeekend: true });
        expect(firstHeader()).toHaveTextContent('19周一');
        expect(view.container.querySelectorAll(`[role="columnheader"].${prefixCls}-weekend`)).toHaveLength(2);
        expect(vi.getTimerCount()).toBe(0);

        await view.rerender({ displayValue: today, mode: 'day' });
        await nextTick();
        expect(vi.getTimerCount()).toBe(1);
        await view.rerender({ displayValue: today, mode: 'month', events: [event('a', new Date(2019, 7, 8, 9))] });
        expect(vi.getTimerCount()).toBe(0);
        await fireEvent.click(screen.getByRole('button', { name: '还有1项' }));
        await waitFor(() => expect(card()).not.toBeNull());
        await view.rerender({ displayValue: today, mode: 'week' });
        expect(countLiveListeners(add, remove, 'mousedown')).toBe(0);
    });

    it('events 为 reactive 数组时原地 push 会更新视图', async () => {
        const events = reactive<EventObject[]>([event('a', new Date(2019, 7, 8, 9), new Date(2019, 7, 8, 10))]);
        const { container } = renderCal({ displayValue: today, events, mode: 'day' });
        expect(dayItems(container)).toHaveLength(1);
        events.push(event('b', new Date(2019, 7, 8, 11), new Date(2019, 7, 8, 12)));
        await nextTick();
        expect(dayItems(container).map((item) => item.textContent)).toEqual(['a', 'b']);
    });

    it('卡片列表跳过稀疏数组的空位', async () => {
        mockLayout({ rectHeight: 60 });
        const events = [event('a', new Date(2019, 7, 5), undefined, { allDay: true }), event('b', new Date(2019, 7, 5), new Date(2019, 7, 7), { allDay: true })];
        renderCal({ displayValue: today, events, mode: 'month' });
        await nextTick();
        const tuesday = screen.getByRole('cell', { name: '2019年8月6日' });
        await userEvent.click(within(tuesday).getByRole('button'));
        await waitFor(() => expect(card()).not.toBeNull());
        const items = [...(card() as HTMLElement).querySelectorAll('li')];
        expect(items.map((li) => li.textContent)).toEqual(['b']);
    });

    it('折叠格 tabindex 为 -1，"更多" 按钮是该日唯一的 Tab 停靠点', async () => {
        renderCal({ displayValue: today, events: [event('a', new Date(2019, 7, 8, 9))], mode: 'month' });
        const more = screen.getByRole('button', { name: '还有1项' });
        const cell = more.closest('[role="cell"]') as HTMLElement;
        expect(cell).toHaveAttribute('tabindex', '-1');
        await userEvent.tab();
        expect(more).toHaveFocus();
        await userEvent.tab();
        expect(document.body).toHaveFocus();
    });

    it.each(['week', 'range'] as const)('%s 视图：今天的列标题带 aria-current="date"', async (mode) => {
        await renderLaidOut({ displayValue: today, mode, range: weekRange });
        const current = screen.getAllByRole('columnheader').filter((th) => th.hasAttribute('aria-current'));
        expect(current).toHaveLength(1);
        expect(current[0]).toHaveAttribute('aria-current', 'date');
        expect(current[0]).toHaveTextContent(/^8/);
    });

    it('再次点击已打开的 "更多" 收起卡片，只发一次 close', async () => {
        const onClose = vi.fn<CloseHandler>();
        const onMoreClick = vi.fn<MoreClickHandler>();
        renderCal({
            displayValue: today,
            events: [event('a', new Date(2019, 7, 8, 9))],
            mode: 'month',
            onClose,
            onMoreClick,
        });
        const more = screen.getByRole('button', { name: '还有1项' });
        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        await userEvent.click(more);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        expect(onMoreClick).toHaveBeenCalledTimes(1);
        expect(more).toHaveAttribute('aria-expanded', 'false');
        expect(more).toHaveFocus();
        await waitForCardClosed();
    });

    it('打开卡片的日期格不再折叠时关闭卡片并触发 close，之后不会自行重新弹出', async () => {
        const onClose = vi.fn<CloseHandler>();
        const events = [event('a', new Date(2019, 7, 8, 9))];
        const view = renderCal({ displayValue: today, events, mode: 'month', onClose });
        await userEvent.click(screen.getByRole('button', { name: '还有1项' }));
        await waitFor(() => expect(card()).not.toBeNull());
        await view.rerender({ displayValue: today, events: [], mode: 'month', onClose });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBeNull();
        await view.rerender({ displayValue: today, events, mode: 'month', onClose });
        expect(screen.getByRole('button', { name: '还有1项' })).toHaveAttribute('aria-expanded', 'false');
        await waitForCardClosed();
    });

    it('隐藏挂载后变为可见时重新定位事件与时间线，并补写一次 scrollTop', async () => {
        const observer = mockResizeObserver();
        const height = vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(0);
        const { container } = renderCal({
            displayValue: today,
            events: [event('a', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11))],
            mode: 'day',
        });
        await nextTick();
        const root = rootOf(container);
        expect(px(dayItems(container)[0].style.top)).toBe(0);
        root.scrollTop = 0;
        height.mockReturnValue(480);
        const scroll = container.querySelector(`.${prefixCls}-day-scroll`) as HTMLElement;
        await observer.fire(scroll, [{}]);
        expect(Math.round(px(dayItems(container)[0].style.top))).toBe(200);
        expect(px((currLine(container) as HTMLElement).style.top)).toBe(240);
        expect(root.scrollTop).toBe(400);
        root.scrollTop = 10;
        await observer.fire(scroll, [{}]);
        expect(root.scrollTop).toBe(10);
    });

    it('showCurrTime 运行时切换立即生效，关闭后清除刷新定时器', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2019, 7, 8, 12, 0, 0));
        const view = renderCal({ displayValue: today, mode: 'day', showCurrTime: false });
        await nextTick();
        expect(currLine(view.container)).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
        await view.rerender({ displayValue: today, mode: 'day', showCurrTime: true });
        await nextTick();
        expect(currLine(view.container)).not.toBeNull();
        expect(vi.getTimerCount()).toBe(1);
        await view.rerender({ displayValue: today, mode: 'day', showCurrTime: false });
        await nextTick();
        expect(currLine(view.container)).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['week', 'range'] as const)('%s 视图：全天条带按事件 key 复用 DOM 节点', async (mode) => {
        const at = (aDay: number) => ({
            displayValue: today,
            events: [event('a', new Date(2019, 7, aDay), undefined, { allDay: true }), event('b', new Date(2019, 7, 6), undefined, { allDay: true })],
            mode,
            range: weekRange,
        });
        const view = renderCal(at(5));
        const itemOf = (key: string) => allDayItems(view.container).find((item) => item.textContent === key);
        const before = itemOf('a');
        expect(allDayItems(view.container).map((item) => item.textContent)).toEqual(['a', 'b']);
        await view.rerender(at(8));
        expect(allDayItems(view.container).map((item) => item.textContent)).toEqual(['b', 'a']);
        expect(itemOf('a')).toBe(before);
    });

    it('events 的 key 重复或为空时，#event 不取到别的事件的自定义字段', () => {
        mockLayout();
        const events = [event('dup', new Date(2019, 7, 8, 10), new Date(2019, 7, 8, 11), { color: 'red' }), event('dup', new Date(2019, 7, 8, 12), new Date(2019, 7, 8, 13), { color: 'blue' }), event('', new Date(2019, 7, 8, 14), new Date(2019, 7, 8, 15), { color: 'green' })];
        const view = renderCal({ displayValue: today, events, mode: 'day' }, { event: ({ event: item }: CalendarEventSlotProps) => <i class="evt">{String(item.color)}</i> });
        // an ambiguous key cannot name an event, so each piece keeps its own (field-less) layout copy
        const colors = [...view.container.querySelectorAll('.evt')].map((node) => node.textContent);
        expect(colors).toEqual(['undefined', 'undefined', 'undefined']);
    });

    it.each(MODES)('%s 视图：renderToString 不抛错，且不访问 document', async (mode) => {
        const touched = [vi.spyOn(document, 'querySelector'), vi.spyOn(document, 'getElementById')];
        const html = await renderToString(
            createSSRApp({
                render: () => <Calendar displayValue={today} events={[event('a', new Date(2019, 7, 8, 9))]} mode={mode} range={weekRange} />,
            })
        );
        expect(html).toContain('role="table"');
        for (const spy of touched) {
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        }
    });

    it('ja_JP 下的关闭按钮、全天与 "更多" 名称', async () => {
        const inJapanese = (props: CalendarProps) => render(LocaleProvider, { props: { locale: ja_JP }, slots: { default: () => <Calendar {...props} /> } });
        const week = inJapanese({ displayValue: today, mode: 'week' });
        expect(screen.getByRole('rowheader')).toHaveTextContent(ja_JP.Calendar.allDay);
        week.unmount();

        const events = [event('a', new Date(2019, 7, 8, 9))];
        inJapanese({ displayValue: today, events, mode: 'month' });
        const more = screen.getByRole('button', { name: ja_JP.Calendar.remaining.replace('${remained}', '1') });
        await userEvent.click(more);
        await waitFor(() => expect(screen.getByRole('button', { name: ja_JP.Calendar.close })).toBeInTheDocument());
    });

    it('KeepAlive 切走再切回后卡片已关闭', async () => {
        const onClose = vi.fn<CloseHandler>();
        const props = { displayValue: today, events: [event('a', new Date(2019, 7, 8, 9))], onClose };
        const view = render(CachedMonth, { props: { ...props, active: true } });
        await userEvent.click(screen.getByRole('button', { name: '还有1项' }));
        await waitFor(() => expect(card()).not.toBeNull());
        await view.rerender({ ...props, active: false });
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBeNull();
        await view.rerender({ ...props, active: true });
        await waitForCardClosed();
        expect(screen.getByRole('button', { name: '还有1项' })).toHaveAttribute('aria-expanded', 'false');
    });
});
