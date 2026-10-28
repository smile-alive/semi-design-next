import type { ComputedRef } from 'vue';
import type { NoticeInstance } from '@fibrae/semi-foundation/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { createContext } from '../_base/create-context';

/** A notice as the store holds it: `add` always has an id, and the offsets ride along from the options */
export type ListedNotice = NoticeInstance & Required<Pick<NoticeInstance, 'id'>> & Pick<ConfigProps, 'top' | 'bottom' | 'left' | 'right'>;

export interface NoticeListContext {
    /** The pointer or focus is inside the position's list: every notice's countdown waits */
    paused: boolean;
    /** The notices the latest store change updated in place */
    updatedItems: readonly NoticeInstance[];
    /** Queues text for the live region; `read` runs when it is written */
    announce: (key: string, read: () => string) => void;
}

export const [provideNoticeListContext, useNoticeListContext] = createContext<ComputedRef<NoticeListContext>>('NoticeList', { optional: true });
