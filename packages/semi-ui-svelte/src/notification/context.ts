import type { NoticeInstance } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { createContext } from '../_base/create-context.js';

export type ListedNotice = NoticeInstance & Required<Pick<NoticeInstance, 'id'>> & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'>;

export interface NoticeListContext {
    /** The pointer or focus is inside the position's list: every notice's countdown waits */
    readonly paused: boolean;
    readonly updatedItems: readonly NoticeInstance[];
    readonly removedItems: readonly NoticeInstance[];
    /** Queues text for the live region; `read` runs when it is written */
    announce: (key: string, read: () => string) => void;
}

export const [getNoticeListContext, setNoticeListContext] = createContext<NoticeListContext>('NoticeList', { optional: true });
