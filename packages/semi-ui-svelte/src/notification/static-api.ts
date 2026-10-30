import { mount, unmount } from 'svelte';
import { omitBy } from 'es-toolkit';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only.js';
import semiGlobal from '../_utils/semi-global.js';
import type { NoticeProps } from './interface.js';
import NotificationList from './notification-list.svelte';
import useNotification from './use-notification.js';

const store = new NotificationListStore();
let wrapper: HTMLDivElement | null = null;
let list: ReturnType<typeof mount> | null = null;

function addNotice(notice: NoticeProps) {
    assertClient('Notification', 'Notification.useNotification');
    // an explicit undefined must not replace the defaults
    const merged: NoticeProps = { ...store.defaults, ...omitInstanceIds(semiGlobal.config.overrideDefaultProps?.Notification), ...omitBy(notice, (value) => value === undefined) };
    const id = merged.id ?? createId('notification');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = cssClasses.WRAPPER;
        wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        (merged.getPopupContainer?.() ?? document.body).appendChild(wrapper);
        // Detached: a static notification reads the global defaults and the default locale, never a caller's context.
        // The list subscribes once its mount effects run; a notice added before that is read from the snapshot.
        list = mount(NotificationList, { target: wrapper, props: { store } });
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
    if (!wrapper || !list) return;
    // unmount first: the store then has no listeners, so clearing it renders nothing
    void unmount(list);
    wrapper.remove();
    wrapper = null;
    list = null;
    store.clear();
}

export const Notification = {
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
};
