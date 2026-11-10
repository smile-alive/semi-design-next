/** @jsxImportSource vue */
// JSX because the imperative API mounts a NotificationList vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import NotificationApi from '@fibrae/semi-foundation/components/notification/notification-api-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils/assert-client';
import { getInstalledApp, rootAppContext, setInstalledApp } from '../../base/installed-app';
import { useSemiGlobal } from '../../base/semi-default';
import semiGlobal from '../../utils/semi-global';
import type { NoticeProps } from './interface';
import NotificationList from './notification-list.vue';
import useNotification from './use-notification';

export type * from './interface';

// runWithContext lets inject read app.provide(semiGlobalKey, ...) outside a component.
function getGlobalDefaults(): Partial<NoticeProps> {
    const installedApp = getInstalledApp();
    const semi = installedApp ? installedApp.runWithContext(useSemiGlobal) : semiGlobal;
    return omitInstanceIds(semi.config.overrideDefaultProps?.Notification);
}

const api = new NotificationApi<NoticeProps>({
    assertClient: () => assertClient('Notification', 'Notification.useNotification'),
    readGlobalDefaults: getGlobalDefaults,
    // render() mounts synchronously, so the list subscribes before the first notice is added.
    mount: (wrapper, store) => {
        const vnode = <NotificationList store={store} />;
        vnode.appContext = rootAppContext();
        render(vnode, wrapper);
        return () => render(null, wrapper);
    },
});

export default Object.assign(api, {
    useNotification,
    /** Optional: static notifications (and the other static APIs) then render with this app's context. */
    install(app: App) {
        setInstalledApp(app);
    },
});
