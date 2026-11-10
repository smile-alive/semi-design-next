import { type Accessor, type JSX, Index, Show, createEffect, createMemo, createUniqueId, on } from 'solid-js';
import clsx from 'clsx';
import { format } from 'date-fns';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
import type { DayStatusType } from '@fibrae/semi-foundation/components/date-picker/foundation';
import MonthFoundation, { type MonthAdapter, type MonthDayInfo, type MonthFoundationProps, type MonthFoundationState } from '@fibrae/semi-foundation/components/date-picker/month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/index';
import useFoundation from '../../base/use-foundation';
import useToday from '../calendar/primitives/use-today';
import useConfig from '../config-provider/use-config';

const prefixCls = cssClasses.PREFIX;

export interface MonthProps extends Omit<MonthFoundationProps, 'renderDate' | 'renderFullDate'> {
    renderDate?: (dayNumber?: number, fullDate?: string) => JSX.Element;
    renderFullDate?: (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => JSX.Element;
    locale: Locale['DatePicker'];
    /** The id of the month title that names the grid; a range shows two grids */
    labelledby?: string;
}

export default function Month(props: MonthProps) {
    const config = useConfig();

    const gridId = createUniqueId();

    // empty until mounted, so the server render and the hydration pass mark no day as today
    const today = useToday(() => props.timeZone);

    const { foundation, state } = useFoundation<MonthFoundation, MonthAdapter, MonthProps, MonthFoundationState>(
        MonthFoundation,
        props,
        () => MonthFoundation.getInitialState(),
        () => ({
            notifyDayClick: (day) => props.onDayClick(day),
            notifyMonthSwitch: (switchType) => props.onMonthSwitch(switchType),
        }),
        { context: config }
    );

    const weeks = createMemo(() => MonthFoundation.getMonthTable(props.month, props.weekStartsOn).weeks);

    const todayText = () => {
        const value = today();
        return value === null ? '' : format(value, strings.FORMAT_FULL_DATE);
    };

    const activeDate = () => MonthFoundation.getActiveDate(props, state(), todayText());

    const weekdaysText = () => MonthFoundation.getWeekdays(props.weekStartsOn).map((key) => props.locale.weeks[key as keyof Locale['DatePicker']['weeks']]);

    const statusOptions = () => ({
        selected: props.selected,
        rangeStart: props.rangeStart,
        rangeEnd: props.rangeEnd,
        offsetRangeStart: props.offsetRangeStart,
        offsetRangeEnd: props.offsetRangeEnd,
        disabledDate: props.disabledDate,
        hoverDay: props.hoverDay,
        rangeInputFocus: props.rangeInputFocus,
        focusRecords: props.focusRecords,
        todayText: todayText(),
    });

    const dayId = (fullDate: string) => `${gridId}-${fullDate}`;

    const renderDay = (day: Accessor<MonthDayInfo>) => {
        const status = createMemo(() => MonthFoundation.getDayStatus(day(), statusOptions()));
        const isActive = () => day().fullDate === activeDate();
        const customRender = () => typeof props.renderFullDate === 'function';
        const dayCls = () => clsx(cssClasses.DAY, MonthFoundation.getDayClasses(status(), isActive()));

        return (
            <Show
                when={day().fullDate}
                fallback={
                    <div class={cssClasses.DAY} role="gridcell">
                        <span />
                    </div>
                }
            >
                <div
                    id={dayId(day().fullDate)}
                    class={customRender() ? clsx(cssClasses.DAY, { [cssClasses.DAY_ACTIVE]: isActive() }) : dayCls()}
                    aria-disabled={Boolean(status().isDisabled)}
                    aria-label={day().fullDate}
                    // a range keeps its value in rangeStart and rangeEnd, not in `selected`
                    aria-selected={Boolean(status().isSelected || status().isSelectedStart || status().isSelectedEnd)}
                    role="gridcell"
                    title={day().fullDate}
                    onClick={() => foundation.selectDay(day())}
                    onMouseEnter={() => props.onDayHover(day())}
                    onMouseLeave={() => props.onDayHover()}
                >
                    {/* called again when the day or its status changes, as React renders it again */}
                    <Show
                        when={customRender()}
                        fallback={
                            <div class={`${cssClasses.DAY}-main`}>
                                <Show when={typeof props.renderDate === 'function'} fallback={<span>{day().dayNumber}</span>}>
                                    {props.renderDate?.(day().dayNumber as number, day().fullDate)}
                                </Show>
                            </div>
                        }
                    >
                        {props.renderFullDate?.(day().dayNumber as number, day().fullDate, status())}
                    </Show>
                </div>
            </Show>
        );
    };

    createEffect(
        on(
            () => weeks().length,
            () => props.onWeeksRowNumChange()
        )
    );

    return (
        <div class={cssClasses.MONTH} aria-activedescendant={dayId(activeDate())} aria-labelledby={props.labelledby} aria-multiselectable={props.multiple} role="grid" tabIndex={0} onKeyDown={(event) => foundation.handleKeyDown(event, todayText())}>
            <div class={cssClasses.WEEKDAY} role="row">
                <Index each={weekdaysText()}>
                    {(text) => (
                        <div class={`${prefixCls}-weekday-item`} role="columnheader">
                            {text()}
                        </div>
                    )}
                </Index>
            </div>
            <div class={cssClasses.WEEKS}>
                <Index each={weeks()}>
                    {(week) => (
                        <div class={cssClasses.WEEK} role="row">
                            <Index each={week()}>{renderDay}</Index>
                        </div>
                    )}
                </Index>
            </div>
        </div>
    );
}
