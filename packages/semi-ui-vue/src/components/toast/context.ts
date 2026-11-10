import type { ComputedRef } from 'vue';
import type { AutoCloseListState } from '@fibrae/semi-foundation/base/auto-close-foundation';
import { createContext } from '../../base/create-context';

export interface ToastListContext {
    /** What every toast's countdown follows */
    state: ComputedRef<AutoCloseListState>;
    /** Gives the list the toast element it reads when it announces the toast; returns the unregister */
    register: (id: string, element: Element) => () => void;
}

export const [provideToastListContext, useToastListContext] = createContext<ToastListContext>('ToastList', { optional: true });
