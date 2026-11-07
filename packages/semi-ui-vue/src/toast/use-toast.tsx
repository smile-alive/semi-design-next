/** @jsxImportSource vue */

import type { Component } from 'vue';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastInstance, ToastType } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createHolder } from '../_base/holder';
import { useSemiGlobal } from '../_base/semi-default';
import type { ToastHookApi, ToastHookOptions } from './interface';
import ToastList from './toast-list.vue';

/**
 * Toasts rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is
 * placed. Each call owns one store; it registers no lifecycle hooks, and unmounting the Holder clears the timers.
 */
export default function useToast(): [ToastHookApi, Component] {
    const semi = useSemiGlobal();

    const store = new ToastListStore();

    const Holder = createHolder('ToastHolder', () => (
        <div class={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    ));

    const add = (config: ToastHookOptions, type: ToastType) => store.open({ ...config, type } as ToastInstance, omitInstanceIds(semi.config.overrideDefaultProps?.Toast) as Partial<ToastInstance>);

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
