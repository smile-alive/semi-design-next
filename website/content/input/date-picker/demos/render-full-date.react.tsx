import clsx from 'clsx';
import { DatePicker, type DatePickerDayStatusType as DayStatusType } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    const renderFullDate = (dayNumber?: number, _fullDate?: string, { isInRange, isHover, isSelected, isSelectedStart, isSelectedEnd }: DayStatusType = {}) => {
        const prefix = 'components-datepicker-demo';
        const dateCls = clsx({
            [`${prefix}-day-inrange`]: isInRange,
            [`${prefix}-day-hover`]: isHover,
            [`${prefix}-day-selected`]: isSelected,
            [`${prefix}-day-selected-start`]: isSelectedStart,
            [`${prefix}-day-selected-end`]: isSelectedEnd,
        });
        const dayStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80%',
            height: '80%',
            borderRadius: 'var(--semi-border-radius-circle)',
        };

        return (
            <div style={dayStyle} className={dateCls}>
                {dayNumber}
            </div>
        );
    };

    return <DatePicker style={{ width: 260 }} type="dateRange" renderFullDate={renderFullDate} />;
}
