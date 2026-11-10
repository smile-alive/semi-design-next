import { type ReactElement, useState } from 'react';
import { createHookApi, type HookApi } from '@fibrae/semi-foundation/base/hook-api';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import { createToastListStore } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { ToastOptions } from './index';
import ToastList from './toast-list';

/** The id is generated, and a hook's toasts render where its holder is, so the layer options do not apply */
type ToastHookOptions = Omit<ToastOptions, 'id' | 'zIndex' | 'getPopupContainer'>;

export type ToastHookApi = HookApi<ToastHookOptions>;

function createToastHook(): [ToastHookApi, ReactElement] {
    const store = createToastListStore();

    const contextHolder = (
        <div className={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    );

    return [createHookApi<ToastHookOptions>(store, { readGlobalDefaults: () => readGlobalDefaults('Toast') }), contextHolder];
}

export default function useToast(): [ToastHookApi, ReactElement] {
    const [hook] = useState(createToastHook);
    return hook;
}
