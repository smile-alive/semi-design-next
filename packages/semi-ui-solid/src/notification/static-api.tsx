import NotificationApi from '@fibrae/semi-foundation/components/notification/notification-api-foundation';
import renderDetached, { assertClient } from '../_base/detached-render';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';
import useNotification from './use-notification';

const api = new NotificationApi<NotificationOptions>({
    assertClient,
    readGlobalDefaults: () => readGlobalDefaults('Notification'),
    // detached: static notifications read the global defaults and the default locale, never a caller's context
    mount: (wrapper, store) => renderDetached(() => <NotificationList store={store} />, wrapper),
});

export default Object.assign(api, { useNotification });
