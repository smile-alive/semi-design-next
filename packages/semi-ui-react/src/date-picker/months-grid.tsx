import React, { useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { isRangeType } from '@fibrae/semi-foundation/date-picker/_utils/picker-type';
import { strings, numbers, cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
import MonthsGridFoundation, { type PanelState, type MonthsGridAdapter, type MonthsGridFoundationProps, type MonthsGridFoundationState, type PanelType } from '@fibrae/semi-foundation/date-picker/months-grid-foundation';
import { IconClock, IconCalendar } from '@fibrae/semi-icons-react';
import type { BaseProps } from '../_base/base-component';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
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
    ref?: React.Ref<MonthsGridHandle>;
}

/** Called by DatePicker when an inset input gets focus */
export interface MonthsGridHandle {
    showDatePanel: (panelType: PanelType) => void;
    showTimePicker: (panelType: PanelType) => void;
}

export type MonthsGridState = MonthsGridFoundationState;

function noDisabledDate() {
    return false;
}

const { isYearOrTime } = MonthsGridFoundation;

type PanelPart = 'panel' | 'wrap' | 'switch';

class PanelNodes {
    panel: Record<PanelType, HTMLDivElement | null> = { left: null, right: null };
    wrap: Record<PanelType, HTMLDivElement | null> = { left: null, right: null };
    switch: Record<PanelType, HTMLDivElement | null> = { left: null, right: null };
    /** the cached height of both panels while they show a scroll list; 0 means measure it */
    currentPanelHeight = 0;

    attach(part: PanelPart, panelType: PanelType, node: HTMLDivElement | null) {
        this[part][panelType] = node;
    }

    measurePanelHeight() {
        this.currentPanelHeight = this.calcScrollListHeight();
    }

    /** The height of the taller panel, or 0 while the panels are not laid out */
    calcScrollListHeight() {
        const height = (panelType: PanelType) => (this.wrap[panelType]?.getBoundingClientRect().height || 0) + (this.switch[panelType]?.getBoundingClientRect().height || 0);
        return Math.max(height(PANEL_TYPE_LEFT), height(PANEL_TYPE_RIGHT));
    }

    applyPanelSize(state: MonthsGridState, insetInput: MonthsGridProps['insetInput']) {
        const sizes = MonthsGridFoundation.getPanelSizeStyle(state, insetInput, {
            monthWidth: (panelType) => this.wrap[panelType]?.getBoundingClientRect().width ?? null,
            scrollListHeight: () => this.currentPanelHeight || this.calcScrollListHeight(),
        });
        for (const panelType of [PANEL_TYPE_LEFT, PANEL_TYPE_RIGHT] as const) {
            const panel = this.panel[panelType];
            if (panel) {
                panel.style.minWidth = sizes[panelType].minWidth;
                panel.style.minHeight = sizes[panelType].minHeight;
            }
        }
    }
}

/** The date panels of DatePicker: one month, or two for a range, each with its year and time picker */
export default function MonthsGrid({ ref, ...rawProps }: MonthsGridProps) {
    const props: MonthsGridProps = {
        ...rawProps,
        type: rawProps.type ?? 'date',
        multiple: rawProps.multiple ?? false,
        weekStartsOn: rawProps.weekStartsOn ?? numbers.WEEK_START_ON,
        disabledDate: rawProps.disabledDate ?? noDisabledDate,
    };

    const { type, insetInput, selectedValue, defaultPickerValue } = props;

    const { weekStartsOn, disabledDate, locale, renderDate, renderFullDate, density, rangeInputFocus, syncSwitchMonth, multiple, focusRecords, format, hideDisabledOptions, timePickerOpts, dateFnsLocale, yearAndMonthOpts, startYear, endYear, disabledTimePicker, presetPosition, renderQuickControls, renderDateInput } =
        props;

    const [nodes] = useState(() => new PanelNodes());
    const titleId = useId();

    // the button that switches between the month and the year picker unmounts or hides under the focus, so the view
    // it switched to takes the focus once rendered
    const pendingFocus = useRef<{ panelType: PanelType; target: 'year' | 'title' } | null>(null);

    // hooks called inside an object literal are memoized as values by the React Compiler and skipped on re-render
    const leftTimePickerRef = useRef<ComboboxHandle>(null);
    const rightTimePickerRef = useRef<ComboboxHandle>(null);
    const leftYamRef = useRef<YearAndMonthHandle>(null);
    const rightYamRef = useRef<YearAndMonthHandle>(null);

    const timePickerRefs = { left: leftTimePickerRef, right: rightTimePickerRef };
    const yamRefs = { left: leftYamRef, right: rightYamRef };
    const isRange = isRangeType(type);
    const dateFormat = MonthsGridFoundation.getValidDateFormat(props);

    const reselect = () => {
        for (const handle of [timePickerRefs.left, timePickerRefs.right, yamRefs.left, yamRefs.right]) {
            handle.current?.reselect();
        }
    };

    useLayoutEffect(() => {
        const pending = pendingFocus.current;
        if (pending) {
            pendingFocus.current = null;
            const panel = nodes.panel[pending.panelType];
            const node = pending.target === 'year' ? panel?.querySelector<HTMLElement>('[role="listbox"]') : (panel?.getRootNode() as Document | ShadowRoot | undefined)?.getElementById(`${titleId}-${pending.panelType}-title`);
            node?.focus();
        }
    });

    const [foundation, state] = useFoundation<MonthsGridFoundation, MonthsGridAdapter, MonthsGridProps, MonthsGridState>(
        MonthsGridFoundation,
        props,
        () => MonthsGridFoundation.getInitialState(props),
        (base) => ({
            updateDaySelected: (selected) => base.setState({ selected }),
            setRangeStart: (rangeStart) => base.setState({ rangeStart }),
            setRangeEnd: (rangeEnd) => base.setState({ rangeEnd }),
            setHoverDay: (hoverDay) => base.setState({ hoverDay }),
            setOffsetRangeStart: (offsetRangeStart) => base.setState({ offsetRangeStart }),
            setOffsetRangeEnd: (offsetRangeEnd) => base.setState({ offsetRangeEnd }),
            updateMonthOnLeft: (monthLeft) => base.setState({ monthLeft }),
            updateMonthOnRight: (monthRight) => base.setState({ monthRight }),
            notifySelectedChange: (value, options) => base.getProps().onChange(value, options),
            notifyPanelChange: (date, dateString) => base.getProps().onPanelChange(date, dateString),
            setRangeInputFocus: (rangeInputFocus) => base.getProps().setRangeInputFocus(rangeInputFocus),
            hasOtherRangeInputBeenFocused: (currentRangeInput) => base.getProps().hasOtherRangeInputBeenFocused(currentRangeInput),
        })
    );

    const leftIsYearOrTime = isYearOrTime(state.monthLeft);
    const rightIsYearOrTime = isYearOrTime(state.monthRight);
    const yearOrTimePanels = isRange ? Number(leftIsYearOrTime) + Number(rightIsYearOrTime) : 0;
    const { selected, rangeStart, rangeEnd, hoverDay, offsetRangeStart, offsetRangeEnd, monthLeft, monthRight } = state;

    // a scroll list beside a month keeps its own height; the panels share a minHeight only while both show lists
    const handleWeeksRowNumChange = () => {
        if (isRange && !(leftIsYearOrTime && rightIsYearOrTime)) {
            nodes.measurePanelHeight();
        }
    };

    const renderMonth = (month: Date, panelType: PanelType, detail: PanelState) => {
        const monthText = MonthsGridFoundation.formatMonthText(locale, month);
        const style: React.CSSProperties = isRange && isYearOrTime(detail) ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : {};

        return (
            <div ref={(node) => nodes.attach('wrap', panelType, node)} style={style}>
                <Navigation
                    density={density}
                    locale={locale}
                    monthText={monthText}
                    panelType={panelType}
                    shouldBimonthSwitch={isRange && syncSwitchMonth}
                    titleId={`${titleId}-${panelType}-title`}
                    onMonthClick={() => {
                        pendingFocus.current = { panelType, target: 'year' };
                        foundation.showYearPicker(panelType);
                    }}
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
                    weekStartsOn={weekStartsOn}
                    renderDate={renderDate}
                    renderFullDate={renderFullDate}
                    onDayClick={(day) => foundation.handleDayClick(day, panelType)}
                    onDayHover={(day) => foundation.handleDayHover(day)}
                    onMonthSwitch={(switchType) => foundation[switchType](panelType)}
                    onWeeksRowNumChange={handleWeeksRowNumChange}
                />
            </div>
        );
    };

    const renderTimePicker = (panelType: PanelType, panelDetail: PanelState) => {
        const optionProps: Partial<ComboboxProps> = { ...timePickerOpts, hideDisabledOptions };
        const disabledOptions = MonthsGridFoundation.calcDisabledTime(props, state, panelType);
        if (disabledOptions) {
            for (const key of ['disabledHours', 'disabledMinutes', 'disabledSeconds']) {
                if (disabledOptions[key]) {
                    optionProps[key] = disabledOptions[key];
                }
            }
        }
        return (
            <div className={`${prefixCls}-time`}>
                <Combobox
                    {...optionProps}
                    // the panel's own props come after the spread: an untyped caller cannot replace them
                    ref={timePickerRefs[panelType]}
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
                ref={yamRefs[panelType]}
                currentMonth={{ left: pickerDate.getMonth() + 1, right: 0 }}
                currentYear={{ left: pickerDate.getFullYear(), right: 0 }}
                density={density}
                endYear={endYear}
                locale={locale}
                startYear={startYear}
                yearAndMonthOpts={yearAndMonthOpts}
                onBackToMain={() => {
                    pendingFocus.current = { panelType, target: 'title' };
                    foundation.showDatePanel(panelType);
                }}
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
            <div ref={(node) => nodes.attach('switch', panelType, node)} className={`${prefixCls}-switch`}>
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
            <div key={panelType} ref={(node) => nodes.attach('panel', panelType, node)} className={monthCls} x-open-type={MonthsGridFoundation.getOpenType(panelDetail)}>
                {isYearPickerOpen && <div className={`${prefixCls}-yam`}>{renderYearAndMonth(panelType, panelDetail)}</div>}
                {isTimePickerOpen && <div className={`${prefixCls}-tpk`}>{renderTimePicker(panelType, panelDetail)}</div>}
                {(isRange || !(isYearPickerOpen || isTimePickerOpen)) && panelContent}
                {renderSwitch(panelType)}
            </div>
        );
    };

    const content = isRange ? [renderPanel(PANEL_TYPE_LEFT), renderPanel(PANEL_TYPE_RIGHT)] : renderPanel(PANEL_TYPE_LEFT);

    useDidUpdate(selectedValue, (value) => foundation.updateSelectedFromProps(value));

    // by content: a parent rendering `new Date(...)` each time must not pull the panel back
    useDidUpdate(defaultPickerValue, () => foundation.initDefaultPickerValue(), isEqual);

    useLayoutEffect(() => {
        nodes.applyPanelSize(state, insetInput);
    });

    useDidUpdate(yearOrTimePanels, (count, previous) => {
        if (previous === 1 && count === 2) {
            nodes.measurePanelHeight();
            nodes.applyPanelSize(foundation.getStates(), foundation.getProp('insetInput'));
            reselect();
        } else if (previous === 2 && count === 1) {
            reselect();
        }
    });

    useImperativeHandle(
        ref,
        () => ({
            showDatePanel: (panelType) => foundation.showDatePanel(panelType),
            showTimePicker: (panelType) => foundation.showTimePicker(panelType),
        }),
        [foundation]
    );

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
