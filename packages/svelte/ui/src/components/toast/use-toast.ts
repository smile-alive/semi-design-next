import { getAllContexts, getContext, mount, onDestroy, unmount } from 'svelte';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastInstance, ToastType } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { assertClient } from '../../utils/client-only.js';
import semiGlobal, { type SemiGlobal, semiGlobalKey } from '../../utils/semi-global.js';
import type { ToastHookApi, ToastHookOptions } from './interface.js';
import ToastList from './toast-list.svelte';

// the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
const readDefaults = (semi: SemiGlobal) => omitInstanceIds(semi.config.overrideDefaultProps?.Toast) as Partial<ToastInstance>;

/**
 * Opens toasts that read the calling component's contexts (ConfigProvider, LocaleProvider), which the static `Toast`
 * cannot reach because it mounts its own root. Call it during component initialization. The list is mounted into the
 * body on the first toast and removed with the calling component.
 */
export default function useToast(): ToastHookApi {
    const context = getAllContexts();
    const semi = getContext<SemiGlobal | undefined>(semiGlobalKey) ?? semiGlobal;
    const store = new ToastListStore();
    let wrapper: HTMLDivElement | null = null;
    let list: ReturnType<typeof mount> | null = null;

    onDestroy(() => {
        if (!list) return;
        void unmount(list);
        wrapper?.remove();
        wrapper = list = null;
    });

    return createToastHookApi(store, {
        readGlobalDefaults: () => readDefaults(semi),
        beforeAdd: () => {
            assertClient('The Toast.useToast api', 'Toast.useToast');
            if (wrapper) return;
            wrapper = document.createElement('div');
            wrapper.className = cssClasses.WRAPPER;
            wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
            document.body.appendChild(wrapper);
            list = mount(ToastList, { target: wrapper, props: { store }, context });
        },
    });
}

/**
 * The hook's api over a store whose `ToastList` the caller renders, for a Semi component that keeps its toasts inside
 * itself (AI Chat). Internal: reachable through the `./*` export but not documented, so its shape may change.
 */
export function createToastHookApi(store: ToastListStore, { beforeAdd, readGlobalDefaults = () => readDefaults(semiGlobal) }: { beforeAdd?: () => void; readGlobalDefaults?: () => Partial<ToastInstance> } = {}): ToastHookApi {
    const add = (config: ToastHookOptions, type: ToastType) => {
        beforeAdd?.();
        return store.open({ ...config, type } as ToastInstance, readGlobalDefaults());
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
