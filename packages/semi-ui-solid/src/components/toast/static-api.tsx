import ToastApi from '@fibrae/semi-foundation/components/toast/toast-api-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils';
import { renderDetached } from '../../base/index';
import { readGlobalDefaults } from '../../utils/index';
import type { ToastProps } from './toast';
import ToastList from './toast-list';
import useToast from './use-toast';

export type ToastOptions = Omit<ToastProps, 'type' | 'close'>;

function createBaseToast(initialConfig?: ConfigProps) {
    const api = new ToastApi<Omit<ToastProps, 'close'>>(
        {
            assertClient: () => assertClient('Toast', 'Toast.useToast'),
            readGlobalDefaults: () => readGlobalDefaults('Toast'),
            // detached: static toasts read the global defaults and the default locale, never a caller's context
            mount: (wrapper, store) => renderDetached(() => <ToastList store={store} />, wrapper),
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

export default ToastFactory.create();
