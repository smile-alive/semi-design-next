import { omitBy } from 'es-toolkit';
import { cssClasses, setPosition } from '@fibrae/semi-foundation/toast/constants';
import type { ConfigProps, ToastInstance, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import renderDetached, { assertClient } from '../_base/detached-render';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { ToastProps } from './toast';
import ToastList from './toast-list';
import useToast from './use-toast';

/** Options of one toast opened through the static methods; the list supplies `close` */
export type ToastOptions = Omit<ToastProps, 'type' | 'close'>;

function createBaseToast(initialConfig?: ConfigProps) {
    const store = new ToastListStore(initialConfig);
    // held as an element, not found by id: two instances shown in the same millisecond would share an id
    let wrapper: HTMLDivElement | null = null;
    let dispose: () => void = noop;

    const show = (opts: ToastOptions | string, type: ToastType) => toast.create({ ...(typeof opts === 'string' ? { content: opts } : opts), type });

    const toast = {
        get defaultOpts() {
            return store.defaults;
        },
        useToast,

        create(opts: Omit<ToastProps, 'close'>) {
            assertClient();
            const id = opts.id ?? createId('toast');
            // an explicit undefined must not replace the defaults
            const mergedOpts = { ...store.defaults, ...readGlobalDefaults('Toast'), ...omitBy(opts, (value) => value === undefined) };

            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = cssClasses.WRAPPER;
                wrapper.id = createId('toast-wrapper');
                wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
                (mergedOpts.getPopupContainer ? mergedOpts.getPopupContainer() : document.body).appendChild(wrapper);
                // detached: static toasts read the global defaults and the default locale, never a caller's context
                dispose = renderDetached(() => <ToastList store={store} />, wrapper);
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
            if (wrapper) {
                store.clear();
                dispose();
                wrapper = null;
            }
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

export default ToastFactory.create();
