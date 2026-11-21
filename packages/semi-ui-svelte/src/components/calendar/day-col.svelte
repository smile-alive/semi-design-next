<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
    import type { DailyEventLayout } from '@fibrae/semi-foundation/components/calendar/event-util';
    import CalendarFoundation, { type CalendarAdapter, type CalendarBaseProps, type CalendarBaseState } from '@fibrae/semi-foundation/components/calendar/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import { useFoundation } from '../../base/index.js';
    import { getCalendarContext } from './context.js';
    import type { CalendarViewProps } from './interface.js';
    import { withKeys } from './unique-keys.js';

    interface Props extends Pick<CalendarViewProps, 'event' | 'dateGrid' | 'classNames' | 'styles'> {
        displayValue: Date;
        events: DailyEventLayout[];
        scrollHeight: number;
        isWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
        today: number | null;
        onSlotClick: (event: MouseEvent, value: Date) => void;
    }

    type Foundation = CalendarFoundation<CalendarBaseProps>;
    type Adapter = CalendarAdapter<CalendarBaseProps>;

    let { displayValue, events, scrollHeight, isWeekend, minEventHeight, showCurrTime, today, onSlotClick, event, dateGrid, classNames, styles }: Props = $props();

    const calendar = getCalendarContext();

    const foundationProps: CalendarBaseProps = {
        get displayValue() {
            return displayValue;
        },
        get showCurrTime() {
            return showCurrTime;
        },
        get today() {
            return today;
        },
    };

    const { states } = useFoundation<Foundation, Adapter, CalendarBaseProps, CalendarBaseState>(
        CalendarFoundation,
        foundationProps,
        () => CalendarFoundation.getInitialState(),
        () => ({})
    );

    const prefixCls = `${cssClasses.PREFIX}-grid`;
    const hours = Array.from({ length: 25 }, (_, hour) => hour);

    const pad = (d: number) => String(d).padStart(2, '0');

    const slotClick = (mouseEvent: MouseEvent, hour: number, minute: number) => onSlotClick(mouseEvent, CalendarFoundation.formatCbValue([displayValue, hour, minute, 0]));
</script>

<div class={[prefixCls, classNames?.day]} role="cell" style={styles?.day}>
    <div class={`${prefixCls}-content`}>
        {#if showCurrTime && states().showCurrTime}
            <!-- a style attribute plus style: directives would let the directives win; the caller's style goes last instead -->
            <div class={[`${prefixCls}-curr-circle`, classNames?.currentTimeDot]} style={`top: ${states().currPos * scrollHeight}px;${styles?.currentTimeDot ?? ''}`}></div>
            <div class={[`${prefixCls}-curr-line`, classNames?.currentTimeLine]} style={`top: ${states().currPos * scrollHeight}px;${styles?.currentTimeLine ?? ''}`}></div>
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
                <li
                    class={[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-day`, classNames?.event]}
                    style={`height: ${Math.max(minEventHeight ?? Number.MIN_SAFE_INTEGER, (layout.endPos - layout.startPos) * scrollHeight)}px; inset-inline-start: ${toCssLength(layout.left)}; top: ${layout.startPos * scrollHeight}px;${styles?.event ?? ''}`}
                >
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
