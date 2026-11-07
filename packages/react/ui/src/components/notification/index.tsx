import NotificationApi from '@fibrae/semi-foundation/components/notification/notification-api-foundation';
import { assertBrowser, render as reactRender, unmount as reactUnmount } from '../../utils/react-render';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';
import useNotification from './use-notification';

export type { NoticeReactProps } from './notice';
export type { NotificationHookOptions } from './use-notification';
export type { NoticeState } from '@fibrae/semi-foundation/components/notification/notification-foundation';
export type { ConfigProps, NoticesInPosition, NotificationListProps, NotificationListState } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';

const api = new NotificationApi<NotificationOptions>({
    assertClient: () => assertBrowser('Notification', 'Notification.useNotification()'),
    readGlobalDefaults: () => readGlobalDefaults('Notification'),
    // createRoot renders asynchronously; the list reads notices added before it mounts from the store
    mount: (wrapper, store) => {
        reactRender(<NotificationList store={store} />, wrapper);
        return () => reactUnmount(wrapper);
    },
});

export default Object.assign(api, { useNotification });
