/** @jsxImportSource vue */

import type { Component } from 'vue';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { createHookApi } from '@fibrae/semi-foundation/base/hook-api';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { createToastListStore } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createHolder } from '../../base/holder';
import { useSemiGlobal } from '../../base/semi-default';
import type { ToastHookApi, ToastHookOptions } from './interface';
import ToastList from './toast-list.vue';

/**
 * Toasts rendered by the returned Holder, so they inherit the provides, ConfigProvider and locale where it is
 * placed. Each call owns one store; it registers no lifecycle hooks, and unmounting the Holder clears the timers.
 */
export default function useToast(): [ToastHookApi, Component] {
    const semi = useSemiGlobal();

    const store = createToastListStore();

    const Holder = createHolder('ToastHolder', () => (
        <div class={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    ));

    return [createHookApi<ToastHookOptions>(store, { readGlobalDefaults: () => omitInstanceIds(semi.config.overrideDefaultProps?.Toast) as Partial<ToastInstance> }), Holder];
}
