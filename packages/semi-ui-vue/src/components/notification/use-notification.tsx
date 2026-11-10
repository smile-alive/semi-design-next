/** @jsxImportSource vue */

import type { Component } from 'vue';
import { omitInstanceIds, createHookApi } from '@fibrae/semi-foundation/base';
import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
import { createNotificationListStore } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils';
import { createHolder, useSemiGlobal } from '../../base/index';
import type { NotificationHookApi, NotificationHookOptions } from './interface';
import NotificationList from './notification-list.vue';

/**
 * Notifications rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is
 * placed. Each call owns one store; it registers no lifecycle hooks, and unmounting the Holder clears the timers.
 */
export default function useNotification(): [NotificationHookApi, Component] {
    const semi = useSemiGlobal();

    const store = createNotificationListStore();

    // keep-interactive stops a modal layer from making the live region inert; display: contents keeps the fixed lists
    // out of a stacking context.
    const Holder = createHolder('NotificationHolder', () => (
        <div class={cssClasses.WRAPPER} style={{ display: 'contents' }} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <NotificationList store={store} />
        </div>
    ));

    return [createHookApi<NotificationHookOptions>(store, { readGlobalDefaults: () => omitInstanceIds(semi.config.overrideDefaultProps?.Notification) }), Holder];
}
