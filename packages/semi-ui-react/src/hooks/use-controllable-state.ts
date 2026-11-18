import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface UseControllableStateOptions<T> {
    /** Controlled value; `undefined` leaves the hook uncontrolled */
    value?: T;
    /** Initial value while uncontrolled, read on mount only */
    defaultValue?: T;
    /** Called with every new value, controlled or not; not called when the value stays the same */
    onChange?: (value: T) => void;
}

/**
 * State that follows `value` when the parent passes one and keeps its own copy otherwise, like a Semi component's
 * `value` / `defaultValue` / `onChange`. `setValue` keeps one identity and accepts an updater.
 */
export default function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
    const [local, setLocal] = useState(defaultValue);
    const controlled = value !== undefined;
    const current = controlled ? value : local;

    // setValue reads the latest render, and updaters called twice in one handler see each other's result
    const latest = useRef({ current, controlled, onChange });
    useLayoutEffect(() => {
        latest.current = { current, controlled, onChange };
    });

    const setValue = useCallback((next: T | ((prev: T) => T)) => {
        const state = latest.current;
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(state.current) : next;
        if (Object.is(resolved, state.current)) {
            return;
        }
        state.current = resolved;
        if (!state.controlled) {
            setLocal(resolved);
        }
        state.onChange?.(resolved);
    }, []);

    return [current, setValue];
}
