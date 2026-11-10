import { mount, unmount } from 'svelte';
import { resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
import { assertClient } from '@fibrae/semi-foundation/utils';
import ConfirmModal from './confirm-modal.svelte';
import type { ConfirmProps, ModalConfirmProps, ModalHookRef } from './interface.js';

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

/**
 * Mounts a confirm dialog into the body and returns its instance plus `dispose`, which removes it at once without its
 * leave animation. `context` is what the dialog reads (ConfigProvider, LocaleProvider): the static methods pass none, so
 * they read the global defaults and the default locale, and useModal passes the calling component's.
 */
export function openConfirm(config: ConfirmProps, { context, registry: owner, onRemove }: { context?: Map<unknown, unknown>; registry?: ConfirmRegistry; onRemove?: () => void } = {}) {
    assertClient('Modal.confirm', 'Modal.useModal');

    let unmounted = false;
    const dispose = () => {
        if (unmounted) return;
        unmounted = true;
        void unmount(dialog, { outro: false });
    };

    const instance = new ConfirmInstance(
        config,
        {
            render: (next) => Object.assign(props, next),
            remove: () => {
                onRemove?.();
                // the dialog is reporting from inside its own effects
                queueMicrotask(dispose);
            },
        },
        owner
    );
    const props = $state(instance.props);
    const dialog = mount(ConfirmModal, { target: document.body, props, context });
    // the Modal is shown from its construction inside mount, so a close from here on still reports afterClose
    instance.handleMount();
    return { instance, dispose };
}

export default function confirm(props: ConfirmProps): ModalHookRef {
    return openConfirm(props, { registry }).instance.handle;
}

export function withType(type: ConfirmProps['type'], props: ModalConfirmProps): ConfirmProps {
    return { type, ...resolveConfirmProps(type, props) };
}
