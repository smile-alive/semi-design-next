import clsx from 'clsx';
import { DatePicker, type DatePickerDayStatusType as DayStatusType } from '@fibrae/semi-ui-solid';

const prefix = 'components-datepicker-demo';

const dayStyle = {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '80%',
    height: '80%',
    'border-radius': 'var(--semi-border-radius-circle)',
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
        <div style={dayStyle} class={dateCls}>
            {dayNumber}
        </div>
    );
}

export default function DatePickerDemo() {
    return <DatePicker style={{ width: '260px' }} type="dateRange" renderFullDate={renderFullDate} />;
}
