import { getAllContexts, mount, onDestroy, unmount } from 'svelte';
import { cssClasses } from '@fibrae/semi-foundation/toast/constants';
import type { ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only.js';
import type { ToastHookApi, ToastHookOptions } from './interface.js';
import ToastList from './toast-list.svelte';

/**
 * Opens toasts that read the calling component's contexts (ConfigProvider, LocaleProvider), which the static `Toast`
 * cannot reach because it mounts its own root. Call it during component initialization. The list is mounted into the
 * body on the first toast and removed with the calling component.
 */
export default function useToast(): ToastHookApi {
    const context = getAllContexts();
    const store = new ToastListStore();
    let wrapper: HTMLDivElement | null = null;
    let list: ReturnType<typeof mount> | null = null;

    onDestroy(() => {
        if (!list) return;
        void unmount(list);
        wrapper?.remove();
        wrapper = list = null;
    });

    return createToastHookApi(store, () => {
        assertClient('The Toast.useToast api', 'Toast.useToast');
        if (wrapper) return;
        wrapper = document.createElement('div');
        wrapper.className = cssClasses.WRAPPER;
        wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
        document.body.appendChild(wrapper);
        list = mount(ToastList, { target: wrapper, props: { store }, context });
    });
}

/**
 * The hook's api over a store whose `ToastList` the caller renders, for a Semi component that keeps its toasts inside
 * itself (AI Chat). Internal: reachable through the `./*` export but not documented, so its shape may change.
 */
export function createToastHookApi(store: ToastListStore, beforeAdd?: () => void): ToastHookApi {
    const add = (config: ToastHookOptions, type: ToastType) => {
        beforeAdd?.();
        const id = createId('toast');
        store.setStack(config.stack);
        // the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
        store.add({ ...config, type, id } as ToastInstance);
        return id;
    };

    return {
        success: (config) => add(config, 'success'),
        info: (config) => add(config, 'info'),
        error: (config) => add(config, 'error'),
        warning: (config) => add(config, 'warning'),
        open: (config) => add(config, 'default'),
        close: (id) => store.remove(id),
    };
}
