import type React from 'react';
import { useId, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/date-picker/constants';
import MonthFoundation, { type MonthAdapter, type MonthDayInfo, type MonthFoundationProps, type MonthFoundationState } from '@fibrae/semi-foundation/components/date-picker/month-foundation';
import type { Locale } from '@fibrae/semi-foundation/locale';
import { type BaseProps, useFoundation } from '../../base/index';
import useToday from '../calendar/hooks/use-today';
import { useConfigContext } from '../config-provider/context';

const prefixCls = cssClasses.PREFIX;

export interface MonthProps extends MonthFoundationProps, BaseProps {
    /** on the role="grid" div */
    ref?: React.Ref<HTMLDivElement>;
    locale: Locale['DatePicker'];
    /** the id of the month title that names the grid; a range shows two grids */
    labelledby?: string;
}

export default function Month(props: MonthProps) {
    const { ref, labelledby, month, weekStartsOn, locale, multiple, renderDate, renderFullDate, selected, rangeStart, rangeEnd, offsetRangeStart, offsetRangeEnd, disabledDate, hoverDay, rangeInputFocus, focusRecords, timeZone, onDayHover, onWeeksRowNumChange } = props;

    const context = useConfigContext();

    const gridId = useId();
    const reportedRowNum = useRef(0);

    const today = useToday(timeZone);

    const [foundation, state] = useFoundation<MonthFoundation, MonthAdapter, MonthProps, MonthFoundationState>(
        MonthFoundation,
        props,
        () => MonthFoundation.getInitialState(),
        (base) => ({
            notifyDayClick: (day) => base.getProps().onDayClick(day),
            notifyMonthSwitch: (switchType) => base.getProps().onMonthSwitch(switchType),
        }),
        context
    );

    const todayText = today === null ? '' : format(today, strings.FORMAT_FULL_DATE);
    const { weeks } = MonthFoundation.getMonthTable(month, weekStartsOn);
    const activeDate = MonthFoundation.getActiveDate(props, state, todayText);

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
                onClick={() => foundation.selectDay(day)}
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
            onWeeksRowNumChange();
        }
    });

    return (
        <div ref={ref} className={cssClasses.MONTH} aria-activedescendant={dayId(activeDate)} aria-labelledby={labelledby} aria-multiselectable={multiple} role="grid" tabIndex={0} onKeyDown={(event) => foundation.handleKeyDown(event, todayText)}>
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
