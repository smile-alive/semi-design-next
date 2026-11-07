import { mount, unmount } from 'svelte';
import { resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
import { assertClient } from '../../utils/client-only.js';
import ConfirmModal from './confirm-modal.svelte';
import type { ConfirmProps, ModalConfirmProps, ModalHookRef } from './interface.js';

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

/**
 * Mounts a confirm dialog into the body and returns its handle plus `dispose`, which removes it at once without its
 * leave animation. `context` is what the dialog reads (ConfigProvider, LocaleProvider): the static methods pass none, so
 * they read the global defaults and the default locale, and useModal passes the calling component's.
 */
export function openConfirm({ afterClose, ...others }: ConfirmProps, { context, onClosed }: { context?: Map<unknown, unknown>; onClosed?: () => void } = {}) {
    assertClient('Modal.confirm', 'Modal.useModal');

    // kept apart from the props: a later update may replace it, and the dialog must still unmount after it
    let latestAfterClose = afterClose;
    // after the leave animation the tree is gone; a later update must not resurrect it
    let destroyed = false;
    let unmounted = false;

    const props = $state<ConfirmProps>({
        ...others,
        afterClose: () => {
            latestAfterClose?.();
            release();
            // the dialog is reporting from inside its own effects
            queueMicrotask(dispose);
        },
    });

    const instance = mount(ConfirmModal, { target: document.body, props, context });

    const release = () => {
        if (destroyed) return;
        destroyed = true;
        onClosed?.();
    };

    const dispose = () => {
        release();
        if (unmounted) return;
        unmounted = true;
        void unmount(instance, { outro: false });
    };

    const update = (change: ModalConfirmProps) => {
        if (destroyed) return;
        const { afterClose: next, ...rest } = change;
        if ('afterClose' in change) {
            latestAfterClose = next;
        }
        Object.assign(props, rest);
    };

    const destroy = () => update({ visible: false });

    return { ref: { destroy, update } satisfies ModalHookRef, dispose, close: destroy };
}

export default function confirm(props: ConfirmProps): ModalHookRef {
    const { ref, close } = openConfirm(props, { onClosed: () => unregister() });
    const unregister = registry.register(close);
    return ref;
}

export function withType(type: ConfirmProps['type'], props: ModalConfirmProps): ConfirmProps {
    return { type, ...resolveConfirmProps(type, props) };
}
