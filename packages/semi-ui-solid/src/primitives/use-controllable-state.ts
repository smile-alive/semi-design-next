import { type Accessor, createSignal, untrack } from 'solid-js';

export interface UseControllableStateOptions<T> {
    /** Controlled value; `undefined` leaves the hook uncontrolled */
    value: Accessor<T | undefined>;
    /** Initial value while uncontrolled, read on creation only */
    defaultValue?: T;
    /** Called with every new value, controlled or not; not called when the value stays the same. Read on each call */
    onChange?: (value: T) => void;
}

/**
 * State that follows `value()` when the parent passes one and keeps its own copy otherwise, like a Semi component's
 * `value` / `defaultValue` / `onChange`. `setValue` accepts an updater; updaters called twice in one event see each
 * other's result, even while controlled.
 */
export default function useControllableState<T>(options: UseControllableStateOptions<T>): [Accessor<T>, (next: T | ((prev: T) => T)) => void] {
    // without a defaultValue the uncontrolled value starts undefined, as in React
    const [local, setLocal] = createSignal(untrack(() => options.defaultValue) as T);
    const controlled = () => options.value() !== undefined;
    const current = (): T => {
        const value = options.value();
        return value === undefined ? local() : value;
    };

    // A controlled parent may apply onChange later than the next updater in the same event
    let pending: { from: T; to: T } | undefined;
    const latest = () => {
        const value = current();
        return pending && Object.is(pending.from, value) ? pending.to : value;
    };

    const setValue = (next: T | ((prev: T) => T)) => {
        const prev = untrack(latest);
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        if (Object.is(resolved, prev)) {
            return;
        }
        if (untrack(controlled)) {
            pending = { from: untrack(current), to: resolved };
            queueMicrotask(() => (pending = undefined));
        } else {
            setLocal(() => resolved);
        }
        options.onChange?.(resolved);
    };

    return [current, setValue];
}
