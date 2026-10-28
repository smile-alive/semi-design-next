import type { FieldSnapshot } from './interface';

/** An instance owns its snapshot even while its field path changes or its effects are disconnected. */
export default class FieldStore {
    #snapshot: FieldSnapshot;
    #listeners = new Set<() => void>();

    constructor(snapshot: FieldSnapshot) {
        this.#snapshot = snapshot;
    }

    getSnapshot = () => this.#snapshot;

    subscribe = (listener: () => void) => {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    };

    update(snapshot: Partial<FieldSnapshot>) {
        if (Object.entries(snapshot).every(([key, value]) => Object.is(this.#snapshot[key as keyof FieldSnapshot], value))) {
            return false;
        }
        this.#snapshot = { ...this.#snapshot, ...snapshot };
        return true;
    }

    notify() {
        this.#listeners.forEach((listener) => listener());
    }
}
