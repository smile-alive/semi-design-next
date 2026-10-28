import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { EventObject } from './interface';

// The layouts the foundation returns are copies (split spans, timed events without custom fields), so the views
// look up the caller's event by key for the #event slot.
export type CalendarContext = ComputedRef<ReadonlyMap<string, EventObject>>;

export const [provideCalendarContext, useCalendarContext] = createContext<CalendarContext>('Calendar', { optional: true });
