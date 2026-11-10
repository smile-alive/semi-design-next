import type { NoticeInstance } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { createContext } from '../../base/index.js';
import type { NoticeListState } from '../../hooks/index.js';

export type ListedNotice = NoticeInstance & Required<Pick<NoticeInstance, 'id'>> & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'>;

/** Gives the list the notice element it reads when it announces the notice; returns the unregister */
export type RegisterNotice = (id: string, element: Element) => () => void;

/** `paused` covers the position's list only */
export interface NoticeListContext extends Readonly<NoticeListState> {
    register: RegisterNotice;
}

export const [getNoticeListContext, setNoticeListContext] = createContext<NoticeListContext>('NoticeList', { optional: true });
