import { createSignal, onCleanup, onMount } from 'solid-js';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';

export const snapshotToday = () => startOfDay(getCurrDate()).getTime();

/**
 * The timestamp of today's local midnight, kept current while mounted. Null until mount: the server and the
 * hydrating browser may be on different days, so no date is marked today in the first frame.
 */
export default function useToday() {
    const [today, setToday] = createSignal<number | null>(null);

    onMount(() => {
        const refresh = () => setToday(snapshotToday());
        refresh();
        onCleanup(CalendarFoundation.watchToday(refresh));
    });

    return today;
}
