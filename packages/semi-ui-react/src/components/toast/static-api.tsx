import type React from 'react';
import type { CSSProperties } from 'react';
import ToastApi from '@fibrae/semi-foundation/components/toast/toast-api-foundation';
import type { ConfigProps, ToastProps } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { assertClient } from '@fibrae/semi-foundation/utils';
import type { ElementProps } from '../../base/index';
import { render as reactRender, unmount as reactUnmount, readGlobalDefaults } from '../../utils/index';
import ToastList from './toast-list';
import useToast from './use-toast';

/** Undeclared options land on the toast element (F2, F6); the list owns its animation handlers */
export interface ToastReactProps extends ToastProps, ElementProps<'div', 'content' | 'style' | 'className' | 'id' | 'children' | 'dangerouslySetInnerHTML' | 'onAnimationEnd' | 'onAnimationStart'> {
    id?: string;
    style?: CSSProperties;
    icon?: React.ReactNode;
    content: React.ReactNode;
    motion?: boolean;
    // an options object gets excess property checks, which only JSX skips for hyphenated names
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}

export type ToastOptions = Omit<ToastReactProps, 'type' | 'close'>;

export type { ConfigProps, ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';
export type { ToastHookApi } from './use-toast';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';

function createBaseToast(initialConfig?: ConfigProps) {
    const api = new ToastApi<Omit<ToastReactProps, 'close'>>(
        {
            assertClient: () => assertClient('Toast', 'Toast.useToast()'),
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
