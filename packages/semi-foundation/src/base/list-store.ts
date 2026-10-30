/** The part of a Toast or Notification list's state the kernel maintains */
export interface ListStoreState<T> {
    removedItems: T[];
    // the items the latest change updated in place; any later change resets it
    updatedItems: T[];
    // ids of the shown and leaving items in display order, so a leaving item keeps its place
    order: string[];
}

/**
 * The items of one Toast or Notification list, read by the list through subscribe and getSnapshot
 * (useSyncExternalStore). Every change publishes a new state object, so a snapshot never changes after it is read.
 * `key` names the field of the shown items: each store's state type exposes it under its own public name.
 */
export default class ListStore<T extends { id?: string }, K extends string, S extends ListStoreState<T> & Record<K, T[]>> {
    #state: S;
    #listeners = new Set<() => void>();
    readonly #key: K;
    readonly #insertAt: 'start' | 'end';

    constructor(key: K, insertAt: 'start' | 'end', initialState: S) {
        this.#key = key;
        this.#insertAt = insertAt;
        this.#state = initialState;
    }

    #withItems(items: T[], state: Partial<S>): Partial<S> {
        return { ...state, [this.#key]: items };
    }

    subscribe = (listener: () => void) => {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    };

    getSnapshot = () => this.#state;

    /** Publishes a change; `updatedItems` is reset unless the change carries it */
    set(state: Partial<S>) {
        this.#state = { ...this.#state, updatedItems: [], ...state };
        this.#listeners.forEach((listener) => listener());
    }

    /** Shows an item at the `insertAt` end, or updates the shown one with the same id in place */
    add(item: T) {
        const { removedItems, order } = this.#state;
        const items: T[] = this.#state[this.#key];
        if (items.some((shown) => shown.id === item.id)) {
            const updated = items.map((shown) => (shown.id === item.id ? { ...shown, ...item } : shown));
            this.set(this.#withItems(updated, { updatedItems: updated.filter((shown) => shown.id === item.id) } as Partial<S>));
        } else {
            const others = order.filter((id) => id !== item.id);
            const atStart = this.#insertAt === 'start';
            // shown again while leaving: it is still mounted with a stale or no countdown, so it counts as updated and
            // restarts its duration
            this.set(
                this.#withItems(atStart ? [item, ...items] : [...items, item], {
                    updatedItems: removedItems.some((removed) => removed.id === item.id) ? [item] : [],
                    removedItems: removedItems.filter((removed) => removed.id !== item.id),
                    order: atStart ? [item.id, ...others] : [...others, item.id],
                } as Partial<S>)
            );
        }
    }

    remove(id: string) {
        const { removedItems, order } = this.#state;
        const items: T[] = this.#state[this.#key];
        const removed = items.filter((item) => item.id === id);
        if (removed.length) {
            // with nothing rendering the list there is no leave animation to wait for; a leaving item keeps its place
            this.set(
                this.#withItems(
                    items.filter((item) => item.id !== id),
                    (this.#listeners.size ? { removedItems: [...removedItems, ...removed] } : { order: order.filter((orderId) => orderId !== id) }) as Partial<S>
                )
            );
        }
    }

    finishLeave(id: string) {
        const { removedItems, updatedItems, order } = this.#state;
        if (removedItems.some((item) => item.id === id)) {
            this.set({
                removedItems: removedItems.filter((item) => item.id !== id),
                order: order.filter((orderId) => orderId !== id),
                updatedItems,
            } as Partial<S>);
        }
    }

    clear() {
        this.set(this.#withItems([], { removedItems: [], order: [] } as Partial<S>));
    }
}
