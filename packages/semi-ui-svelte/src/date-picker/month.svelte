<script lang="ts">
    import { onMount } from 'svelte';
    import { format, parseISO } from 'date-fns';
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import MonthFoundation, { type MonthDayInfo } from '@fibrae/semi-foundation/date-picker/month-foundation';
    import watch from '../_base/watch.svelte.js';
    import useToday from '../calendar/use-today.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import type { MonthProps } from './internal.js';

    let { month, weekStartsOn, locale, multiple, selected, rangeStart, rangeEnd, offsetRangeStart, offsetRangeEnd, disabledDate, hoverDay, rangeInputFocus, focusRecords, labelledby, date, fullDate, onDayClick, onDayHover, onMonthSwitch, onWeeksRowNumChange }: MonthProps = $props();

    const config = useConfig();

    const gridId = $props.id();
    let keyboardDate = $state('');

    // empty until mounted, so the server render and the hydration pass mark no day as today
    const today = useToday();

    const prefix = cssClasses.PREFIX;
    const todayText = $derived(today() === null ? '' : format(today() as number, strings.FORMAT_FULL_DATE));
    const weeks = $derived(MonthFoundation.getMonthTable(month, weekStartsOn).weeks);
    const activeDate = $derived(MonthFoundation.getDefaultActiveDate(format(month, strings.FORMAT_YEAR_MONTH), [keyboardDate, ...selected, rangeStart, rangeEnd, todayText]));
    const weekdays = $derived(MonthFoundation.getWeekdays(weekStartsOn).map((key) => locale.weeks[key as keyof MonthProps['locale']['weeks']]));

    const statuses = $derived.by(() => {
        const options = {
            selected,
            rangeStart,
            rangeEnd,
            offsetRangeStart,
            offsetRangeEnd,
            disabledDate,
            hoverDay,
            rangeInputFocus,
            focusRecords,
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
        const status = statuses.get(day.fullDate) as ReturnType<typeof MonthFoundation.getDayStatus>;
        return day.fullDate === todayText ? { ...status, isToday: true } : status;
    };

    const dayClass = (day: MonthDayInfo) => {
        if (fullDate) {
            return [cssClasses.DAY, { [cssClasses.DAY_ACTIVE]: day.fullDate === activeDate }];
        }
        return [cssClasses.DAY, MonthFoundation.getDayClasses(statusOf(day), day.fullDate === activeDate)];
    };

    // a range keeps its value in rangeStart and rangeEnd, not in `selected`
    const isSelected = (day: MonthDayInfo) => {
        const status = statusOf(day);
        return Boolean(status.isSelected || status.isSelectedStart || status.isSelectedEnd);
    };

    const selectDay = (day?: MonthDayInfo) => {
        if (day && !statusOf(day).isDisabled) {
            keyboardDate = day.fullDate;
            onDayClick(day);
        }
    };

    // APG grid: focus stays on the grid; the keys move the active day, Enter or Space selects it
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectDay(weeks.flat().find((day) => day.fullDate === activeDate));
            return;
        }
        const target = MonthFoundation.getKeyboardTargetDate(event, parseISO(activeDate), weekStartsOn, config.direction === 'rtl');
        if (target) {
            event.preventDefault();
            keyboardDate = format(target, strings.FORMAT_FULL_DATE);
            const switchType = MonthFoundation.getMonthSwitch(target, month);
            if (switchType) {
                onMonthSwitch(switchType);
            }
        }
    };

    watch(
        () => weeks.length,
        (count) => onWeeksRowNumChange(count)
    );

    // MonthsGrid reads the DOM, so notify after it is mounted
    onMount(() => onWeeksRowNumChange(weeks.length));
</script>

<!-- cells are not focusable (aria-activedescendant) -->
<div aria-activedescendant={dayId(activeDate)} aria-labelledby={labelledby} aria-multiselectable={multiple} class={cssClasses.MONTH} role="grid" tabindex="0" onkeydown={handleKeyDown}>
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
                        <div aria-disabled={statusOf(day).isDisabled} aria-label={day.fullDate} aria-selected={isSelected(day)} class={dayClass(day)} id={dayId(day.fullDate)} role="gridcell" title={day.fullDate} onclick={() => selectDay(day)} onmouseenter={() => onDayHover(day)} onmouseleave={() => onDayHover()}>
                            {#if fullDate}
                                {@render fullDate({ dayNumber: Number(day.dayNumber), dayStatus: statusOf(day), fullDate: day.fullDate })}
                            {:else}
                                <div class={`${cssClasses.DAY}-main`}>
                                    {#if date}
                                        {@render date({ dayNumber: Number(day.dayNumber), fullDate: day.fullDate })}
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
