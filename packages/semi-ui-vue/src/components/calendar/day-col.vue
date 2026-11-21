<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
    import type { DailyEventLayout } from '@fibrae/semi-foundation/components/calendar/event-util';
    import CalendarFoundation, { type CalendarAdapter, type CalendarBaseState } from '@fibrae/semi-foundation/components/calendar/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import { useFoundation, useKeepAliveFoundation } from '../../base/index';
    import { useCalendarContext } from './context';
    import type { CalendarProps, CalendarSlots } from './interface';

    interface DayColProps {
        classNames?: CalendarProps['classNames'];
        styles?: CalendarProps['styles'];
        displayValue: Date;
        events: DailyEventLayout[];
        scrollHeight: number;
        isWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
        today: number | null;
    }

    type Foundation = CalendarFoundation<DayColProps>;
    type Adapter = CalendarAdapter<DayColProps>;

    const props = defineProps<DayColProps>();
    const emit = defineEmits<{ slotClick: [event: MouseEvent, value: Date] }>();
    defineSlots<Pick<CalendarSlots, 'event' | 'dateGrid'>>();

    const eventsByKey = useCalendarContext();

    const { foundation, state } = useFoundation<Foundation, Adapter, DayColProps, CalendarBaseState>(
        CalendarFoundation,
        props,
        () => CalendarFoundation.getInitialState(),
        () => ({})
    );

    const prefixCls = `${cssClasses.PREFIX}-grid`;
    const hours = Array.from({ length: 25 }, (_, hour) => hour);

    const pad = (d: number) => String(d).padStart(2, '0');

    const slotClick = (event: MouseEvent, hour: number, minute: number) => emit('slotClick', event, CalendarFoundation.formatCbValue([props.displayValue, hour, minute, 0]));

    const eventOf = (layout: DailyEventLayout) => eventsByKey?.value.get(layout.key) ?? layout;

    useKeepAliveFoundation(foundation);
</script>

<template>
    <div :class="[prefixCls, props.classNames?.day]" role="cell" :style="props.styles?.day">
        <div :class="`${prefixCls}-content`">
            <template v-if="props.showCurrTime && state.showCurrTime">
                <div :class="[`${prefixCls}-curr-circle`, props.classNames?.currentTimeDot]" :style="[{ top: `${state.currPos * props.scrollHeight}px` }, props.styles?.currentTimeDot]" />
                <div :class="[`${prefixCls}-curr-line`, props.classNames?.currentTimeLine]" :style="[{ top: `${state.currPos * props.scrollHeight}px` }, props.styles?.currentTimeLine]" />
            </template>
            <div :class="[`${prefixCls}-skeleton`, { [`${cssClasses.PREFIX}-weekend`]: props.isWeekend }]">
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
                    :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-day`, props.classNames?.event]"
                    :style="[
                        {
                            top: `${layout.startPos * props.scrollHeight}px`,
                            height: `${Math.max(props.minEventHeight ?? Number.MIN_SAFE_INTEGER, (layout.endPos - layout.startPos) * props.scrollHeight)}px`,
                            insetInlineStart: toCssLength(layout.left),
                        },
                        props.styles?.event,
                    ]"
                >
                    <slot :event="eventOf(layout)" name="event">{{ layout.children }}</slot>
                </li>
            </ul>
        </div>
    </div>
</template>
