import NotificationApi from '@fibrae/semi-foundation/components/notification/notification-api-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils';
import { renderDetached } from '../../base/index';
import { readGlobalDefaults } from '../../utils/index';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';
import useNotification from './use-notification';

const api = new NotificationApi<NotificationOptions>({
    assertClient: () => assertClient('Notification', 'Notification.useNotification'),
    readGlobalDefaults: () => readGlobalDefaults('Notification'),
    // detached: static notifications read the global defaults and the default locale, never a caller's context
    mount: (wrapper, store) => renderDetached(() => <NotificationList store={store} />, wrapper),
});

export default Object.assign(api, { useNotification });
