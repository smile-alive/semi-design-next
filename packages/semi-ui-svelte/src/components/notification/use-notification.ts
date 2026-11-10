import { getAllContexts, getContext, mount, onDestroy, unmount } from 'svelte';
import { omitInstanceIds, createHookApi, StaticListWrapper } from '@fibrae/semi-foundation/base';
import { cssClasses } from '@fibrae/semi-foundation/components/notification/constants';
import { createNotificationListStore } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils';
import { semiGlobal, type SemiGlobal, semiGlobalKey } from '../../utils/index.js';
import type { NotificationHookApi, NotificationHookOptions } from './interface.js';
import NotificationList from './notification-list.svelte';

/**
 * Opens notifications that read the calling component's contexts (ConfigProvider, LocaleProvider), which the static
 * `Notification` cannot reach because it mounts its own root. Call it during component initialization. The list is
 * mounted into the body on the first notification and removed with the calling component.
 */
export default function useNotification(): NotificationHookApi {
    const context = getAllContexts();
    const semi = getContext<SemiGlobal | undefined>(semiGlobalKey) ?? semiGlobal;
    const store = createNotificationListStore();
    const wrapper = new StaticListWrapper(cssClasses.WRAPPER);

    onDestroy(() => wrapper.destroy());

    return createHookApi<NotificationHookOptions>(store, {
        readGlobalDefaults: () => omitInstanceIds(semi.config.overrideDefaultProps?.Notification),
        beforeAdd: () => {
            assertClient('The Notification.useNotification api', 'Notification.useNotification');
            wrapper.ensure(undefined, (target) => {
                // display: contents keeps the fixed lists out of a stacking context
                target.style.display = 'contents';
                const list = mount(NotificationList, { target, props: { store }, context });
                return () => void unmount(list);
            });
        },
    });
}
