<script lang="ts">
    import { onMount } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { format } from 'date-fns';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { type DateObj, toPercent } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation, { type ParsedRangeEvent } from '@fibrae/semi-foundation/calendar/foundation';
    import CalendarMonthFoundation, { type CalendarMonthAdapter } from '@fibrae/semi-foundation/calendar/month-foundation';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { IconButton } from '../icon-button/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import { observeResize } from '../resize-observer/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import { getCalendarContext } from './context.js';
    import type { CalendarProps, CalendarViewProps, WeekStartsOn } from './interface.js';
    import { rootStyle } from './root-style.js';
    import { withKeys } from './unique-keys.js';

    interface Props extends CalendarViewProps, Pick<CalendarProps, 'dateDisplay' | 'onClose' | 'onMoreClick'> {
        displayValue: Date;
        weekStartsOn: WeekStartsOn;
    }

    interface MonthCalendarState {
        showCard: Record<string, boolean>;
    }

    type MonthDay = DateObj & {
        key: string;
        titleId: string;
        events: ParsedRangeEvent[];
        hidden: number;
    };

    type Foundation = CalendarMonthFoundation<object, MonthCalendarState>;
    type Adapter = CalendarMonthAdapter<object, MonthCalendarState>;

    let { displayValue, events, markWeekend, weekStartsOn, today, width, height, header, event, dateDisplay, dateGrid, onClick, onClose, onMoreClick, ...rest }: Props = $props();

    const calendar = getCalendarContext();
    const locale = useLocale('Calendar');

    const cardIdPrefix = $props.id();

    // The cards' and "more" buttons' DOM by key. Maps, not single refs: a leaving card and the next opening one
    // coexist during the exit animation.
    const cards = new Map<string, HTMLElement>();
    const moreButtons = new Map<string, HTMLButtonElement>();
    let grid = $state<HTMLDivElement>();

    // Starts at 0 as in the other frameworks' first frame: the row height is only known once mounted
    let itemLimit = $state(0);

    const { foundation, states } = useFoundation<Foundation, Adapter, object, MonthCalendarState>(
        CalendarMonthFoundation,
        {},
        () => ({ showCard: {} }),
        (base) => ({
            notifyClose: (closeEvent, key) => {
                base.setState({ showCard: { ...base.getState('showCard'), [key]: false } });
                onClose?.(closeEvent);
            },
            openCard: (key) => base.setState({ showCard: { [key]: true } }),
        })
    );

    const nestedPopups = useNestedPopups();

    const prefixCls = `${cssClasses.PREFIX}-month`;
    const cardCls = `${prefixCls}-event-card`;
    const openCardKey = $derived(CalendarFoundation.getOpenCardKey(states().showCard));
    const monthlyData = $derived(CalendarFoundation.getMonthlyData(displayValue, locale().dateFnsLocale, weekStartsOn, today));
    const parsedEvents = $derived(CalendarFoundation.getParseMonthlyEvents(events, displayValue, weekStartsOn));
    const weekCount = $derived(Object.keys(monthlyData).length);
    const stale = $derived(CalendarFoundation.isOpenCardStale(openCardKey, monthlyData, parsedEvents, itemLimit));

    // A day's events are a sparse array indexed by row, so the holes are dropped before listing or counting them.
    const weeks = $derived(
        Object.values(monthlyData).map((weekDays, weekInd) => {
            const parsed = parsedEvents[weekInd];
            return {
                // positioned spans always carry leftPos, width and topInd; the foundation type keeps them optional
                display: (parsed?.display ?? []).filter((item) => (item.topInd ?? 0) < itemLimit),
                days: weekDays.map((day): MonthDay => {
                    const dayEvents = parsed?.day[day.ind];
                    return {
                        ...day,
                        key: day.date.toString(),
                        // the key is the date string, which has spaces and so is no IDREF
                        titleId: `${cardIdPrefix}-${day.date.valueOf()}`,
                        events: (dayEvents ?? []).filter(Boolean),
                        hidden: CalendarFoundation.countHidden(dayEvents, itemLimit),
                    };
                }),
            };
        })
    );

    const isOpen = (key: string) => states().showCard[key] ?? false;

    // rows split the grid height evenly; the last row is measured because it always renders
    const measure = () => {
        const row = grid?.lastElementChild;
        if (row) {
            itemLimit = CalendarFoundation.getItemLimit(row.getBoundingClientRect().height);
        }
    };

    const observe = observeResize(measure);

    // Registers an element under its day's key for as long as it is mounted
    const track =
        <E extends HTMLElement>(map: Map<string, E>, key: string): Attachment<E> =>
        (element) => {
            map.set(key, element);
            return () => {
                if (map.get(key) === element) {
                    map.delete(key);
                }
            };
        };

    const remaining = (count: number) => locale().locale.remaining.replace('${remained}', String(count));

    // APG dialog: Esc and the close button hand focus back to "more" instead of dropping it with the card
    const closeCardToMore = (closeEvent: MouseEvent | KeyboardEvent, key: string) => {
        foundation.closeCard(closeEvent, key);
        moreButtons.get(key)?.focus();
    };

    const handleMoreClick = (clickEvent: MouseEvent, key: string, date: Date, count: number) => {
        clickEvent.stopPropagation();
        if (isOpen(key)) {
            closeCardToMore(clickEvent, key);
            return;
        }
        foundation.showCard(key);
        onMoreClick?.(clickEvent, date, count);
    };

    // The "more" button of the open card counts as inside: clicking it again closes the card through its click
    // instead of closing on mousedown and reopening on click.
    useClickOutside(
        [() => cards.get(openCardKey ?? ''), () => moreButtons.get(openCardKey ?? '')],
        () => {
            if (openCardKey !== undefined && cards.get(openCardKey)) {
                foundation.closeCard(null, openCardKey);
            }
        },
        () => openCardKey !== undefined,
        nestedPopups
    );

    watch(() => weekCount, measure);

    watch(
        () => stale,
        (isStale) => {
            if (isStale) {
                foundation.closeCard(null, openCardKey);
            }
        }
    );

    onMount(measure);
