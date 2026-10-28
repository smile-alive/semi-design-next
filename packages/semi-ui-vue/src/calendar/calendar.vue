<script setup lang="ts">
    import { computed } from 'vue';
    import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/calendar/calendar.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import { provideCalendarContext } from './context';
    import DayCalendar from './day-calendar.vue';
    import type { CalendarEmits, CalendarProps, CalendarSlots } from './interface';
    import MonthCalendar from './month-calendar.vue';
    import TimeGrid from './time-grid.vue';
    import useToday from './use-today';

    defineOptions({ name: 'Calendar' });

    const props = withDefaults(defineProps<CalendarProps & /* @vue-ignore */ ElementProps<'div', keyof CalendarProps | EmitHandlers<CalendarEmits>>>(), {
        displayValue: semiGlobalDefault('Calendar', 'displayValue'),
        range: semiGlobalDefault('Calendar', 'range'),
        events: () => semiDefault('Calendar', 'events', []),
        mode: () => semiDefault('Calendar', 'mode', 'week'),
        showCurrTime: () => semiDefault('Calendar', 'showCurrTime', true),
        weekStartsOn: () => semiDefault('Calendar', 'weekStartsOn', 0),
        scrollTop: () => semiDefault('Calendar', 'scrollTop', 400),
        markWeekend: () => semiDefault('Calendar', 'markWeekend', false),
        minEventHeight: semiGlobalDefault('Calendar', 'minEventHeight'),
        width: semiGlobalDefault('Calendar', 'width'),
        height: () => semiDefault('Calendar', 'height', 600),
    });

    const emit = defineEmits<CalendarEmits>();

    // The template forwards a slot only when it is provided: a view renders its defaults when a slot is absent.
    defineSlots<CalendarSlots>();

    // One "today" source per Calendar; the views read it.
    const today = useToday();

    // Without displayValue the first frame shows the current date, so SSR users pass displayValue to make the server and the browser agree
    const displayValue = computed(() => props.displayValue ?? new Date(today.value ?? getCurrDate()));

    // Week and range share the time grid; the week is named by the month of the displayed date, which its first day
    // may not be in. A range view without `range` throws, as in React.
    const weekRange = computed(() => CalendarFoundation.getWeekRange(displayValue.value, props.weekStartsOn));
    const rootStyle = computed(() => ({ height: toCssLength(props.height), width: toCssLength(props.width) }));

    // Only a non-empty, unique key identifies an event; otherwise a view keeps the layout's own copy.
    provideCalendarContext(
        computed(() => {
            const counts = new Map<string, number>();
            for (const { key } of props.events) {
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
            return new Map(props.events.filter(({ key }) => key && counts.get(key) === 1).map((event) => [event.key, event]));
        })
    );
</script>

<template>
    <DayCalendar v-if="props.mode === 'day'" :displayValue="displayValue" :events="props.events" :markWeekend="props.markWeekend" :minEventHeight="props.minEventHeight" :scrollTop="props.scrollTop" :showCurrTime="props.showCurrTime" :style="rootStyle" :today="today" @click="(...args) => emit('click', ...args)">
        <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name as keyof CalendarSlots" v-bind="scope" />
        </template>
    </DayCalendar>
    <MonthCalendar
        v-else-if="props.mode === 'month'"
        :displayValue="displayValue"
        :events="props.events"
        :markWeekend="props.markWeekend"
        :style="rootStyle"
        :today="today"
        :weekStartsOn="props.weekStartsOn"
        @click="(...args) => emit('click', ...args)"
        @close="(...args) => emit('close', ...args)"
        @moreClick="(...args) => emit('moreClick', ...args)"
    >
        <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name as keyof CalendarSlots" v-bind="scope" />
        </template>
    </MonthCalendar>
    <TimeGrid
        v-else
        :events="props.events"
        :labelDate="props.mode === 'week' ? displayValue : undefined"
        :markWeekend="props.markWeekend"
        :minEventHeight="props.minEventHeight"
        :range="props.mode === 'week' ? weekRange : (props.range as Date[])"
        :scrollTop="props.scrollTop"
        :showCurrTime="props.showCurrTime"
        :style="rootStyle"
        :today="today"
        :weekStartsOn="props.weekStartsOn"
        @click="(...args) => emit('click', ...args)"
    >
        <template v-for="(_, name) in $slots" #[name]="scope">
            <slot :name="name as keyof CalendarSlots" v-bind="scope" />
        </template>
    </TimeGrid>
</template>
