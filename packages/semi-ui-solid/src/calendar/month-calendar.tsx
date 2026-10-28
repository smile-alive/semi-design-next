import { For, Show, children, createEffect, createMemo, createSignal, createUniqueId, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { format, isSameDay } from 'date-fns';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import { type DateObj, toPercent } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import CalendarMonthFoundation, { type CalendarMonthAdapter } from '@fibrae/semi-foundation/calendar/month-foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import { IconClose } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useClickOutside from '../_base/use-click-outside';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { RenderContentProps } from '../tooltip';
import ByKey from './by-key';
import EventContent from './event-content';
import type { DayCalendarProps } from './interface';
import useToday from './use-today';
import { rootStyle, viewPropKeys } from './view-props';

const prefixCls = `${cssClasses.PREFIX}-month`;
const cardCls = `${prefixCls}-event-card`;

interface MonthCalendarState {
    showCard: Record<string, boolean>;
}

type Foundation = CalendarMonthFoundation<DayCalendarProps, MonthCalendarState>;
type Adapter = CalendarMonthAdapter<DayCalendarProps, MonthCalendarState>;

export default function MonthCalendar(props: DayCalendarProps) {
    const [local, rest] = splitProps(props, viewPropKeys);

    const locale = useLocale('Calendar');

    const cardIdPrefix = createUniqueId();
    const moreButtons = new Map<string, HTMLButtonElement>();
    let cardElement: HTMLElement | undefined;
    const [grid, setGrid] = createSignal<HTMLElement>();

    // the row height is measured after mount; until then every event shows, so the server HTML carries them
    const [itemLimit, setItemLimit] = createSignal(Infinity);

    const { foundation, state } = useFoundation<Foundation, Adapter, DayCalendarProps, MonthCalendarState>(
        CalendarMonthFoundation,
        props,
        () => ({ showCard: {} }),
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

    const today = useToday();

    const openCardKey = createMemo(() => CalendarFoundation.getOpenCardKey(state().showCard));

    // the "more" button that owns the card toggles it on click; closing on its mousedown too would reopen it
    const markPressInCard = useClickOutside(
        [() => cardElement, () => moreButtons.get(openCardKey() ?? '')],
        () => foundation.closeCard(null, openCardKey() as string),
        () => openCardKey() !== undefined
    );

    const header = children(() => local.header);

    // a function prop is read through a memo: an unrelated key change would rebuild what it renders
    const renderDateDisplay = createMemo(() => local.renderDateDisplay);
    const dateGridRender = createMemo(() => local.dateGridRender);
    const displayValue = createMemo(() => local.displayValue);
    const events = createMemo(() => local.events ?? []);

    // a memo reruns whenever any source it read notifies, so reading the props directly would rebuild the week rows
    const weekStartsOn = createMemo(() => local.weekStartsOn ?? 0);

    // today is applied per cell, so the mount-time today does not rebuild the grid the server rendered
    const monthlyData = createMemo(() => CalendarFoundation.getMonthlyData(displayValue(), locale().dateFnsLocale, weekStartsOn(), null));
    const weeks = createMemo(() => Object.values(monthlyData()));
    const parsedEvents = createMemo(() => CalendarFoundation.getParseMonthlyEvents(events(), displayValue(), weekStartsOn()));
    const openCardStale = createMemo(() => CalendarFoundation.isOpenCardStale(openCardKey(), monthlyData(), parsedEvents(), itemLimit()));

    // rows split the grid height evenly; the last row is measured because it always renders
    const measureItemLimit = () => {
        const row = grid()?.lastElementChild;
        if (row) {
            setItemLimit(CalendarFoundation.getItemLimit(row.getBoundingClientRect().height));
        }
    };

    const handleClick = (e: MouseEvent, date: Date) => {
        local.onClick?.(e, CalendarFoundation.formatCbValue([date]));
    };

    const handleMoreClick = (e: MouseEvent, key: string, date: Date, remaining: number) => {
        e.stopPropagation();
        if (state().showCard[key]) {
            foundation.closeCard(e, key);
            return;
        }
        foundation.showCard(key);
        local.onMoreClick?.(e, date, remaining);
    };

    // APG dialog: Esc and the close button hand focus back to "more" instead of dropping it with the card
    const closeCardToMore = (e: MouseEvent | KeyboardEvent, key: string) => {
        foundation.closeCard(e, key);
        moreButtons.get(key)?.focus();
    };

    const formatDayString = (date: Date, month: string, dayString: string) => {
        const render = renderDateDisplay();
        if (render) {
            return render(date);
        }
        if (dayString === '1') {
            return (
                <span class={`${prefixCls}-date`}>
                    {month}
                    <span class={`${cssClasses.PREFIX}-today-date`}>&nbsp;{dayString}</span>
                    {locale().locale.datestring}
                </span>
            );
        }
        return (
            <span class={`${prefixCls}-date`}>
                <span class={`${cssClasses.PREFIX}-today-date`}>{dayString}</span>
            </span>
        );
    };

    const DayCell = (cell: { day: DateObj; weekInd: number }) => {
        // a cell's day never changes: new month data makes new day objects and so new cells
        const key = untrack(() => cell.day.date.toString());
        // the key is the date string, which has spaces and so is no IDREF
        const titleId = `${cardIdPrefix}-${untrack(() => cell.day.date.valueOf())}`;
        const dayEvents = () => parsedEvents()[cell.weekInd]?.day?.[cell.day.ind];
        const hidden = () => CalendarFoundation.countHidden(dayEvents(), itemLimit());
        const isOpen = () => state().showCard[key] ?? false;
        const isToday = () => {
            const day = today();
            return day !== null && isSameDay(cell.day.date, day);
        };
        const cellClass = () =>
            clsx({
                [`${cssClasses.PREFIX}-today`]: isToday(),
                [`${cssClasses.PREFIX}-weekend`]: local.markWeekend && cell.day.isWeekend,
                [`${prefixCls}-same`]: cell.day.isSameMonth,
            });
        const ariaLabel = () => format(cell.day.date, 'PPP', { locale: locale().dateFnsLocale });
        const cellProps = {
            role: 'cell' as const,
            get 'aria-current'() {
                return isToday() ? ('date' as const) : undefined;
            },
            get 'aria-label'() {
                return ariaLabel();
            },
            onClick: (e: MouseEvent) => handleClick(e, cell.day.date),
        };

        const content = ({ initialFocusRef }: RenderContentProps) => (
            <div ref={(node) => (cardElement = node)} class={cardCls} onMouseDown={markPressInCard}>
                <div class={`${cardCls}-content`}>
                    <div class={`${cardCls}-header`}>
                        <div id={titleId} class={`${cardCls}-header-info`}>
                            <div class={`${cardCls}-header-info-weekday`}>{cell.day.weekday}</div>
                            <div class={`${cardCls}-header-info-date`}>{cell.day.dayString}</div>
                        </div>
                        <IconButton ref={initialFocusRef} type="tertiary" class={`${cardCls}-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={(e) => closeCardToMore(e, key)} />
                    </div>
                    <div class={`${cardCls}-body`}>
                        <ul class={`${cardCls}-list`}>
                            <ByKey each={(dayEvents() ?? []).filter(Boolean)} by={(item) => item.key || `${item.start?.toString()}-event`}>
                                {(item) => (
                                    <li>
                                        <EventContent of={item().children} />
                                    </li>
                                )}
                            </ByKey>
                        </ul>
                    </div>
                </div>
            </div>
        );

        return (
            <Show
                when={hidden() > 0}
                fallback={
                    <div class={cellClass()} {...cellProps}>
                        {formatDayString(cell.day.date, cell.day.month, cell.day.dayString)}
                        {dateGridRender()?.(key, cell.day.date)}
                    </div>
                }
            >
                <Popover aria-labelledby={titleId} content={content} position="leftTopOver" trigger="custom" visible={isOpen()} onEscKeyDown={(e) => closeCardToMore(e, key)}>
                    {(getTriggerProps) => (
                        <div
                            {...getTriggerProps({
                                role: 'cell',
                                // the Popover would make the cell a second tab stop beside "more"; -1 is truthy, so it keeps it
                                tabIndex: -1,
                                get class() {
                                    return cellClass();
                                },
                                get 'aria-current'() {
                                    return cellProps['aria-current'];
                                },
                                get 'aria-label'() {
                                    return ariaLabel();
                                },
                                onClick: cellProps.onClick,
                            })}
                        >
                            {formatDayString(cell.day.date, cell.day.month, cell.day.dayString)}
                            <button
                                ref={(node) => {
                                    moreButtons.set(key, node);
                                    onCleanup(() => moreButtons.delete(key));
                                }}
                                type="button"
                                class={`${cardCls}-wrapper`}
                                style={{ bottom: '0' }}
                                aria-expanded={isOpen()}
                                aria-haspopup="dialog"
                                onClick={(e) => handleMoreClick(e, key, cell.day.date, hidden())}
                            >
                                {locale().locale.remaining.replace('${remained}', String(hidden()))}
                            </button>
                            {dateGridRender()?.(key, cell.day.date)}
                        </div>
                    )}
                </Popover>
            </Show>
        );
    };

    useResizeObserver(grid, measureItemLimit);

    // rows split the grid height evenly, so their height follows the height prop and the week count
    createEffect(on([() => local.height, () => weeks().length], measureItemLimit));

    createEffect(() => {
        if (openCardStale()) {
            untrack(() => foundation.closeCard(null, openCardKey() as string));
        }
    });

    return (
        <div aria-label={format(displayValue(), 'LLLL y', { locale: locale().dateFnsLocale })} role="table" {...rest} ref={mergeRefs(local.ref)} class={clsx(prefixCls, local.class)} style={rootStyle(local.style, local.width, local.height)}>
            <div class={`${prefixCls}-sticky-top`} role="rowgroup">
                <Show when={hasContent(header())}>
                    <div role="row">
                        <div role="cell">{header()}</div>
                    </div>
                </Show>
                <div class={`${prefixCls}-header`}>
                    <div class={`${prefixCls}-grid`}>
                        <div class={`${prefixCls}-grid-row`} role="row">
                            <For each={monthlyData()[0]}>
                                {({ weekday, isWeekend }) => (
                                    <div class={clsx({ [`${cssClasses.PREFIX}-weekend`]: local.markWeekend && isWeekend })} aria-label={weekday} role="columnheader">
                                        <span>{weekday}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </div>
            <div class={`${prefixCls}-grid-wrapper`} role="rowgroup">
                <div class={`${prefixCls}-week`}>
                    <div ref={(node) => setGrid(node)} class={`${prefixCls}-grid-col`}>
                        <For each={weeks()}>
                            {(weekDays, weekInd) => {
                                const display = createMemo(() => (parsedEvents()[weekInd()]?.display ?? []).filter((item) => (item.topInd ?? 0) < itemLimit()));
                                return (
                                    <div class={`${prefixCls}-weekrow`}>
                                        <div class={`${prefixCls}-skeleton`} role="row">
                                            <For each={weekDays}>{(day) => <DayCell day={day} weekInd={weekInd()} />}</For>
                                        </div>
                                        {/* the overlay sits beside the row, where a list is not a valid child of the table */}
                                        <div class={`${cssClasses.PREFIX}-event-items`}>
                                            <ByKey each={display()} by={(item, index) => item.key || `${index}-monthevent`}>
                                                {(item) => (
                                                    <div
                                                        class={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-month`}
                                                        style={{
                                                            left: toPercent(item().leftPos as number),
                                                            width: toPercent(item().width as number),
                                                            top: `${item().topInd}em`,
                                                        }}
                                                    >
                                                        <EventContent of={item().children} />
                                                    </div>
                                                )}
                                            </ByKey>
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                    </div>
                </div>
            </div>
        </div>
    );
}
