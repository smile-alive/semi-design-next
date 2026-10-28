<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import type { DailyEventLayout } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation, { type CalendarAdapter } from '@fibrae/semi-foundation/calendar/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import { useCalendarContext } from './context';
    import type { CalendarSlots } from './interface';

    interface DayColProps {
        displayValue: Date;
        events: DailyEventLayout[];
        scrollHeight: number;
        isWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
    }

    interface DayColState {
        currPos: number;
        showCurrTime: boolean;
    }

    // decided on mount and again on each KeepAlive activation; views key the column by date and showCurrTime
    type Foundation = CalendarFoundation<DayColProps, DayColState>;
    type Adapter = CalendarAdapter<DayColProps, DayColState>;

    const props = defineProps<DayColProps>();
    const emit = defineEmits<{ slotClick: [event: MouseEvent, value: Date] }>();
    defineSlots<Pick<CalendarSlots, 'event' | 'dateGrid'>>();

    const eventsByKey = useCalendarContext();

    const { foundation, state } = useFoundation<Foundation, Adapter, DayColProps, DayColState>(
        CalendarFoundation,
        props,
        () => ({ currPos: 0, showCurrTime: false }),
        (base) => ({
            updateCurrPos: (currPos) => base.setState({ currPos }),
            setShowCurrTime: (showCurrTime) => base.setState({ showCurrTime }),
        })
    );

    const prefixCls = `${cssClasses.PREFIX}-grid`;
    const hours = Array.from({ length: 25 }, (_, hour) => hour);

    const pad = (d: number) => String(d).padStart(2, '0');

    const slotClick = (event: MouseEvent, hour: number, minute: number) => emit('slotClick', event, CalendarFoundation.formatCbValue([props.displayValue, hour, minute, 0]));

    const eventOf = (layout: DailyEventLayout) => eventsByKey?.value.get(layout.key) ?? layout;

    useKeepAliveFoundation(foundation);
</script>

<template>
    <div :class="prefixCls" role="cell">
        <div :class="`${prefixCls}-content`">
            <template v-if="props.showCurrTime && state.showCurrTime">
                <div :class="`${prefixCls}-curr-circle`" :style="{ top: `${state.currPos * props.scrollHeight}px` }" />
                <div :class="`${prefixCls}-curr-line`" :style="{ top: `${state.currPos * props.scrollHeight}px` }" />
            </template>
            <div :class="[`${prefixCls}-skeleton`, { [`${cssClasses.PREFIX}-weekend`]: props.isWeekend }]">
                <!-- pointer-only time slots: the cell has no keyboard way to pick a time, as in React -->
                <template v-for="hour in hours" :key="hour">
                    <div :class="`${prefixCls}-skeleton-row-line`" :data-time="`${pad(hour)}:00:00`" @click="slotClick($event, hour, 0)" />
                    <div :data-time="`${pad(hour)}:30:00`" @click="slotClick($event, hour, 30)" />
                </template>
            </div>
            <slot :date="props.displayValue" :dateString="props.displayValue.toString()" name="dateGrid" />
            <ul :class="`${cssClasses.PREFIX}-event-items`">
                <!-- Vue does not add px to numbers in a style object -->
                <li
                    v-for="layout in props.events"
                    :key="layout.key"
                    :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-day`]"
                    :style="{
                        top: `${layout.startPos * props.scrollHeight}px`,
                        height: `${Math.max(props.minEventHeight ?? Number.MIN_SAFE_INTEGER, (layout.endPos - layout.startPos) * props.scrollHeight)}px`,
                        left: toCssLength(layout.left),
                    }"
                >
                    <slot :event="eventOf(layout)" name="event">{{ layout.children }}</slot>
                </li>
            </ul>
        </div>
    </div>
</template>
