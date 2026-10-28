import { createSignal } from 'solid-js';
import { resolveConfirmProps } from '@fibrae/semi-foundation/modal/confirm';
import renderDetached from '../_base/detached-render';
import ConfirmModal, { type ConfirmProps } from './confirm-modal';
import type { ModalProps } from './modal';

export type { ConfirmProps };

export interface ModalHookRef {
    /** Closes the dialog through its leave animation */
    destroy: () => void;
    /** Merges into the dialog's current props */
    update: (config: ModalProps) => void;
}

const destroyFns: Array<() => void> = [];

export function destroyAll() {
    for (const close of destroyFns.splice(0)) {
        close();
    }
}

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
                const index = destroyFns.indexOf(close);
                if (index !== -1) {
                    destroyFns.splice(index, 1);
                }
                dispose();
            }}
        />
    ));

    destroyFns.push(close);
    return { destroy: close, update };
}

/** The props of `Modal.<type>()`; ConfirmModal adds the type's icon */
export function withType(type: ConfirmProps['type'], props: ModalProps): ConfirmProps {
    return { type, ...resolveConfirmProps(type, props) };
}
