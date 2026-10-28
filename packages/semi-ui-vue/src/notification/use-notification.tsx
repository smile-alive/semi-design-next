/** @jsxImportSource vue */

import type { Component } from 'vue';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import type { NoticeType } from '@fibrae/semi-foundation/notification/notification-foundation';
import NotificationListStore from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { createHolder } from '../_base/holder';
import type { NotificationHookApi, NotificationHookOptions } from './interface';
import NotificationList from './notification-list.vue';

/**
 * Notifications rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is
 * placed. Each call owns one store; it registers no lifecycle hooks, and unmounting the Holder clears the timers.
 */
export default function useNotification(): [NotificationHookApi, Component] {
    const store = new NotificationListStore();

    // keep-interactive stops a modal layer from making the live region inert; display: contents keeps the fixed lists
    // out of a stacking context.
    const Holder = createHolder('NotificationHolder', () => (
        <div class={cssClasses.WRAPPER} style={{ display: 'contents' }} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <NotificationList store={store} />
        </div>
    ));

    const add = (config: NotificationHookOptions, type: NoticeType) => {
        const id = createId('semi_notice_');
        store.add({ ...config, type, id });
        return id;
    };

    return [
        {
            success: (config) => add(config, 'success'),
            info: (config) => add(config, 'info'),
            error: (config) => add(config, 'error'),
            warning: (config) => add(config, 'warning'),
            open: (config) => add(config, 'default'),
            close: (id) => store.remove(id),
        },
        Holder,
    ];
}