</script>

{#snippet cell(day: MonthDay, popup?: TooltipTriggerProps)}
    <!-- Tooltip makes a trigger without a tabindex a tab stop; "more" is the stop -->
    <div
        {...popup}
        aria-current={day.isToday ? 'date' : undefined}
        aria-label={format(day.date, 'PPP', { locale: locale().dateFnsLocale })}
        class={{
            [`${cssClasses.PREFIX}-today`]: day.isToday,
            [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend,
            [`${prefixCls}-same`]: day.isSameMonth,
        }}
        role="cell"
        tabindex={day.hidden > 0 ? -1 : undefined}
        onclick={(clickEvent) => onClick?.(clickEvent, CalendarFoundation.formatCbValue([day.date]))}
    >
        {#if dateDisplay}
            {@render dateDisplay({ date: day.date })}
        {:else}
            <span class={`${prefixCls}-date`}>
                {#if day.dayString === '1'}
                    {day.month}<span class={`${cssClasses.PREFIX}-today-date`}>&nbsp;{day.dayString}</span>{locale().locale.datestring}
                {:else}
                    <span class={`${cssClasses.PREFIX}-today-date`}>{day.dayString}</span>
                {/if}
            </span>
        {/if}
        {#if day.hidden > 0}
            <button {@attach track(moreButtons, day.key)} aria-expanded={isOpen(day.key)} aria-haspopup="dialog" class={`${cardCls}-wrapper`} style="bottom: 0" type="button" onclick={(clickEvent) => handleMoreClick(clickEvent, day.key, day.date, day.hidden)}>
                {remaining(day.hidden)}
            </button>
        {/if}
        {@render dateGrid?.({ date: day.date, dateString: day.date.toString() })}
    </div>
{/snippet}

<!-- aria-label and role come before the rest so the caller can replace them -->
<div aria-label={format(displayValue, 'LLLL y', { locale: locale().dateFnsLocale })} role="table" {...rest} class={[prefixCls, rest.class]} style={rootStyle(rest.style, width, height)}>
    <div class={`${prefixCls}-sticky-top`} role="rowgroup">
        {#if header}
            <div role="row">
                <div role="cell">
                    {@render header()}
                </div>
            </div>
        {/if}
        <div class={`${prefixCls}-header`}>
            <div class={`${prefixCls}-grid`}>
                <div class={`${prefixCls}-grid-row`} role="row">
                    {#each monthlyData[0] as day (day.weekday)}
                        <div aria-label={day.weekday} class={{ [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend }} role="columnheader">
                            <span>{day.weekday}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
    <div class={`${prefixCls}-grid-wrapper`} role="rowgroup">
        <div class={`${prefixCls}-week`}>
            <div {@attach observe} bind:this={grid} class={`${prefixCls}-grid-col`}>
                {#each weeks as week, weekInd (weekInd)}
                    <div class={`${prefixCls}-weekrow`}>
                        <div class={`${prefixCls}-skeleton`} role="row">
                            <!-- a collapsed day is the anchor of its "more" card -->
                            {#each week.days as day (day.date.valueOf())}
                                {#if day.hidden > 0}
                                    <Popover aria-labelledby={day.titleId} bind:visible={() => isOpen(day.key), () => {}} onEscKeyDown={(keyEvent) => closeCardToMore(keyEvent, day.key)} position="leftTopOver" trigger="custom">
                                        {#snippet child({ props })}
                                            {@render cell(day, props)}
                                        {/snippet}
                                        {#snippet content({ initialFocusRef })}
                                            <div {@attach track(cards, day.key)} class={cardCls}>
                                                <div class={`${cardCls}-content`}>
                                                    <div class={`${cardCls}-header`}>
                                                        <div class={`${cardCls}-header-info`} id={day.titleId}>
                                                            <div class={`${cardCls}-header-info-weekday`}>
                                                                {day.weekday}
                                                            </div>
                                                            <div class={`${cardCls}-header-info-date`}>
                                                                {day.dayString}
                                                            </div>
                                                        </div>
                                                        <IconButton {@attach initialFocusRef} aria-label={locale().locale.close} class={`${cardCls}-close`} size="small" theme="borderless" type="tertiary" onclick={(clickEvent) => closeCardToMore(clickEvent, day.key)}>
                                                            {#snippet icon()}
                                                                <IconClose />
                                                            {/snippet}
                                                        </IconButton>
                                                    </div>
                                                    <div class={`${cardCls}-body`}>
                                                        <ul class={`${cardCls}-list`}>
                                                            {#each withKeys(day.events, 'card') as { id, item } (id)}
                                                                <li>
                                                                    {#if event}
                                                                        {@render event({ event: calendar.eventOf(item) })}
                                                                    {:else}
                                                                        {item.children}
                                                                    {/if}
                                                                </li>
                                                            {/each}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        {/snippet}
                                    </Popover>
                                {:else}
                                    {@render cell(day)}
                                {/if}
                            {/each}
                        </div>
                        <!-- the overlay sits beside the row, where a list is not a valid child of the table -->
                        <div class={`${cssClasses.PREFIX}-event-items`}>
                            {#each withKeys(week.display, 'month') as { id, item } (id)}
                                <div class={[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-month`]} style:left={toPercent(item.leftPos ?? 0)} style:top={`${item.topInd ?? 0}em`} style:width={toPercent(item.width ?? 0)}>
                                    {#if event}
                                        {@render event({ event: calendar.eventOf(item) })}
                                    {:else}
                                        {item.children}
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
