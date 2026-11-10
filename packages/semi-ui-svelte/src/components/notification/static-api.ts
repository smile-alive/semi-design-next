import { mount, unmount } from 'svelte';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import NotificationApi from '@fibrae/semi-foundation/components/notification/notification-api-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils/assert-client';
import semiGlobal from '../../utils/semi-global.js';
import type { NoticeProps } from './interface.js';
import NotificationList from './notification-list.svelte';
import useNotification from './use-notification.js';

const api = new NotificationApi<NoticeProps>({
    assertClient: () => assertClient('Notification', 'Notification.useNotification'),
    readGlobalDefaults: () => omitInstanceIds(semiGlobal.config.overrideDefaultProps?.Notification),
    // Detached: a static notification reads the global defaults and the default locale, never a caller's context.
    // The list subscribes once its mount effects run; a notice added before that is read from the snapshot.
    mount: (wrapper, store) => {
        const list = mount(NotificationList, { target: wrapper, props: { store } });
        return () => void unmount(list);
    },
});

export const Notification = Object.assign(api, { useNotification });
