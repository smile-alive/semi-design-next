import { type Accessor, type JSX, For, createSignal, onMount } from 'solid-js';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
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
    props: Accessor<ConfirmProps>;
    instance: ConfirmInstance<ConfirmProps>;
}

/**
 * Confirm dialogs rendered by the returned holder. The holder is created here, under the caller's owner, so its dialogs
 * read the caller's ConfigProvider, LocaleProvider and other context; place it once. A dialog's handle works at once:
 * its props live in a signal, not in a mounted instance.
 */
export default function useModal(): [ModalHookApi, JSX.Element] {
    const [items, setItems] = createSignal<HookItem[]>([]);

    const open = (type: ConfirmProps['type']) => (initial: ModalProps) => {
        const instance = new ConfirmInstance(withType(type, initial), {
            render: (next) => setProps(next),
            remove: () => setItems((current) => current.filter((other) => other !== item)),
        });
        const [props, setProps] = createSignal(instance.props);
        const item: HookItem = { props, instance };
        setItems((current) => [...current, item]);
        return instance.handle;
    };

    const contextHolder = (
        <For each={items()}>
            {(item) => {
                // a Modal hidden in the batch that creates it never reports afterClose, so the dialog exists only from onMount
                onMount(item.instance.handleMount);
                return <ConfirmModal {...item.props()} />;
            }}
        </For>
    );

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
