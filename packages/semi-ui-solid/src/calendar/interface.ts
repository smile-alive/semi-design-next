import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/calendar/constants';
import type { DailyEventLayout, EventObject, weekStartsOnEnum } from '@fibrae/semi-foundation/calendar/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ElementProps } from '../_base/element-props';

export interface CalendarProps extends ElementProps<'div', 'onClick' | 'onClose' | 'children'> {
    displayValue?: Date;
    range?: Date[];
    header?: JSX.Element;
    /**
     * An event's `children` is a node or a function that returns one. A function is called for every place the event
     * shows; a node shows in one place and as a copy without event handlers in the others
     */
    events?: EventObject[];
    mode?: ArrayElement<typeof strings.MODE>;
    showCurrTime?: boolean;
    weekStartsOn?: weekStartsOnEnum;
    scrollTop?: number;
    onClick?: (e: MouseEvent, value: Date) => void;
    /** the close button's click, the Esc keydown, or `null` when a mousedown outside closes the card */
    onClose?: (e: MouseEvent | KeyboardEvent | null) => void;
    onMoreClick?: (e: MouseEvent, date: Date, remaining: number) => void;
    renderTimeDisplay?: (time: number) => JSX.Element;
    markWeekend?: boolean;
    minEventHeight?: number;
    width?: number | string;
    height?: number | string;
    renderDateDisplay?: (date: Date) => JSX.Element;
    dateGridRender?: (dateString?: string, date?: Date) => JSX.Element;
    allDayEventsRender?: (events: EventObject[]) => JSX.Element;
}

/** What every view takes: `mode` picks the view and is not passed on, and Calendar always supplies `displayValue` */
export type DayCalendarProps = Omit<CalendarProps, 'mode' | 'displayValue'> & { displayValue: Date };
export type WeekCalendarProps = DayCalendarProps;
export type RangeCalendarProps = DayCalendarProps;

export interface DayColProps {
    displayValue: Date;
    events: DailyEventLayout[];
    scrollHeight: number;
    isWeekend: boolean;
    showCurrTime?: boolean;
    minEventHeight?: number;
    dateGridRender?: CalendarProps['dateGridRender'];
    handleClick: (e: MouseEvent, val: [Date, number, number, number]) => void;
}

export interface TimeColProps {
    class?: string;
    renderTimeDisplay?: CalendarProps['renderTimeDisplay'];
}
