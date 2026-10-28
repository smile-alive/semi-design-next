import { For, Show, children, createMemo, splitProps } from 'solid-js';
import clsx from 'clsx';
import { format, isSameDay, startOfDay } from 'date-fns';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import { checkWeekend } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useLocale from '../locale/use-locale';
import ByKey from './by-key';
import DayCol from './day-col';
import EventContent from './event-content';
import type { DayCalendarProps, DayColProps } from './interface';
import TimeCol from './time-col';
import useScrollGrid from './use-scroll-grid';
import useToday from './use-today';
import { rootStyle, viewPropKeys } from './view-props';

const prefixCls = `${cssClasses.PREFIX}-day`;
const allDayCls = `${cssClasses.PREFIX}-all-day`;

export default function DayCalendar(props: DayCalendarProps) {
    const [local, rest] = splitProps(props, viewPropKeys);

    const locale = useLocale('Calendar');

    const { rootRef, scrollRef, scrollHeight } = useScrollGrid(() => local.scrollTop ?? 0);
    const today = useToday();

    const header = children(() => local.header);

    // a function prop is read through a memo: an unrelated key change would rebuild what it renders
    const allDayEventsRender = createMemo(() => local.allDayEventsRender);
    const renderTimeDisplay = createMemo(() => local.renderTimeDisplay);
    const dateGridRender = createMemo(() => local.dateGridRender);
    const displayValue = createMemo(() => local.displayValue);
    const events = createMemo(() => local.events ?? []);
    const parsedEvents = createMemo(() => CalendarFoundation.getParseDailyEvents(events(), displayValue()));

    // every view hands dateGridRender the day's midnight, not the caller's time of day
    const dayStart = createMemo(() => startOfDay(displayValue()));

    const isWeekend = () => Boolean(local.markWeekend && checkWeekend(displayValue()));

    // showCurrTime and whether the day is today in the key: a column decides once per mount whether to run the current
    // time line
    const columnKey = () => {
        const day = today();
        return `${dayStart().toDateString()}-${String(local.showCurrTime)}-${String(day !== null && isSameDay(dayStart(), day))}`;
    };

    const handleClick: DayColProps['handleClick'] = (e, val) => {
        local.onClick?.(e, CalendarFoundation.formatCbValue(val));
    };

    return (
        <div
            aria-label={format(displayValue(), 'PPP', { locale: locale().dateFnsLocale })}
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
                <div class={allDayCls} role="row">
                    <div class={`${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left`} role="rowheader">
                        <span>{locale().locale.allDay}</span>
                    </div>
                    <div class={clsx(`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend() })} role="cell">
                        <ul class={`${cssClasses.PREFIX}-event-items`}>
                            <Show
                                keyed
                                when={allDayEventsRender()}
                                fallback={
                                    <ByKey each={parsedEvents().allDay} by={(event, index) => event.key || `allDay-${index}`}>
                                        {(event) => (
                                            <li class={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`}>
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
                    <For each={[columnKey()]}>{() => <DayCol displayValue={dayStart()} events={parsedEvents().day} isWeekend={isWeekend()} minEventHeight={local.minEventHeight} scrollHeight={scrollHeight()} showCurrTime={local.showCurrTime} dateGridRender={dateGridRender()} handleClick={handleClick} />}</For>
                </div>
            </div>
        </div>
    );
}
