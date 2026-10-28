/** @jsxImportSource vue */
// JSX because the imperative API mounts a NotificationList vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { omitBy } from 'es-toolkit';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only';
import { getInstalledApp, rootAppContext, setInstalledApp } from '../_base/installed-app';
import { useSemiGlobal } from '../_base/semi-default';
import semiGlobal from '../_utils/semi-global';
import type { NoticeProps } from './interface';
import NotificationList from './notification-list.vue';
import useNotification from './use-notification';

export type * from './interface';

const store = new NotificationListStore();
let wrapper: HTMLDivElement | null = null;

// runWithContext lets inject read app.provide(semiGlobalKey, ...) outside a component.
function getGlobalDefaults(): Partial<NoticeProps> {
    const installedApp = getInstalledApp();
    const semi = installedApp ? installedApp.runWithContext(useSemiGlobal) : semiGlobal;
    return omitInstanceIds(semi.config.overrideDefaultProps?.Notification);
}

function addNotice(notice: NoticeProps) {
    assertClient('Notification', 'Notification.useNotification');
    // an explicit undefined must not replace the defaults
    const merged: NoticeProps = { ...store.defaults, ...getGlobalDefaults(), ...omitBy(notice, (value) => value === undefined) };
    const id = merged.id ?? createId('notification');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = cssClasses.WRAPPER;
        wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        (merged.getPopupContainer?.() ?? document.body).appendChild(wrapper);
        // A factory outside any tree: the app context supplies app-level provides and global components.
        const vnode = <NotificationList store={store} />;
        vnode.appContext = rootAppContext();
        // render() mounts synchronously, so the list subscribes before the first notice is added.
        render(vnode, wrapper);
    }
    wrapper.style.zIndex = String(typeof merged.zIndex === 'number' ? merged.zIndex : store.defaults.zIndex);
    store.add({ ...merged, id });
    return id;
}

function removeNotice(id: string) {
    store.remove(id);
    return id;
}

function destroyAll() {
    if (!wrapper) return;
    // Unmounting first leaves the store without listeners, so clearing it renders nothing.
    render(null, wrapper);
    wrapper.remove();
    wrapper = null;
    store.clear();
}

export default {
    addNotice,
    removeNotice,
    open: (opts: NoticeProps) => addNotice({ ...opts, type: 'default' }),
    info: (opts: NoticeProps) => addNotice({ ...opts, type: 'info' }),
    success: (opts: NoticeProps) => addNotice({ ...opts, type: 'success' }),
    warning: (opts: NoticeProps) => addNotice({ ...opts, type: 'warning' }),
    error: (opts: NoticeProps) => addNotice({ ...opts, type: 'error' }),
    close: removeNotice,
    destroyAll,
    config: (opts: ConfigProps) => store.config(opts),
    resetConfig: () => store.resetConfig(),
    useNotification,
    /** Optional: static notifications (and the other static APIs) then render with this app's context. */
    install(app: App) {
        setInstalledApp(app);
    },
};
