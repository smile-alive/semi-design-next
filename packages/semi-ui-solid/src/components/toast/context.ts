import type { Accessor } from 'solid-js';
import type { ToastListState } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { createContext } from '../../base/create-context';

export interface ToastListContextValue {
    paused: Accessor<boolean>;
    /** The store snapshot: a toast stops counting once removed and starts over when updated in place */
    state: Accessor<ToastListState>;
}

export const [ToastListContext, useToastListContext] = createContext<ToastListContextValue>('ToastList', { optional: true });
