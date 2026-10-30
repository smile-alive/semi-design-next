<script lang="ts">
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { strings } from '@fibrae/semi-foundation/date-picker/constants';
    import type { PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
    import YearAndMonthFoundation, { type MonthScrollItem, type YearAndMonthAdapter, type YearAndMonthFoundationProps, type YearScrollItem } from '@fibrae/semi-foundation/date-picker/year-and-month-foundation';
    import { IconChevronLeft } from '@fibrae/semi-icons-svelte';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { IconButton } from '../icon-button/index.js';
    import { ScrollItem, type ScrollItemHandle, type ScrollItemSelectData, ScrollList } from '../scroll-list/index.js';
    import type { YearAndMonthProps } from './internal.js';

    const props: YearAndMonthProps = $props();

    const columns: Record<string, ScrollItemHandle | undefined> = $state({});

    // The foundation reads disabledDate through this view, so a missing one enables every year and month
    const view: YearAndMonthFoundationProps = {
        get currentYear() {
            return props.currentYear;
        },
        get currentMonth() {
            return props.currentMonth;
        },
        get type() {
            return props.type ?? 'month';
        },
        get disabledDate() {
            return props.disabledDate ?? enabled;
        },
        get startYear() {
            return props.startYear;
        },
        get endYear() {
            return props.endYear;
        },
        get locale() {
            return props.locale;
        },
    };

    const { foundation } = useFoundation<YearAndMonthFoundation, YearAndMonthAdapter, YearAndMonthFoundationProps, Record<string, never>>(
        YearAndMonthFoundation,
        view,
        () => ({}),
        () => ({
            notifySelect: (yearAndMonth) => props.onSelect(yearAndMonth),
            notifyBackToMain: () => props.onBackToMain?.(),
        })
    );

    const prefix = `${BASE_CLASS_PREFIX}-datepicker`;
    const type = $derived(props.type ?? 'month');
    const current = $derived(YearAndMonthFoundation.getYearAndMonth(props));
    const panelTypes = $derived<PanelType[]>(type === 'monthRange' ? [strings.PANEL_TYPE_LEFT, strings.PANEL_TYPE_RIGHT] : [strings.PANEL_TYPE_LEFT]);
    const iconSize = $derived(props.density === 'compact' ? 'default' : 'large');
    const buttonSize = $derived(props.density === 'compact' ? 'small' : 'default');

    const panels = $derived(
        panelTypes.map((panelType) => {
            const years = YearAndMonthFoundation.getYearList(view, panelType);
            const months = YearAndMonthFoundation.getMonthList(view, panelType);
            return {
                panelType,
                years,
                months,
                yearIndex: years.findIndex((item) => item.value === current.currentYear[panelType]),
                monthIndex: months.findIndex((item) => item.month === current.currentMonth[panelType]),
            };
        })
    );

    const enabled = () => {
        return false;
    };

    const yearText = (value: number | string) => {
        return props.locale.yearText.replace('${year}', String(value));
    };

    // The selected index follows the props only; a selection is reported through onSelect
    const keepIndex = () => {};

    export function reselect() {
        for (const column of Object.values(columns)) {
            column?.scrollToIndex();
        }
    }
</script>

{#snippet lists()}
    {#each panels as panel (panel.panelType)}
        <ScrollList>
            <ScrollItem
                aria-label={props.locale.year}
                bind:this={columns[`${panel.panelType}-year`]}
                cycled={props.yearCycled ?? false}
                list={panel.years}
                mode="normal"
                transform={yearText}
                type="year"
                {...props.yearAndMonthOpts}
                bind:selectedIndex={() => panel.yearIndex, keepIndex}
                onSelect={(item) => foundation.selectYear(item as ScrollItemSelectData<YearScrollItem>, panel.panelType)}
            />
            {#if type !== 'year'}
                <ScrollItem
                    aria-label={props.locale.month}
                    bind:this={columns[`${panel.panelType}-month`]}
                    cycled={props.monthCycled ?? false}
                    list={panel.months}
                    mode="normal"
                    type="month"
                    {...props.yearAndMonthOpts}
                    bind:selectedIndex={() => panel.monthIndex, keepIndex}
                    onSelect={(item) => foundation.selectMonth(item as ScrollItemSelectData<MonthScrollItem>, panel.panelType)}
                />
            {/if}
        </ScrollList>
    {/each}
{/snippet}

{#snippet body()}
    {@render props.dateInput?.()}
    {#if type === 'monthRange'}
        <div class={`${prefix}-yearmonth-body`}>{@render lists()}</div>
    {:else}
        {@render lists()}
    {/if}
{/snippet}

{#snippet withPresets()}
    <!-- monthRange does not support presetPosition -->
    {#if props.presetPosition === 'left' && type !== 'monthRange'}
        {@render props.quickControls?.()}
    {/if}
    {#if props.presetPosition}
        <div>{@render body()}</div>
    {:else}
        {@render body()}
    {/if}
    {#if props.presetPosition === 'right' && type !== 'monthRange'}
        {@render props.quickControls?.()}
    {/if}
{/snippet}

{#if !props.noBackBtn}
    <div class={`${prefix}-yearmonth-header`}>
        <IconButton noHorizontalPadding={false} size={buttonSize} onclick={foundation.backToMain}>
            {#snippet icon()}<IconChevronLeft size={iconSize} />{/snippet}
            <span>{props.locale.selectDate}</span>
        </IconButton>
    </div>
{/if}
{#if props.presetPosition}
    <div style="display: flex">{@render withPresets()}</div>
{:else}
    {@render withPresets()}
{/if}
