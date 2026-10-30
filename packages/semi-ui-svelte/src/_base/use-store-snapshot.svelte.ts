import { onMount } from 'svelte';

interface ExternalStore<T> {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => T;
}

/** Mirrors a foundation store the way React's useSyncExternalStore reads it. A component reads one store for its lifetime. */
export default function useStoreSnapshot<T>(store: ExternalStore<T>) {
    // raw: a snapshot is replaced on every change and never mutated, so no deep proxy
    let snapshot = $state.raw(store.getSnapshot());

    onMount(() => {
        const unsubscribe = store.subscribe(() => {
            snapshot = store.getSnapshot();
        });
        // Children may change the store while mounting, before this component subscribes
        snapshot = store.getSnapshot();
        return unsubscribe;
    });

    return () => snapshot;
}
