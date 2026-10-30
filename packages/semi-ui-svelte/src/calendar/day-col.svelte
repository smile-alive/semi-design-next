<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import type { DailyEventLayout } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation, { type CalendarAdapter, type CalendarBaseProps } from '@fibrae/semi-foundation/calendar/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { getCalendarContext } from './context.js';
    import type { CalendarViewProps } from './interface.js';
    import { withKeys } from './unique-keys.js';

    interface Props extends Pick<CalendarViewProps, 'event' | 'dateGrid'> {
        displayValue: Date;
        events: DailyEventLayout[];
        scrollHeight: number;
        isWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
        onSlotClick: (event: MouseEvent, value: Date) => void;
    }

    interface DayColState {
        currPos: number;
        showCurrTime: boolean;
    }

    // decided on mount; views key the column by date and showCurrTime so a change remounts it
    type Foundation = CalendarFoundation<CalendarBaseProps, DayColState>;
    type Adapter = CalendarAdapter<CalendarBaseProps, DayColState>;

    let { displayValue, events, scrollHeight, isWeekend, minEventHeight, showCurrTime, onSlotClick, event, dateGrid }: Props = $props();

    const calendar = getCalendarContext();

    const foundationProps: CalendarBaseProps = {
        get displayValue() {
            return displayValue;
        },
        get showCurrTime() {
            return showCurrTime;
        },
    };

    const { states } = useFoundation<Foundation, Adapter, CalendarBaseProps, DayColState>(
        CalendarFoundation,
        foundationProps,
        () => ({ currPos: 0, showCurrTime: false }),
        (base) => ({
            updateCurrPos: (currPos) => base.setState({ currPos }),
            setShowCurrTime: (show) => base.setState({ showCurrTime: show }),
        })
    );

    const prefixCls = `${cssClasses.PREFIX}-grid`;
    const hours = Array.from({ length: 25 }, (_, hour) => hour);

    const pad = (d: number) => String(d).padStart(2, '0');

    const slotClick = (mouseEvent: MouseEvent, hour: number, minute: number) => onSlotClick(mouseEvent, CalendarFoundation.formatCbValue([displayValue, hour, minute, 0]));
</script>

<div class={prefixCls} role="cell">
    <div class={`${prefixCls}-content`}>
        {#if showCurrTime && states().showCurrTime}
            <div class={`${prefixCls}-curr-circle`} style:top={`${states().currPos * scrollHeight}px`}></div>
            <div class={`${prefixCls}-curr-line`} style:top={`${states().currPos * scrollHeight}px`}></div>
        {/if}
        <div class={[`${prefixCls}-skeleton`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend }]}>
            <!-- pointer-only time slots: the cell has no keyboard way to pick a time, as in React -->
            {#each hours as hour (hour)}
                <div class={`${prefixCls}-skeleton-row-line`} data-time={`${pad(hour)}:00:00`} onclick={(mouseEvent) => slotClick(mouseEvent, hour, 0)}></div>
                <div data-time={`${pad(hour)}:30:00`} onclick={(mouseEvent) => slotClick(mouseEvent, hour, 30)}></div>
            {/each}
        </div>
        {@render dateGrid?.({ date: displayValue, dateString: displayValue.toString() })}
        <ul class={`${cssClasses.PREFIX}-event-items`}>
            {#each withKeys(events, 'day') as { id, item: layout } (id)}
                <li class={[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-day`]} style:height={`${Math.max(minEventHeight ?? Number.MIN_SAFE_INTEGER, (layout.endPos - layout.startPos) * scrollHeight)}px`} style:left={toCssLength(layout.left)} style:top={`${layout.startPos * scrollHeight}px`}>
                    {#if event}
                        {@render event({ event: calendar.eventOf(layout) })}
                    {:else}
                        {layout.children}
                    {/if}
                </li>
            {/each}
        </ul>
    </div>
</div>
