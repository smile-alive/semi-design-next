<script lang="ts">
    import { format, isSameDay, startOfDay } from 'date-fns';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { checkWeekend } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getCalendarContext } from './context.js';
    import DayCol from './day-col.svelte';
    import type { CalendarProps, CalendarViewProps } from './interface.js';
    import { rootStyle } from './root-style.js';
    import TimeCol from './time-col.svelte';
    import { withKeys } from './unique-keys.js';
    import useScrollGrid from './use-scroll-grid.svelte.js';

    interface Props extends CalendarViewProps, Pick<CalendarProps, 'timeDisplay' | 'allDayEvents'> {
        displayValue: Date;
        minEventHeight?: number;
        showCurrTime: boolean;
        scrollTop: number;
    }

    let { displayValue, events, markWeekend, minEventHeight, showCurrTime, scrollTop, today, width, height, header, event, dateGrid, timeDisplay, allDayEvents, onClick, ...rest }: Props = $props();

    const calendar = getCalendarContext();
    const locale = useLocale('Calendar');

    let root = $state<HTMLDivElement>();
    let scroll = $state<HTMLDivElement>();

    const grid = useScrollGrid(
        () => root,
        () => scroll,
        () => scrollTop
    );

    const prefixCls = `${cssClasses.PREFIX}-day`;
    const allDayCls = `${cssClasses.PREFIX}-all-day`;
    const parsedEvents = $derived(CalendarFoundation.getParseDailyEvents(events, displayValue));

    // every view hands the dateGrid snippet the day's midnight, not the caller's time of day
    const dayStart = $derived(startOfDay(displayValue));
    const isWeekend = $derived(markWeekend && checkWeekend(displayValue));
</script>

<!-- aria-label, role and tabindex come before the rest so the caller can replace them -->
<div aria-label={format(displayValue, 'PPP', { locale: locale().dateFnsLocale })} bind:this={root} role="table" tabindex="0" {...rest} class={[prefixCls, rest.class]} style={rootStyle(rest.style, width, height)}>
    <!-- the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root -->
    <div class={`${prefixCls}-sticky-top`} role="rowgroup">
        {#if header}
            <div role="row">
                <div role="cell">
                    {@render header()}
                </div>
            </div>
        {/if}
        <div class={allDayCls} role="row">
            <div class={[`${cssClasses.PREFIX}-tag`, `${allDayCls}-tag`, `${prefixCls}-sticky-left`]} role="rowheader">
                <span>{locale().locale.allDay}</span>
            </div>
            <div class={[`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend }]} role="cell">
                <ul class={`${cssClasses.PREFIX}-event-items`}>
                    {#if allDayEvents}
                        {@render allDayEvents({ events })}
                    {:else}
                        {#each withKeys(parsedEvents.allDay, 'allDay') as { id, item } (id)}
                            <li class={[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-allday`]}>
                                {#if event}
                                    {@render event({ event: calendar.eventOf(item) })}
                                {:else}
                                    {item.children}
                                {/if}
                            </li>
                        {/each}
                    {/if}
                </ul>
            </div>
        </div>
    </div>
    <div class={`${prefixCls}-scroll-wrapper`} role="rowgroup">
        <div {@attach grid.observe} bind:this={scroll} class={`${prefixCls}-scroll`} role="row">
            <TimeCol class={`${prefixCls}-sticky-left`} {timeDisplay} />
            <!-- a new day, a new showCurrTime or a day that becomes today gets a new column, which decides again whether to show the line -->
            {#key `${dayStart.toDateString()}|${showCurrTime}|${today !== null && isSameDay(dayStart, today)}`}
                <DayCol {dateGrid} displayValue={dayStart} {event} events={parsedEvents.day} {isWeekend} {minEventHeight} onSlotClick={(mouseEvent, value) => onClick?.(mouseEvent, value)} scrollHeight={grid.scrollHeight()} {showCurrTime} />
            {/key}
        </div>
    </div>
</div>
