import { useSyncExternalStore } from 'react';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';

// getSnapshot only re-renders when the day differs.
function getSnapshot() {
    return startOfDay(getCurrDate()).getTime();
}

// The server's day can differ from the browser's (time zone, midnight), so no day is marked until hydration ends
function getServerSnapshot() {
    return null;
}

/** The timestamp of today's local midnight, null on the server and while hydrating; re-renders when the day changes */
export default function useToday() {
    return useSyncExternalStore(CalendarFoundation.watchToday, getSnapshot, getServerSnapshot);
}
