import type { Ref } from 'react';

type Cleanup = () => void;

function assignRef<T>(ref: Ref<T> | null | undefined, value: T | null): Cleanup | void {
    if (typeof ref === 'function') {
        return ref(value);
    }
    if (ref) {
        ref.current = value;
    }
}

/**
 * Merges refs into one callback ref with React 19 semantics: a function ref's cleanup runs on release; without one,
 * the ref is called with null instead, and an object ref is set to null.
 */
export function mergeRefs<T>(refs: (Ref<T> | null | undefined)[]): (value: T | null) => Cleanup {
    return (value) => {
        const cleanups = refs.map((ref) => {
            const cleanup = assignRef(ref, value);
            return typeof cleanup === 'function' ? cleanup : () => void assignRef(ref, null);
        });
        return () => {
            for (const cleanup of cleanups) {
                cleanup();
            }
        };
    };
}
