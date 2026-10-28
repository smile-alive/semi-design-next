import type { Accessor } from 'solid-js';
import type { NotificationListState } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { createContext } from '../_base/create-context';

export interface NotificationListContextValue {
    /** The pointer or focus is on this notice's position list: its countdown waits */
    paused: Accessor<boolean>;
    /** The store snapshot: a notice stops counting once removed and starts over when updated in place */
    state: Accessor<NotificationListState>;
}

export const [NotificationListContext, useNotificationListContext] = createContext<NotificationListContextValue>('NotificationList', { optional: true });
