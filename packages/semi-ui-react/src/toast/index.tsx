import type React from 'react';
import type { CSSProperties } from 'react';
import { omitBy } from 'es-toolkit';
import { cssClasses, setPosition } from '@fibrae/semi-foundation/toast/constants';
import type { ConfigProps, ToastProps } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import { assertBrowser, render as reactRender, unmount as reactUnmount } from '../_utils/react-render';
import { readGlobalDefaults } from '../_utils/semi-global';
import ToastList from './toast-list';
import useToast from './use-toast';

export interface ToastReactProps extends ToastProps {
    id?: string;
    style?: CSSProperties;
    icon?: React.ReactNode;
    content: React.ReactNode;
    motion?: boolean;
    // forwarded to the toast element (F2)
    [attribute: `data-${string}` | `aria-${string}`]: string | number | boolean | undefined;
}

/** Options of one toast opened through the static methods or a hook; the list supplies `close` */
export type ToastOptions = Omit<ToastReactProps, 'type' | 'close'>;

export type { ConfigProps, ToastState } from '@fibrae/semi-foundation/toast/toast-foundation';
export type { ToastHandle } from './toast';
export type { ToastHookApi } from './use-toast';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/toast/toast-list-foundation';

function createBaseToast(initialConfig?: ConfigProps) {
    const store = new ToastListStore(initialConfig);
    // held as an element, not found by id: two instances shown in the same millisecond would share an id
    let wrapper: HTMLDivElement | null = null;

    const show = (opts: ToastOptions | string, type: ToastProps['type']) => toast.create({ ...(typeof opts === 'string' ? { content: opts } : opts), type });

    const toast = {
        get defaultOpts() {
            return store.defaults;
        },
        useToast,

        create(opts: Omit<ToastReactProps, 'close'>) {
            assertBrowser('Toast', 'Toast.useToast()');
            const id = opts.id ?? createId('toast');
            // an explicit undefined must not replace the defaults
            const mergedOpts = { ...store.defaults, ...readGlobalDefaults('Toast'), ...omitBy(opts, (value) => value === undefined) };

            // createRoot renders asynchronously; calls before the list mounts only reach the store
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = cssClasses.WRAPPER;
                wrapper.id = createId('toast-wrapper');
                wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
                (mergedOpts.getPopupContainer ? mergedOpts.getPopupContainer() : document.body).appendChild(wrapper);
                reactRender(<ToastList store={store} />, wrapper);
            }
            wrapper.style.zIndex = String(mergedOpts.zIndex);
            setPosition(wrapper, mergedOpts);
            store.setStack(mergedOpts.stack);
            store.add({ ...mergedOpts, id });
            return id;
        },

        close(id: string) {
            store.remove(id);
        },

        destroyAll() {
            if (wrapper) {
                store.clear();
                reactUnmount(wrapper);
                wrapper.remove();
                wrapper = null;
            }
        },

        getWrapperId: (): string | null => wrapper?.id ?? null,

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
