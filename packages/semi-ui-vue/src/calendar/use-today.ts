import { type ShallowRef, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';

const snapshot = () => startOfDay(getCurrDate()).getTime();

/** The timestamp of today's local midnight, kept current while mounted; `null` until mounted so the server render and the hydration pass mark no day */
export default function useToday(): Readonly<ShallowRef<number | null>> {
    const today = shallowRef<number | null>(null);
    let stop: (() => void) | undefined;

    const refresh = () => {
        today.value = snapshot();
    };

    onMounted(() => {
        refresh();
        stop = CalendarFoundation.watchToday(refresh);
    });

    onBeforeUnmount(() => stop?.());

    return today;
}
