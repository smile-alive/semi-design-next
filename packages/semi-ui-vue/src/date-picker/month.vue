<script setup lang="ts">
    import { computed, onMounted, shallowRef, useId, watch } from 'vue';
    import { format, parseISO } from 'date-fns';
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import MonthFoundation, { type MonthDayInfo } from '@fibrae/semi-foundation/date-picker/month-foundation';
    import useToday from '../calendar/use-today';
    import useConfig from '../config-provider/use-config';
    import type { DatePickerMonthEmits, DatePickerMonthProps, DatePickerMonthSlots } from './internal';

    const props = withDefaults(defineProps<DatePickerMonthProps>(), { labelledby: undefined });
    const emit = defineEmits<DatePickerMonthEmits>();
    const slots = defineSlots<DatePickerMonthSlots>();

    const config = useConfig();

    const gridId = useId();
    const keyboardDate = shallowRef('');

    // empty until mounted, so the server render and the hydration pass mark no day as today
    const today = useToday();

    const prefix = cssClasses.PREFIX;
    const todayText = computed(() => (today.value === null ? '' : format(today.value, strings.FORMAT_FULL_DATE)));
    const weeks = computed(() => MonthFoundation.getMonthTable(props.month, props.weekStartsOn).weeks);
    const activeDate = computed(() => MonthFoundation.getDefaultActiveDate(format(props.month, strings.FORMAT_YEAR_MONTH), [keyboardDate.value, ...props.selected, props.rangeStart, props.rangeEnd, todayText.value]));
    const weekdays = computed(() => MonthFoundation.getWeekdays(props.weekStartsOn).map((key) => props.locale.weeks[key as keyof DatePickerMonthProps['locale']['weeks']]));

    const statuses = computed(() => {
        const options = {
            selected: props.selected,
            rangeStart: props.rangeStart,
            rangeEnd: props.rangeEnd,
            offsetRangeStart: props.offsetRangeStart,
            offsetRangeEnd: props.offsetRangeEnd,
            disabledDate: props.disabledDate,
            hoverDay: props.hoverDay,
            rangeInputFocus: props.rangeInputFocus,
            focusRecords: props.focusRecords,
            // today is overlaid in statusOf: marking it after mount must not call disabledDate for every cell again
            todayText: '',
        };
        return new Map(
            weeks.value
                .flat()
                .filter((day) => day.fullDate)
                .map((day) => [day.fullDate, MonthFoundation.getDayStatus(day, options)])
        );
    });

    const dayId = (fullDate: string) => `${gridId}-${fullDate}`;

    const statusOf = (day: MonthDayInfo) => {
        const status = statuses.value.get(day.fullDate) as ReturnType<typeof MonthFoundation.getDayStatus>;
        return day.fullDate === todayText.value ? { ...status, isToday: true } : status;
    };

    const dayClass = (day: MonthDayInfo) => {
        if (slots.fullDate) {
            return [cssClasses.DAY, { [cssClasses.DAY_ACTIVE]: day.fullDate === activeDate.value }];
        }
        return [cssClasses.DAY, MonthFoundation.getDayClasses(statusOf(day), day.fullDate === activeDate.value)];
    };

    // a range keeps its value in rangeStart and rangeEnd, not in `selected`
    const isSelected = (day: MonthDayInfo) => {
        const status = statusOf(day);
        return Boolean(status.isSelected || status.isSelectedStart || status.isSelectedEnd);
    };

    const selectDay = (day?: MonthDayInfo) => {
        if (day && !statusOf(day).isDisabled) {
            keyboardDate.value = day.fullDate;
            emit('dayClick', day);
        }
    };

    // APG grid: focus stays on the grid; the keys move the active day, Enter or Space selects it
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectDay(weeks.value.flat().find((day) => day.fullDate === activeDate.value));
            return;
        }
        const target = MonthFoundation.getKeyboardTargetDate(event, parseISO(activeDate.value), props.weekStartsOn, config.value.direction === 'rtl');
        if (target) {
            event.preventDefault();
            keyboardDate.value = format(target, strings.FORMAT_FULL_DATE);
            const switchType = MonthFoundation.getMonthSwitch(target, props.month);
            if (switchType) {
                emit('monthSwitch', switchType);
            }
        }
    };

    watch(
        () => weeks.value.length,
        (count) => emit('weeksRowNumChange', count),
        { flush: 'post' }
    );

    // MonthsGrid reads the DOM, so notify after the patch
    onMounted(() => emit('weeksRowNumChange', weeks.value.length));
</script>

<template>
    <!-- cells are not focusable (aria-activedescendant) -->
    <div :aria-activedescendant="dayId(activeDate)" :aria-labelledby="props.labelledby" :aria-multiselectable="props.multiple" :class="cssClasses.MONTH" role="grid" tabindex="0" @keydown="handleKeyDown">
        <div :class="cssClasses.WEEKDAY" role="row">
            <div v-for="(text, index) in weekdays" :key="index" :class="`${prefix}-weekday-item`" role="columnheader">
                {{ text }}
            </div>
        </div>
        <div :class="cssClasses.WEEKS">
            <div v-for="(week, weekIndex) in weeks" :key="weekIndex" :class="cssClasses.WEEK" role="row">
                <template v-for="(day, dayIndex) in week" :key="dayIndex">
                    <div v-if="!day.fullDate" :class="cssClasses.DAY" role="gridcell"><span /></div>
                    <div v-else :id="dayId(day.fullDate)" :aria-disabled="statusOf(day).isDisabled" :aria-label="day.fullDate" :aria-selected="isSelected(day)" :class="dayClass(day)" role="gridcell" :title="day.fullDate" @click="selectDay(day)" @mouseenter="emit('dayHover', day)" @mouseleave="emit('dayHover')">
                        <slot v-if="$slots.fullDate" :dayNumber="Number(day.dayNumber)" :dayStatus="statusOf(day)" :fullDate="day.fullDate" name="fullDate" />
                        <div v-else :class="`${cssClasses.DAY}-main`">
                            <slot :dayNumber="Number(day.dayNumber)" :fullDate="day.fullDate" name="date">
                                <span>{{ day.dayNumber }}</span>
                            </slot>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
