import { useSyncExternalStore } from 'react';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/components/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
import { toWallTime } from '@fibrae/semi-foundation/utils/zoned-time';

// The server's day can differ from the browser's (time zone, midnight), so no day is marked until hydration ends
function getServerSnapshot() {
    return null;
}

/**
 * The timestamp of today's midnight, held as a wall time of `timeZone` (local without one); null on the server and
 * while hydrating. Re-renders when that day changes.
 */
export default function useToday(timeZone?: string | number) {
    return useSyncExternalStore(CalendarFoundation.watchToday, () => startOfDay(toWallTime(getCurrDate(), timeZone)).getTime(), getServerSnapshot);
}
