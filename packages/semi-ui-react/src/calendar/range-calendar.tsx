import type { RangeCalendarProps } from './interface';
import TimeGrid from './time-grid';

export default function RangeCalendar(props: RangeCalendarProps) {
    return <TimeGrid {...props} range={props.range} />;
}
