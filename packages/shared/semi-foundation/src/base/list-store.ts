import { omitBy } from 'es-toolkit';
import { createId } from '../utils/uuid';
import FocusTrapHandle from './focus-handle';

// `stack: true` lays out up to this many items flat and stacks from the next one
const STACK_THRESHOLD = 3;
// a collapsed stack shows this many layers; the ones behind them are hidden
const STACK_VISIBLE_COUNT = 3;

export interface ListStoreItem {
    id?: string;
    type?: string;
    // true stacks once more than STACK_THRESHOLD items are shown; a number sets that threshold
    stack?: boolean | number;
}

export interface ListStoreState<T> {
    items: T[];
    removedItems: T[];
    // the items the latest change updated in place; any later change resets it
    updatedItems: T[];
    // ids of the shown and leaving items in display order, so a leaving item keeps its place
    order: string[];
    /** How many items show before the list stacks, as the latest `open` asked; 0 never stacks */
    stack: number;
}

/**
 * The items of one Toast or Notification list, read by the list through subscribe and getSnapshot
 * (useSyncExternalStore). Every change publishes a new state object, so a snapshot never changes after it is read.
 * `defaults` are the options of the static API that owns the list.
 */
export default class ListStore<I extends ListStoreItem> {
    #state: ListStoreState<I & { id: string }> = { items: [], removedItems: [], updatedItems: [], order: [], stack: 0 };
    #listeners = new Set<() => void>();
    #sameRunUpdates: (I & { id: string })[] = [];
    readonly #insertAt: 'start' | 'end';
    readonly #idPrefix: string;
    defaults: I;

    constructor(insertAt: 'start' | 'end', idPrefix: string, defaults: I) {
        this.#insertAt = insertAt;
        this.#idPrefix = idPrefix;
        this.defaults = defaults;
    }

    /**
     * The updates of the `open` calls in one synchronous run: a batching host renders only the last snapshot, which
     * would otherwise lose an update that a later `open` of another item reset.
     */
    #collectUpdates(updated: (I & { id: string })[]) {
        if (!updated.length) {
            return this.#sameRunUpdates;
        }
        if (!this.#sameRunUpdates.length) {
            queueMicrotask(() => {
                this.#sameRunUpdates = [];
            });
        }
        this.#sameRunUpdates = [...this.#sameRunUpdates.filter((kept) => !updated.some((item) => item.id === kept.id)), ...updated];
        return this.#sameRunUpdates;
    }

    /** Publishes a change; `updatedItems` is reset unless the change carries it */
    #set(state: Partial<ListStoreState<I & { id: string }>>) {
        this.#state = { ...this.#state, updatedItems: [], ...state };
        this.#listeners.forEach((listener) => listener());
    }

    subscribe = (listener: () => void) => {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    };

    getSnapshot = () => this.#state;

    /**
     * Shows an item with `opts` over the list's defaults and the global defaults, which is where the global defaults
     * take effect: an explicit undefined replaces nothing. The item goes to the `insertAt` end, or updates the shown one
     * with the same id in place. `beforeShow` gets the merged options before the item is added, so a static API can
     * place its wrapper by them. Returns the id.
     */
    open = (opts: I, globalDefaults: Partial<I>, beforeShow?: (merged: I) => void) => {
        const merged: I = { ...this.defaults, ...globalDefaults, ...omitBy(opts, (value) => value === undefined) };
        const id = merged.id ?? createId(this.#idPrefix);
        beforeShow?.(merged);
        const item = { ...merged, id };
        const option = merged.stack;
        const stack = option === true ? STACK_THRESHOLD : typeof option === 'number' ? Math.max(option, 0) : 0;
        const { items, removedItems, order } = this.#state;
        if (items.some((shown) => shown.id === id)) {
            const updated = items.map((shown) => (shown.id === id ? { ...shown, ...item } : shown));
            this.#set({ items: updated, stack, updatedItems: this.#collectUpdates(updated.filter((shown) => shown.id === id)) });
        } else {
            const others = order.filter((orderId) => orderId !== id);
            const atStart = this.#insertAt === 'start';
            // shown again while leaving: it is still mounted with a stale or no countdown, so it counts as updated and
            // restarts its duration
            this.#set({
                items: atStart ? [item, ...items] : [...items, item],
                stack,
                updatedItems: this.#collectUpdates(removedItems.some((removed) => removed.id === id) ? [item] : []),
                removedItems: removedItems.filter((removed) => removed.id !== id),
                order: atStart ? [id, ...others] : [...others, id],
            });
        }
        return id;
    };

    remove = (id: string) => {
        const { items, removedItems, order } = this.#state;
        const removed = items.filter((item) => item.id === id);
        if (removed.length) {
            // with nothing rendering the list there is no leave animation to wait for; a leaving item keeps its place
            this.#set({
                items: items.filter((item) => item.id !== id),
                ...(this.#listeners.size ? { removedItems: [...removedItems, ...removed] } : { order: order.filter((orderId) => orderId !== id) }),
            });
        }
    };

    finishLeave = (id: string) => {
        const { removedItems, updatedItems, order } = this.#state;
        if (removedItems.some((item) => item.id === id)) {
            this.#set({
                removedItems: removedItems.filter((item) => item.id !== id),
                order: order.filter((orderId) => orderId !== id),
                updatedItems,
            });
        }
    };

    clear = () => {
        this.#set({ items: [], removedItems: [], order: [] });
    };
}

