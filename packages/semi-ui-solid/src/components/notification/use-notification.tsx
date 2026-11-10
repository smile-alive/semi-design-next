import type { JSX } from 'solid-js';
import { createHookApi, type HookApi } from '@fibrae/semi-foundation/base/hook-api';
import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
import { createNotificationListStore } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';

/** The id is generated, and a hook's notifications render where its holder is, so the layer options do not apply */
export type NotificationHookOptions = Omit<NotificationOptions, 'type' | 'id' | 'zIndex' | 'getPopupContainer'>;

export type NotificationHookApi = HookApi<NotificationHookOptions>;

/**
 * Notifications rendered by the returned holder. The holder is created here, under the caller's owner, so its
 * notifications read the caller's ConfigProvider, LocaleProvider and other context; place it once.
 */
export default function useNotification(): [NotificationHookApi, JSX.Element] {
    const store = createNotificationListStore();

    // keep-interactive: a modal layer must not make the live region inert; contents: no stacking context for the lists
    const contextHolder = (
        <div class={cssClasses.WRAPPER} style={{ display: 'contents' }} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <NotificationList store={store} />
        </div>
    );

    return [createHookApi<NotificationHookOptions>(store, { readGlobalDefaults: () => readGlobalDefaults('Notification') }), contextHolder];
}
