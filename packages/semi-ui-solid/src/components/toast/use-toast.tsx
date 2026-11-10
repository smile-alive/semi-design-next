import type { JSX } from 'solid-js';
import { createHookApi, type HookApi } from '@fibrae/semi-foundation/base/hook-api';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import { createToastListStore } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { ToastProps } from './toast';
import ToastList from './toast-list';

/** The id is generated, and a hook's toasts render where its holder is, so the layer options do not apply */
export type ToastHookOptions = Omit<ToastProps, 'type' | 'close' | 'id' | 'zIndex' | 'getPopupContainer'>;

export type ToastHookApi = HookApi<ToastHookOptions>;

/**
 * Toasts rendered by the returned holder. The holder is created here, under the caller's owner, so its toasts read the
 * caller's ConfigProvider, LocaleProvider and other context; place it once.
 */
export default function useToast(): [ToastHookApi, JSX.Element] {
    const store = createToastListStore();

    const contextHolder = (
        <div class={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    );

    return [createHookApi<ToastHookOptions>(store, { readGlobalDefaults: () => readGlobalDefaults('Toast') }), contextHolder];
}
