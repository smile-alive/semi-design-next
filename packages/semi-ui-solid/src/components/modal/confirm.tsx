import { createSignal, onMount } from 'solid-js';
import { resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
import { assertClient } from '@fibrae/semi-foundation/utils/assert-client';
import renderDetached from '../../base/detached-render';
import ConfirmModal, { type ConfirmProps } from './confirm-modal';
import type { ModalProps } from './modal';

export type { ConfirmProps };

export interface ModalHookRef {
    destroy: () => void;
    update: (config: ModalProps) => void;
}

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

/** Renders a confirm dialog outside the app, so it reads global defaults and the default locale */
export default function confirm(props: ConfirmProps): ModalHookRef {
    assertClient('Modal.confirm', 'Modal.useModal');
    const instance = new ConfirmInstance(props, { render: (next) => setConfig(next), remove: () => dispose() }, registry);
    const [config, setConfig] = createSignal(instance.props);
    const dispose = renderDetached(() => {
        // a Modal hidden in the batch that creates it never reports afterClose, so the dialog exists only from onMount
        onMount(instance.handleMount);
        return <ConfirmModal {...config()} />;
    });
    return instance.handle;
}

export function withType(type: ConfirmProps['type'], props: ModalProps): ConfirmProps {
    return { type, ...resolveConfirmProps(type, props) };
}
