import { createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/components/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
import { toWallTime } from '@fibrae/semi-foundation/utils/zoned-time';

export const snapshotToday = (timeZone?: string | number) => startOfDay(toWallTime(getCurrDate(), timeZone)).getTime();

/**
 * The timestamp of today's midnight, held as a wall time of `timeZone` (local without one), kept current while
 * mounted. Null until mount: the server and the hydrating browser may be on different days, so no date is marked
 * today in the first frame.
 */
export default function useToday(timeZone: () => string | number | undefined = () => undefined) {
    // bumped on every check; the memo only notifies when the day it gives changes
    const [checkedAt, setCheckedAt] = createSignal<number | null>(null);

    onMount(() => {
        const refresh = () => setCheckedAt(Date.now());
        refresh();
        onCleanup(CalendarFoundation.watchToday(refresh));
    });

    return createMemo(() => (checkedAt() === null ? null : snapshotToday(timeZone())));
}
