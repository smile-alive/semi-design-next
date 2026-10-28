import { type ReactElement, useState } from 'react';
import { omitBy } from 'es-toolkit';
import { builtInOpts, cssClasses, numbers } from '@fibrae/semi-foundation/toast/constants';
import type { ToastProps } from '@fibrae/semi-foundation/toast/toast-foundation';
import ToastListStore from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '@fibrae/semi-foundation/utils/layer';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import type { ToastOptions } from '../index';
import ToastList from '../toast-list';

/** The id is generated, and a hook's toasts render where its holder is, so the layer options do not apply */
type ToastHookOptions = Omit<ToastOptions, 'id' | 'zIndex' | 'getPopupContainer'>;

export interface ToastHookApi {
    success: (config: ToastHookOptions) => string;
    info: (config: ToastHookOptions) => string;
    error: (config: ToastHookOptions) => string;
    warning: (config: ToastHookOptions) => string;
    open: (config: ToastHookOptions) => string;
    close: (id: string) => void;
}

const defaultOpts = { ...builtInOpts, duration: numbers.duration };

function createToastHook(): [ToastHookApi, ReactElement] {
    const store = new ToastListStore();

    const addToast = (config: ToastHookOptions, type: ToastProps['type']) => {
        const id = createId('semi_toast_');
        store.setStack(config.stack);
        store.add({ ...defaultOpts, ...omitBy(config, (value) => value === undefined), type, id });
        return id;
    };

    const contextHolder = (
        <div className={cssClasses.WRAPPER} {...{ [KEEP_INTERACTIVE_ATTRIBUTE]: '' }}>
            <ToastList store={store} />
        </div>
    );

    return [
        {
            success: (config) => addToast(config, 'success'),
            info: (config) => addToast(config, 'info'),
            error: (config) => addToast(config, 'error'),
            warning: (config) => addToast(config, 'warning'),
            open: (config) => addToast(config, 'default'),
            close: (id) => store.remove(id),
        },
        contextHolder,
    ];
}

export default function useToast(): [ToastHookApi, ReactElement] {
    // Created once with its store: the api must still reach earlier toasts, and a stable api and holder let memo
    // components that receive them skip rendering
    const [hook] = useState(createToastHook);
    return hook;
}
