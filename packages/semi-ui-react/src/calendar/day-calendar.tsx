import { useMemo } from 'react';
import clsx from 'clsx';
import { format, isSameDay, startOfDay } from 'date-fns';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import { checkWeekend } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useMergedRef from '../_base/use-merged-ref';
import useLocale from '../locale/use-locale';
import DayCol from './day-col';
import type { DayCalendarProps, DayColProps } from './interface';
import TimeCol from './time-col';
import useScrollGrid from './use-scroll-grid';
import useToday from './use-today';

const prefixCls = `${cssClasses.PREFIX}-day`;

export default function DayCalendar({ ref, className, style, displayValue, range, header, events, showCurrTime, weekStartsOn, scrollTop, onClick, onClose, onMoreClick, renderTimeDisplay, markWeekend, minEventHeight, width, height, renderDateDisplay, dateGridRender, allDayEventsRender, ...rest }: DayCalendarProps) {
    const { locale, dateFnsLocale } = useLocale('Calendar');

    const { rootRef, scrollRef, scrollHeight } = useScrollGrid(scrollTop);
    const today = useToday();

    const mergedRef = useMergedRef(ref, rootRef);
    const parsedEvents = useMemo(() => CalendarFoundation.getParseDailyEvents(events, displayValue), [events, displayValue]);

    // every view hands dateGridRender the day's midnight, not the caller's time of day
    const dayStart = useMemo(() => startOfDay(displayValue), [displayValue]);
    const isWeekend = markWeekend && checkWeekend(displayValue);
    const allDayCls = `${cssClasses.PREFIX}-all-day`;

    const handleClick: DayColProps['handleClick'] = (e, val) => {
        onClick?.(e, CalendarFoundation.formatCbValue(val));
    };

    return (
        <div
            aria-label={format(displayValue, 'PPP', { locale: dateFnsLocale })}
            role="table"
            // the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root
            tabIndex={0}
            {...rest}
            ref={mergedRef}
            className={clsx(prefixCls, className)}
            style={{ height, width, ...style }}
        >
            <div className={`${prefixCls}-sticky-top`} role="rowgroup">
                {Boolean(header) && (
                    <div role="row">
                        <div role="cell">{header}</div>
                    </div>
                )}
                <div className={allDayCls} role="row">
                    <div className={`${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left`} role="rowheader">
                        <span>{locale.allDay}</span>
                    </div>
                    <div className={clsx(`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend })} role="cell">
                        <ul className={`${cssClasses.PREFIX}-event-items`}>
                            {allDayEventsRender
                                ? allDayEventsRender(events)
                                : parsedEvents.allDay.map(({ children: content, key }, ind) => (
                                      <li key={key || `allDay-${ind}`} className={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`}>
                                          {content}
                                      </li>
                                  ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className={`${prefixCls}-scroll-wrapper`} role="rowgroup">
                <div ref={scrollRef} className={`${prefixCls}-scroll`} role="row">
                    <TimeCol className={`${prefixCls}-sticky-left`} renderTimeDisplay={renderTimeDisplay} />
                    <DayCol
                        // showCurrTime and whether the day is today in the key: a column decides once per mount
                        // whether to run the current time line
                        key={`${dayStart.toDateString()}-${String(showCurrTime)}-${String(today !== null && isSameDay(dayStart, today))}`}
                        displayValue={dayStart}
                        events={parsedEvents.day}
                        isWeekend={isWeekend}
                        minEventHeight={minEventHeight}
                        scrollHeight={scrollHeight}
                        showCurrTime={showCurrTime}
                        dateGridRender={dateGridRender}
                        handleClick={handleClick}
                    />
                </div>
            </div>
        </div>
    );
}
