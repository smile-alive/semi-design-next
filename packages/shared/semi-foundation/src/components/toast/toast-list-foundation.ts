import ListStore, { type ListStoreState } from '../../base/list-store';
import { builtInOpts } from './constants';
import type { ToastInstance } from './toast-foundation';

/** A toast of the list: `open` gives every toast an id */
export type ToastItem = ToastInstance & { id: string };

export type ToastListState = ListStoreState<ToastItem>;

export interface ToastListProps {
    store: ListStore<ToastInstance>;
}

/** Toasts of one list, shown at the end */
export function createToastListStore() {
    return new ListStore<ToastInstance>('end', 'toast', { ...builtInOpts });
}
