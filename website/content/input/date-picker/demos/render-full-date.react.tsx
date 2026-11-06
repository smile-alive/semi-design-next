import clsx from 'clsx';
import { DatePicker, type DatePickerDayStatusType as DayStatusType } from '@fibrae/semi-ui-react';

const prefix = 'components-datepicker-demo';

const dayStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '80%',
    borderRadius: 'var(--semi-border-radius-circle)',
};

function renderFullDate(dayNumber?: number, _fullDate?: string, dayStatus?: DayStatusType) {
    const dateCls = clsx({
        [`${prefix}-day-inrange`]: dayStatus?.isInRange,
        [`${prefix}-day-hover`]: dayStatus?.isHover,
        [`${prefix}-day-selected`]: dayStatus?.isSelected,
        [`${prefix}-day-selected-start`]: dayStatus?.isSelectedStart,
        [`${prefix}-day-selected-end`]: dayStatus?.isSelectedEnd,
    });

    return (
        <div style={dayStyle} className={dateCls}>
            {dayNumber}
        </div>
    );
}

export default function DatePickerDemo() {
    return <DatePicker style={{ width: 260 }} type="dateRange" renderFullDate={renderFullDate} />;
}
