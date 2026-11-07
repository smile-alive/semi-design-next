import type { JSX } from 'solid-js';
import type { NoticeInstance, NoticeType } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import NotificationListStore from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { NotificationOptions } from './notice';
import NotificationList from './notification-list';

/** The id is generated, and a hook's notifications render where its holder is, so the layer options do not apply */
export type NotificationHookOptions = Omit<NotificationOptions, 'type' | 'id' | 'zIndex' | 'getPopupContainer'>;

export interface NotificationHookApi {
    success: (config: NotificationHookOptions) => string;
    info: (config: NotificationHookOptions) => string;
    error: (config: NotificationHookOptions) => string;
    warning: (config: NotificationHookOptions) => string;
    open: (config: NotificationHookOptions) => string;
    close: (id: string) => void;
}

/**
 * Notifications rendered by the returned holder. The holder is created here, under the caller's owner, so its
 * notifications read the caller's ConfigProvider, LocaleProvider and other context; place it once.
 */
export default function useNotification(): [NotificationHookApi, JSX.Element] {
    const store = new NotificationListStore();

    const addNotice = (config: NotificationHookOptions, type: NoticeType) => store.open({ ...config, type } as NoticeInstance, readGlobalDefaults('Notification'));

    // keep-interactive: a modal layer must not make the live region inert; contents: no stacking context for the lists
    const contextHolder = (
        <div style={{ display: 'contents' }} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <NotificationList store={store} />
        </div>
    );

    return [
        {
            success: (config) => addNotice(config, 'success'),
            info: (config) => addNotice(config, 'info'),
            error: (config) => addNotice(config, 'error'),
            warning: (config) => addNotice(config, 'warning'),
            open: (config) => addNotice(config, 'default'),
            close: (id) => store.remove(id),
        },
        contextHolder,
    ];
}
