import { type JSX, type Ref, For, Show, createMemo, createUniqueId, mergeProps, onCleanup, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
import { isRangeType, type DayStatusType } from '@fibrae/semi-foundation/components/date-picker/foundation';
import MonthsGridFoundation, { type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelPart, type PanelType, type PanelView } from '@fibrae/semi-foundation/components/date-picker/months-grid-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale';
import { IconCalendar, IconClock } from '@fibrae/semi-icons-solid';
import { useFoundation } from '../../base/index';
import Combobox, { type ComboboxHandle, type ComboboxProps } from '../time-picker/combobox';
import Month from './month';
import Navigation from './navigation';
import YearAndMonth, { type YearAndMonthHandle, type YearAndMonthOpts } from './year-and-month';

const prefixCls = cssClasses.PREFIX;
const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;
const { isYearOrTime } = MonthsGridFoundation;

export type DatePickerTimePickerOpts = Partial<Pick<ComboboxProps, 'use12Hours' | 'hourStep' | 'minuteStep' | 'secondStep' | 'defaultIsAM' | 'scrollItemProps'>>;

export interface MonthsGridProps extends Omit<MonthsGridFoundationProps, 'renderDate' | 'renderFullDate' | 'locale'> {
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
    switchPanels: (view: PanelView) => void;
}

type Foundation = MonthsGridFoundation;
type Adapter = MonthsGridAdapter;
type Reselectable = ComboboxHandle | YearAndMonthHandle;

const noFocusRecords = { rangeStart: false, rangeEnd: false };

const defaultProps = {
    type: 'date',
    multiple: false,
    weekStartsOn: numbers.WEEK_START_ON,
} satisfies Partial<MonthsGridProps>;

export default function MonthsGrid(rawProps: MonthsGridProps) {
    const props = mergeProps(defaultProps, rawProps);

    const titleId = createUniqueId();
    const columns = new Set<Reselectable>();

    const nodes: Record<PanelPart, Record<PanelType, HTMLDivElement | undefined>> = { panel: { left: undefined, right: undefined }, wrap: { left: undefined, right: undefined }, switch: { left: undefined, right: undefined } };

    const { foundation, state } = useFoundation<Foundation, Adapter, MonthsGridFoundationProps, MonthsGridFoundationState>(
        MonthsGridFoundation,
        props,
        (view) => MonthsGridFoundation.getInitialState(view),
        () => ({
            notifySelectedChange: (value, options) => props.onChange?.(value, options),
            notifyPanelChange: (date, dateString) => props.onPanelChange?.(date, dateString),
            getPanelNode: (part, panelType) => nodes[part][panelType],
            focusPanelTarget: (panelType, target) => {
                const panel = nodes.panel[panelType];
                const node = target === 'yearList' ? panel?.querySelector<HTMLElement>('[role="listbox"]') : (panel?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`);
                node?.focus();
            },
            reselectScrollLists: () => {
                for (const column of columns) {
                    column.reselect();
                }
            },
        })
    );

    const ref = untrack(() => props.ref);

    const isRange = () => isRangeType(props.type);

    const detailOf = (panelType: PanelType) => (panelType === PANEL_TYPE_RIGHT ? state().monthRight : state().monthLeft);

    const dateFormat = () => MonthsGridFoundation.getValidDateFormat(props);

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
                    onMonthClick={() => foundation.showYearPicker(panelType)}
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
                    timeZone={props.timeZone}
                    weekStartsOn={props.weekStartsOn}
                    renderDate={props.renderDate}
                    renderFullDate={props.renderFullDate}
                    onDayClick={(day) => foundation.handleDayClick(day, panelType)}
                    onDayHover={foundation.handleDayHover}
                    onMonthSwitch={(switchType) => foundation[switchType](panelType)}
                    onWeeksRowNumChange={foundation.handleWeeksRowNumChange}
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
                    disabledHours={disabledOptions().disabledHours}
                    disabledMinutes={disabledOptions().disabledMinutes}
                    disabledSeconds={disabledOptions().disabledSeconds}
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
            onBackToMain={() => foundation.backToDatePanel(panelType)}
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

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({ switchPanels: foundation.switchPanels });
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
