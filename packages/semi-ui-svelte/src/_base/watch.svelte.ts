import { untrack } from 'svelte';

/** Runs `callback` after the DOM shows each change of `get()`, never on mount */
export default function watch<T>(get: () => T, callback: (value: T) => void) {
    let mounted = false;
    $effect(() => {
        const value = get();
        if (!mounted) {
            mounted = true;
            return;
        }
        untrack(() => callback(value));
    });
}
