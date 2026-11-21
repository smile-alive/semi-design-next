import type { CalendarPart, strings } from '@fibrae/semi-foundation/components/calendar/constants';
import type { DailyEventLayout, EventObject, WeekStartsOn } from '@fibrae/semi-foundation/components/calendar/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import type { ElementProps, BaseProps } from '../../base/index';

export interface CalendarProps extends ElementProps<'div', 'onClick' | 'children'> {
    displayValue?: Date;
    range?: Date[];
    header?: React.ReactNode;
    classNames?: Partial<Record<CalendarPart, string>>;
    styles?: Partial<Record<CalendarPart, React.CSSProperties>>;
    events?: EventObject[];
    mode?: ArrayElement<typeof strings.MODE>;
    showCurrTime?: boolean;
    weekStartsOn?: WeekStartsOn;
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
    dateGridRender?: (dateString: string, date: Date) => React.ReactNode;
    allDayEventsRender?: (events: EventObject[]) => React.ReactNode;
    /** Attached to the root div of the current view */
    ref?: React.Ref<HTMLDivElement>;
}

export type DayCalendarProps = Omit<CalendarProps, 'mode'>;

type DayCalendarPropsKeys = 'displayValue' | 'showCurrTime' | 'mode' | 'dateGridRender' | 'minEventHeight' | 'classNames' | 'styles';
export interface DayColProps extends Pick<CalendarProps, DayCalendarPropsKeys>, BaseProps {
    events: DailyEventLayout[];
    scrollHeight: number;
    isWeekend: boolean;
    today: number | null;
    handleClick: (e: React.MouseEvent, val: [Date, number, number, number]) => void;
}

export type MonthCalendarProps = Omit<CalendarProps, 'range' | 'showCurrTime' | 'scrollTop' | 'renderTimeDisplay'>;

export type RangeCalendarProps = CalendarProps;

export interface TimeColProps {
    className?: string;
    classNames?: CalendarProps['classNames'];
    styles?: CalendarProps['styles'];
    renderTimeDisplay?: CalendarProps['renderTimeDisplay'];
}

export type WeekCalendarProps = CalendarProps;
