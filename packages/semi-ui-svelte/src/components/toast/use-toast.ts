import { getAllContexts, getContext, mount, onDestroy, unmount } from 'svelte';
import { omitInstanceIds, createHookApi, StaticListWrapper } from '@fibrae/semi-foundation/base';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { createToastListStore } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils';
import { semiGlobal, type SemiGlobal, semiGlobalKey } from '../../utils/index.js';
import type { ToastHookApi, ToastHookOptions } from './interface.js';
import ToastList from './toast-list.svelte';

/**
 * Opens toasts that read the calling component's contexts (ConfigProvider, LocaleProvider), which the static `Toast`
 * cannot reach because it mounts its own root. Call it during component initialization. The list is mounted into the
 * body on the first toast and removed with the calling component.
 */
export default function useToast(): ToastHookApi {
    const context = getAllContexts();
    const semi = getContext<SemiGlobal | undefined>(semiGlobalKey) ?? semiGlobal;
    const store = createToastListStore();
    const wrapper = new StaticListWrapper(cssClasses.WRAPPER);

    onDestroy(() => wrapper.destroy());

    return createHookApi<ToastHookOptions>(store, {
        // the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
        readGlobalDefaults: () => omitInstanceIds(semi.config.overrideDefaultProps?.Toast) as Partial<ToastInstance>,
        beforeAdd: () => {
            assertClient('The Toast.useToast api', 'Toast.useToast');
            wrapper.ensure(undefined, (target) => {
                const list = mount(ToastList, { target, props: { store }, context });
                return () => void unmount(list);
            });
        },
    });
}
