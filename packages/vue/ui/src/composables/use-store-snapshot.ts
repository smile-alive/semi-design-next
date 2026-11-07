import { type ShallowRef, onBeforeUnmount, onMounted, shallowRef } from 'vue';

interface ExternalStore<T> {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => T;
}

/** Mirrors a foundation store the way React's useSyncExternalStore reads it. A component reads one store for its lifetime. */
export default function useStoreSnapshot<T>(store: ExternalStore<T>): Readonly<ShallowRef<T>> {
    const snapshot = shallowRef(store.getSnapshot());
    let unsubscribe: (() => void) | undefined;

    onMounted(() => {
        unsubscribe = store.subscribe(() => {
            snapshot.value = store.getSnapshot();
        });
        // Children may change the store while mounting, before this component subscribes
        snapshot.value = store.getSnapshot();
    });

    onBeforeUnmount(() => unsubscribe?.());

    return snapshot;
}
