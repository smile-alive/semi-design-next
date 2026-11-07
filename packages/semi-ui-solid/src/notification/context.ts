import type { Accessor } from 'solid-js';
import type { NotificationListState } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { createContext } from '../_base/create-context';

export interface NotificationListContextValue {
    paused: Accessor<boolean>;
    /** The store snapshot: a notice stops counting once removed and starts over when updated in place */
    state: Accessor<NotificationListState>;
}

export const [NotificationListContext, useNotificationListContext] = createContext<NotificationListContextValue>('NotificationList', { optional: true });
