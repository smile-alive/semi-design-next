import { createEffect, createMemo, untrack } from 'solid-js';

/**
 * Calls `fn` with the new value and the one it replaces each time `source` changes (by `Object.is`, so `NaN` stays
 * unchanged), compared with the value it had when `useWatch` was called; `fn` runs untracked. This is how a component
 * mirrors a prop into state it initialized from that prop: a deferred `on` effect would instead compare with the value
 * at its first run and miss a change made before then, such as a parent's `onMount` setting a controlled value.
 */
export default function useWatch<T>(source: () => T, fn: (value: T, previous: T) => void) {
    const value = createMemo(source, undefined, { equals: Object.is });
    let seen = untrack(value);
    createEffect(() => {
        const next = value();
        if (!Object.is(next, seen)) {
            const previous = seen;
            seen = next;
            untrack(() => fn(next, previous));
        }
    });
}
