import type React from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
import MonthFoundation, { type MonthDayInfo, type MonthFoundationProps } from '@fibrae/semi-foundation/date-picker/month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { BaseProps } from '../_base/base-component';
import useToday from '../calendar/use-today';
import { useConfigContext } from '../config-provider/context';

const prefixCls = cssClasses.PREFIX;

export interface MonthProps extends MonthFoundationProps, BaseProps {
    /** on the role="grid" div */
    ref?: React.Ref<HTMLDivElement>;
    locale: Locale['DatePicker'];
    /** the id of the month title that names the grid; a range shows two grids */
    labelledby?: string;
}

/** One month of day cells */
export default function Month({ ref, labelledby, month, weekStartsOn, locale, multiple, renderDate, renderFullDate, selected, rangeStart, rangeEnd, offsetRangeStart, offsetRangeEnd, disabledDate, hoverDay, rangeInputFocus, focusRecords, onDayClick, onDayHover, onMonthSwitch, onWeeksRowNumChange }: MonthProps) {
    const gridId = useId();
    const reportedRowNum = useRef(0);

    // the day the keyboard moved to; stale once the month is switched another way
    const [keyboardDate, setKeyboardDate] = useState('');

    const today = useToday();

    const todayText = today === null ? '' : format(today, strings.FORMAT_FULL_DATE);
    const rtl = useConfigContext().direction === 'rtl';
    const { weeks } = MonthFoundation.getMonthTable(month, weekStartsOn);
    const monthText = format(month, strings.FORMAT_YEAR_MONTH);
    const activeDate = MonthFoundation.getDefaultActiveDate(monthText, [keyboardDate, ...selected, rangeStart, rangeEnd, todayText]);

    const statusOptions = {
        selected,
        rangeStart,
        rangeEnd,
        offsetRangeStart,
        offsetRangeEnd,
        disabledDate,
        hoverDay,
        rangeInputFocus,
        focusRecords,
        todayText,
    };

    const weekdaysText = MonthFoundation.getWeekdays(weekStartsOn).map((key) => locale.weeks[key]);

    const dayId = (fullDate: string) => `${gridId}-${fullDate}`;

    const selectDay = (day: MonthDayInfo) => {
        if (!MonthFoundation.getDayStatus(day, statusOptions).isDisabled) {
            setKeyboardDate(day.fullDate);
            onDayClick(day);
        }
    };

    // APG grid: focus stays on the grid, the keys move the active day and Enter or Space selects it
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectDay(weeks.flat().find((day) => day.fullDate === activeDate));
            return;
        }
        const target = MonthFoundation.getKeyboardTargetDate(event, parseISO(activeDate), weekStartsOn, rtl);
        if (target) {
            event.preventDefault();
            setKeyboardDate(format(target, strings.FORMAT_FULL_DATE));
            const switchType = MonthFoundation.getMonthSwitch(target, month);
            if (switchType) {
                onMonthSwitch(switchType);
            }
        }
    };

    const renderDay = (day: MonthDayInfo, dayIndex: number) => {
        const { fullDate, dayNumber } = day;
        if (!fullDate) {
            return (
                <div key={(dayNumber as number) + dayIndex} className={cssClasses.DAY} role="gridcell">
                    <span />
                </div>
            );
        }

        const dayStatus = MonthFoundation.getDayStatus(day, statusOptions);
        const isActive = fullDate === activeDate;
        const dayCls = clsx(cssClasses.DAY, MonthFoundation.getDayClasses(dayStatus, isActive));
        const dayOfMonth = dayNumber as number;
        const customRender = typeof renderFullDate === 'function';

        return (
            <div
                key={dayOfMonth + dayIndex}
                id={dayId(fullDate)}
                className={!customRender ? dayCls : clsx(cssClasses.DAY, { [cssClasses.DAY_ACTIVE]: isActive })}
                aria-disabled={dayStatus.isDisabled}
                aria-label={fullDate}
                // a range keeps its value in rangeStart and rangeEnd, not in `selected`
                aria-selected={Boolean(dayStatus.isSelected || dayStatus.isSelectedStart || dayStatus.isSelectedEnd)}
                role="gridcell"
                title={fullDate}
                onClick={() => selectDay(day)}
                onMouseEnter={() => onDayHover(day)}
                onMouseLeave={() => onDayHover()}
            >
                {customRender ? renderFullDate(dayOfMonth, fullDate, dayStatus) : <div className={`${cssClasses.DAY}-main`}>{typeof renderDate === 'function' ? renderDate(dayOfMonth, fullDate) : <span>{dayNumber}</span>}</div>}
            </div>
        );
    };

    useLayoutEffect(() => {
        if (weeks.length !== reportedRowNum.current) {
            reportedRowNum.current = weeks.length;
            onWeeksRowNumChange(weeks.length);
        }
    });

    return (
        <div ref={ref} className={cssClasses.MONTH} aria-activedescendant={dayId(activeDate)} aria-labelledby={labelledby} aria-multiselectable={multiple} role="grid" tabIndex={0} onKeyDown={handleKeyDown}>
            <div className={cssClasses.WEEKDAY} role="row">
                {weekdaysText.map((text, i) => (
                    <div key={text + i} className={`${prefixCls}-weekday-item`} role="columnheader">
                        {text}
                    </div>
                ))}
            </div>
            <div className={cssClasses.WEEKS}>
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className={cssClasses.WEEK} role="row">
                        {week.map(renderDay)}
                    </div>
                ))}
            </div>
        </div>
    );
}
