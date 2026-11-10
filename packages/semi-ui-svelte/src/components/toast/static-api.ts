import { mount, unmount } from 'svelte';
import { omitInstanceIds } from '@fibrae/semi-foundation/base/constants';
import ToastApi from '@fibrae/semi-foundation/components/toast/toast-api-foundation';
import type { ConfigProps, ToastInstance } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils/assert-client';
import semiGlobal from '../../utils/semi-global.js';
import type { ToastProps } from './interface.js';
import ToastList from './toast-list.svelte';
import useToast from './use-toast.js';

function createBaseToast(initialConfig?: ConfigProps) {
    const api = new ToastApi<ToastProps>(
        {
            assertClient: () => assertClient('Toast', 'Toast.useToast'),
            // the store holds the options as given (ToastProps), typed as the foundation's ToastInstance
            readGlobalDefaults: () => omitInstanceIds(semiGlobal.config.overrideDefaultProps?.Toast) as Partial<ToastInstance>,
            // Detached: a static toast reads the global defaults and the default locale, never a caller's context.
            // The list subscribes once its mount effects run; a toast added before that is read from the snapshot.
            mount: (wrapper, store) => {
                const list = mount(ToastList, { target: wrapper, props: { store } });
                return () => void unmount(list);
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

export const Toast = ToastFactory.create();
