import { For, Show, children, createMemo, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { isSameDay } from 'date-fns';
import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
import { calcRowHeight, toPercent } from '@fibrae/semi-foundation/components/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
import { getDateFnsLocale } from '@fibrae/semi-foundation/utils/date-fns-locale';
import '@fibrae/semi-foundation/components/calendar/calendar.scss';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import ByKey from './by-key';
import DayCol from './day-col';
import EventContent from './event-content';
import type { DayCalendarProps, DayColProps } from './interface';
import useScrollGrid from './primitives/use-scroll-grid';
import useToday from './primitives/use-today';
import TimeCol from './time-col';
import { rootStyle, viewPropKeys } from './view-props';

const prefixCls = `${cssClasses.PREFIX}-week`;
const allDayCls = `${cssClasses.PREFIX}-all-day`;

export interface TimeGridProps extends DayCalendarProps {
    /** The days to show, [start, end) */
    range: Date[];
    /** The date whose month names the grid; the first day of the range by default */
    labelDate?: Date;
}

export default function TimeGrid(props: TimeGridProps) {
    const [local, rest] = splitProps(props, [...viewPropKeys, 'labelDate']);

    const locale = useLocale('Calendar');
    const config = useConfig();

    const monthId = createUniqueId();

    const { rootRef, scrollRef, scrollHeight } = useScrollGrid(() => local.scrollTop ?? 0);
    const today = useToday();

    const header = children(() => local.header);

    // a prop is read through a memo: an unrelated key change would rebuild what it renders
    const renderDateDisplay = createMemo(() => local.renderDateDisplay);
    const renderTimeDisplay = createMemo(() => local.renderTimeDisplay);
    const dateGridRender = createMemo(() => local.dateGridRender);
    const allDayEventsRender = createMemo(() => local.allDayEventsRender);
    const events = createMemo(() => local.events ?? []);
    const range = createMemo(() => local.range);
    const labelDate = createMemo(() => local.labelDate);
    const weekStartsOn = createMemo(() => local.weekStartsOn ?? 0);

    // today is applied per cell, so the mount-time today does not rebuild the grid the server rendered
    const data = createMemo(() => CalendarFoundation.getRangeData(range(), getDateFnsLocale(locale().localeCode, config().dateFnsLocale), weekStartsOn(), null, labelDate()));
    const parsedEvents = createMemo(() => CalendarFoundation.getParsedRangeEvents(events()));
    const allDayEvents = createMemo(() => CalendarFoundation.parseRangeAllDayEvents(parsedEvents().allDay, range()));

    const isToday = (date: Date) => {
        const day = today();
        return day !== null && isSameDay(date, day);
    };

    const handleClick: DayColProps['handleClick'] = (e, val) => {
        local.onClick?.(e, CalendarFoundation.formatCbValue(val));
    };

    return (
        <div
            aria-labelledby={rest['aria-label'] ? undefined : monthId}
            role="table"
            // the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root
            tabIndex={0}
            {...rest}
            ref={mergeRefs(local.ref, rootRef)}
            class={clsx(prefixCls, local.class)}
            style={rootStyle(local.style, local.width, local.height)}
        >
            <div class={`${prefixCls}-sticky-top`} role="rowgroup">
                <Show when={hasContent(header())}>
                    <div role="row">
                        <div role="cell">{header()}</div>
                    </div>
                </Show>
                <div class={`${prefixCls}-header`} role="row">
                    <div id={monthId} class={`${cssClasses.PREFIX}-tag ${prefixCls}-tag ${prefixCls}-sticky-left`} role="cell">
                        <span>{data().month}</span>
                    </div>
                    <div class={`${prefixCls}-grid`}>
                        <div class={`${prefixCls}-grid-row`}>
                            <For each={data().week}>
                                {(day) => (
                                    <div
                                        class={clsx({
                                            [`${cssClasses.PREFIX}-today`]: isToday(day.date),
                                            [`${cssClasses.PREFIX}-weekend`]: local.markWeekend && day.isWeekend,
                                        })}
                                        aria-current={isToday(day.date) ? 'date' : undefined}
                                        role="columnheader"
                                    >
                                        <Show
                                            keyed
                                            when={renderDateDisplay()}
                                            fallback={
                                                <>
                                                    <span class={`${cssClasses.PREFIX}-today-date`}>{day.dayString}</span>
                                                    <span>{day.weekday}</span>
                                                </>
                                            }
                                        >
                                            {(render) => render(day.date)}
                                        </Show>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
                <div class={allDayCls} style={allDayEventsRender() ? undefined : { height: `${calcRowHeight(allDayEvents())}em` }} role="row">
                    <div class={`${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left`} role="rowheader">
                        <span>{locale().locale.allDay}</span>
                    </div>
                    <div class={`${cssClasses.PREFIX}-content ${allDayCls}-content`} role="cell">
                        <div class={`${allDayCls}-skeleton`}>
                            <For each={data().week}>{(day) => <div class={clsx({ [`${cssClasses.PREFIX}-weekend`]: local.markWeekend && day.isWeekend })} />}</For>
                        </div>
                        <ul class={`${cssClasses.PREFIX}-event-items`}>
                            <Show
                                keyed
                                when={allDayEventsRender()}
                                fallback={
                                    <ByKey each={allDayEvents()} by={(event, index) => event.key || `allDay-${index}`}>
                                        {(event) => (
                                            <li
                                                class={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`}
                                                style={{
                                                    'inset-inline-start': toPercent(event().leftPos as number),
                                                    width: toPercent(event().width as number),
                                                    top: `${event().topInd}em`,
                                                }}
                                            >
                                                <EventContent of={event().children} />
                                            </li>
                                        )}
                                    </ByKey>
                                }
                            >
                                {/* the Show child runs untracked; the fragment's expression follows the events */}
                                {(render) => <>{render(events())}</>}
                            </Show>
                        </ul>
                    </div>
                </div>
            </div>
            <div class={`${prefixCls}-scroll-wrapper`} role="rowgroup">
                <div ref={scrollRef} class={`${prefixCls}-scroll`} role="row">
                    <TimeCol class={`${prefixCls}-sticky-left`} renderTimeDisplay={renderTimeDisplay()} />
                    <ByKey each={data().week} by={(day) => day.date.toString()}>
                        {(day) => {
                            const dayEvents = createMemo(() => CalendarFoundation.getParseDailyEvents(parsedEvents().day?.get(day().date.toString()) ?? [], day().date).day);
                            return (
                                <DayCol
                                    displayValue={day().date}
                                    events={dayEvents()}
                                    isWeekend={Boolean(local.markWeekend && day().isWeekend)}
                                    minEventHeight={local.minEventHeight}
                                    scrollHeight={scrollHeight()}
                                    showCurrTime={local.showCurrTime}
                                    today={today()}
                                    dateGridRender={dateGridRender()}
                                    handleClick={handleClick}
                                />
                            );
                        }}
                    </ByKey>
                </div>
            </div>
        </div>
    );
}
