import { createSignal } from 'solid-js';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { clickOutside, expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Calendar, { type CalendarProps } from '..';
import Popover from '../../popover';
import Radio from '../../radio';
import RadioGroup from '../../radio/radio-group';

const displayValue = new Date(2019, 6, 23, 8, 32, 0);
const events = [
    [new Date(2019, 5, 25, 14, 45), new Date(2019, 6, 26, 6, 18)],
    [new Date(2019, 6, 18, 10, 0), new Date(2019, 6, 30, 8, 0)],
    [new Date(2019, 6, 19, 20, 0), new Date(2019, 6, 23, 14, 0)],
    [new Date(2019, 6, 21, 6, 0), new Date(2019, 6, 25, 6, 0)],
    [new Date(2019, 6, 22, 9, 0), new Date(2019, 6, 23, 23, 0)],
    [new Date(2019, 6, 23, 8, 32)],
    [new Date(2019, 6, 23, 14, 30), new Date(2019, 6, 23, 20, 0)],
    [new Date(2019, 6, 25, 8, 0), new Date(2019, 6, 27, 6, 0)],
    [new Date(2019, 6, 26, 10, 0), new Date(2019, 6, 27, 16, 0)],
].map(([start, end], i) => ({ key: String(i), start, end, children: () => <div>event {i}</div> }));

const prefixCls = `${BASE_CLASS_PREFIX}-calendar`;
const eventItemSelector = `.${prefixCls}-event-item`;
const moreSelector = `.${prefixCls}-month-event-card-wrapper`;
const card = () => document.querySelector(`.${prefixCls}-month-event-card`);
const renderMonth = (list: CalendarProps['events'] | (() => CalendarProps['events'])) => <Calendar displayValue={displayValue} events={typeof list === 'function' ? list() : list} height={305} mode="month" />;
const snapshot = (container: HTMLElement) => ({
    items: [...container.querySelectorAll(eventItemSelector)].map((item) => item.textContent),
    more: [...container.querySelectorAll(moreSelector)].map((item) => item.textContent),
});

describe('Calendar（浏览器）', () => {
    it('Fix1892：挂载后设置的事件与挂载时传入的事件一样遵守行数限制', () => {
        const { container: mounted, unmount } = render(() => renderMonth(events));
        const expected = snapshot(mounted);
        unmount();
        // At 305px a week row fits no event row, so the row limit is 0 and every day with events collapses into
        // "N more". A limit of 0 is the case the bug broke: the update path fell back to the events array as limit
        expect(expected.items).toEqual([]);
        expect(expected.more.length).toBeGreaterThan(0);
        expected.more.forEach((text) => expect(text).toMatch(/\d/));

        const [list, setList] = createSignal<CalendarProps['events']>([]);
        const { container } = render(() => <Calendar displayValue={displayValue} events={list()} height={305} mode="month" />);
        expect(snapshot(container)).toEqual({ items: [], more: [] });
        setList(events);
        expect(snapshot(container)).toEqual(expected);
    });

    it('换到周数更多的月份后，行数上限与 "更多" 计数随行高重算', () => {
        const sameDay = (month: number) =>
            ['a', 'b', 'c', 'd'].map((name, i) => ({
                key: `${month}${name}`,
                start: new Date(2019, month, 12, 9 + i),
                children: () => <div>{name}</div>,
            }));
        const list = [...sameDay(7), ...sameDay(2)];
        const [month, setMonth] = createSignal(7);
        const counts = (container: HTMLElement) => {
            const visible = container.querySelectorAll(eventItemSelector).length;
            const more = Number(container.querySelector(moreSelector)?.textContent?.match(/\d+/)?.[0]);
            return { visible, more };
        };
        const { container } = render(() => <Calendar displayValue={new Date(2019, month(), 12)} events={list} height={600} mode="month" />);
        const august = counts(container);
        setMonth(2);
        const march = counts(container);
        expect(august.visible + august.more).toBe(4);
        expect(march.visible + march.more).toBe(4);
        expect(march.visible).toBeLessThan(august.visible);
    });

    it('事件渲染', async () => {
        const storyEvents = (
            [
                [new Date(2019, 5, 25, 14, 45), new Date(2019, 6, 26, 6, 18), '6月25日 14:45 ~ 7月26日 6:18'],
                [new Date(2019, 6, 18, 10, 0), new Date(2019, 6, 30, 8, 0), '7月18日 10:00 ~ 7月30日 8:00'],
                [new Date(2019, 6, 19, 20, 0), new Date(2019, 6, 23, 14, 0), '7月19日 20:00 ~ 7月23日 14:00'],
                [new Date(2019, 6, 21, 6, 0), new Date(2019, 6, 25, 6, 0), '7月21日 6:00 ~ 7月25日 6:00'],
                [new Date(2019, 6, 22, 8, 0), undefined, '7月22日 全天', true],
                [new Date(2019, 6, 22, 9, 0), new Date(2019, 6, 23, 23, 0), '7月22日 9:00 ~ 7月23日 23:00'],
                [new Date(2019, 6, 23, 8, 32), undefined, '7月23日 8:32'],
                [new Date(2019, 6, 23, 14, 30), new Date(2019, 6, 23, 20, 0), '7月23日 14:30-20:00'],
                [new Date(2019, 6, 25, 8, 0), new Date(2019, 6, 27, 6, 0), '7月25日 8:00 ~ 7月27日 6:00'],
                [new Date(2019, 6, 26, 10, 0), new Date(2019, 6, 27, 16, 0), '7月26日 10:00 ~ 7月27日 16:00'],
            ] as [Date, Date | undefined, string, boolean?][]
        ).map(([start, end, text, allDay], i) => ({
            key: String(i),
            start,
            end,
            allDay,
            children: () => <div style={{ height: '100%', overflow: 'hidden' }}>{text}</div>,
        }));
        function Demo() {
            const [mode, setMode] = createSignal<CalendarProps['mode']>('week');
            const [clickDate, setClickDate] = createSignal<string | number>('?');
            return (
                <>
                    <RadioGroup value={mode()} onChange={(e) => setMode(e.target.value)}>
                        <Radio value="day">日视图</Radio>
                        <Radio value="week">周视图</Radio>
                        <Radio value="month">月视图</Radio>
                        <Radio value="range">多日视图</Radio>
                    </RadioGroup>
                    <Calendar displayValue={displayValue} events={storyEvents} height={400} mode={mode()} range={mode() === 'range' ? [new Date(2019, 6, 23), new Date(2019, 6, 26)] : []} onClick={(_e, date) => setClickDate(date.getDate())} />
                    <div>当前点击的日期是{clickDate()}号</div>
                </>
            );
        }
        const { container } = render(() => <Demo />);
        const eventItems = () => [...container.querySelectorAll(eventItemSelector)].map((item) => item.textContent);
        const timeSlot = (time: string, index = 0) => container.querySelectorAll(`[data-time="${time}"]`)[index] as HTMLElement;

        expect(eventItems()).toContain('7月23日 8:32');

        await userEvent.click(screen.getByText('日视图'));
        expect(eventItems()).toContain('7月23日 8:32');
        // Event blocks may cover the time slot, the click only needs to reach the slot's handler
        await userEvent.click(timeSlot('01:30:00'), { force: true });
        expect(screen.getByText('当前点击的日期是23号')).toBeInTheDocument();

        await userEvent.click(screen.getByText('月视图'));
        await userEvent.click(screen.getAllByText('还有3项')[0]);
        await waitFor(() => expect(card()).not.toBeNull());
        await clickOutside();
        await waitFor(() => expect(card()).toBeNull());

        await userEvent.click(screen.getAllByText('还有3项')[0]);
        await waitFor(() => expect(card()).not.toBeNull());
        await userEvent.click(document.querySelector(`.${prefixCls}-month-event-card-close`) as Element);
        await waitFor(() => expect(card()).toBeNull());

        await userEvent.click(screen.getByText('多日视图'));
        await userEvent.click(timeSlot('09:30:00', 1), { force: true });
        expect(screen.getByText('当前点击的日期是24号')).toBeInTheDocument();
    });

    it('月视图事件渲染', () => {
        const monthEvents = (
            [
                [new Date(2019, 5, 25, 14, 45), undefined, '6月25日 14:45'],
                [new Date(2019, 6, 18, 10, 0), undefined, '7月18日 10:00'],
                [new Date(2019, 6, 19, 20, 0), undefined, '7月19日 20:00'],
                [new Date(2019, 6, 21, 6, 0), undefined, '7月21日 6:00'],
                [new Date(2019, 6, 22, 8, 0), undefined, '7月22日 全天', true],
                [new Date(2019, 6, 23, 9, 0), undefined, '7月23日 全天', true],
                [new Date(2019, 6, 24, 8, 32), undefined, '7月24日 8:32'],
                [new Date(2019, 6, 25, 8, 32), new Date(2019, 6, 26, 8, 32), '7月25日 8:32 - 7月26日 8:32'],
            ] as [Date, Date | undefined, string, boolean?][]
        ).map(([start, end, text, allDay], i) => ({
            key: String(i),
            start,
            end,
            allDay,
            children: () => <div class="eventDay">{text}</div>,
        }));
        const { container } = render(() => <Calendar displayValue={displayValue} events={monthEvents} height={400} mode="month" />);
        expect(container.querySelectorAll('.eventDay')).toHaveLength(7);
    });

    describe('通过键盘打开 "more" 卡片', () => {
        const openFromKeyboard = async () => {
            render(() => renderMonth(events));
            const more = screen.getAllByRole('button', { name: /还有/ })[0];
            await tabTo(more);
            expectThemeFocusRing(more);
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(card()).not.toBeNull());
            await waitFor(() => expect(screen.getByRole('button', { name: '关闭' })).toHaveFocus());
            return more;
        };

        it('Esc 关闭卡片并将焦点返回 "more"', async () => {
            const more = await openFromKeyboard();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(card()).toBeNull());
            expect(more).toHaveFocus();
            expect(more).toHaveAttribute('aria-expanded', 'false');
        });

        it('打开卡片不产生 "dialog has no accessible name" 告警', async () => {
            const warn = vi.spyOn(console, 'warn');
            try {
                await openFromKeyboard();
                expect(warn.mock.calls.flat().join('\n')).not.toMatch(/no accessible name/);
            } finally {
                warn.mockRestore();
            }
        });

        it('关闭按钮将焦点返回 "more"', async () => {
            const more = await openFromKeyboard();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(card()).toBeNull());
            expect(more).toHaveFocus();
        });
    });

    it('右侧边缘日期的 "more" 卡片在关闭的离场期间保持打开时的位置', async () => {
        const saturday = [0, 1].map((i) => ({
            key: String(i),
            start: new Date(2019, 7, 10, 9 + i),
            end: new Date(2019, 7, 10, 10 + i),
            children: () => <div>event {i}</div>,
        }));
        render(() => <Calendar displayValue={new Date(2019, 7, 8)} events={saturday} height={305} mode="month" />);
        const popover = () => document.querySelector(`.${prefixCls}-month-event-card`)?.closest<HTMLElement>('[popover]');
        // the layout box of the fixed popover, which the scale of the enter and exit animations does not change; the
        // exit plays while the popover is still open, and it stays mounted but hidden once the exit ends
        const box = () => {
            const popup = popover();
            return popup?.checkVisibility() ? { left: popup.offsetLeft, top: popup.offsetTop, width: popup.offsetWidth, height: popup.offsetHeight } : null;
        };

        await userEvent.click(screen.getByRole('button', { name: /还有/ }));
        await waitFor(() => expect(box()).not.toBeNull());
        const opened = box() as NonNullable<ReturnType<typeof box>>;
        expect(opened.left).toBeGreaterThanOrEqual(0);
        expect(opened.left + opened.width).toBeLessThanOrEqual(document.documentElement.clientWidth);
        // the exit can end before the click's round trip returns under load, so every frame is recorded from before the
        // click; an exit frame is the open popover without the show class, which is what plays the exit animation
        const seen: ReturnType<typeof box>[] = [];
        let exitFrames = 0;
        let sampling = true;
        const sample = () => {
            const current = box();
            if (current) {
                seen.push(current);
                if (popover()?.matches(`:popover-open:not(.${BASE_CLASS_PREFIX}-popover-wrapper-show)`)) {
                    exitFrames += 1;
                }
            }
            if (sampling) {
                requestAnimationFrame(sample);
            }
        };
        requestAnimationFrame(sample);
        try {
            await userEvent.click(screen.getByRole('button', { name: '关闭' }));
            await waitFor(() => expect(box()).toBeNull());
        } finally {
            sampling = false;
        }
        expect(exitFrames).toBeGreaterThan(0);
        for (const rect of seen) {
            expect(rect).toEqual(opened);
        }
    });

    it.each(['week', 'day'] as const)('滚动的 %s 视图获得键盘焦点时显示主题焦点环', async (mode) => {
        const { container } = render(() => <Calendar displayValue={displayValue} height={300} mode={mode} />);
        const view = container.querySelector(`.${prefixCls}-${mode}`) as HTMLElement;
        await tabTo(view);
        expectThemeFocusRing(view);
    });

    it.each(['week', 'range'] as const)('%s 视图的表头、全天行和时间网格共享列边缘', (mode) => {
        const { container } = render(() => <Calendar displayValue={displayValue} height={300} mode={mode} range={mode === 'range' ? [new Date(2019, 6, 23), new Date(2019, 6, 26)] : []} />);
        const left = (selector: string) => (container.querySelector(selector) as Element).getBoundingClientRect().left;
        const gridLeft = left(`.${prefixCls}-grid`);
        expect(left('[role="columnheader"]')).toBe(gridLeft);
        expect(left(`.${prefixCls}-all-day-skeleton > div`)).toBe(gridLeft);
    });

    it.each(['week', 'range'] as const)('%s 视图中的全天事件无论内容多高都保持在所属行内', (mode) => {
        const { container } = render(() => (
            <Calendar
                displayValue={displayValue}
                events={[
                    { ...events[0], children: () => <div style={{ height: '42px' }}>tall</div> },
                    { ...events[1], children: () => <div>next</div> },
                ]}
                height={300}
                mode={mode}
                range={mode === 'range' ? [new Date(2019, 6, 23), new Date(2019, 6, 26)] : []}
            />
        ));
        const [tall, next] = container.querySelectorAll(`.${prefixCls}-event-allday`);
        expect(tall.getBoundingClientRect().bottom).toBeLessThanOrEqual(next.getBoundingClientRect().top);
        expect(tall.getBoundingClientRect().height).toBe(next.getBoundingClientRect().height);
    });

    it('在隐藏容器中挂载的时间网格变为可见后，事件按网格高度定位并滚动到 scrollTop', async () => {
        const timed = [{ key: 't', start: new Date(2019, 6, 23, 12), end: new Date(2019, 6, 23, 13), children: () => 'timed' }];
        function Host() {
            const [hidden, setHidden] = createSignal(true);
            return (
                <div>
                    <button type="button" onClick={() => setHidden(false)}>
                        show
                    </button>
                    <div style={{ display: hidden() ? 'none' : 'block' }}>
                        <Calendar displayValue={displayValue} events={timed} height={300} mode="week" scrollTop={120} />
                    </div>
                </div>
            );
        }
        const { container } = render(() => <Host />);
        await userEvent.click(screen.getByRole('button', { name: 'show' }));
        const root = container.querySelector<HTMLElement>(`.${prefixCls}-week`) as HTMLElement;
        await waitFor(() => {
            expect(parseFloat((container.querySelector(`.${prefixCls}-event-day`) as HTMLElement).style.top)).toBeGreaterThan(0);
            expect(root.scrollTop).toBe(120);
        });
    });

    it('月视图折叠日期格不占 Tab 停靠点，Tab 直接到达 "more" 按钮', async () => {
        render(() => (
            <div>
                <button type="button">before</button>
                {renderMonth(events)}
            </div>
        ));
        const more = screen.getAllByRole('button', { name: /还有/ })[0];
        screen.getByRole('button', { name: 'before' }).focus();
        await userEvent.keyboard('{Tab}');
        expect(more).toHaveFocus();
    });

    it('月视图卡片内嵌套 Popover 的内容里按下鼠标不关闭卡片，body 上按下才关闭', async () => {
        const nested = [
            {
                key: 'a',
                start: new Date(2019, 6, 23, 9),
                children: () => (
                    <Popover aria-label="Details" content={<button type="button">inside nested</button>} motion={false} stopPropagation={false} trigger="click">
                        {(t) => (
                            <button type="button" {...t()}>
                                nested trigger
                            </button>
                        )}
                    </Popover>
                ),
            },
            { key: 'b', start: new Date(2019, 6, 23, 10), children: () => <div>b</div> },
        ];
        render(() => renderMonth(nested));
        const more = screen.getByRole('button', { name: /还有/ });
        await userEvent.click(more);
        await waitFor(() => expect(card()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'nested trigger' }));
        const inside = await screen.findByRole('button', { name: 'inside nested' });
        expect(card()?.contains(inside)).toBe(false);

        fireEvent.mouseDown(inside);
        expect(more).toHaveAttribute('aria-expanded', 'true');
        fireEvent.mouseDown(document.body);
        await waitFor(() => expect(card()).toBeNull());
    });
});
