import { createMemo, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import '@fibrae/semi-foundation/components/calendar/calendar.scss';
import useDefaultProps from '../../base/use-default-props';
import DayCalendar from './day-calendar';
import type { CalendarProps } from './interface';
import MonthCalendar from './month-calendar';
import useToday, { snapshotToday } from './primitives/use-today';
import RangeCalendar from './range-calendar';
import WeekCalendar from './week-calendar';

const views = {
    day: DayCalendar,
    week: WeekCalendar,
    month: MonthCalendar,
    range: RangeCalendar,
};

const defaultProps = {
    events: [],
    showCurrTime: true,
    mode: 'week',
    markWeekend: false,
    height: 600,
    scrollTop: 400,
    weekStartsOn: 0,
} satisfies Partial<CalendarProps>;

export default function Calendar(rawProps: CalendarProps) {
    const props = useDefaultProps('Calendar', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['mode', 'displayValue']);

    const todayStart = useToday();

    // Without displayValue the first frame shows the current day on each side; server rendering passes displayValue
    const fallbackDisplayValue = createMemo(() => new Date(todayStart() ?? snapshotToday()), undefined, { equals: (a, b) => a.getTime() === b.getTime() });
    const displayValue = createMemo(() => local.displayValue ?? fallbackDisplayValue());

    return <Dynamic component={views[local.mode]} {...rest} displayValue={displayValue()} />;
}
