import { createContext } from '../../base/create-context.js';
import type { NoticeListState } from '../../hooks/use-notice-close.js';

export interface ToastListContext extends Readonly<NoticeListState> {
    /** Gives the list the toast element it reads when it announces the toast; returns the unregister */
    register: (id: string, element: Element) => () => void;
}

export const [getToastListContext, setToastListContext] = createContext<ToastListContext>('ToastList', { optional: true });
