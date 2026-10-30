<script setup lang="ts">
    import { computed, nextTick, onMounted, onUpdated, shallowRef, useId, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { isRangeType } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import MonthsGridFoundation, { type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
    import { IconCalendar, IconClock } from '@fibrae/semi-icons-vue';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import Combobox from '../time-picker/combobox.vue';
    import type { ComboboxHandle, ComboboxProps } from '../time-picker/interface';
    import type { DatePickerMonthsGridEmits, DatePickerMonthsGridHandle, DatePickerMonthsGridProps, DatePickerMonthsGridSlots, DatePickerYearAndMonthHandle } from './internal';
    import Month from './month.vue';
    import Navigation from './navigation.vue';
    import YearAndMonth from './year-and-month.vue';

    const props = withDefaults(defineProps<DatePickerMonthsGridProps>(), {
        dateFnsLocale: undefined,
        multiple: false,
        max: undefined,
        weekStartsOn: 0,
        disabledTimePicker: false,
        hideDisabledOptions: false,
        isControlledComponent: false,
        rangeInputFocus: false,
        format: undefined,
        startDateOffset: undefined,
        endDateOffset: undefined,
        autoSwitchDate: true,
        density: 'default',
        timeZone: undefined,
        syncSwitchMonth: false,
        focusRecords: () => ({ rangeStart: false, rangeEnd: false }),
        insetInput: false,
        presetPosition: undefined,
        hasPresets: false,
        selectedValue: undefined,
        defaultPickerValue: undefined,
        timePickerOpts: undefined,
        yearAndMonthOpts: undefined,
        startYear: undefined,
        endYear: undefined,
        hasOtherRangeInputBeenFocused: undefined,
    });

    const emit = defineEmits<DatePickerMonthsGridEmits>();
    defineSlots<DatePickerMonthsGridSlots>();

    const titleId = useId();
    let panelHeight = 0;

    const { foundation, state } = useFoundation<MonthsGridFoundation, MonthsGridAdapter, MonthsGridFoundationProps, MonthsGridFoundationState>(
        MonthsGridFoundation,
        props,
        (view) => MonthsGridFoundation.getInitialState(view),
        (base) => ({
            updateDaySelected: (selected) => base.setState({ selected }),
            setRangeStart: (rangeStart) => base.setState({ rangeStart }),
            setRangeEnd: (rangeEnd) => base.setState({ rangeEnd }),
            setHoverDay: (hoverDay) => base.setState({ hoverDay }),
            setOffsetRangeStart: (offsetRangeStart) => base.setState({ offsetRangeStart }),
            setOffsetRangeEnd: (offsetRangeEnd) => base.setState({ offsetRangeEnd }),
            updateMonthOnLeft: (monthLeft) => base.setState({ monthLeft }),
            updateMonthOnRight: (monthRight) => base.setState({ monthRight }),
            notifySelectedChange: (value, options) => emit('change', value, options),
            notifyPanelChange: (date, dateString) => emit('panelChange', date, dateString),
            setRangeInputFocus: (rangeInputFocus) => emit('rangeInputFocus', rangeInputFocus),
            hasOtherRangeInputBeenFocused: (currentRangeInput) => props.hasOtherRangeInputBeenFocused?.(currentRangeInput) ?? false,
        })
    );

    const prefix = cssClasses.PREFIX;
    const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;
    const { isYearOrTime } = MonthsGridFoundation;
    const isRange = computed(() => isRangeType(props.type));
    const panelTypes = computed<PanelType[]>(() => (isRange.value ? [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] : [PANEL_TYPE_LEFT]));
    const dateFormat = computed(() => MonthsGridFoundation.getValidDateFormat(props));

    const nodes = {
        panel: { left: null, right: null } as Record<PanelType, HTMLElement | null>,
        wrap: { left: null, right: null } as Record<PanelType, HTMLElement | null>,
        switch: { left: null, right: null } as Record<PanelType, HTMLElement | null>,
    };

    const timePickers: Record<PanelType, ComboboxHandle | null> = { left: null, right: null };
    const yearAndMonths: Record<PanelType, DatePickerYearAndMonthHandle | null> = { left: null, right: null };
    const emptySize = { minWidth: '', minHeight: '' };

    const panelSize = shallowRef({ left: emptySize, right: emptySize });

    const detailOf = (panelType: PanelType) => (panelType === PANEL_TYPE_RIGHT ? state.value.monthRight : state.value.monthLeft);

    const attach = (part: keyof typeof nodes, panelType: PanelType, node: unknown) => {
        nodes[part][panelType] = node as HTMLElement | null;
    };

    // The button that switches between the month and the year picker unmounts or hides under the focus, so the view it
    // switched to takes the focus once rendered
    const showYearPicker = (panelType: PanelType) => {
        foundation.showYearPicker(panelType);
        void nextTick(() => nodes.panel[panelType]?.querySelector<HTMLElement>('[role="listbox"]')?.focus());
    };

    const showDatePanel = (panelType: PanelType) => {
        foundation.showDatePanel(panelType);
        void nextTick(() => (nodes.panel[panelType]?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`)?.focus());
    };

    const scrollListHeight = () => {
        const height = (panelType: PanelType) => (nodes.wrap[panelType]?.getBoundingClientRect().height || 0) + (nodes.switch[panelType]?.getBoundingClientRect().height || 0);
        return Math.max(height(PANEL_TYPE_LEFT), height(PANEL_TYPE_RIGHT));
    };

    // Equal sizes keep the ref, which ends the update cycle this write starts.
    const applyPanelSize = () => {
        const size = MonthsGridFoundation.getPanelSizeStyle(state.value, props.insetInput, {
            monthWidth: (panelType) => nodes.wrap[panelType]?.getBoundingClientRect().width ?? null,
            scrollListHeight: () => panelHeight || scrollListHeight(),
        });
        const current = panelSize.value;
        const same = (panelType: PanelType) => current[panelType].minWidth === size[panelType].minWidth && current[panelType].minHeight === size[panelType].minHeight;
        if (!same(PANEL_TYPE_LEFT) || !same(PANEL_TYPE_RIGHT)) {
            panelSize.value = size;
        }
    };

    const reselect = () => {
        for (const handle of [timePickers.left, timePickers.right, yearAndMonths.left, yearAndMonths.right]) {
            handle?.reselect();
        }
    };

    // Panels share a minHeight only while both show scroll lists, so only the cached height is updated here
    const handleWeeksRowNumChange = () => {
        if (isRange.value && !(isYearOrTime(state.value.monthLeft) && isYearOrTime(state.value.monthRight))) {
            panelHeight = scrollListHeight();
        }
    };

    const timeOptions = (panelType: PanelType) => {
        const options: Partial<ComboboxProps> = { ...props.timePickerOpts, hideDisabledOptions: props.hideDisabledOptions };
        const disabled = MonthsGridFoundation.calcDisabledTime(props, state.value, panelType);
        for (const key of ['disabledHours', 'disabledMinutes', 'disabledSeconds'] as const) {
            if (disabled?.[key]) {
                Object.assign(options, { [key]: disabled[key] });
            }
        }
        return options;
    };

    const switchTexts = (panelType: PanelType) =>
        MonthsGridFoundation.getSwitchTexts({
            rangeEndpoint: panelType === PANEL_TYPE_LEFT ? state.value.rangeStart : state.value.rangeEnd,
            showDate: detailOf(panelType).showDate,
            dateFormat: dateFormat.value,
            format: props.format,
            locale: props.locale,
            dateFnsLocale: props.dateFnsLocale,
        });

    const panelClass = (panelType: PanelType) => {
        const detail = detailOf(panelType);
        return [`${prefix}-month-grid-${panelType}`, { [`${prefix}-yam-showing`]: !isRange.value && (detail.isTimePickerOpen || detail.isYearPickerOpen) }];
    };

    watch(
        () => props.selectedValue,
        (value) => foundation.updateSelectedFromProps(value as (Date | null)[])
    );

    // by content: a parent rendering `new Date(...)` each time must not pull the panel back
    useDidUpdate(() => props.defaultPickerValue, foundation.initDefaultPickerValue, isEqual, 'pre');

    watch(
        () => (isRange.value ? Number(isYearOrTime(state.value.monthLeft)) + Number(isYearOrTime(state.value.monthRight)) : 0),
        (count, previous) => {
            if (previous === 1 && count === 2) {
                panelHeight = scrollListHeight();
                applyPanelSize();
                // min-height reaches the DOM on the next flush; the lists centre against it
                void nextTick(reselect);
            } else if (previous === 2 && count === 1) {
                reselect();
            }
        },
        { flush: 'post' }
    );

    onMounted(applyPanelSize);
    onUpdated(applyPanelSize);

    defineExpose<DatePickerMonthsGridHandle>({
        showDatePanel: foundation.showDatePanel,
        showTimePicker: foundation.showTimePicker,
    });
</script>

<template>
    <div :style="{ display: 'flex' }">
        <slot v-if="props.presetPosition === 'left'" name="quickControls" />
        <div>
            <slot name="dateInput" />
            <div :class="`${prefix}-month-grid`" :x-insetinput="props.insetInput ? 'true' : 'false'" :x-panel-yearandmonth-open-type="MonthsGridFoundation.getYAMOpenType(state)" :x-preset-position="props.hasPresets ? props.presetPosition : 'null'" :x-type="props.type">
                <div v-for="panelType in panelTypes" :key="panelType" :ref="(node) => attach('panel', panelType, node)" :class="panelClass(panelType)" :style="panelSize[panelType]" :x-open-type="MonthsGridFoundation.getOpenType(detailOf(panelType))">
                    <div v-if="detailOf(panelType).isYearPickerOpen" :class="`${prefix}-yam`">
                        <YearAndMonth
                            :ref="(handle) => (yearAndMonths[panelType] = handle as DatePickerYearAndMonthHandle | null)"
                            :currentMonth="{ left: detailOf(panelType).pickerDate.getMonth() + 1, right: 0 }"
                            :currentYear="{ left: detailOf(panelType).pickerDate.getFullYear(), right: 0 }"
                            :density="props.density"
                            :endYear="props.endYear"
                            :locale="props.locale"
                            :startYear="props.startYear"
                            :yearAndMonthOpts="props.yearAndMonthOpts"
                            @backToMain="showDatePanel(panelType)"
                            @select="foundation.toYearMonth(panelType, new Date($event.currentYear.left, $event.currentMonth.left - 1))"
                        />
                    </div>
                    <div v-if="detailOf(panelType).isTimePickerOpen" :class="`${prefix}-tpk`">
                        <div :class="`${prefix}-time`">
                            <Combobox :ref="(handle) => (timePickers[panelType] = handle as ComboboxHandle | null)" :format="props.format || strings.FORMAT_TIME_PICKER" :timeStampValue="detailOf(panelType).pickerDate" v-bind="timeOptions(panelType)" @change="foundation.handleTimeChange($event, panelType)">
                                <template #panelHeader>{{ props.locale.selectTime }}</template>
                            </Combobox>
                        </div>
                    </div>
                    <div v-if="isRange || !isYearOrTime(detailOf(panelType))" :ref="(node) => attach('wrap', panelType, node)" :style="isRange && isYearOrTime(detailOf(panelType)) ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : undefined">
                        <Navigation
                            :density="props.density"
                            :locale="props.locale"
                            :monthText="MonthsGridFoundation.formatMonthText(props.locale, detailOf(panelType).pickerDate)"
                            :panelType="panelType"
                            :shouldBimonthSwitch="isRange && props.syncSwitchMonth"
                            :titleId="`${titleId}-${panelType}-title`"
                            @monthClick="showYearPicker(panelType)"
                            @nextMonth="foundation.nextMonth(panelType)"
                            @nextYear="foundation.nextYear(panelType)"
                            @prevMonth="foundation.prevMonth(panelType)"
                            @prevYear="foundation.prevYear(panelType)"
                        />
                        <Month
                            :disabledDate="props.disabledDate"
                            :focusRecords="props.focusRecords"
                            :hoverDay="state.hoverDay"
                            :labelledby="`${titleId}-${panelType}-title`"
                            :locale="props.locale"
                            :month="detailOf(panelType).pickerDate"
                            :multiple="props.multiple || isRange"
                            :offsetRangeEnd="state.offsetRangeEnd"
                            :offsetRangeStart="state.offsetRangeStart"
                            :rangeEnd="state.rangeEnd"
                            :rangeInputFocus="props.rangeInputFocus"
                            :rangeStart="state.rangeStart"
                            :selected="state.selected"
                            :weekStartsOn="props.weekStartsOn"
                            @dayClick="foundation.handleDayClick($event, panelType)"
                            @dayHover="foundation.handleDayHover"
                            @monthSwitch="foundation[$event](panelType)"
                            @weeksRowNumChange="handleWeeksRowNumChange"
                        >
                            <template v-if="$slots.date" #date="slotProps">
                                <slot name="date" v-bind="slotProps" />
                            </template>
                            <template v-if="$slots.fullDate" #fullDate="slotProps">
                                <slot name="fullDate" v-bind="slotProps" />
                            </template>
                        </Month>
                    </div>
                    <div v-if="props.type.includes('Time') && !props.insetInput" :ref="(node) => attach('switch', panelType, node)" :class="`${prefix}-switch`">
                        <button :aria-label="props.locale.switchToDate" :class="[`${prefix}-switch-date`, { [`${prefix}-switch-date-active`]: !detailOf(panelType).isTimePickerOpen }]" type="button" @click="foundation.showDatePanel(panelType)">
                            <IconCalendar v-if="props.density === 'default'" />
                            <span :class="`${prefix}-switch-text`">{{ switchTexts(panelType).date }}</span>
                        </button>
                        <button
                            :aria-label="props.locale.switchToTime"
                            :class="[`${prefix}-switch-time`, { [`${prefix}-switch-time-disabled`]: props.disabledTimePicker, [`${prefix}-switch-date-active`]: detailOf(panelType).isTimePickerOpen }]"
                            :disabled="props.disabledTimePicker"
                            type="button"
                            @click="foundation.showTimePicker(panelType)"
                        >
                            <IconClock v-if="props.density === 'default'" />
                            <span :class="`${prefix}-switch-text`">{{ switchTexts(panelType).time }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <slot v-if="props.presetPosition === 'right'" name="quickControls" />
    </div>
</template>
