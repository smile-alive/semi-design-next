// Semi marks the wrapper of each content prop with `x-semi-prop`, a non-standard attribute svelte/elements does not know
declare module 'svelte/elements' {
    interface HTMLAttributes<T> {
        'x-semi-prop'?: string;
    }
}

export {};
