import { type ComputedRef, type MaybeRefOrGetter, computed, onBeforeUnmount, onMounted, shallowRef, toValue } from 'vue';
import { startOfDay } from 'date-fns';
import { getCurrDate } from '@fibrae/semi-foundation/components/calendar/event-util';
import CalendarFoundation from '@fibrae/semi-foundation/components/calendar/foundation';
import { toWallTime } from '@fibrae/semi-foundation/utils/zoned-time';

/**
 * The timestamp of today's midnight, held as a wall time of `timeZone` (local without one), kept current while
 * mounted; `null` until mounted so the server render and the hydration pass mark no day
 */
export default function useToday(timeZone?: MaybeRefOrGetter<string | number | undefined>): ComputedRef<number | null> {
    // bumped on every check; the computed only notifies when the day it gives changes
    const checkedAt = shallowRef<number | null>(null);
    let stop: (() => void) | undefined;

    const refresh = () => {
        checkedAt.value = Date.now();
    };

    onMounted(() => {
        refresh();
        stop = CalendarFoundation.watchToday(refresh);
    });

    onBeforeUnmount(() => stop?.());

    return computed(() => (checkedAt.value === null ? null : startOfDay(toWallTime(getCurrDate(), toValue(timeZone))).getTime()));
}
