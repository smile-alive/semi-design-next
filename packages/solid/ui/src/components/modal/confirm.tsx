import { createSignal } from 'solid-js';
import { resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
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
    const [config, setConfig] = createSignal<ConfirmProps>({ ...props });
    // after the leave animation the tree is gone; a later update must not resurrect it
    let closed = false;

    const update = (next: ModalProps) => {
        if (!closed) {
            setConfig((current) => ({ ...current, ...next }));
        }
    };

    const close = () => update({ visible: false });

    const dispose = renderDetached(() => (
        <ConfirmModal
            {...config()}
            afterClose={() => {
                closed = true;
                config().afterClose?.();
                unregister();
                dispose();
            }}
        />
    ));

    const unregister = registry.register(close);
    return { destroy: close, update };
}

export function withType(type: ConfirmProps['type'], props: ModalProps): ConfirmProps {
    return { type, ...resolveConfirmProps(type, props) };
}
