<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { isRangeType } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import MonthsGridFoundation, { type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
    import { IconCalendar, IconClock } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import Combobox from '../time-picker/combobox.svelte';
    import type { ComboboxHandle, ComboboxProps } from '../time-picker/interface.js';
    import type { MonthsGridProps } from './internal.js';
    import Month from './month.svelte';
    import Navigation from './navigation.svelte';
    import YearAndMonth from './year-and-month.svelte';

    type PanelSize = Record<PanelType, { minWidth: string; minHeight: string }>;

    const props: MonthsGridProps = $props();

    const titleId = $props.id();
    let panelHeight = 0;

    // The values the effects below last saw, to act on changes only
    let syncedPickerValue: { value: MonthsGridProps['defaultPickerValue'] } | undefined;
    let previousCount: number | undefined;
    let panelSize = $state.raw<PanelSize>({ left: { minWidth: '', minHeight: '' }, right: { minWidth: '', minHeight: '' } });

    // Element and instance references of each panel, read in handlers and untracked effects only. They are $state because
    // Svelte warns in development about bind:this on a property of a plain object
    const nodes = $state<Record<'panel' | 'wrap' | 'switch', Record<PanelType, HTMLElement | undefined>>>({ panel: { left: undefined, right: undefined }, wrap: { left: undefined, right: undefined }, switch: { left: undefined, right: undefined } });
    const timePickers = $state<Record<PanelType, ComboboxHandle | undefined>>({ left: undefined, right: undefined });
    const yearAndMonths = $state<Record<PanelType, YearAndMonth | undefined>>({ left: undefined, right: undefined });

    const { foundation, states } = useFoundation<MonthsGridFoundation, MonthsGridAdapter, MonthsGridFoundationProps, MonthsGridFoundationState>(
        MonthsGridFoundation,
        props as MonthsGridFoundationProps,
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
            notifySelectedChange: (value, options) => props.onChange(value, options),
            notifyPanelChange: (date, dateString) => props.onPanelChange(date, dateString),
            setRangeInputFocus: (rangeInputFocus) => props.onRangeInputFocus(rangeInputFocus),
            hasOtherRangeInputBeenFocused: (currentRangeInput) => props.hasOtherRangeInputBeenFocused?.(currentRangeInput) ?? false,
        })
    );

    const prefix = cssClasses.PREFIX;
    const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;
    const { isYearOrTime } = MonthsGridFoundation;
    const isRange = $derived(isRangeType(props.type));
    const panelTypes = $derived<PanelType[]>(isRange ? [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] : [PANEL_TYPE_LEFT]);
    const dateFormat = $derived(MonthsGridFoundation.getValidDateFormat(props));
    const hasTime = $derived(props.type.includes('Time'));

    // Both panels show year or time lists in a range, which then share a minHeight
    const scrollListCount = $derived(isRange ? Number(isYearOrTime(states().monthLeft)) + Number(isYearOrTime(states().monthRight)) : 0);

    const detailOf = (panelType: PanelType) => {
        return panelType === PANEL_TYPE_RIGHT ? states().monthRight : states().monthLeft;
    };

    // The button that switches between the month and the year picker unmounts or hides under the focus, so the view it
    // switched to takes the focus once rendered
    const showYearPicker = async (panelType: PanelType) => {
        foundation.showYearPicker(panelType);
        await tick();
        nodes.panel[panelType]?.querySelector<HTMLElement>('[role="listbox"]')?.focus();
    };

    const backToDatePanel = async (panelType: PanelType) => {
        foundation.showDatePanel(panelType);
        await tick();
        (nodes.panel[panelType]?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`)?.focus();
    };

    const scrollListHeight = () => {
        const height = (panelType: PanelType) => (nodes.wrap[panelType]?.getBoundingClientRect().height || 0) + (nodes.switch[panelType]?.getBoundingClientRect().height || 0);
        return Math.max(height(PANEL_TYPE_LEFT), height(PANEL_TYPE_RIGHT));
    };

    // Equal sizes keep the object, which ends the update cycle this write starts
    const applyPanelSize = () => {
        const size = MonthsGridFoundation.getPanelSizeStyle(states(), props.insetInput, {
            monthWidth: (panelType) => nodes.wrap[panelType]?.getBoundingClientRect().width ?? null,
            scrollListHeight: () => panelHeight || scrollListHeight(),
        });
        const same = (panelType: PanelType) => panelSize[panelType].minWidth === size[panelType].minWidth && panelSize[panelType].minHeight === size[panelType].minHeight;
        if (!same(PANEL_TYPE_LEFT) || !same(PANEL_TYPE_RIGHT)) {
            panelSize = size;
        }
    };

    const reselect = () => {
        for (const handle of [timePickers.left, timePickers.right, yearAndMonths.left, yearAndMonths.right]) {
            handle?.reselect();
        }
    };

    const syncScrollLists = async (previous: number | undefined, count: number) => {
        if (previous === 1 && count === 2) {
            panelHeight = scrollListHeight();
            applyPanelSize();
            // min-height reaches the DOM on the next flush; the lists centre against it
            await tick();
            reselect();
        } else if (previous === 2 && count === 1) {
            reselect();
        }
    };

    // Panels share a minHeight only while both show scroll lists, so only the cached height is updated here
    const handleWeeksRowNumChange = () => {
        if (isRange && !(isYearOrTime(states().monthLeft) && isYearOrTime(states().monthRight))) {
            panelHeight = scrollListHeight();
        }
    };

    const timeOptions = (panelType: PanelType) => {
        const options: Partial<ComboboxProps> = { ...props.timePickerOpts, hideDisabledOptions: props.hideDisabledOptions };
        const disabled = MonthsGridFoundation.calcDisabledTime(props, states(), panelType);
        for (const key of ['disabledHours', 'disabledMinutes', 'disabledSeconds'] as const) {
            if (disabled?.[key]) {
                Object.assign(options, { [key]: disabled[key] });
            }
        }
        return options;
    };

    const switchTexts = (panelType: PanelType) => {
        return MonthsGridFoundation.getSwitchTexts({
            rangeEndpoint: panelType === PANEL_TYPE_LEFT ? states().rangeStart : states().rangeEnd,
            showDate: detailOf(panelType).showDate,
            dateFormat,
            format: props.format,
            locale: props.locale,
            dateFnsLocale: props.dateFnsLocale,
        });
    };

    const panelClass = (panelType: PanelType) => {
        const detail = detailOf(panelType);
        return [`${prefix}-month-grid-${panelType}`, { [`${prefix}-yam-showing`]: !isRange && (detail.isTimePickerOpen || detail.isYearPickerOpen) }];
    };

    watch(
        () => props.selectedValue,
        (value) => foundation.updateSelectedFromProps(value as (Date | null)[])
    );

    // by content: a parent rendering `new Date(...)` each time must not pull the panel back
    $effect(() => {
        const next = { value: props.defaultPickerValue };
        const previous = syncedPickerValue;
        syncedPickerValue = next;
        if (previous && !isEqual(next.value, previous.value)) {
            foundation.initDefaultPickerValue();
        }
    });

    $effect(() => {
        const count = scrollListCount;
        const previous = previousCount;
        previousCount = count;
        untrack(() => void syncScrollLists(previous, count));
    });

    // The panel size follows the views each panel shows, measured once the DOM shows them
    $effect(() => {
        void states().monthLeft;
        void states().monthRight;
        void props.insetInput;
        void props.type;
        untrack(applyPanelSize);
    });

    export function showDatePanel(panelType: PanelType) {
        foundation.showDatePanel(panelType);
    }

    export function showTimePicker(panelType: PanelType) {
        foundation.showTimePicker(panelType);
    }
</script>

<div style="display: flex">
    {#if props.presetPosition === 'left'}
        {@render props.quickControls?.()}
    {/if}
    <div>
        {@render props.dateInput?.()}
        <div
            {...{
                'x-insetinput': props.insetInput ? 'true' : 'false',
                'x-panel-yearandmonth-open-type': MonthsGridFoundation.getYAMOpenType(states()),
                'x-preset-position': props.hasPresets ? props.presetPosition : 'null',
                'x-type': props.type,
            }}
            class={`${prefix}-month-grid`}
        >
            {#each panelTypes as panelType (panelType)}
                {@const detail = detailOf(panelType)}
                <div bind:this={nodes.panel[panelType]} {...{ 'x-open-type': MonthsGridFoundation.getOpenType(detail) }} class={panelClass(panelType)} style:min-height={panelSize[panelType].minHeight || undefined} style:min-width={panelSize[panelType].minWidth || undefined}>
                    {#if detail.isYearPickerOpen}
                        <div class={`${prefix}-yam`}>
                            <YearAndMonth
                                bind:this={yearAndMonths[panelType]}
                                currentMonth={{ left: detail.pickerDate.getMonth() + 1, right: 0 }}
                                currentYear={{ left: detail.pickerDate.getFullYear(), right: 0 }}
                                density={props.density}
                                endYear={props.endYear}
                                locale={props.locale}
                                onBackToMain={() => backToDatePanel(panelType)}
                                onSelect={(selected) => foundation.toYearMonth(panelType, new Date(selected.currentYear.left, selected.currentMonth.left - 1))}
                                startYear={props.startYear}
                                yearAndMonthOpts={props.yearAndMonthOpts}
                            />
                        </div>
                    {/if}
                    {#if detail.isTimePickerOpen}
                        <div class={`${prefix}-tpk`}>
                            <div class={`${prefix}-time`}>
                                <Combobox bind:this={timePickers[panelType]} format={props.format || strings.FORMAT_TIME_PICKER} panelHeader={props.locale.selectTime} timeStampValue={detail.pickerDate} {...timeOptions(panelType)} onChange={(time) => foundation.handleTimeChange(time, panelType)} />
                            </div>
                        </div>
                    {/if}
                    {#if isRange || !isYearOrTime(detail)}
                        <div bind:this={nodes.wrap[panelType]} style={isRange && isYearOrTime(detail) ? 'visibility: hidden; position: absolute; pointer-events: none' : undefined}>
                            <Navigation
                                density={props.density}
                                locale={props.locale}
                                monthText={MonthsGridFoundation.formatMonthText(props.locale, detail.pickerDate)}
                                onMonthClick={() => showYearPicker(panelType)}
                                onNextMonth={() => foundation.nextMonth(panelType)}
                                onNextYear={() => foundation.nextYear(panelType)}
                                onPrevMonth={() => foundation.prevMonth(panelType)}
                                onPrevYear={() => foundation.prevYear(panelType)}
                                {panelType}
                                shouldBimonthSwitch={isRange && props.syncSwitchMonth}
                                titleId={`${titleId}-${panelType}-title`}
                            />
                            <Month
                                date={props.date}
                                disabledDate={props.disabledDate}
                                focusRecords={props.focusRecords ?? { rangeStart: false, rangeEnd: false }}
                                fullDate={props.fullDate}
                                hoverDay={states().hoverDay}
                                labelledby={`${titleId}-${panelType}-title`}
                                locale={props.locale}
                                month={detail.pickerDate}
                                multiple={Boolean(props.multiple) || isRange}
                                offsetRangeEnd={states().offsetRangeEnd}
                                offsetRangeStart={states().offsetRangeStart}
                                onDayClick={(day) => foundation.handleDayClick(day, panelType)}
                                onDayHover={foundation.handleDayHover}
                                onMonthSwitch={(switchType) => foundation[switchType](panelType)}
                                onWeeksRowNumChange={handleWeeksRowNumChange}
                                rangeEnd={states().rangeEnd}
                                rangeInputFocus={props.rangeInputFocus ?? false}
                                rangeStart={states().rangeStart}
                                selected={states().selected}
                                weekStartsOn={props.weekStartsOn ?? 0}
                            />
                        </div>
                    {/if}
                    {#if hasTime && !props.insetInput}
                        <div bind:this={nodes.switch[panelType]} class={`${prefix}-switch`}>
                            <button aria-label={props.locale.switchToDate} class={[`${prefix}-switch-date`, { [`${prefix}-switch-date-active`]: !detail.isTimePickerOpen }]} type="button" onclick={() => foundation.showDatePanel(panelType)}>
                                {#if props.density !== 'compact'}<IconCalendar />{/if}
                                <span class={`${prefix}-switch-text`}>{switchTexts(panelType).date}</span>
                            </button>
                            <button
                                aria-label={props.locale.switchToTime}
                                class={[`${prefix}-switch-time`, { [`${prefix}-switch-time-disabled`]: props.disabledTimePicker, [`${prefix}-switch-date-active`]: detail.isTimePickerOpen }]}
                                disabled={props.disabledTimePicker}
                                type="button"
                                onclick={() => foundation.showTimePicker(panelType)}
                            >
                                {#if props.density !== 'compact'}<IconClock />{/if}
                                <span class={`${prefix}-switch-text`}>{switchTexts(panelType).time}</span>
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
    {#if props.presetPosition === 'right'}
        {@render props.quickControls?.()}
    {/if}
</div>
