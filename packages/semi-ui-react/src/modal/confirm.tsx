import { type ConfirmType, resolveConfirmProps } from '@fibrae/semi-foundation/modal/confirm';
import ConfirmRegistry from '@fibrae/semi-foundation/modal/confirm-registry';
import '@fibrae/semi-foundation/modal/modal.scss';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-react';
import { assertBrowser, render as reactRender, unmount as reactUnmount } from '../_utils/react-render';
import ConfirmModal from './confirm-modal';
import type { ModalReactProps } from './modal';

export interface ConfirmProps extends ModalReactProps {
    type: ConfirmType;
}

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

export default function confirm(props: ConfirmProps) {
    assertBrowser('Modal.confirm and its variants', 'Modal.useModal()');
    const div = document.createElement('div');
    document.body.appendChild(div);

    let currentConfig = { ...props };
    // rendering after destroy would create a root on the detached div that nothing unmounts
    let destroyed = false;
    // A dialog that first renders hidden never reports afterClose. So a close before the first commit waits for the
    // mount, and the dialog then hides through its normal path.
    let mounted = false;
    let closeBeforeMount = false;

    const destroy = () => {
        destroyed = true;
        reactUnmount(div);
        div.remove();
        unregister();
    };

    const render = (renderProps: ConfirmProps) => {
        if (destroyed || (closeBeforeMount && !mounted)) {
            return;
        }
        const { afterClose } = renderProps;
        reactRender(
            <ConfirmModal
                {...renderProps}
                afterClose={() => {
                    afterClose?.();
                    destroy();
                }}
                onMount={() => {
                    mounted = true;
                    if (closeBeforeMount) {
                        render(currentConfig);
                    }
                }}
            />,
            div
        );
    };

    const close = () => {
        currentConfig = {
            ...currentConfig,
            visible: false,
        };
        closeBeforeMount = !mounted;
        render(currentConfig);
    };

    const update = (newConfig: ModalReactProps) => {
        currentConfig = {
            ...currentConfig,
            ...newConfig,
        };
        render(currentConfig);
    };

    const unregister = registry.register(close);
    render(currentConfig);
    return {
        destroy: close,
        update,
    };
}

export function withInfo(props: ModalReactProps): ConfirmProps {
    return { type: 'info', icon: <IconInfoCircle />, ...resolveConfirmProps('info', props) };
}

export function withSuccess(props: ModalReactProps): ConfirmProps {
    return { type: 'success', icon: <IconTickCircle />, ...resolveConfirmProps('success', props) };
}

export function withWarning(props: ModalReactProps): ConfirmProps {
    return { type: 'warning', icon: <IconAlertTriangle />, ...resolveConfirmProps('warning', props) };
}

export function withError(props: ModalReactProps): ConfirmProps {
    return { type: 'error', icon: <IconAlertCircle />, ...resolveConfirmProps('error', props) };
}

export function withConfirm(props: ModalReactProps): ConfirmProps {
    return { type: 'confirm', icon: <IconHelpCircle />, ...resolveConfirmProps('confirm', props) };
}
