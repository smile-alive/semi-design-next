import type React from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import { toPercent, type DateObj } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation, { type ParsedRangeEvent } from '@fibrae/semi-foundation/calendar/foundation';
import CalendarMonthFoundation, { type CalendarMonthAdapter } from '@fibrae/semi-foundation/calendar/month-foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import { IconClose } from '@fibrae/semi-icons-react';
import useClickOutside from '../_base/use-click-outside';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { RenderContentProps } from '../tooltip';
import type { CalendarProps, MonthCalendarProps } from './interface';
import useToday from './use-today';

const prefixCls = `${cssClasses.PREFIX}-month`;
const cardCls = `${prefixCls}-event-card`;

export interface MonthCalendarState {
    itemLimit: number;
    showCard: Record<string, boolean>;
}

type MonthViewProps = MonthCalendarProps & Pick<CalendarProps, 'range' | 'showCurrTime' | 'scrollTop' | 'renderTimeDisplay'>;

export default function MonthCalendar(props: MonthViewProps) {
    const { ref, className, style, mode, displayValue, range, header, events, showCurrTime, weekStartsOn, scrollTop, onClick, onClose, onMoreClick, renderTimeDisplay, markWeekend, minEventHeight, width, height, renderDateDisplay, dateGridRender, allDayEventsRender, ...rest } = props;

    const { locale, dateFnsLocale } = useLocale('Calendar');

    const cardIdPrefix = useId();
    const cardRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const [moreButtons] = useState(() => new Map<string, HTMLButtonElement | null>());
    const rootRef = useRef<HTMLDivElement>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    const [foundation, { itemLimit, showCard }] = useFoundation<CalendarMonthFoundation<MonthViewProps, MonthCalendarState>, CalendarMonthAdapter<MonthViewProps, MonthCalendarState>, MonthViewProps, MonthCalendarState>(
        CalendarMonthFoundation,
        props,
        () => ({ itemLimit: 0, showCard: {} }),
        (base) => ({
            notifyClose: (e, key) => {
                base.setState({ showCard: { ...base.getState('showCard'), [key]: false } });
                base.getProps().onClose?.(e);
            },
            openCard: (key) => {
                base.setState({ showCard: { [key]: true } });
            },
        })
    );

    const openCardKey = CalendarFoundation.getOpenCardKey(showCard);

    // the "more" button that owns the card toggles it on click; closing on its mousedown too would reopen it
    const markPressInCard = useClickOutside([cardRef, moreButtonRef], () => foundation.closeCard(null, openCardKey), openCardKey !== undefined);
    const today = useToday();

    const mergedRef = useMergedRef(ref, rootRef);
    const monthlyData = useMemo(() => CalendarFoundation.getMonthlyData(displayValue, dateFnsLocale, weekStartsOn, today), [displayValue, dateFnsLocale, weekStartsOn, today]);
    const weekCount = Object.keys(monthlyData).length;
    const parsedEvents = useMemo(() => CalendarFoundation.getParseMonthlyEvents(events, displayValue, weekStartsOn), [events, displayValue, weekStartsOn]);
    const openCardStale = CalendarFoundation.isOpenCardStale(openCardKey, monthlyData, parsedEvents, itemLimit);

    const measureItemLimit = useCallback(() => {
        const cell = cellRef.current;
        // the observer reports asynchronously, after a remount may have dropped the rows
        if (!cell) {
            return;
        }
        foundation.setState({ itemLimit: CalendarFoundation.getItemLimit(cell.getBoundingClientRect().height) });
    }, [foundation]);

    // a percentage height or a style.height follows the container, which no prop reports; the root remounts with each
    // new limit, so the observer is tied to the grid node instead of this component
    const observeGrid = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) {
                return undefined;
            }
            const observer = new ResizeObserver(measureItemLimit);
            observer.observe(node);
            return () => observer.disconnect();
        },
        [measureItemLimit]
    );

    const handleClick = (e: React.MouseEvent, date: Date) => {
        onClick?.(e, CalendarFoundation.formatCbValue([date]));
    };

    const handleMoreClick = (e: React.MouseEvent, key: string, date: Date, remaining: number) => {
        e.stopPropagation();
        if (showCard[key]) {
            foundation.closeCard(e, key);
            return;
        }
        foundation.showCard(key);
        onMoreClick?.(e, date, remaining);
    };

    // APG dialog: Esc and the close button hand focus back to "more" instead of dropping it with the card
    const closeCardToMore = (e: React.SyntheticEvent | KeyboardEvent, key: string) => {
        foundation.closeCard(e, key);
        moreButtons.get(key)?.focus();
    };

    const formatDayString = (date: Date, month: string, dayString: string) => {
        if (renderDateDisplay) {
            return renderDateDisplay(date);
        }
        if (dayString === '1') {
            return (
                <span className={`${prefixCls}-date`}>
                    {month}
                    <span className={`${cssClasses.PREFIX}-today-date`}>&nbsp;{dayString}</span>
                    {locale.datestring}
                </span>
            );
        }
        return (
            <span className={`${prefixCls}-date`}>
                <span className={`${cssClasses.PREFIX}-today-date`}>{dayString}</span>
            </span>
        );
    };

    const getCellProps = (date: Date, isToday: boolean) => ({
        role: 'cell' as const,
        'aria-current': isToday ? ('date' as const) : false,
        'aria-label': format(date, 'PPP', { locale: dateFnsLocale }),
        onClick: (e: React.MouseEvent) => handleClick(e, date),
    });

    // a day's events are a sparse array indexed by row, so `remained` counts by row
    const renderCollapsed = (dayEvents: ParsedRangeEvent[], { weekday, dayString, date, month, isToday }: DateObj, listCls: string, remained: number) => {
        const key = date.toString();
        const isCardOpen = showCard[key] ?? false;
        // key is the date string, which has spaces and so is no IDREF
        const titleId = `${cardIdPrefix}-${date.valueOf()}`;
        const content = ({ initialFocusRef }: RenderContentProps<HTMLButtonElement>) => (
            <div ref={cardRef} className={cardCls} onMouseDownCapture={markPressInCard}>
                <div className={`${cardCls}-content`}>
                    <div className={`${cardCls}-header`}>
                        <div id={titleId} className={`${cardCls}-header-info`}>
                            <div className={`${cardCls}-header-info-weekday`}>{weekday}</div>
                            <div className={`${cardCls}-header-info-date`}>{dayString}</div>
                        </div>
                        <Button ref={initialFocusRef} type="tertiary" className={`${cardCls}-close`} aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={(e) => closeCardToMore(e, key)} />
                    </div>
                    <div className={`${cardCls}-body`}>
                        <ul className={`${cardCls}-list`}>
                            {dayEvents.map((item) => (
                                <li key={item.key || `${item.start.toString()}-event`}>{item.children}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
        return (
            <Popover
                key={`${date.valueOf()}`}
                aria-labelledby={titleId}
                content={content}
                position="leftTopOver"
                trigger="custom"
                visible={isCardOpen}
                // the trigger is custom, so the Popover leaves closing on Esc to the month view
                onEscKeyDown={(e) => closeCardToMore(e, key)}
            >
                <div
                    className={listCls}
                    // the Popover would make the cell a second tab stop beside "more"; -1 is truthy, so it keeps it
                    tabIndex={-1}
                    {...getCellProps(date, isToday)}
                >
                    {formatDayString(date, month, dayString)}
                    <button
                        ref={(node) => {
                            moreButtons.set(key, node);
                            if (key === openCardKey) {
                                moreButtonRef.current = node;
                            }
                        }}
                        type="button"
                        className={`${cardCls}-wrapper`}
                        style={{ bottom: 0 }}
                        aria-expanded={isCardOpen}
                        aria-haspopup="dialog"
                        onClick={(e) => handleMoreClick(e, key, date, remained)}
                    >
                        {locale.remaining.replace('${remained}', String(remained))}
                    </button>
                    {dateGridRender?.(date.toString(), date)}
                </div>
            </Popover>
        );
    };

    // rows split the grid height evenly, so their height follows the height prop and the week count
    useLayoutEffect(() => {
        measureItemLimit();
    }, [measureItemLimit, height, weekCount]);

    useEffect(() => {
        if (openCardStale) {
            foundation.closeCard(null, openCardKey);
        }
    }, [foundation, openCardStale, openCardKey]);

    return (
        <div key={itemLimit} aria-label={format(displayValue, 'LLLL y', { locale: dateFnsLocale })} role="table" {...rest} ref={mergedRef} className={clsx(prefixCls, className)} style={{ height, width, ...style }}>
            <div className={`${prefixCls}-sticky-top`} role="rowgroup">
                {Boolean(header) && (
                    <div role="row">
                        <div role="cell">{header}</div>
                    </div>
                )}
                <div className={`${prefixCls}-header`}>
                    <div className={`${prefixCls}-grid`}>
                        <div className={`${prefixCls}-grid-row`} role="row">
                            {monthlyData[0].map(({ weekday, isWeekend }) => (
                                <div key={`${weekday}-monthheader`} className={clsx({ [`${cssClasses.PREFIX}-weekend`]: markWeekend && isWeekend })} aria-label={weekday} role="columnheader">
                                    <span>{weekday}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${prefixCls}-grid-wrapper`} role="rowgroup">
                <div className={`${prefixCls}-week`}>
                    <div ref={observeGrid} className={`${prefixCls}-grid-col`}>
                        {Object.values(monthlyData).map((weekDays, weekInd) => {
                            const day = parsedEvents[weekInd]?.day;
                            const display = parsedEvents[weekInd]?.display;
                            // every row takes the ref, so the last row is the one measured
                            return (
                                <div key={`${weekInd}-weekrow`} ref={cellRef} className={`${prefixCls}-weekrow`}>
                                    <div className={`${prefixCls}-skeleton`} role="row">
                                        {weekDays.map((each) => {
                                            const { date, dayString, isToday, isSameMonth, isWeekend, month, ind } = each;
                                            const listCls = clsx({
                                                [`${cssClasses.PREFIX}-today`]: isToday,
                                                [`${cssClasses.PREFIX}-weekend`]: markWeekend && isWeekend,
                                                [`${prefixCls}-same`]: isSameMonth,
                                            });
                                            const hidden = CalendarFoundation.countHidden(day?.[ind], itemLimit);
                                            if (hidden > 0) {
                                                return renderCollapsed(day[ind], each, listCls, hidden);
                                            }
                                            return (
                                                <div key={`${date}-weeksk`} className={listCls} {...getCellProps(date, isToday)}>
                                                    {formatDayString(date, month, dayString)}
                                                    {dateGridRender?.(date.toString(), date)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* the overlay sits beside the row, where a list is not a valid child of the table */}
                                    <div className={`${cssClasses.PREFIX}-event-items`}>
                                        {display?.map(({ leftPos, width: eventWidth, topInd, key, children: content }, ind) =>
                                            topInd < itemLimit ? (
                                                <div
                                                    key={key || `${ind}-monthevent`}
                                                    className={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-month`}
                                                    style={{
                                                        left: toPercent(leftPos),
                                                        width: toPercent(eventWidth),
                                                        top: `${topInd}em`,
                                                    }}
                                                >
                                                    {content}
                                                </div>
                                            ) : null
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
