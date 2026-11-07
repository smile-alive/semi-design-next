/** @jsxImportSource vue */
// JSX because the imperative API mounts a ToastList vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import ToastApi from '@fibrae/semi-foundation/components/toast/toast-api-foundation';
import type { ConfigProps, ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { getInstalledApp, rootAppContext, setInstalledApp } from '../../base/installed-app';
import { useSemiGlobal } from '../../base/semi-default';
import { assertClient } from '../../utils/client-only';
import semiGlobal from '../../utils/semi-global';
import type { ToastProps } from './interface';
import ToastList from './toast-list.vue';
import useToast from './use-toast';

export type * from './interface';

// runWithContext lets inject read app.provide(semiGlobalKey, ...) outside a component.
function getGlobalDefaults() {
    const installedApp = getInstalledApp();
    const semi = installedApp ? installedApp.runWithContext(useSemiGlobal) : semiGlobal;
    // the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
    return omitInstanceIds(semi.config.overrideDefaultProps?.Toast) as Partial<ToastInstance>;
}

function createBaseToast(initialConfig?: ConfigProps) {
    const api = new ToastApi<ToastProps>(
        {
            assertClient: () => assertClient('Toast', 'Toast.useToast'),
            readGlobalDefaults: getGlobalDefaults,
            // render() mounts synchronously, so the list subscribes before the first toast is added.
            mount: (wrapper, store) => {
                const vnode = <ToastList store={store} />;
                vnode.appContext = rootAppContext();
                render(vnode, wrapper);
                return () => render(null, wrapper);
            },
        },
        initialConfig
    );
    return Object.assign(api, { useToast });
}

export class ToastFactory {
    static create(config?: ConfigProps): ReturnType<typeof createBaseToast> {
        return createBaseToast(config);
    }
}

export default Object.assign(ToastFactory.create(), {
    /** Optional: static toasts (and the other static APIs) then render with this app's context. */
    install(app: App) {
        setInstalledApp(app);
    },
});
