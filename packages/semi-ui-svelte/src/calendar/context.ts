import { createContext } from '../_base/create-context.js';
import type { EventObject } from './interface.js';

export interface CalendarContextValue {
    // The layouts the foundation returns are copies (split spans, timed events without custom fields), so the views
    // look up the caller's event by key for the `event` snippet.
    eventOf: (layout: EventObject) => EventObject;
}

export const [getCalendarContext, setCalendarContext] = createContext<CalendarContextValue>('Calendar');
