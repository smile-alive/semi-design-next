import { Fragment, useId, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import { calcRowHeight, toPercent } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useMergedRef from '../_base/use-merged-ref';
import useLocale from '../locale/use-locale';
import DayCol from './day-col';
import type { CalendarProps, DayColProps } from './interface';
import TimeCol from './time-col';
import useScrollGrid from './use-scroll-grid';
import useToday from './use-today';

const prefixCls = `${cssClasses.PREFIX}-week`;
const allDayCls = `${cssClasses.PREFIX}-all-day`;

export interface TimeGridProps extends CalendarProps {
    /** The days to show, [start, end) */
    range: Date[];
    /** The date whose month names the grid; the first day of the range by default */
    labelDate?: Date;
}

/** The time grid behind the week view and the range view: one column per day of `range` */
export default function TimeGrid(props: TimeGridProps) {
    const { ref, className, style, mode, displayValue, range, labelDate, header, events, showCurrTime, weekStartsOn, scrollTop, onClick, onClose, onMoreClick, renderTimeDisplay, markWeekend, minEventHeight, width, height, renderDateDisplay, dateGridRender, allDayEventsRender, ...rest } = props;

    const { locale, dateFnsLocale } = useLocale('Calendar');

    const monthId = useId();

    const { rootRef, scrollRef, scrollHeight } = useScrollGrid(scrollTop);
    const today = useToday();

    const mergedRef = useMergedRef(ref, rootRef);
    const { month, week } = useMemo(() => CalendarFoundation.getRangeData(range, dateFnsLocale, weekStartsOn, today, labelDate), [range, dateFnsLocale, weekStartsOn, today, labelDate]);
    const parsedEvents = useMemo(() => CalendarFoundation.getParsedRangeEvents(events), [events]);
    const allDayEvents = CalendarFoundation.parseRangeAllDayEvents(parsedEvents.allDay, range);

    const handleClick: DayColProps['handleClick'] = (e, val) => {
        onClick?.(e, CalendarFoundation.formatCbValue(val));
    };

    return (
        <div
            aria-labelledby={props['aria-label'] ? undefined : monthId}
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
                <div className={`${prefixCls}-header`} role="row">
                    <div id={monthId} className={`${cssClasses.PREFIX}-tag ${prefixCls}-tag ${prefixCls}-sticky-left`} role="cell">
                        <span>{month}</span>
                    </div>
                    <div className={`${prefixCls}-grid`}>
                        <div className={`${prefixCls}-grid-row`}>
                            {week.map((day) => (
                                <div
                                    key={`${day.date.toString()}-weekheader`}
                                    className={clsx({
                                        [`${cssClasses.PREFIX}-today`]: day.isToday,
                                        [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend,
                                    })}
                                    aria-current={day.isToday ? 'date' : undefined}
                                    role="columnheader"
                                >
                                    {renderDateDisplay ? (
                                        renderDateDisplay(day.date)
                                    ) : (
                                        <Fragment>
                                            <span className={`${cssClasses.PREFIX}-today-date`}>{day.dayString}</span>
                                            <span>{day.weekday}</span>
                                        </Fragment>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={allDayCls} style={allDayEventsRender ? null : { height: `${calcRowHeight(allDayEvents)}em` }} role="row">
                    <div className={`${cssClasses.PREFIX}-tag ${allDayCls}-tag ${prefixCls}-sticky-left`} role="rowheader">
                        <span>{locale.allDay}</span>
                    </div>
                    <div className={`${cssClasses.PREFIX}-content ${allDayCls}-content`} role="cell">
                        <div className={`${allDayCls}-skeleton`}>
                            {week.map((day, ind) => (
                                <div key={`${ind}-weekgrid`} className={clsx({ [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend })} />
                            ))}
                        </div>
                        <ul className={`${cssClasses.PREFIX}-event-items`}>
                            {allDayEventsRender
                                ? allDayEventsRender(events)
                                : allDayEvents.map(({ leftPos, width: eventWidth, topInd, children: content, key }, ind) => (
                                      <li
                                          key={key || `allDay-${ind}`}
                                          className={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-allday`}
                                          style={{
                                              left: toPercent(leftPos),
                                              width: toPercent(eventWidth),
                                              top: `${topInd}em`,
                                          }}
                                      >
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
                    {week.map((day) => {
                        const dateString = day.date.toString();
                        const dayEvents = parsedEvents.day.get(dateString) ?? [];
                        return (
                            <DayCol
                                // showCurrTime and isToday in the key: a column decides once per mount whether to run
                                // the current time line
                                key={`${dateString}-weekday-${String(showCurrTime)}-${String(day.isToday)}`}
                                displayValue={day.date}
                                events={CalendarFoundation.getParseDailyEvents(dayEvents, day.date).day}
                                isWeekend={markWeekend && day.isWeekend}
                                minEventHeight={minEventHeight}
                                scrollHeight={scrollHeight}
                                showCurrTime={showCurrTime}
                                dateGridRender={dateGridRender}
                                handleClick={handleClick}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
