<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
    import { isRangeType } from '@fibrae/semi-foundation/components/date-picker/foundation';
    import MonthsGridFoundation, { type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelPart, type PanelType, type PanelView } from '@fibrae/semi-foundation/components/date-picker/months-grid-foundation';
    import { IconCalendar, IconClock } from '@fibrae/semi-icons-svelte';
    import { useFoundation } from '../../base/index.js';
    import Combobox from '../time-picker/combobox.svelte';
    import type { ComboboxHandle, ComboboxProps } from '../time-picker/interface.js';
    import type { MonthsGridProps } from './internal.js';
    import Month from './month.svelte';
    import Navigation from './navigation.svelte';
    import YearAndMonth from './year-and-month.svelte';

    const props: MonthsGridProps = $props();

    const titleId = $props.id();

    // Element and instance references of each panel, read in handlers and untracked effects only. They are $state because
    // Svelte warns in development about bind:this on a property of a plain object
    const nodes = $state<Record<PanelPart, Record<PanelType, HTMLElement | undefined>>>({ panel: { left: undefined, right: undefined }, wrap: { left: undefined, right: undefined }, switch: { left: undefined, right: undefined } });
    const timePickers = $state<Record<PanelType, ComboboxHandle | undefined>>({ left: undefined, right: undefined });
    const yearAndMonths = $state<Record<PanelType, YearAndMonth | undefined>>({ left: undefined, right: undefined });

    const { foundation, states } = useFoundation<MonthsGridFoundation, MonthsGridAdapter, MonthsGridFoundationProps, MonthsGridFoundationState>(
        MonthsGridFoundation,
        props as MonthsGridFoundationProps,
        (view) => MonthsGridFoundation.getInitialState(view),
        () => ({
            notifySelectedChange: (value, options) => props.onChange(value, options),
            notifyPanelChange: (date, dateString) => props.onPanelChange(date, dateString),
            getPanelNode: (part, panelType) => nodes[part][panelType],
            focusPanelTarget: (panelType, target) => {
                const panel = nodes.panel[panelType];
                const node = target === 'yearList' ? panel?.querySelector<HTMLElement>('[role="listbox"]') : (panel?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`);
                node?.focus();
            },
            reselectScrollLists: () => {
                for (const handle of [timePickers.left, timePickers.right, yearAndMonths.left, yearAndMonths.right]) {
                    handle?.reselect();
                }
            },
        })
    );

    const prefix = cssClasses.PREFIX;
    const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;
    const { isYearOrTime } = MonthsGridFoundation;
    const isRange = $derived(isRangeType(props.type));
    const panelTypes = $derived<PanelType[]>(isRange ? [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] : [PANEL_TYPE_LEFT]);
    const dateFormat = $derived(MonthsGridFoundation.getValidDateFormat(props));
    const hasTime = $derived(props.type.includes('Time'));

    const detailOf = (panelType: PanelType) => {
        return panelType === PANEL_TYPE_RIGHT ? states().monthRight : states().monthLeft;
    };

    const timeOptions = (panelType: PanelType): Partial<ComboboxProps> => ({ ...props.timePickerOpts, hideDisabledOptions: props.hideDisabledOptions, ...MonthsGridFoundation.calcDisabledTime(props, states(), panelType) });

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

    export function switchPanels(view: PanelView) {
        foundation.switchPanels(view);
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
                <div bind:this={nodes.panel[panelType]} {...{ 'x-open-type': MonthsGridFoundation.getOpenType(detail) }} class={panelClass(panelType)}>
                    {#if detail.isYearPickerOpen}
                        <div class={`${prefix}-yam`}>
                            <YearAndMonth
                                bind:this={yearAndMonths[panelType]}
                                currentMonth={{ left: detail.pickerDate.getMonth() + 1, right: 0 }}
                                currentYear={{ left: detail.pickerDate.getFullYear(), right: 0 }}
                                density={props.density}
                                endYear={props.endYear}
                                locale={props.locale}
                                onBackToMain={() => foundation.backToDatePanel(panelType)}
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
                                onMonthClick={() => foundation.showYearPicker(panelType)}
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
                                onWeeksRowNumChange={foundation.handleWeeksRowNumChange}
                                rangeEnd={states().rangeEnd}
                                rangeInputFocus={props.rangeInputFocus ?? false}
                                rangeStart={states().rangeStart}
                                selected={states().selected}
                                timeZone={props.timeZone}
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
