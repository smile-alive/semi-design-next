<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { format, startOfDay } from 'date-fns';
    import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
    import { checkWeekend } from '@fibrae/semi-foundation/components/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
    import { getDateFnsLocale } from '@fibrae/semi-foundation/utils/date-fns-locale';
    import { hasSlotContent } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import useScrollGrid from './composables/use-scroll-grid';
    import { useCalendarContext } from './context';
    import DayCol from './day-col.vue';
    import type { CalendarProps, CalendarSlots, EventObject } from './interface';
    import TimeCol from './time-col.vue';

    const props = defineProps<{
        classNames?: CalendarProps['classNames'];
        styles?: CalendarProps['styles'];
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
    const config = useConfig();
    const eventsByKey = useCalendarContext();

    const root = useTemplateRef('root');
    const scroll = useTemplateRef('scroll');

    const scrollHeight = useScrollGrid(root, scroll, () => props.scrollTop);

    const prefixCls = `${cssClasses.PREFIX}-day`;
    const allDayCls = `${cssClasses.PREFIX}-all-day`;
    const parsedEvents = computed(() => CalendarFoundation.getParseDailyEvents(props.events, props.displayValue));
    const dateFnsLocale = computed(() => getDateFnsLocale(i18n.value.localeCode, config.value.dateFnsLocale));

    // every view hands the dateGrid slot the day's midnight, not the caller's time of day
    const dayStart = computed(() => startOfDay(props.displayValue));
    const isWeekend = computed(() => props.markWeekend && checkWeekend(props.displayValue));

    const eventOf = (parsed: EventObject) => eventsByKey?.value.get(parsed.key) ?? parsed;
</script>

<template>
    <div ref="root" :aria-label="format(props.displayValue, 'PPP', { locale: dateFnsLocale })" :class="prefixCls" role="table" tabindex="0">
        <!-- the view scrolls and nothing inside it takes focus, so the keyboard can only scroll it through the root -->
        <div :class="`${prefixCls}-sticky-top`" role="rowgroup">
            <div v-if="hasSlotContent($slots.header)" role="row">
                <div role="cell">
                    <slot name="header" />
                </div>
            </div>
            <div :class="[allDayCls, props.classNames?.allDay]" role="row" :style="props.styles?.allDay">
                <div :class="[`${cssClasses.PREFIX}-tag`, `${allDayCls}-tag`, `${prefixCls}-sticky-left`]" role="rowheader">
                    <span>{{ i18n.locale.allDay }}</span>
                </div>
                <div :class="[`${allDayCls}-content`, { [`${cssClasses.PREFIX}-weekend`]: isWeekend }]" role="cell">
                    <ul :class="`${cssClasses.PREFIX}-event-items`">
                        <slot v-if="$slots.allDayEvents" :events="props.events" name="allDayEvents" />
                        <template v-else>
                            <li v-for="(item, ind) in parsedEvents.allDay" :key="item.key || `allDay-${ind}`" :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-allday`, props.classNames?.event]" :style="props.styles?.event">
                                <slot :event="eventOf(item)" name="event">{{ item.children }}</slot>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>
        <div :class="`${prefixCls}-scroll-wrapper`" role="rowgroup">
            <div ref="scroll" :class="`${prefixCls}-scroll`" role="row">
                <TimeCol :class="`${prefixCls}-sticky-left`" :classNames="props.classNames" :styles="props.styles">
                    <template v-if="$slots.timeDisplay" #timeDisplay="slotProps">
                        <slot name="timeDisplay" v-bind="slotProps" />
                    </template>
                </TimeCol>
                <DayCol
                    :classNames="props.classNames"
                    :displayValue="dayStart"
                    :events="parsedEvents.day"
                    :isWeekend="isWeekend"
                    :minEventHeight="props.minEventHeight"
                    :scrollHeight="scrollHeight"
                    :showCurrTime="props.showCurrTime"
                    :styles="props.styles"
                    :today="props.today"
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
