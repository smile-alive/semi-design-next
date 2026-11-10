import { type ConfirmType, resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
import { assertClient } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/modal/modal.scss';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-react';
import { render as reactRender, unmount as reactUnmount } from '../../utils/index';
import ConfirmModal from './confirm-modal';
import type { ModalReactProps } from './modal';
import type { HookModalRef } from './use-modal';

export interface ConfirmProps extends ModalReactProps {
    type: ConfirmType;
}

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

export default function confirm(props: ConfirmProps): HookModalRef {
    assertClient('Modal.confirm and its variants', 'Modal.useModal()');
    const div = document.createElement('div');
    document.body.appendChild(div);
    // createRoot renders asynchronously, so the dialog exists only once ConfirmModal reports its first commit
    const render = (renderProps: ConfirmProps) => reactRender(<ConfirmModal {...renderProps} onMount={instance.handleMount} />, div);
    const instance = new ConfirmInstance(
        props,
        {
            render,
            remove: () => {
                reactUnmount(div);
                div.remove();
            },
        },
        registry
    );
    render(instance.props);
    return instance.handle;
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
