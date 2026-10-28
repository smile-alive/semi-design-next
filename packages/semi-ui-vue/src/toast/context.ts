import type { ComputedRef } from 'vue';
import type { ToastInstance } from '@fibrae/semi-foundation/toast/toast-foundation';
import { createContext } from '../_base/create-context';

export interface ToastListContext {
    /** The pointer or focus is inside the list: every toast's countdown waits */
    paused: boolean;
    /** The toasts the latest store change updated in place */
    updatedItems: readonly ToastInstance[];
    /** Queues text for the list's live region; `read` runs when it is written */
    announce: (key: string, read: () => string) => void;
}

export const [provideToastListContext, useToastListContext] = createContext<ComputedRef<ToastListContext>>('ToastList', { optional: true });
