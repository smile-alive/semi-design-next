import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
import type { EventObject } from '@fibrae/semi-foundation/calendar/foundation';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useDefaultProps from '../_base/use-default-props';
import DayCalendar from './day-calendar';
import type { CalendarProps } from './interface';
import MonthCalendar from './month-calendar';
import RangeCalendar from './range-calendar';
import useToday from './use-today';
import WeekCalendar from './week-calendar';

export * from './interface';

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
    const { mode, displayValue, ...rest } = useDefaultProps('Calendar', rawProps, defaultProps);

    const todayStart = useToday();

    // without displayValue the server shows its own day, which may differ from the browser's; SSR callers pass one
    const fallbackDisplayValue = useMemo(() => (todayStart === null ? startOfDay(getCurrDate()) : new Date(todayStart)), [todayStart]);
    const View = views[mode];

    return <View {...rest} displayValue={displayValue ?? fallbackDisplayValue} />;
}

export type { EventObject };
