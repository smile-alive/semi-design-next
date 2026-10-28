<script setup lang="ts">
    import { computed, useId, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { calcRowHeight, toPercent, type DateObj } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useLocale from '../locale/use-locale';
    import { useCalendarContext } from './context';
    import DayCol from './day-col.vue';
    import type { CalendarSlots, EventObject, WeekStartsOn } from './interface';
    import TimeCol from './time-col.vue';
    import useScrollGrid from './use-scroll-grid';

    const props = defineProps<{
        range: Date[];
        /** The date whose month names the grid; the first day of the range by default */
        labelDate?: Date;
        events: EventObject[];
        markWeekend: boolean;
        minEventHeight?: number;
        showCurrTime: boolean;
        scrollTop: number;
        weekStartsOn: WeekStartsOn;
        today: number | null;
    }>();

    const emit = defineEmits<{ click: [event: MouseEvent, value: Date] }>();
    defineSlots<CalendarSlots>();

    const i18n = useLocale('Calendar');
    const eventsByKey = useCalendarContext();

    const monthId = useId();
    const root = useTemplateRef('root');
    const scroll = useTemplateRef('scroll');

    const scrollHeight = useScrollGrid(root, scroll, () => props.scrollTop);

    const prefixCls = `${cssClasses.PREFIX}-week`;
    const allDayCls = `${cssClasses.PREFIX}-all-day`;
    const rangeData = computed(() => CalendarFoundation.getRangeData(props.range, i18n.value.dateFnsLocale, props.weekStartsOn, props.today, props.labelDate));
    const parsedEvents = computed(() => CalendarFoundation.getParsedRangeEvents(props.events));
    const allDayEvents = computed(() => CalendarFoundation.parseRangeAllDayEvents(parsedEvents.value.allDay, props.range));

    const dayEvents = (day: DateObj) => CalendarFoundation.getParseDailyEvents(parsedEvents.value.day?.get(day.date.toString()) ?? [], day.date).day;

    const eventOf = (parsed: EventObject) => eventsByKey?.value.get(parsed.key) ?? parsed;

    const weekendCls = (day: DateObj) => ({ [`${cssClasses.PREFIX}-weekend`]: props.markWeekend && day.isWeekend });
</script>

<template>
    <div ref="root" :aria-labelledby="$attrs['aria-label'] ? undefined : monthId" :class="prefixCls" role="table" tabindex="0">
        <!-- the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root -->
        <div :class="`${prefixCls}-sticky-top`" role="rowgroup">
            <div v-if="hasSlotContent($slots.header)" role="row">
                <div role="cell">
                    <slot name="header" />
                </div>
            </div>
            <div :class="`${prefixCls}-header`" role="row">
                <div :id="monthId" :class="[`${cssClasses.PREFIX}-tag`, `${prefixCls}-tag`, `${prefixCls}-sticky-left`]" role="cell">
                    <span>{{ rangeData.month }}</span>
                </div>
                <div :class="`${prefixCls}-grid`">
                    <div :class="`${prefixCls}-grid-row`">
                        <div v-for="day in rangeData.week" :key="day.date.toString()" :aria-current="day.isToday ? 'date' : undefined" :class="[{ [`${cssClasses.PREFIX}-today`]: day.isToday }, weekendCls(day)]" role="columnheader">
                            <slot :date="day.date" name="dateDisplay">
                                <span :class="`${cssClasses.PREFIX}-today-date`">{{ day.dayString }}</span>
                                <span>{{ day.weekday }}</span>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
            <div :class="allDayCls" role="row" :style="$slots.allDayEvents ? undefined : { height: `${calcRowHeight(allDayEvents)}em` }">
                <div :class="[`${cssClasses.PREFIX}-tag`, `${allDayCls}-tag`, `${prefixCls}-sticky-left`]" role="rowheader">
                    <span>{{ i18n.locale.allDay }}</span>
                </div>
                <div :class="[`${cssClasses.PREFIX}-content`, `${allDayCls}-content`]" role="cell">
                    <div :class="`${allDayCls}-skeleton`">
                        <div v-for="(day, ind) in rangeData.week" :key="ind" :class="weekendCls(day)" />
                    </div>
                    <ul :class="`${cssClasses.PREFIX}-event-items`">
                        <slot v-if="$slots.allDayEvents" :events="props.events" name="allDayEvents" />
                        <template v-else>
                            <!-- positioned spans always carry leftPos, width and topInd; the foundation type keeps them optional -->
                            <li v-for="(item, ind) in allDayEvents" :key="item.key || `allDay-${ind}`" :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-allday`]" :style="{ left: toPercent(item.leftPos ?? 0), width: toPercent(item.width ?? 0), top: `${item.topInd ?? 0}em` }">
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
                    v-for="day in rangeData.week"
                    :key="`${day.date.toString()}|${props.showCurrTime}|${day.isToday}`"
                    :displayValue="day.date"
                    :events="dayEvents(day)"
                    :isWeekend="props.markWeekend && day.isWeekend"
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
