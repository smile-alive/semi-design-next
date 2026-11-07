import type { ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { createContext } from '../../base/create-context.js';

export interface ToastListContext {
    /** The pointer or focus is inside the list: every toast's countdown waits */
    readonly paused: boolean;
    readonly updatedItems: readonly ToastInstance[];
    readonly removedItems: readonly ToastInstance[];
    /** Queues text for the list's live region; `read` runs when it is written */
    announce: (key: string, read: () => string) => void;
}

export const [getToastListContext, setToastListContext] = createContext<ToastListContext>('ToastList', { optional: true });
