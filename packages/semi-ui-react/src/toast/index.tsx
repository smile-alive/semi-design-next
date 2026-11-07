import type React from 'react';
import type { CSSProperties } from 'react';
import ToastApi from '@fibrae/semi-foundation/components/toast/toast-api-foundation';
import type { ConfigProps, ToastProps } from '@fibrae/semi-foundation/components/toast/toast-foundation';
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

export type ToastOptions = Omit<ToastReactProps, 'type' | 'close'>;

export type { ConfigProps, ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';
export type { ToastHandle } from './toast';
export type { ToastHookApi } from './use-toast';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';

function createBaseToast(initialConfig?: ConfigProps) {
    const api = new ToastApi<Omit<ToastReactProps, 'close'>>(
        {
            assertClient: () => assertBrowser('Toast', 'Toast.useToast()'),
            readGlobalDefaults: () => readGlobalDefaults('Toast'),
            // createRoot renders asynchronously; calls before the list mounts only reach the store
            mount: (wrapper, store) => {
                reactRender(<ToastList store={store} />, wrapper);
                return () => reactUnmount(wrapper);
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
export default ToastFactory.create();
