import React, { useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { strings, numbers, cssClasses } from '@fibrae/semi-foundation/components/date-picker/constants';
import { isRangeType } from '@fibrae/semi-foundation/components/date-picker/foundation';
import MonthsGridFoundation, { type PanelState, type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelPart, type PanelType, type PanelView } from '@fibrae/semi-foundation/components/date-picker/months-grid-foundation';
import { IconClock, IconCalendar } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../../base/base-props';
import useFoundation from '../../base/use-foundation';
import Combobox, { type ComboboxHandle, type ComboboxProps } from '../time-picker/combobox';
import type { DatePickerProps } from './date-picker';
import Month from './month';
import Navigation from './navigation';
import YearAndMonth, { type YearAndMonthHandle, type YearAndMonthOpts } from './year-and-month';

const prefixCls = cssClasses.PREFIX;
const { PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT } = strings;

/** The time column options a caller may set; the panel owns the format, the value and the change handler */
export type DatePickerTimePickerOpts = Partial<Pick<ComboboxProps, 'use12Hours' | 'hourStep' | 'minuteStep' | 'secondStep' | 'defaultIsAM' | 'scrollItemProps'>>;

export interface MonthsGridProps extends MonthsGridFoundationProps, BaseProps {
    renderDate?: DatePickerProps['renderDate'];
    renderFullDate?: DatePickerProps['renderFullDate'];
    timePickerOpts?: DatePickerTimePickerOpts;
    yearAndMonthOpts?: YearAndMonthOpts;
    renderQuickControls?: React.ReactNode;
    renderDateInput?: React.ReactNode;
    ref?: React.Ref<MonthsGridHandle>;
}

/** Called by DatePicker when an inset input gets focus */
export interface MonthsGridHandle {
    switchPanels: (view: PanelView) => void;
}

export type MonthsGridState = MonthsGridFoundationState;

const { isYearOrTime } = MonthsGridFoundation;

export default function MonthsGrid({ ref, ...rawProps }: MonthsGridProps) {
    const props: MonthsGridProps = {
        ...rawProps,
        type: rawProps.type ?? 'date',
        multiple: rawProps.multiple ?? false,
        weekStartsOn: rawProps.weekStartsOn ?? numbers.WEEK_START_ON,
    };

    const {
        type,
        insetInput,
        weekStartsOn,
        disabledDate,
        locale,
        renderDate,
        renderFullDate,
        density,
        rangeInputFocus,
        syncSwitchMonth,
        multiple,
        focusRecords,
        format,
        hideDisabledOptions,
        timePickerOpts,
        dateFnsLocale,
        yearAndMonthOpts,
        startYear,
        endYear,
        disabledTimePicker,
        presetPosition,
        renderQuickControls,
        renderDateInput,
        timeZone,
    } = props;

    const titleId = useId();
    const nodesRef = useRef<Record<PanelPart, Record<PanelType, HTMLDivElement | null>>>({ panel: { left: null, right: null }, wrap: { left: null, right: null }, switch: { left: null, right: null } });
    const scrollListsRef = useRef(new Set<ComboboxHandle | YearAndMonthHandle>());

    const [foundation, state] = useFoundation<MonthsGridFoundation, MonthsGridAdapter, MonthsGridProps, MonthsGridState>(
        MonthsGridFoundation,
        props,
        () => MonthsGridFoundation.getInitialState(props),
        (base) => ({
            notifySelectedChange: (value, options) => base.getProps().onChange?.(value, options),
            notifyPanelChange: (date, dateString) => base.getProps().onPanelChange?.(date, dateString),
            getPanelNode: (part, panelType) => nodesRef.current[part][panelType],
            focusPanelTarget: (panelType, target) => {
                const panel = nodesRef.current.panel[panelType];
                const node = target === 'yearList' ? panel?.querySelector<HTMLElement>('[role="listbox"]') : (panel?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${panelType}-title`);
                node?.focus();
            },
            reselectScrollLists: () => {
                for (const handle of scrollListsRef.current) {
                    handle.reselect();
                }
            },
        })
    );

    const isRange = isRangeType(type);
    const dateFormat = MonthsGridFoundation.getValidDateFormat(props);
    const { selected, rangeStart, rangeEnd, hoverDay, offsetRangeStart, offsetRangeEnd, monthLeft, monthRight } = state;

    const attachNode = (part: PanelPart, panelType: PanelType) => (node: HTMLDivElement | null) => {
        nodesRef.current[part][panelType] = node;
    };

    const attachScrollList = (handle: ComboboxHandle | YearAndMonthHandle | null) => {
        if (!handle) {
            return undefined;
        }
        scrollListsRef.current.add(handle);
        return () => {
            scrollListsRef.current.delete(handle);
        };
    };

    const renderMonth = (month: Date, panelType: PanelType, detail: PanelState) => {
        const monthText = MonthsGridFoundation.formatMonthText(locale, month);
        const style: React.CSSProperties = isRange && isYearOrTime(detail) ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : {};

        return (
            <div ref={attachNode('wrap', panelType)} style={style}>
                <Navigation
                    density={density}
                    locale={locale}
                    monthText={monthText}
                    panelType={panelType}
                    shouldBimonthSwitch={isRange && syncSwitchMonth}
                    titleId={`${titleId}-${panelType}-title`}
                    onMonthClick={() => foundation.showYearPicker(panelType)}
                    onNextMonth={() => foundation.nextMonth(panelType)}
                    onNextYear={() => foundation.nextYear(panelType)}
                    onPrevMonth={() => foundation.prevMonth(panelType)}
                    onPrevYear={() => foundation.prevYear(panelType)}
                />
                <Month
                    multiple={multiple || isRange}
                    disabledDate={disabledDate}
                    focusRecords={focusRecords}
                    hoverDay={hoverDay}
                    labelledby={`${titleId}-${panelType}-title`}
                    locale={locale}
                    month={month}
                    offsetRangeEnd={offsetRangeEnd}
                    offsetRangeStart={offsetRangeStart}
                    rangeEnd={rangeEnd}
                    rangeInputFocus={rangeInputFocus}
                    rangeStart={rangeStart}
                    selected={selected}
                    timeZone={timeZone}
                    weekStartsOn={weekStartsOn}
                    renderDate={renderDate}
                    renderFullDate={renderFullDate}
                    onDayClick={(day) => foundation.handleDayClick(day, panelType)}
                    onDayHover={foundation.handleDayHover}
                    onMonthSwitch={(switchType) => foundation[switchType](panelType)}
                    onWeeksRowNumChange={foundation.handleWeeksRowNumChange}
                />
            </div>
        );
    };

    const renderTimePicker = (panelType: PanelType, panelDetail: PanelState) => {
        const optionProps: Partial<ComboboxProps> = { ...timePickerOpts, hideDisabledOptions, ...MonthsGridFoundation.calcDisabledTime(props, state, panelType) };
        return (
            <div className={`${prefixCls}-time`}>
                <Combobox
                    {...optionProps}
                    // the panel's own props come after the spread: an untyped caller cannot replace them
                    ref={attachScrollList}
                    format={format || strings.FORMAT_TIME_PICKER}
                    panelHeader={locale.selectTime}
                    timeStampValue={panelDetail.pickerDate}
                    onChange={(newTime: { timeStampValue: number }) => foundation.handleTimeChange(newTime, panelType)}
                />
            </div>
        );
    };

    const renderYearAndMonth = (panelType: PanelType, { pickerDate }: PanelState) => {
        return (
            <YearAndMonth
                ref={attachScrollList}
                currentMonth={{ left: pickerDate.getMonth() + 1, right: 0 }}
                currentYear={{ left: pickerDate.getFullYear(), right: 0 }}
                density={density}
                endYear={endYear}
                locale={locale}
                startYear={startYear}
                yearAndMonthOpts={yearAndMonthOpts}
                onBackToMain={() => foundation.backToDatePanel(panelType)}
                onSelect={(item) => foundation.toYearMonth(panelType, new Date(item.currentYear.left, item.currentMonth.left - 1))}
            />
        );
    };

    const renderSwitch = (panelType: PanelType) => {
        if (!type.includes('Time') || insetInput) {
            return null;
        }

        const isLeft = panelType === PANEL_TYPE_LEFT;
        const { isTimePickerOpen, showDate } = isLeft ? monthLeft : monthRight;
        const switchTexts = MonthsGridFoundation.getSwitchTexts({ rangeEndpoint: isLeft ? rangeStart : rangeEnd, showDate, dateFormat, format, locale, dateFnsLocale });
        const showSwitchIcon = density === 'default';
        const textCls = `${prefixCls}-switch-text`;

        return (
            <div ref={attachNode('switch', panelType)} className={`${prefixCls}-switch`}>
                <button
                    type="button"
                    className={clsx(`${prefixCls}-switch-date`, {
                        [`${prefixCls}-switch-date-active`]: !isTimePickerOpen,
                    })}
                    aria-label={locale.switchToDate}
                    onClick={() => foundation.showDatePanel(panelType)}
                >
                    {showSwitchIcon && <IconCalendar />}
                    <span className={textCls}>{switchTexts.date}</span>
                </button>
                <button
                    type="button"
                    className={clsx(`${prefixCls}-switch-time`, {
                        [`${prefixCls}-switch-time-disabled`]: disabledTimePicker,
                        [`${prefixCls}-switch-date-active`]: isTimePickerOpen,
                    })}
                    aria-label={locale.switchToTime}
                    disabled={disabledTimePicker}
                    onClick={() => foundation.showTimePicker(panelType)}
                >
                    {showSwitchIcon && <IconClock />}
                    <span className={textCls}>{switchTexts.time}</span>
                </button>
            </div>
        );
    };

    const renderPanel = (panelType: PanelType) => {
        const panelDetail = panelType === PANEL_TYPE_RIGHT ? monthRight : monthLeft;
        const { isTimePickerOpen, isYearPickerOpen } = panelDetail;
        const panelContent = renderMonth(panelDetail.pickerDate, panelType, panelDetail);
        const monthCls = clsx(`${prefixCls}-month-grid-${panelType}`, {
            [`${prefixCls}-yam-showing`]: !isRange && (isTimePickerOpen || isYearPickerOpen),
        });

        return (
            <div key={panelType} ref={attachNode('panel', panelType)} className={monthCls} x-open-type={MonthsGridFoundation.getOpenType(panelDetail)}>
                {isYearPickerOpen && <div className={`${prefixCls}-yam`}>{renderYearAndMonth(panelType, panelDetail)}</div>}
                {isTimePickerOpen && <div className={`${prefixCls}-tpk`}>{renderTimePicker(panelType, panelDetail)}</div>}
                {(isRange || !(isYearPickerOpen || isTimePickerOpen)) && panelContent}
                {renderSwitch(panelType)}
            </div>
        );
    };

    const content = isRange ? [renderPanel(PANEL_TYPE_LEFT), renderPanel(PANEL_TYPE_RIGHT)] : renderPanel(PANEL_TYPE_LEFT);

    useImperativeHandle(ref, () => ({ switchPanels: foundation.switchPanels }), [foundation]);

    return (
        <div style={{ display: 'flex' }}>
            {presetPosition === 'left' && renderQuickControls}
            <div>
                {renderDateInput}
                <div className={`${prefixCls}-month-grid`} x-insetinput={insetInput ? 'true' : 'false'} x-panel-yearandmonth-open-type={MonthsGridFoundation.getYAMOpenType(state)} x-preset-position={renderQuickControls === null ? 'null' : presetPosition} x-type={type}>
                    {content}
                </div>
            </div>
            {presetPosition === 'right' && renderQuickControls}
        </div>
    );
}
