import { getAllContexts, mount, onDestroy, unmount } from 'svelte';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import type { NoticeType } from '@fibrae/semi-foundation/notification/notification-foundation';
import NotificationListStore from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only.js';
import type { NotificationHookApi, NotificationHookOptions } from './interface.js';
import NotificationList from './notification-list.svelte';

/**
 * Opens notifications that read the calling component's contexts (ConfigProvider, LocaleProvider), which the static
 * `Notification` cannot reach because it mounts its own root. Call it during component initialization. The list is
 * mounted into the body on the first notification and removed with the calling component.
 */
export default function useNotification(): NotificationHookApi {
    const context = getAllContexts();
    const store = new NotificationListStore();
    let wrapper: HTMLDivElement | null = null;
    let list: ReturnType<typeof mount> | null = null;

    onDestroy(() => {
        if (!list) return;
        void unmount(list);
        wrapper?.remove();
        wrapper = list = null;
    });

    const add = (config: NotificationHookOptions, type: NoticeType) => {
        assertClient('The Notification.useNotification api', 'Notification.useNotification');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = cssClasses.WRAPPER;
            // keep-interactive stops a modal layer from making the live region inert; display: contents keeps the fixed lists out of a stacking context
            wrapper.style.display = 'contents';
            wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
            document.body.appendChild(wrapper);
            list = mount(NotificationList, { target: wrapper, props: { store }, context });
        }
        const id = createId('semi_notice_');
        store.add({ ...config, type, id });
        return id;
    };

    return {
        success: (config) => add(config, 'success'),
        info: (config) => add(config, 'info'),
        error: (config) => add(config, 'error'),
        warning: (config) => add(config, 'warning'),
        open: (config) => add(config, 'default'),
        close: (id) => store.remove(id),
    };
}
