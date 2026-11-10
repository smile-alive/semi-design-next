<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { strings } from '@fibrae/semi-foundation/components/date-picker/constants';
    import type { PanelType } from '@fibrae/semi-foundation/components/date-picker/months-grid-foundation';
    import YearAndMonthFoundation, { type MonthScrollItem, type YearAndMonthAdapter, type YearAndMonthFoundationProps, type YearScrollItem } from '@fibrae/semi-foundation/components/date-picker/year-and-month-foundation';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import { IconChevronLeft } from '@fibrae/semi-icons-vue';
    import SlotFragment from '../../base/slot-fragment';
    import useFoundation from '../../base/use-foundation';
    import IconButton from '../icon-button/icon-button.vue';
    import type { ScrollItemHandle, ScrollItemSelectData } from '../scroll-list/interface';
    import ScrollItem from '../scroll-list/scroll-item.vue';
    import ScrollList from '../scroll-list/scroll-list.vue';
    import type { DatePickerYearAndMonthEmits, DatePickerYearAndMonthHandle, DatePickerYearAndMonthProps, DatePickerYearAndMonthSlots } from './internal';

    const props = withDefaults(defineProps<DatePickerYearAndMonthProps>(), {
        monthCycled: false,
        yearCycled: false,
        noBackBtn: false,
        disabledDate: undefined,
        density: undefined,
        presetPosition: undefined,
        type: 'month',
        yearAndMonthOpts: undefined,
        startYear: undefined,
        endYear: undefined,
    });

    const emit = defineEmits<DatePickerYearAndMonthEmits>();
    defineSlots<DatePickerYearAndMonthSlots>();

    // v-for ref: inference types each item as nullable, but Vue only collects mounted instances.
    const columns = useTemplateRef<ScrollItemHandle[]>('columns');

    const { foundation } = useFoundation<YearAndMonthFoundation, YearAndMonthAdapter, YearAndMonthFoundationProps, Record<string, never>>(
        YearAndMonthFoundation,
        props,
        () => ({}),
        () => ({
            notifySelect: (yearAndMonth) => emit('select', yearAndMonth),
        })
    );

    const prefix = `${BASE_CLASS_PREFIX}-datepicker`;
    const current = computed(() => YearAndMonthFoundation.getYearAndMonth(props));
    const panelTypes = computed<PanelType[]>(() => (props.type === 'monthRange' ? [strings.PANEL_TYPE_LEFT, strings.PANEL_TYPE_RIGHT] : [strings.PANEL_TYPE_LEFT]));
    const iconSize = computed(() => (props.density === 'compact' ? 'default' : 'large'));
    const buttonSize = computed(() => (props.density === 'compact' ? 'small' : 'default'));

    const panels = computed(() =>
        panelTypes.value.map((panelType) => {
            const years = YearAndMonthFoundation.getYearList(props, panelType);
            const months = YearAndMonthFoundation.getMonthList(props, panelType);
            return {
                panelType,
                years,
                months,
                yearIndex: years.findIndex((item) => item.value === current.value.currentYear[panelType]),
                monthIndex: months.findIndex((item) => item.month === current.value.currentMonth[panelType]),
            };
        })
    );

    const yearText = (value: number) => formatLocale(props.locale.yearText, { year: value });

    defineExpose<DatePickerYearAndMonthHandle>({
        reselect: () => {
            for (const column of columns.value ?? []) {
                column.scrollToIndex();
            }
        },
    });
</script>

<template>
    <div v-if="!props.noBackBtn" :class="`${prefix}-yearmonth-header`">
        <IconButton :noHorizontalPadding="false" :size="buttonSize" @click="emit('backToMain')">
            <template #icon>
                <IconChevronLeft :size="iconSize" />
            </template>
            <span>{{ props.locale.selectDate }}</span>
        </IconButton>
    </div>
    <component :is="props.presetPosition ? 'div' : SlotFragment" :style="{ display: 'flex' }">
        <slot v-if="props.presetPosition === 'left' && props.type !== 'monthRange'" name="quickControls" />
        <component :is="props.presetPosition ? 'div' : SlotFragment">
            <slot name="dateInput" />
            <component :is="props.type === 'monthRange' ? 'div' : SlotFragment" :class="`${prefix}-yearmonth-body`">
                <ScrollList v-for="panel in panels" :key="panel.panelType">
                    <ScrollItem
                        ref="columns"
                        :aria-label="props.locale.year"
                        :cycled="props.yearCycled"
                        :list="panel.years"
                        mode="normal"
                        :selectedIndex="panel.yearIndex"
                        :transform="yearText"
                        v-bind="props.yearAndMonthOpts"
                        @select="foundation.selectYear($event as ScrollItemSelectData<YearScrollItem>, panel.panelType)"
                    />
                    <ScrollItem
                        v-if="props.type !== 'year'"
                        ref="columns"
                        :aria-label="props.locale.month"
                        :cycled="props.monthCycled"
                        :list="panel.months"
                        mode="normal"
                        :selectedIndex="panel.monthIndex"
                        v-bind="props.yearAndMonthOpts"
                        @select="foundation.selectMonth($event as ScrollItemSelectData<MonthScrollItem>, panel.panelType)"
                    />
                </ScrollList>
            </component>
        </component>
        <slot v-if="props.presetPosition === 'right' && props.type !== 'monthRange'" name="quickControls" />
    </component>
</template>
