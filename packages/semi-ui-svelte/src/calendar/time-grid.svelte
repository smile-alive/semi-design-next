<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { calcRowHeight, toPercent, type DateObj } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getCalendarContext } from './context.js';
    import DayCol from './day-col.svelte';
    import type { CalendarProps, CalendarViewProps, WeekStartsOn } from './interface.js';
    import { rootStyle } from './root-style.js';
    import TimeCol from './time-col.svelte';
    import { withKeys } from './unique-keys.js';
    import useScrollGrid from './use-scroll-grid.svelte.js';

    interface Props extends CalendarViewProps, Pick<CalendarProps, 'dateDisplay' | 'timeDisplay' | 'allDayEvents'> {
        range: Date[];
        /** The date whose month names the grid; the first day of the range by default */
        labelDate?: Date;
        minEventHeight?: number;
        showCurrTime: boolean;
        scrollTop: number;
        weekStartsOn: WeekStartsOn;
    }

    let { range, labelDate, events, markWeekend, minEventHeight, showCurrTime, scrollTop, weekStartsOn, today, width, height, header, event, dateDisplay, dateGrid, timeDisplay, allDayEvents, onClick, ...rest }: Props = $props();

    const calendar = getCalendarContext();
    const locale = useLocale('Calendar');

    const monthId = $props.id();
    let root = $state<HTMLDivElement>();
    let scroll = $state<HTMLDivElement>();

    const grid = useScrollGrid(
        () => root,
        () => scroll,
        () => scrollTop
    );

    const prefixCls = `${cssClasses.PREFIX}-week`;
    const allDayCls = `${cssClasses.PREFIX}-all-day`;
    const rangeData = $derived(CalendarFoundation.getRangeData(range, locale().dateFnsLocale, weekStartsOn, today, labelDate));
    const parsedEvents = $derived(CalendarFoundation.getParsedRangeEvents(events));
    const allDayItems = $derived(CalendarFoundation.parseRangeAllDayEvents(parsedEvents.allDay, range));

    const dayEvents = (day: DateObj) => CalendarFoundation.getParseDailyEvents(parsedEvents.day?.get(day.date.toString()) ?? [], day.date).day;

    const weekendCls = (day: DateObj) => ({ [`${cssClasses.PREFIX}-weekend`]: markWeekend && day.isWeekend });

    // a new day, a new showCurrTime or a day that becomes today gets a new column, which decides again whether to show the line
    const columnKey = (day: DateObj) => `${day.date.toString()}|${showCurrTime}|${day.isToday}`;
</script>

<!-- aria-labelledby, role and tabindex come before the rest so the caller can replace them -->
<div aria-labelledby={rest['aria-label'] ? undefined : monthId} bind:this={root} role="table" tabindex="0" {...rest} class={[prefixCls, rest.class]} style={rootStyle(rest.style, width, height)}>
    <!-- the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root -->
    <div class={`${prefixCls}-sticky-top`} role="rowgroup">
        {#if header}
            <div role="row">
                <div role="cell">
                    {@render header()}
                </div>
            </div>
        {/if}
        <div class={`${prefixCls}-header`} role="row">
            <div class={[`${cssClasses.PREFIX}-tag`, `${prefixCls}-tag`, `${prefixCls}-sticky-left`]} id={monthId} role="cell">
                <span>{rangeData.month}</span>
            </div>
            <div class={`${prefixCls}-grid`}>
                <div class={`${prefixCls}-grid-row`}>
                    {#each rangeData.week as day (day.date.toString())}
                        <div aria-current={day.isToday ? 'date' : undefined} class={[{ [`${cssClasses.PREFIX}-today`]: day.isToday }, weekendCls(day)]} role="columnheader">
                            {#if dateDisplay}
                                {@render dateDisplay({ date: day.date })}
                            {:else}
                                <span class={`${cssClasses.PREFIX}-today-date`}>{day.dayString}</span>
                                <span>{day.weekday}</span>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        <div class={allDayCls} role="row" style:height={allDayEvents ? undefined : `${calcRowHeight(allDayItems)}em`}>
            <div class={[`${cssClasses.PREFIX}-tag`, `${allDayCls}-tag`, `${prefixCls}-sticky-left`]} role="rowheader">
                <span>{locale().locale.allDay}</span>
            </div>
            <div class={[`${cssClasses.PREFIX}-content`, `${allDayCls}-content`]} role="cell">
                <div class={`${allDayCls}-skeleton`}>
                    {#each rangeData.week as day, ind (ind)}
                        <div class={weekendCls(day)}></div>
                    {/each}
                </div>
                <ul class={`${cssClasses.PREFIX}-event-items`}>
                    {#if allDayEvents}
                        {@render allDayEvents({ events })}
                    {:else}
                        <!-- positioned spans always carry leftPos, width and topInd; the foundation type keeps them optional -->
                        {#each withKeys(allDayItems, 'allDay') as { id, item } (id)}
                            <li class={[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-allday`]} style:left={toPercent(item.leftPos ?? 0)} style:top={`${item.topInd ?? 0}em`} style:width={toPercent(item.width ?? 0)}>
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
            {#each rangeData.week as day (columnKey(day))}
                <DayCol {dateGrid} displayValue={day.date} {event} events={dayEvents(day)} isWeekend={markWeekend && day.isWeekend} {minEventHeight} onSlotClick={(mouseEvent, value) => onClick?.(mouseEvent, value)} scrollHeight={grid.scrollHeight()} {showCurrTime} />
            {/each}
        </div>
    </div>
</div>