/** Whether the stack shows every item flat: no stacking, opened by hover or focus, or no more items than the threshold */
export function isStackExpanded(stack: number, opened: boolean, shownCount: number) {
    return stack === 0 || opened || shownCount <= stack;
}

/** Whether a collapsed stack hides the item that `depth` shown items are newer than */
export function isStackHidden(expanded: boolean, depth: number) {
    return !expanded && depth >= STACK_VISIBLE_COUNT;
}

/**
 * How many shown items are newer than each item, keyed by id; `ids` run newest first. Leaving items are not counted,
 * or the ones behind them would sink and spring back when they go.
 */
export function getStackDepths(ids: readonly string[], shown: ReadonlySet<string>) {
    const depths = new Map<string, number>();
    let newer = 0;
    for (const id of ids) {
        depths.set(id, newer);
        if (shown.has(id)) {
            newer++;
        }
    }
    return depths;
}

/** The focus was inside `list` but its item unmounted, which fires no reliable blur and would keep the list paused */
export function hasLostFocus(focusInside: boolean, list?: Element | null) {
    return focusInside && !list?.contains(FocusTrapHandle.getActiveElement(list));
}

/**
 * Whether a Toast or Notification of this type is an alert, which its own `role="alert"` announces; the list's
 * announcer skips it so it is not read twice.
 */
export function isAlertType(type?: string) {
    return type === 'warning' || type === 'error';
}

/** What an item announces: its title and content (`.${prefixCls}-title`, `.${prefixCls}-content`), without the icon and close button */
export function readNoticeText(item: Element | null | undefined, prefixCls: string) {
    return Array.from(item?.querySelectorAll(`.${prefixCls}-title, .${prefixCls}-content`) ?? [], (node) => node.textContent)
        .filter(Boolean)
        .join(' ');
}

/** Picks what a list announces: the items new since the previous call or updated in place, alerts excepted */
export class FreshItems {
    #shownIds = new Set<string>();

    pick<T extends { id: string; type?: string }>(items: readonly T[], updatedItems: readonly { id?: string }[]) {
        const fresh = items.filter((item) => (!this.#shownIds.has(item.id) || updatedItems.some((updated) => updated.id === item.id)) && !isAlertType(item.type));
        this.#shownIds = new Set(items.map((item) => item.id));
        return fresh;
    }
}
