import { onMount } from 'svelte';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';

/** The timestamp of today's local midnight; used while the first frame has no `today` */
export const snapshotToday = () => startOfDay(getCurrDate()).getTime();

/**
 * The timestamp of today's local midnight, kept current while mounted. `null` until mounted so the server render and
 * the hydration pass mark no day.
 */
export default function useToday() {
    let today = $state.raw<number | null>(null);

    onMount(() => {
        const refresh = () => {
            today = snapshotToday();
        };
        refresh();
        return CalendarFoundation.watchToday(refresh);
    });

    return () => today;
}
