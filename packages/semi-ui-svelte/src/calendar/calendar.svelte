<script lang="ts">
    import { countBy } from 'es-toolkit';
    import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import '@fibrae/semi-foundation/calendar/calendar.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import { setCalendarContext } from './context.js';
    import DayCalendar from './day-calendar.svelte';
    import type { CalendarProps, EventObject } from './interface.js';
    import MonthCalendar from './month-calendar.svelte';
    import TimeGrid from './time-grid.svelte';
    import useToday from './use-today.svelte.js';

    const defaults = useDefaultProps('Calendar');

    let {
        displayValue = defaults('displayValue'),
        range = defaults('range'),
        events = defaults('events', []),
        mode = defaults('mode', 'week'),
        showCurrTime = defaults('showCurrTime', true),
        weekStartsOn = defaults('weekStartsOn', 0),
        scrollTop = defaults('scrollTop', 400),
        markWeekend = defaults('markWeekend', false),
        minEventHeight = defaults('minEventHeight'),
        width = defaults('width'),
        height = defaults('height', 600),
        onClick,
        onClose,
        onMoreClick,
        header,
        event,
        dateDisplay,
        dateGrid,
        timeDisplay,
        allDayEvents,
        ...rest
    }: CalendarProps = $props();

    // One "today" source per Calendar; the views read it.
    const today = useToday();

    // Without displayValue the first frame shows the current date, so server rendering passes displayValue to make the server and the browser agree
    const shownValue = $derived(displayValue ?? new Date(today() ?? getCurrDate()));

    // Week and range share the time grid; the week is named by the month of the displayed date, which its first day
    // may not be in. A range view without `range` throws, as in React.
    const weekRange = $derived(CalendarFoundation.getWeekRange(shownValue, weekStartsOn));

    // Only a non-empty, unique key identifies an event; otherwise a view keeps the layout's own copy.
    const eventsByKey = $derived.by(() => {
        const counts = countBy(events, ({ key }) => key);
        return new Map(events.filter(({ key }) => key && counts[key] === 1).map((item) => [item.key, item]));
    });

    setCalendarContext({ eventOf: (layout: EventObject) => eventsByKey.get(layout.key) ?? layout });
</script>

{#if mode === 'day'}
    <DayCalendar {...rest} {allDayEvents} {dateGrid} displayValue={shownValue} {event} {events} {header} {height} {markWeekend} {minEventHeight} {onClick} {scrollTop} {showCurrTime} {timeDisplay} today={today()} {width} />
{:else if mode === 'month'}
    <MonthCalendar {...rest} {dateDisplay} {dateGrid} displayValue={shownValue} {event} {events} {header} {height} {markWeekend} {onClick} {onClose} {onMoreClick} today={today()} {weekStartsOn} {width} />
{:else}
    <TimeGrid
        {...rest}
        {allDayEvents}
        {dateDisplay}
        {dateGrid}
        {event}
        {events}
        {header}
        {height}
        labelDate={mode === 'week' ? shownValue : undefined}
        {markWeekend}
        {minEventHeight}
        {onClick}
        range={mode === 'week' ? weekRange : (range as Date[])}
        {scrollTop}
        {showCurrTime}
        {timeDisplay}
        today={today()}
        {weekStartsOn}
        {width}
    />
{/if}
