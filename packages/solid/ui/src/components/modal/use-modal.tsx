import { type JSX, For, createSignal } from 'solid-js';
import { type ModalHookRef, withType } from './confirm';
import ConfirmModal, { type ConfirmProps } from './confirm-modal';
import type { ModalProps } from './modal';

export interface ModalHookApi {
    info: (config: ModalProps) => ModalHookRef;
    success: (config: ModalProps) => ModalHookRef;
    error: (config: ModalProps) => ModalHookRef;
    warning: (config: ModalProps) => ModalHookRef;
    confirm: (config: ModalProps) => ModalHookRef;
}

interface HookItem {
    config: () => ConfirmProps;
    afterClose: () => void;
}

/**
 * Confirm dialogs rendered by the returned holder. The holder is created here, under the caller's owner, so its dialogs
 * read the caller's ConfigProvider, LocaleProvider and other context; place it once. A dialog's handle works at once:
 * its props live in a signal, not in a mounted instance.
 */
export default function useModal(): [ModalHookApi, JSX.Element] {
    const [items, setItems] = createSignal<HookItem[]>([]);

    const open = (type: ConfirmProps['type']) => (initial: ModalProps) => {
        const [config, setConfig] = createSignal(withType(type, initial));
        let closed = false;
        const item: HookItem = {
            config,
            afterClose: () => {
                closed = true;
                config().afterClose?.();
                setItems((current) => current.filter((other) => other !== item));
            },
        };
        setItems((current) => [...current, item]);
        const update = (next: ModalProps) => {
            if (!closed) {
                setConfig((current) => ({ ...current, ...next }));
            }
        };
        return { destroy: () => update({ visible: false }), update };
    };

    const contextHolder = <For each={items()}>{(item) => <ConfirmModal {...item.config()} afterClose={item.afterClose} />}</For>;

    return [
        {
            info: open('info'),
            success: open('success'),
            error: open('error'),
            warning: open('warning'),
            confirm: open('confirm'),
        },
        contextHolder,
    ];
}
