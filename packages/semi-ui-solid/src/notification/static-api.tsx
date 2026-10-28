import { omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/notification/constants';
import type { NoticeInstance } from '@fibrae/semi-foundation/notification/notification-foundation';
import NotificationListStore, { type ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import renderDetached, { assertClient } from '../_base/detached-render';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { NoticeProps, NotificationOptions } from './notice';
import NotificationList from './notification-list';
import useNotification from './use-notification';

const store = new NotificationListStore();
let wrapper: HTMLDivElement | null = null;
let dispose: () => void = noop;

function addNotice(notice: NotificationOptions) {
    assertClient();
    // an explicit undefined must not replace the defaults
    const merged: NoticeProps = { ...store.defaults, ...readGlobalDefaults('Notification'), ...omitBy(notice, (value) => value === undefined) };
    const id = merged.id ?? createId('notification');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = cssClasses.WRAPPER;
        wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        (merged.getPopupContainer?.() ?? document.body).appendChild(wrapper);
        // detached: static notifications read the global defaults and the default locale, never a caller's context
        dispose = renderDetached(() => <NotificationList store={store} />, wrapper);
    }
    wrapper.style.zIndex = String(typeof merged.zIndex === 'number' ? merged.zIndex : store.defaults.zIndex);
    store.add({ ...merged, id } as NoticeInstance);
    return id;
}

function removeNotice(id: string) {
    store.remove(id);
    return id;
}

function destroyAll() {
    if (wrapper) {
        store.clear();
        dispose();
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
