import type { Accessor } from 'solid-js';
import type { ToastListState } from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { createContext } from '../_base/create-context';

export interface ToastListContextValue {
    /** The pointer or focus is inside the list: every toast's countdown waits */
    paused: Accessor<boolean>;
    /** The store snapshot: a toast stops counting once removed and starts over when updated in place */
    state: Accessor<ToastListState>;
}

export const [ToastListContext, useToastListContext] = createContext<ToastListContextValue>('ToastList', { optional: true });
