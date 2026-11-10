import { type ReactElement, useState } from 'react';
import { createHookApi, type HookApi } from '@fibrae/semi-foundation/base/hook-api';
import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
import { createNotificationListStore } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';

/** A hook's notifications render where its holder is, so the layer options do not apply */
export type NotificationHookOptions = Omit<NotificationOptions, 'type' | 'id' | 'zIndex' | 'getPopupContainer'>;

export type NotificationHookApi = HookApi<NotificationHookOptions>;

function createNotificationHook(): [NotificationHookApi, ReactElement] {
    const store = createNotificationListStore();

    // keep-interactive: a modal layer must not make the live region inert; contents: no stacking context for the lists
    const contextHolder = (
        <div className={cssClasses.WRAPPER} style={{ display: 'contents' }} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <NotificationList store={store} />
        </div>
    );

    return [createHookApi<NotificationHookOptions>(store, { readGlobalDefaults: () => readGlobalDefaults('Notification') }), contextHolder];
}

export default function useNotification(): [NotificationHookApi, ReactElement] {
    // Created once with its store: the api must still reach earlier notices, and a stable api and holder let memo
    // components that receive them skip rendering
    const [hook] = useState(createNotificationHook);
    return hook;
}
