import { useLayoutEffect, useRef } from 'react';

/**
 * Calls `onChange(value, previous)` after a commit in which `value` differs (`isEqual`, Object.is by default) from
 * the last committed value: the `componentDidUpdate` prevProps comparison, run in the same layout phase. Never on
 * mount, and StrictMode's extra effect pass does not fire it because the value has not changed.
 */
export default function useDidUpdate<T>(value: T, onChange: (value: T, previous: T) => void, isEqual: (a: T, b: T) => boolean = Object.is) {
    const committed = useRef(value);
    useLayoutEffect(() => {
        const previous = committed.current;
        if (!isEqual(previous, value)) {
            committed.current = value;
            onChange(value, previous);
        }
    });
}
