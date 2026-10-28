/** @jsxImportSource vue */
// JSX because the imperative API mounts a ToastList vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { omitBy } from 'es-toolkit';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses, setPosition } from '@fibrae/semi-foundation/toast/constants';
import type { ConfigProps, ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only';
import { getInstalledApp, rootAppContext, setInstalledApp } from '../_base/installed-app';
import { useSemiGlobal } from '../_base/semi-default';
import semiGlobal from '../_utils/semi-global';
import type { ToastProps } from './interface';
import ToastList from './toast-list.vue';
import useToast from './use-toast';

export type * from './interface';

// runWithContext lets inject read app.provide(semiGlobalKey, ...) outside a component.
function getGlobalDefaults(): Partial<ToastProps> {
    const installedApp = getInstalledApp();
    const semi = installedApp ? installedApp.runWithContext(useSemiGlobal) : semiGlobal;
    return omitInstanceIds(semi.config.overrideDefaultProps?.Toast);
}

function createBaseToast(initialConfig?: ConfigProps) {
    const store = new ToastListStore(initialConfig);
    let wrapper: HTMLDivElement | null = null;

    const show = (opts: Omit<ToastProps, 'type'> | string, type: ToastType) => toast.create({ ...(typeof opts === 'string' ? { content: opts } : opts), type });

    const toast = {
        get defaultOpts() {
            return store.defaults;
        },
        useToast,

        create(opts: ToastProps) {
            assertClient('Toast', 'Toast.useToast');
            const id = opts.id ?? createId('toast');
            // an explicit undefined must not replace the defaults
            const mergedOpts = { ...store.defaults, ...getGlobalDefaults(), ...omitBy(opts, (value) => value === undefined) };
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = cssClasses.WRAPPER;
                wrapper.id = createId('toast-wrapper');
                wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
                (mergedOpts.getPopupContainer ? mergedOpts.getPopupContainer() : document.body).appendChild(wrapper);
                // the app context exposes app-level provides and global components to the toasts
                const vnode = <ToastList store={store} />;
                vnode.appContext = rootAppContext();
                // render() mounts synchronously, so the list subscribes before the first toast is added.
                render(vnode, wrapper);
            }
            wrapper.style.zIndex = String(mergedOpts.zIndex);
            setPosition(wrapper, mergedOpts);
            store.setStack(mergedOpts.stack);
            store.add({ ...mergedOpts, id } as ToastInstance);
            return id;
        },

        close(id: string) {
            store.remove(id);
        },

        destroyAll() {
            if (!wrapper) return;
            // unmount first: the store then has no listeners, so clearing it renders nothing
            render(null, wrapper);
            wrapper.remove();
            wrapper = null;
            store.clear();
        },

        getWrapperId: () => wrapper?.id ?? null,

        info: (opts: Omit<ToastProps, 'type'> | string) => show(opts, 'info'),
        warning: (opts: Omit<ToastProps, 'type'> | string) => show(opts, 'warning'),
        error: (opts: Omit<ToastProps, 'type'> | string) => show(opts, 'error'),
        success: (opts: Omit<ToastProps, 'type'> | string) => show(opts, 'success'),

        config: (opts: ConfigProps) => store.config(opts),
        resetConfig: () => store.resetConfig(),
    };
    return toast;
}

export class ToastFactory {
    static create(config?: ConfigProps): ReturnType<typeof createBaseToast> {
        return createBaseToast(config && { ...config });
    }
}

export default Object.assign(ToastFactory.create(), {
    /** Optional: static toasts (and the other static APIs) then render with this app's context. */
    install(app: App) {
        setInstalledApp(app);
    },
});
