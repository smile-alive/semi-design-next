import { onMount } from 'svelte';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/components/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
import { toWallTime } from '@fibrae/semi-foundation/utils/zoned-time';

export const snapshotToday = (timeZone?: string | number) => startOfDay(toWallTime(getCurrDate(), timeZone)).getTime();

/**
 * The timestamp of today's midnight, held as a wall time of `timeZone` (local without one), kept current while
 * mounted. `null` until mounted so the server render and the hydration pass mark no day.
 */
export default function useToday(timeZone: () => string | number | undefined = () => undefined) {
    // bumped on every check; the derived only notifies when the day it gives changes
    let checkedAt = $state.raw<number | null>(null);

    const today = $derived(checkedAt === null ? null : snapshotToday(timeZone()));

    onMount(() => {
        const refresh = () => {
            checkedAt = Date.now();
        };
        refresh();
        return CalendarFoundation.watchToday(refresh);
    });

    return () => today;
}
