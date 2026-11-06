import type { JSX } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/toast/constants';
import type { ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { ToastProps } from './toast';
import ToastList from './toast-list';

/** The id is generated, and a hook's toasts render where its holder is, so the layer options do not apply */
export type ToastHookOptions = Omit<ToastProps, 'type' | 'close' | 'id' | 'zIndex' | 'getPopupContainer'>;

export interface ToastHookApi {
    success: (config: ToastHookOptions) => string;
    info: (config: ToastHookOptions) => string;
    error: (config: ToastHookOptions) => string;
    warning: (config: ToastHookOptions) => string;
    open: (config: ToastHookOptions) => string;
    close: (id: string) => void;
}

/**
 * Toasts rendered by the returned holder. The holder is created here, under the caller's owner, so its toasts read the
 * caller's ConfigProvider, LocaleProvider and other context; place it once.
 */
export default function useToast(): [ToastHookApi, JSX.Element] {
    const store = new ToastListStore();

    const addToast = (config: ToastHookOptions, type: ToastType) => store.open({ ...config, type } as ToastInstance, readGlobalDefaults('Toast'));

    const contextHolder = (
        <div class={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    );

    return [
        {
            success: (config) => addToast(config, 'success'),
            info: (config) => addToast(config, 'info'),
            error: (config) => addToast(config, 'error'),
            warning: (config) => addToast(config, 'warning'),
            open: (config) => addToast(config, 'default'),
            close: (id) => store.remove(id),
        },
        contextHolder,
    ];
}
