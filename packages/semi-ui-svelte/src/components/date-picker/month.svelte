<script lang="ts">
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
    import MonthFoundation, { type MonthAdapter, type MonthDayInfo, type MonthFoundationProps, type MonthFoundationState } from '@fibrae/semi-foundation/components/date-picker/month-foundation';
    import { useFoundation } from '../../base/index.js';
    import { watch } from '../../hooks/index.js';
    import useToday from '../calendar/hooks/use-today.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import type { MonthProps } from './internal.js';

    const props: MonthProps = $props();

    const config = useConfig();

    const gridId = $props.id();

    // empty until mounted, so the server render and the hydration pass mark no day as today
    const today = useToday(() => props.timeZone);

    // the props the foundation reads; getters keep them live
    const view = {
        get month() {
            return props.month;
        },
        get weekStartsOn() {
            return props.weekStartsOn;
        },
        get selected() {
            return props.selected;
        },
        get rangeStart() {
            return props.rangeStart;
        },
        get rangeEnd() {
            return props.rangeEnd;
        },
        get offsetRangeStart() {
            return props.offsetRangeStart;
        },
        get offsetRangeEnd() {
            return props.offsetRangeEnd;
        },
        get disabledDate() {
            return props.disabledDate;
        },
        get hoverDay() {
            return props.hoverDay;
        },
        get rangeInputFocus() {
            return props.rangeInputFocus;
        },
        get focusRecords() {
            return props.focusRecords;
        },
    } as MonthFoundationProps;

    const { foundation, states } = useFoundation<MonthFoundation, MonthAdapter, MonthFoundationProps, MonthFoundationState>(
        MonthFoundation,
        view,
        () => MonthFoundation.getInitialState(),
        () => ({
            notifyDayClick: (day) => props.onDayClick(day),
            notifyMonthSwitch: (switchType) => props.onMonthSwitch(switchType),
        }),
        { context: () => config }
    );

    const prefix = cssClasses.PREFIX;
    const todayText = $derived(today() === null ? '' : format(today()!, strings.FORMAT_FULL_DATE));
    const weeks = $derived(MonthFoundation.getMonthTable(props.month, props.weekStartsOn).weeks);
    const activeDate = $derived(MonthFoundation.getActiveDate(props, states(), todayText));
    const weekdays = $derived(MonthFoundation.getWeekdays(props.weekStartsOn).map((key) => props.locale.weeks[key as keyof MonthProps['locale']['weeks']]));

    const statuses = $derived.by(() => {
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
            weeks
                .flat()
                .filter((day) => day.fullDate)
                .map((day) => [day.fullDate, MonthFoundation.getDayStatus(day, options)])
        );
    });

    const dayId = (full: string) => {
        return `${gridId}-${full}`;
    };

    const statusOf = (day: MonthDayInfo) => {
        const status = statuses.get(day.fullDate)!;
        return day.fullDate === todayText ? { ...status, isToday: true } : status;
    };

    const dayClass = (day: MonthDayInfo) => {
        if (props.fullDate) {
            return [cssClasses.DAY, { [cssClasses.DAY_ACTIVE]: day.fullDate === activeDate }];
        }
        return [cssClasses.DAY, MonthFoundation.getDayClasses(statusOf(day), day.fullDate === activeDate)];
    };

    const isSelected = (day: MonthDayInfo) => {
        const status = statusOf(day);
        return Boolean(status.isSelected || status.isSelectedStart || status.isSelectedEnd);
    };

    watch(
        () => weeks.length,
        () => props.onWeeksRowNumChange()
    );

    // MonthsGrid reads the DOM, so notify after it is mounted
    onMount(() => props.onWeeksRowNumChange());
</script>

<!-- cells are not focusable (aria-activedescendant) -->
<div aria-activedescendant={dayId(activeDate)} aria-labelledby={props.labelledby} aria-multiselectable={props.multiple} class={cssClasses.MONTH} role="grid" tabindex="0" onkeydown={(event) => foundation.handleKeyDown(event, todayText)}>
    <div class={cssClasses.WEEKDAY} role="row">
        {#each weekdays as text, index (index)}
            <div class={`${prefix}-weekday-item`} role="columnheader">{text}</div>
        {/each}
    </div>
    <div class={cssClasses.WEEKS}>
        {#each weeks as week, weekIndex (weekIndex)}
            <div class={cssClasses.WEEK} role="row">
                {#each week as day, dayIndex (dayIndex)}
                    {#if !day.fullDate}
                        <div class={cssClasses.DAY} role="gridcell"><span></span></div>
                    {:else}
                        <div
                            aria-disabled={statusOf(day).isDisabled}
                            aria-label={day.fullDate}
                            aria-selected={isSelected(day)}
                            class={dayClass(day)}
                            id={dayId(day.fullDate)}
                            role="gridcell"
                            title={day.fullDate}
                            onclick={() => foundation.selectDay(day)}
                            onmouseenter={() => props.onDayHover(day)}
                            onmouseleave={() => props.onDayHover()}
                        >
                            {#if props.fullDate}
                                {@render props.fullDate({ dayNumber: Number(day.dayNumber), dayStatus: statusOf(day), fullDate: day.fullDate })}
                            {:else}
                                <div class={`${cssClasses.DAY}-main`}>
                                    {#if props.date}
                                        {@render props.date({ dayNumber: Number(day.dayNumber), fullDate: day.fullDate })}
                                    {:else}
                                        <span>{day.dayNumber}</span>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/each}
    </div>
</div>
