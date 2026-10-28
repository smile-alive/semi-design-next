import { type JSX, type Ref, For, Show, createEffect, createMemo, createUniqueId, mergeProps, on, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { isRangeType } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { DayStatusType } from '@fibrae/semi-foundation/date-picker/foundation';
import MonthsGridFoundation, { type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconCalendar, IconClock } from '@fibrae/semi-icons-solid';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Combobox, { type ComboboxHandle, type ComboboxProps } from '../time-picker/combobox';
import Month from './month';
import Navigation from './navigation';
import YearAndMonth, { type YearAndMonthHandle, type YearAndMonthOpts } from './year-and-month';

const prefixCls = cssClasses.PREFIX;
const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;
const { isYearOrTime } = MonthsGridFoundation;

/** The time column options a caller may set; the panel owns the format, the value and the change handler */
export type DatePickerTimePickerOpts = Partial<Pick<ComboboxProps, 'use12Hours' | 'hourStep' | 'minuteStep' | 'secondStep' | 'defaultIsAM' | 'scrollItemProps'>>;

export interface MonthsGridProps extends Omit<MonthsGridFoundationProps, 'renderDate' | 'renderFullDate' | 'renderQuickControls' | 'renderDateInput' | 'locale'> {
    renderDate?: (dayNumber?: number, fullDate?: string) => JSX.Element;
    renderFullDate?: (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => JSX.Element;
    renderQuickControls?: () => JSX.Element;
    renderDateInput?: () => JSX.Element;
    /** Whether `renderQuickControls` renders anything; the panel sizes itself by whether a side column exists */
    hasPresets?: boolean;
    locale: Locale['DatePicker'];
    timePickerOpts?: DatePickerTimePickerOpts;
    yearAndMonthOpts?: YearAndMonthOpts;
    /** Receives the handle once, while the panel is created */
    ref?: Ref<MonthsGridHandle>;
}

/** Called by DatePicker when an inset input gets focus */
export interface MonthsGridHandle {
    showDatePanel: (panelType: PanelType) => void;
    showTimePicker: (panelType: PanelType) => void;
}

type Foundation = MonthsGridFoundation;
type Adapter = MonthsGridAdapter;
type PanelPart = 'panel' | 'wrap' | 'switch';
type Reselectable = ComboboxHandle | YearAndMonthHandle;

const noFocusRecords = { rangeStart: false, rangeEnd: false };

const defaultProps = {
    type: 'date',
    multiple: false,
    weekStartsOn: numbers.WEEK_START_ON,
    disabledDate: () => false,
} satisfies Partial<MonthsGridProps>;

/** The date panels of DatePicker: one month, or two for a range, each with its year and time picker */
export default function MonthsGrid(rawProps: MonthsGridProps) {
    const props = mergeProps(defaultProps, rawProps);

    const titleId = createUniqueId();

    // the time and year columns of the panels shown now, re-centred when the panels resize
    const columns = new Set<Reselectable>();

    // the cached height of both panels while they show a scroll list; 0 means measure it
    let currentPanelHeight = 0;

    const { foundation, state } = useFoundation<Foundation, Adapter, MonthsGridFoundationProps, MonthsGridFoundationState>(
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
            notifySelectedChange: (value, options) => props.onChange?.(value, options),
            notifyPanelChange: (date, dateString) => props.onPanelChange?.(date, dateString),
            setRangeInputFocus: (rangeInputFocus) => props.setRangeInputFocus?.(rangeInputFocus),
            hasOtherRangeInputBeenFocused: (currentRangeInput) => Boolean(props.hasOtherRangeInputBeenFocused?.(currentRangeInput)),
        })
    );

    const ref = untrack(() => props.ref);
    const nodes: Record<PanelPart, Record<PanelType, HTMLDivElement | undefined>> = { panel: { left: undefined, right: undefined }, wrap: { left: undefined, right: undefined }, switch: { left: undefined, right: undefined } };

    const isRange = () => isRangeType(props.type);

    const yearOrTimePanels = createMemo(() => (isRange() ? Number(isYearOrTime(state().monthLeft)) + Number(isYearOrTime(state().monthRight)) : 0));

    const detailOf = (panelType: PanelType) => (panelType === PANEL_TYPE_RIGHT ? state().monthRight : state().monthLeft);

    const dateFormat = () => MonthsGridFoundation.getValidDateFormat(props);

    // a ref callback that also forgets the node once the branch holding it is removed
    const attach = (part: PanelPart, panelType: PanelType) => (node: HTMLDivElement) => {
        nodes[part][panelType] = node;
        onCleanup(() => {
            if (nodes[part][panelType] === node) {
                nodes[part][panelType] = undefined;
            }
        });
    };

    const registerColumn = (handle: Reselectable) => {
        columns.add(handle);
        onCleanup(() => columns.delete(handle));
    };

    const reselect = () => {
        for (const column of columns) {
            column.reselect();
        }
    };

    /** The height of the taller panel, or 0 while the panels are not laid out */
    const calcScrollListHeight = () => {
        const height = (panelType: PanelType) => (nodes.wrap[panelType]?.getBoundingClientRect().height || 0) + (nodes.switch[panelType]?.getBoundingClientRect().height || 0);
        return Math.max(height(PANEL_TYPE_LEFT), height(PANEL_TYPE_RIGHT));
    };

    const measurePanelHeight = () => {
        currentPanelHeight = calcScrollListHeight();
    };

    const applyPanelSize = (panels: Pick<MonthsGridFoundationState, 'monthLeft' | 'monthRight'>, insetInput: MonthsGridProps['insetInput']) => {
        const sizes = MonthsGridFoundation.getPanelSizeStyle(panels, insetInput, {
            monthWidth: (panelType) => nodes.wrap[panelType]?.getBoundingClientRect().width ?? null,
            scrollListHeight: () => currentPanelHeight || calcScrollListHeight(),
        });
        for (const panelType of [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] as const) {
            const panel = nodes.panel[panelType];
            if (panel) {
                panel.style.minWidth = sizes[panelType].minWidth;
                panel.style.minHeight = sizes[panelType].minHeight;
            }
        }
    };

    // a scroll list beside a month keeps its own height; the panels share a minHeight only while both show lists
    const handleWeeksRowNumChange = () => {
        if (isRange() && untrack(yearOrTimePanels) < 2) {
            measurePanelHeight();
        }
    };

    // the button that switches between the month and the year picker unmounts or hides under the focus, so the view it
    // switches to takes the focus once the foundation call has rendered it
    const showYearPicker = (panelType: PanelType) => {
        foundation.showYearPicker(panelType);
        nodes.panel[panelType]?.querySelector<HTMLElement>('[role="listbox"]')?.focus();
    };

    // in a microtask: the back button calls in from YearAndMonth's own foundation batch, which renders the date panel
    // only after that call returns
    const backToDatePanel = (panelType: PanelType) => {
        foundation.showDatePanel(panelType);
        queueMicrotask(() => (nodes.panel[panelType]?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`)?.focus());
    };

    const renderMonth = (panelType: PanelType) => {
        const detail = () => detailOf(panelType);
        const style = (): JSX.CSSProperties | undefined => (isRange() && isYearOrTime(detail()) ? { visibility: 'hidden', position: 'absolute', 'pointer-events': 'none' } : undefined);

        return (
            <div ref={attach('wrap', panelType)} style={style()}>
                <Navigation
                    density={props.density}
                    locale={props.locale}
                    monthText={MonthsGridFoundation.formatMonthText(props.locale, detail().pickerDate)}
                    panelType={panelType}
                    shouldBimonthSwitch={isRange() && props.syncSwitchMonth}
                    titleId={`${titleId}-${panelType}-title`}
                    onMonthClick={() => showYearPicker(panelType)}
                    onNextMonth={() => foundation.nextMonth(panelType)}
                    onNextYear={() => foundation.nextYear(panelType)}
                    onPrevMonth={() => foundation.prevMonth(panelType)}
                    onPrevYear={() => foundation.prevYear(panelType)}
                />
                <Month
                    multiple={props.multiple || isRange()}
                    disabledDate={props.disabledDate}
                    focusRecords={props.focusRecords ?? noFocusRecords}
                    hoverDay={state().hoverDay}
                    labelledby={`${titleId}-${panelType}-title`}
                    locale={props.locale}
                    month={detail().pickerDate}
                    offsetRangeEnd={state().offsetRangeEnd}
                    offsetRangeStart={state().offsetRangeStart}
                    rangeEnd={state().rangeEnd}
                    rangeInputFocus={props.rangeInputFocus ?? false}
                    rangeStart={state().rangeStart}
                    selected={state().selected}
                    weekStartsOn={props.weekStartsOn}
                    renderDate={props.renderDate}
                    renderFullDate={props.renderFullDate}
                    onDayClick={(day) => foundation.handleDayClick(day, panelType)}
                    onDayHover={(day) => foundation.handleDayHover(day)}
                    onMonthSwitch={(switchType) => foundation[switchType](panelType)}
                    onWeeksRowNumChange={handleWeeksRowNumChange}
                />
            </div>
        );
    };

    const renderTimePicker = (panelType: PanelType) => {
        const disabledOptions = createMemo(() => MonthsGridFoundation.calcDisabledTime(props, state(), panelType));
        return (
            <div class={`${prefixCls}-time`}>
                <Combobox
                    ref={registerColumn}
                    defaultIsAM={props.timePickerOpts?.defaultIsAM}
                    disabledHours={disabledOptions()?.disabledHours}
                    disabledMinutes={disabledOptions()?.disabledMinutes}
                    disabledSeconds={disabledOptions()?.disabledSeconds}
                    format={props.format || strings.FORMAT_TIME_PICKER}
                    hideDisabledOptions={props.hideDisabledOptions}
                    hourStep={props.timePickerOpts?.hourStep}
                    minuteStep={props.timePickerOpts?.minuteStep}
                    panelHeader={props.locale.selectTime}
                    scrollItemProps={props.timePickerOpts?.scrollItemProps}
                    secondStep={props.timePickerOpts?.secondStep}
                    timeStampValue={detailOf(panelType).pickerDate}
                    use12Hours={props.timePickerOpts?.use12Hours}
                    onChange={(newTime) => foundation.handleTimeChange(newTime, panelType)}
                />
            </div>
        );
    };

    const renderYearAndMonth = (panelType: PanelType) => (
        <YearAndMonth
            ref={registerColumn}
            currentMonth={{ left: detailOf(panelType).pickerDate.getMonth() + 1, right: 0 }}
            currentYear={{ left: detailOf(panelType).pickerDate.getFullYear(), right: 0 }}
            density={props.density}
            endYear={props.endYear}
            locale={props.locale}
            startYear={props.startYear}
            yearAndMonthOpts={props.yearAndMonthOpts}
            onBackToMain={() => backToDatePanel(panelType)}
            onSelect={(item) => foundation.toYearMonth(panelType, new Date(item.currentYear.left, item.currentMonth.left - 1))}
        />
    );

    const renderSwitch = (panelType: PanelType) => {
        const detail = () => detailOf(panelType);
        const switchTexts = () =>
            MonthsGridFoundation.getSwitchTexts({
                rangeEndpoint: panelType === PANEL_TYPE_LEFT ? state().rangeStart : state().rangeEnd,
                showDate: detail().showDate,
                dateFormat: dateFormat(),
                format: props.format,
                locale: props.locale,
                dateFnsLocale: props.dateFnsLocale,
            });
        const showSwitchIcon = () => props.density === 'default';
        const textCls = `${prefixCls}-switch-text`;

        return (
            <Show when={props.type.includes('Time') && !props.insetInput}>
                <div ref={attach('switch', panelType)} class={`${prefixCls}-switch`}>
                    <button type="button" class={clsx(`${prefixCls}-switch-date`, { [`${prefixCls}-switch-date-active`]: !detail().isTimePickerOpen })} aria-label={props.locale.switchToDate} onClick={() => foundation.showDatePanel(panelType)}>
                        <Show when={showSwitchIcon()}>
                            <IconCalendar />
                        </Show>
                        <span class={textCls}>{switchTexts().date}</span>
                    </button>
                    <button
                        type="button"
                        class={clsx(`${prefixCls}-switch-time`, {
                            [`${prefixCls}-switch-time-disabled`]: props.disabledTimePicker,
                            [`${prefixCls}-switch-date-active`]: detail().isTimePickerOpen,
                        })}
                        aria-label={props.locale.switchToTime}
                        disabled={props.disabledTimePicker}
                        onClick={() => foundation.showTimePicker(panelType)}
                    >
                        <Show when={showSwitchIcon()}>
                            <IconClock />
                        </Show>
                        <span class={textCls}>{switchTexts().time}</span>
                    </button>
                </div>
            </Show>
        );
    };

    const renderPanel = (panelType: PanelType) => {
        const detail = () => detailOf(panelType);
        return (
            <div ref={attach('panel', panelType)} class={clsx(`${prefixCls}-month-grid-${panelType}`, { [`${prefixCls}-yam-showing`]: !isRange() && isYearOrTime(detail()) })} x-open-type={MonthsGridFoundation.getOpenType(detail())}>
                <Show when={detail().isYearPickerOpen}>
                    <div class={`${prefixCls}-yam`}>{renderYearAndMonth(panelType)}</div>
                </Show>
                <Show when={detail().isTimePickerOpen}>
                    <div class={`${prefixCls}-tpk`}>{renderTimePicker(panelType)}</div>
                </Show>
                <Show when={isRange() || !isYearOrTime(detail())}>{renderMonth(panelType)}</Show>
                {renderSwitch(panelType)}
            </div>
        );
    };

    // deferred, not useWatch: init in onMount applies selectedValue, so the baseline is the value at init, which the
    // first run follows with only the grid's own effects in between
    createEffect(
        on(
            createMemo(() => props.selectedValue),
            (value) => foundation.updateSelectedFromProps(value as (Date | null)[]),
            { defer: true }
        )
    );

    // by content: a parent rendering `new Date(...)` each time must not pull the panel back
    useWatch(
        createMemo(() => props.defaultPickerValue, undefined, { equals: isEqual }),
        () => foundation.initDefaultPickerValue()
    );

    createEffect(() => applyPanelSize({ monthLeft: state().monthLeft, monthRight: state().monthRight }, props.insetInput));

    createEffect(
        on(
            yearOrTimePanels,
            (count, previous) => {
                if (previous === 1 && count === 2) {
                    measurePanelHeight();
                    applyPanelSize(foundation.getStates(), foundation.getProp('insetInput'));
                    reselect();
                } else if (previous === 2 && count === 1) {
                    reselect();
                }
            },
            { defer: true }
        )
    );

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({
            showDatePanel: (panelType) => foundation.showDatePanel(panelType),
            showTimePicker: (panelType) => foundation.showTimePicker(panelType),
        });
    }

    return (
        <div style={{ display: 'flex' }}>
            <Show when={props.presetPosition === 'left'}>{props.renderQuickControls?.()}</Show>
            <div>
                {props.renderDateInput?.()}
                <div class={`${prefixCls}-month-grid`} x-insetinput={props.insetInput ? 'true' : 'false'} x-panel-yearandmonth-open-type={MonthsGridFoundation.getYAMOpenType(state())} x-preset-position={props.hasPresets ? props.presetPosition : 'null'} x-type={props.type}>
                    <For each={isRange() ? [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] : [PANEL_TYPE_LEFT]}>{renderPanel}</For>
                </div>
            </div>
            <Show when={props.presetPosition === 'right'}>{props.renderQuickControls?.()}</Show>
        </div>
    );
}
