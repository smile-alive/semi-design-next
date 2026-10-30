import { mount, unmount } from 'svelte';
import { omitBy } from 'es-toolkit';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import { cssClasses, setPosition } from '@fibrae/semi-foundation/toast/constants';
import type { ConfigProps, ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertClient } from '../_base/client-only.js';
import semiGlobal from '../_utils/semi-global.js';
import type { ToastOptions, ToastProps } from './interface.js';
import ToastList from './toast-list.svelte';
import useToast from './use-toast.js';

function createBaseToast(initialConfig?: ConfigProps) {
    const store = new ToastListStore(initialConfig);
    // held as an element, not found by id: two instances shown in the same millisecond would share an id
    let wrapper: HTMLDivElement | null = null;
    let list: ReturnType<typeof mount> | null = null;

    const show = (opts: ToastOptions | string, type: ToastType) => toast.create({ ...(typeof opts === 'string' ? { content: opts } : opts), type });

    const toast = {
        get defaultOpts() {
            return store.defaults;
        },
        useToast,

        create(opts: ToastProps) {
            assertClient('Toast', 'Toast.useToast');
            const id = opts.id ?? createId('toast');
            // an explicit undefined must not replace the defaults
            const mergedOpts = { ...store.defaults, ...omitInstanceIds(semiGlobal.config.overrideDefaultProps?.Toast), ...omitBy(opts, (value) => value === undefined) };
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = cssClasses.WRAPPER;
                wrapper.id = createId('toast-wrapper');
                wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
                (mergedOpts.getPopupContainer ? mergedOpts.getPopupContainer() : document.body).appendChild(wrapper);
                // Detached: a static toast reads the global defaults and the default locale, never a caller's context.
                // The list subscribes once its mount effects run; a toast added before that is read from the snapshot.
                list = mount(ToastList, { target: wrapper, props: { store } });
            }
            wrapper.style.zIndex = String(mergedOpts.zIndex);
            setPosition(wrapper, mergedOpts);
            store.setStack(mergedOpts.stack);
            // the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
            store.add({ ...mergedOpts, id } as ToastInstance);
            return id;
        },

        close(id: string) {
            store.remove(id);
        },

        destroyAll() {
            if (!wrapper || !list) return;
            // unmount first: the store then has no listeners, so clearing it renders nothing
            void unmount(list);
            wrapper.remove();
            wrapper = null;
            list = null;
            store.clear();
        },

        getWrapperId: () => wrapper?.id ?? null,

        info: (opts: ToastOptions | string) => show(opts, 'info'),
        warning: (opts: ToastOptions | string) => show(opts, 'warning'),
        error: (opts: ToastOptions | string) => show(opts, 'error'),
        success: (opts: ToastOptions | string) => show(opts, 'success'),

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

export const Toast = ToastFactory.create();
