import { type Accessor, type JSX, Index, Show, createEffect, createMemo, createSignal, createUniqueId, on } from 'solid-js';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import type { DayStatusType } from '@fibrae/semi-foundation/date-picker/foundation';
import MonthFoundation, { type MonthDayInfo, type MonthFoundationProps } from '@fibrae/semi-foundation/date-picker/month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import useToday from '../calendar/use-today';
import useConfig from '../config-provider/use-config';

const prefixCls = cssClasses.PREFIX;

export interface MonthProps extends Omit<MonthFoundationProps, 'renderDate' | 'renderFullDate'> {
    renderDate?: (dayNumber?: number, fullDate?: string) => JSX.Element;
    renderFullDate?: (dayNumber?: number, fullDate?: string, dayStatus?: DayStatusType) => JSX.Element;
    locale: Locale['DatePicker'];
    /** The id of the month title that names the grid; a range shows two grids */
    labelledby?: string;
}

/** One month of day cells */
export default function Month(props: MonthProps) {
    const config = useConfig();

    const gridId = createUniqueId();

    // the day the keyboard moved to; stale once the month is switched another way
    const [keyboardDate, setKeyboardDate] = createSignal('');

    // empty until mounted, so the server render and the hydration pass mark no day as today
    const today = useToday();

    const weeks = createMemo(() => MonthFoundation.getMonthTable(props.month, props.weekStartsOn).weeks);

    const todayText = () => {
        const value = today();
        return value === null ? '' : format(value, strings.FORMAT_FULL_DATE);
    };

    const monthText = () => format(props.month, strings.FORMAT_YEAR_MONTH);

    const activeDate = () => MonthFoundation.getDefaultActiveDate(monthText(), [keyboardDate(), ...props.selected, props.rangeStart, props.rangeEnd, todayText()]);

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

    const selectDay = (day?: MonthDayInfo) => {
        if (day && !MonthFoundation.getDayStatus(day, statusOptions()).isDisabled) {
            setKeyboardDate(day.fullDate);
            props.onDayClick(day);
        }
    };

    // APG grid: focus stays on the grid, the keys move the active day and Enter or Space selects it
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectDay(
                weeks()
                    .flat()
                    .find((day) => day.fullDate === activeDate())
            );
            return;
        }
        const target = MonthFoundation.getKeyboardTargetDate(event, parseISO(activeDate()), props.weekStartsOn, config().direction === 'rtl');
        if (target) {
            event.preventDefault();
            setKeyboardDate(format(target, strings.FORMAT_FULL_DATE));
            const switchType = MonthFoundation.getMonthSwitch(target, props.month);
            if (switchType) {
                props.onMonthSwitch(switchType);
            }
        }
    };

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
                    onClick={() => selectDay(day())}
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
            (rowNum) => props.onWeeksRowNumChange(rowNum)
        )
    );

    return (
        <div class={cssClasses.MONTH} aria-activedescendant={dayId(activeDate())} aria-labelledby={props.labelledby} aria-multiselectable={props.multiple} role="grid" tabIndex={0} onKeyDown={handleKeyDown}>
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
