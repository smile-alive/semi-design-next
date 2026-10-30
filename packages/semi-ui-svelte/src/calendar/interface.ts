import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/calendar/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';

export type CalendarMode = ArrayElement<typeof strings.MODE>;
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EventObject {
    // Custom fields (color, title, ...) are what the `event` snippet usually renders, so any key is allowed.
    [x: string]: any;
    key: string;
    allDay?: boolean;
    start?: Date;
    end?: Date;
    children?: string | number;
}

export interface CalendarEventArgs {
    /** The object from `events`, found by its key */
    event: EventObject;
}

export interface CalendarDateDisplayArgs {
    date: Date;
}

export interface CalendarDateGridArgs {
    date: Date;
    dateString: string;
}

export interface CalendarTimeDisplayArgs {
    time: number;
}

export interface CalendarAllDayEventsArgs {
    events: EventObject[];
}

// onClick, onClose and onMoreClick have Semi's signatures; the lowercase DOM listeners they would collide with are not props
export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onclick' | 'onclose'> {
    displayValue?: Date;
    range?: Date[];
    events?: EventObject[];
    mode?: CalendarMode;
    showCurrTime?: boolean;
    weekStartsOn?: WeekStartsOn;
    scrollTop?: number;
    markWeekend?: boolean;
    minEventHeight?: number;
    width?: number | string;
    height?: number | string;
    onClick?: (event: MouseEvent, value: Date) => void;
    /**
     * The close button's click, the Esc keydown, or `null` when a mousedown outside closes the card
     */
    onClose?: (event: MouseEvent | KeyboardEvent | null) => void;
    onMoreClick?: (event: MouseEvent, date: Date, remaining: number) => void;
    /** Shown above the grid; a snippet that renders nothing still leaves its (empty) row */
    header?: Snippet;
    /** Content of an event, called once per place the event shows. Defaults to the event's `children` text */
    event?: Snippet<[CalendarEventArgs]>;
    /** The date in a week or range column header and in every month cell. Not used by the day view */
    dateDisplay?: Snippet<[CalendarDateDisplayArgs]>;
    /** Extra content in every day column, or in every month cell */
    dateGrid?: Snippet<[CalendarDateGridArgs]>;
    /** The hour labels from 1 to 23 */
    timeDisplay?: Snippet<[CalendarTimeDisplayArgs]>;
    /** Replaces the all-day events of the day, week and range views; renders `li` items */
    allDayEvents?: Snippet<[CalendarAllDayEventsArgs]>;
}

/**
 * What every view takes from Calendar, which resolves `mode`, `range` and the defaults: every other attribute goes to
 * the view's root element
 */
export interface CalendarViewProps extends Pick<CalendarProps, 'width' | 'height' | 'header' | 'event' | 'dateGrid' | 'onClick'>, Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onclick' | 'onclose'> {
    events: EventObject[];
    markWeekend: boolean;
    /** The timestamp of today's local midnight; `null` until mounted */
    today: number | null;
}
