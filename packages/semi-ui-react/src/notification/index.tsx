import { omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertBrowser, render as reactRender, unmount as reactUnmount } from '../_utils/react-render';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { NoticeReactProps, NotificationOptions } from './notice';
import NotificationList from './notification-list';
import useNotification from './use-notification';

export type { NoticeReactProps } from './notice';
export type { NotificationHookOptions } from './use-notification';
export type { NoticesInPosition } from './notification-list';
export type { NoticeState } from '@fibrae/semi-foundation/notification/notification-foundation';
export type { ConfigProps, NotificationListProps, NotificationListState } from '@fibrae/semi-foundation/notification/notification-list-foundation';

const store = new NotificationListStore();
let wrapper: HTMLDivElement | null = null;

function addNotice(notice: NotificationOptions) {
    assertBrowser('Notification', 'Notification.useNotification()');
    // an explicit undefined must not replace the defaults
    const merged: NoticeReactProps = { ...store.defaults, ...readGlobalDefaults('Notification'), ...omitBy(notice, (value) => value === undefined) };
    const id = merged.id ?? createId('notification');
    // createRoot renders asynchronously; the list reads notices added before it mounts from the store
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = cssClasses.WRAPPER;
        wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        (merged.getPopupContainer?.() ?? document.body).appendChild(wrapper);
        reactRender(<NotificationList store={store} />, wrapper);
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
    if (wrapper) {
        store.clear();
        reactUnmount(wrapper);
        wrapper.remove();
        wrapper = null;
    }
}

// not a component: a second list rendering `store` would show every notice twice
export default {
    addNotice,
    removeNotice,
    open: (opts: NotificationOptions) => addNotice({ ...opts, type: 'default' }),
    info: (opts: NotificationOptions) => addNotice({ ...opts, type: 'info' }),
    success: (opts: NotificationOptions) => addNotice({ ...opts, type: 'success' }),
    warning: (opts: NotificationOptions) => addNotice({ ...opts, type: 'warning' }),
    error: (opts: NotificationOptions) => addNotice({ ...opts, type: 'error' }),
    close: removeNotice,
    destroyAll,
    config: (opts: ConfigProps) => store.config(opts),
    resetConfig: () => store.resetConfig(),
    useNotification,
};
