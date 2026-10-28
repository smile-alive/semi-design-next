/** @jsxImportSource vue */

import type { Component } from 'vue';
import { cssClasses } from '@fibrae/semi-foundation/toast/constants';
import type { ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { createHolder } from '../_base/holder';
import type { ToastHookApi, ToastHookOptions } from './interface';
import ToastList from './toast-list.vue';

/**
 * Toasts rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is
 * placed. Each call owns one store; it registers no lifecycle hooks, and unmounting the Holder clears the timers.
 */
export default function useToast(): [ToastHookApi, Component] {
    const store = new ToastListStore();

    const Holder = createHolder('ToastHolder', () => (
        <div class={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    ));

    const add = (config: ToastHookOptions, type: ToastType) => {
        const id = createId('toast');
        store.setStack(config.stack);
        store.add({ ...config, type, id } as ToastInstance);
        return id;
    };

    return [
        {
            success: (config) => add(config, 'success'),
            info: (config) => add(config, 'info'),
            error: (config) => add(config, 'error'),
            warning: (config) => add(config, 'warning'),
            open: (config) => add(config, 'default'),
            close: (id) => store.remove(id),
        },
        Holder,
    ];
}
