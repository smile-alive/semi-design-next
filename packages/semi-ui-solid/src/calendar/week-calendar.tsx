import { createMemo } from 'solid-js';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
import type { WeekCalendarProps } from './interface';
import TimeGrid from './time-grid';

export default function WeekCalendar(props: WeekCalendarProps) {
    // a memo reruns whenever any source it read notifies, so reading the props directly would hand on a new range
    const displayValue = createMemo(() => props.displayValue);
    const weekStartsOn = createMemo(() => props.weekStartsOn ?? 0);
    const range = createMemo(() => CalendarFoundation.getWeekRange(displayValue(), weekStartsOn()));

    // the week may begin in the previous month; the label names the month of the displayed date
    return <TimeGrid {...props} labelDate={displayValue()} range={range()} />;
}
