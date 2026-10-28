import type { strings } from '@fibrae/semi-foundation/calendar/constants';
import type { DailyEventLayout, EventObject, weekStartsOnEnum } from '@fibrae/semi-foundation/calendar/foundation';
import type { ArrayElement, ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';

export interface CalendarProps extends ElementProps<'div', 'onClick' | 'children'> {
    displayValue?: Date;
    range?: Date[];
    header?: React.ReactNode;
    events?: EventObject[];
    mode?: ArrayElement<typeof strings.MODE>;
    showCurrTime?: boolean;
    weekStartsOn?: weekStartsOnEnum;
    scrollTop?: number;
    onClick?: (e: React.MouseEvent, value: Date) => void;
    /** the close button's click, the Esc keydown, or `null` when a mousedown outside closes the card */
    onClose?: (e: React.MouseEvent | KeyboardEvent | null) => void;
    onMoreClick?: (e: React.MouseEvent, date: Date, remaining: number) => void;
    renderTimeDisplay?: (time: number) => React.ReactNode;
    markWeekend?: boolean;
    minEventHeight?: number;
    width?: number | string;
    height?: number | string;
    renderDateDisplay?: (date: Date) => React.ReactNode;
    dateGridRender?: (dateString?: string, date?: Date) => React.ReactNode;
    allDayEventsRender?: (events: EventObject[]) => React.ReactNode;
    /** Attached to the root div of the current view */
    ref?: React.Ref<HTMLDivElement>;
}

export type DayCalendarProps = Omit<CalendarProps, 'mode'>;

type DayCalendarPropsKeys = 'displayValue' | 'showCurrTime' | 'mode' | 'dateGridRender' | 'minEventHeight';
export interface DayColProps extends Pick<CalendarProps, DayCalendarPropsKeys>, BaseProps {
    events: DailyEventLayout[];
    scrollHeight: number;
    isWeekend: boolean;
    handleClick: (e: React.MouseEvent, val: [Date, number, number, number]) => void;
}

export type MonthCalendarProps = Omit<CalendarProps, 'range' | 'showCurrTime' | 'scrollTop' | 'renderTimeDisplay'>;

export type RangeCalendarProps = CalendarProps;

export interface TimeColProps {
    className?: string;
    renderTimeDisplay?: CalendarProps['renderTimeDisplay'];
}

export type WeekCalendarProps = CalendarProps;
