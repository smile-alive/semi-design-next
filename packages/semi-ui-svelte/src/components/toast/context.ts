import { createContext } from '../../base/index.js';
import type { NoticeListState } from '../../hooks/index.js';

export interface ToastListContext extends Readonly<NoticeListState> {
    /** Gives the list the toast element it reads when it announces the toast; returns the unregister */
    register: (id: string, element: Element) => () => void;
}

export const [getToastListContext, setToastListContext] = createContext<ToastListContext>('ToastList', { optional: true });
