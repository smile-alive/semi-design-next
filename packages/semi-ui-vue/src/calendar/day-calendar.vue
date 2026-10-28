<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { format, isSameDay, startOfDay } from 'date-fns';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { checkWeekend } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useLocale from '../locale/use-locale';
    import { useCalendarContext } from './context';
    import DayCol from './day-col.vue';
    import type { CalendarSlots, EventObject } from './interface';
    import TimeCol from './time-col.vue';
    import useScrollGrid from './use-scroll-grid';

    const props = defineProps<{
        displayValue: Date;
        events: EventObject[];
        markWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
        scrollTop: number;
        today: number | null;
    }>();

    const emit = defineEmits<{ click: [event: MouseEvent, value: Date] }>();
    defineSlots<Omit<CalendarSlots, 'dateDisplay'>>();

    const i18n = useLocale('Calendar');
    const eventsByKey = useCalendarContext();

    const root = useTemplateRef('root');
    const scroll = useTemplateRef('scroll');

    const scrollHeight = useScrollGrid(root, scroll, () => props.scrollTop);

    const prefixCls = `${cssClasses.PREFIX}-day`;
    const allDayCls = `${cssClasses.PREFIX}-all-day`;
    const parsedEvents = computed(() => CalendarFoundation.getParseDailyEvents(props.events, props.displayValue));

    // every view hands the dateGrid slot the day's midnight, not the caller's time of day
    const dayStart = computed(() => startOfDay(props.displayValue));
    const isWeekend = computed(() => props.markWeekend && checkWeekend(props.displayValue));

    const eventOf = (parsed: EventObject) => eventsByKey?.value.get(parsed.key) ?? parsed;
</script>

<template>
    <div ref="root" :aria-label="format(props.displayValue, 'PPP', { locale: i18n.dateFnsLocale })" :class="prefixCls" role="table" tabindex="0">
        <!-- the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root -->
        <div :class="`${prefixCls}-sticky-top`" role="rowgroup">
            <div v-if="hasSlotContent($slots.header)" role="row">
                <div role="cell">
                    <slot name="header" />
                </div>
            </div>
            <div :class="allDayCls" role="row">
                <div :class="[`${cssClasses.PREFIX}-tag`, `${allDayCls}-tag`, `${prefixCls}-sticky-left`]" role="rowheader">
                    <span>{{ i18n.locale.allDay }}</span>
                </div>
                <div :class="[`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend }]" role="cell">
                    <ul :class="`${cssClasses.PREFIX}-event-items`">
                        <slot v-if="$slots.allDayEvents" :events="props.events" name="allDayEvents" />
                        <template v-else>
                            <li v-for="(item, ind) in parsedEvents.allDay" :key="item.key || `allDay-${ind}`" :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-allday`]">
                                <slot :event="eventOf(item)" name="event">{{ item.children }}</slot>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>
        <div :class="`${prefixCls}-scroll-wrapper`" role="rowgroup">
            <div ref="scroll" :class="`${prefixCls}-scroll`" role="row">
                <TimeCol :class="`${prefixCls}-sticky-left`">
                    <template v-if="$slots.timeDisplay" #timeDisplay="slotProps">
                        <slot name="timeDisplay" v-bind="slotProps" />
                    </template>
                </TimeCol>
                <!-- a new day, a new showCurrTime or a day that becomes today gets a new column, which decides again whether to show the line -->
                <DayCol
                    :key="`${dayStart.toDateString()}|${props.showCurrTime}|${props.today !== null && isSameDay(dayStart, props.today)}`"
                    :displayValue="dayStart"
                    :events="parsedEvents.day"
                    :isWeekend="isWeekend"
                    :minEventHeight="props.minEventHeight"
                    :scrollHeight="scrollHeight"
                    :showCurrTime="props.showCurrTime"
                    @slotClick="(event, value) => emit('click', event, value)"
                >
                    <template v-if="$slots.event" #event="slotProps">
                        <slot name="event" v-bind="slotProps" />
                    </template>
                    <template v-if="$slots.dateGrid" #dateGrid="slotProps">
                        <slot name="dateGrid" v-bind="slotProps" />
                    </template>
                </DayCol>
            </div>
        </div>
    </div>
</template>
