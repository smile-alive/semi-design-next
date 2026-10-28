import type { VNode } from 'vue';

export type CalendarMode = 'day' | 'week' | 'month' | 'range';
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EventObject {
    // Custom fields (color, title, ...) are what the #event slot usually renders, so any key is allowed.
    [x: string]: any;
    key: string;
    allDay?: boolean;
    start?: Date;
    end?: Date;
    children?: string | number;
}

export interface CalendarProps {
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
}

export interface CalendarEmits {
    click: [event: MouseEvent, value: Date];
    /**
     * The close button's click, the Esc keydown, or `null` when a mousedown outside closes the card or the
     * Calendar is deactivated by a surrounding `KeepAlive`
     */
    close: [event: MouseEvent | KeyboardEvent | null];
    moreClick: [event: MouseEvent, date: Date, remaining: number];
}

export interface CalendarEventSlotProps {
    /** The object from `events`, found by its key */
    event: EventObject;
}

export interface CalendarDateDisplaySlotProps {
    date: Date;
}

export interface CalendarDateGridSlotProps {
    date: Date;
    dateString: string;
}

export interface CalendarTimeDisplaySlotProps {
    time: number;
}

export interface CalendarAllDayEventsSlotProps {
    events: EventObject[];
}

export interface CalendarSlots {
    header?: () => VNode[];
    event?: (props: CalendarEventSlotProps) => VNode[];
    dateDisplay?: (props: CalendarDateDisplaySlotProps) => VNode[];
    dateGrid?: (props: CalendarDateGridSlotProps) => VNode[];
    timeDisplay?: (props: CalendarTimeDisplaySlotProps) => VNode[];
    allDayEvents?: (props: CalendarAllDayEventsSlotProps) => VNode[];
}
