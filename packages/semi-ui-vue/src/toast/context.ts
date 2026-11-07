import type { ComputedRef } from 'vue';
import type { ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { createContext } from '../_base/create-context';

export interface ToastListContext {
    /** The pointer or focus is inside the list: every toast's countdown waits */
    paused: boolean;
    updatedItems: readonly ToastInstance[];
    /** `read` runs when the text is written to the live region */
    announce: (key: string, read: () => string) => void;
}

export const [provideToastListContext, useToastListContext] = createContext<ComputedRef<ToastListContext>>('ToastList', { optional: true });
