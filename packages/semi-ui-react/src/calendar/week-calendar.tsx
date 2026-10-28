import { useMemo } from 'react';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import type { WeekCalendarProps } from './interface';
import TimeGrid from './time-grid';

export default function WeekCalendar(props: WeekCalendarProps) {
    const { displayValue, weekStartsOn } = props;

    const range = useMemo(() => CalendarFoundation.getWeekRange(displayValue, weekStartsOn), [displayValue, weekStartsOn]);

    // the week may begin in the previous month; the label names the month of the displayed date
    return <TimeGrid {...props} labelDate={displayValue} range={range} />;
}
