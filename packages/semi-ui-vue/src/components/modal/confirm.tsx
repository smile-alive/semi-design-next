/** @jsxImportSource vue */
// JSX because confirm() mounts a ConfirmModal vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { resolveConfirmProps } from '@fibrae/semi-foundation/components/modal/confirm';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import ConfirmRegistry from '@fibrae/semi-foundation/components/modal/confirm-registry';
import { assertClient } from '@fibrae/semi-foundation/utils';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-vue';
import { rootAppContext, setInstalledApp } from '../../base/index';
import ConfirmModal from './confirm-modal.vue';
import type { ConfirmProps, ModalConfirmProps, ModalHookRef } from './interface';

const registry = new ConfirmRegistry();

export const destroyAll = registry.destroyAll;

/** Optional: static confirms (and the other static APIs) then render with this app's context. */
export function install(app: App) {
    setInstalledApp(app);
}

export default function confirm(props: ConfirmProps): ModalHookRef {
    assertClient('Modal.confirm', 'Modal.useModal');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const appContext = rootAppContext();

    const mount = ({ afterClose, ...rest }: ConfirmProps) => {
        const vnode = <ConfirmModal {...rest} onAfterClose={afterClose} onVnodeMounted={instance.handleMount} />;
        vnode.appContext = appContext;
        render(vnode, div);
    };
    const instance = new ConfirmInstance(
        props,
        {
            render: mount,
            remove: () => {
                render(null, div);
                div.remove();
            },
        },
        registry
    );
    mount(instance.props);
    return instance.handle;
}

export function withInfo(props: ModalConfirmProps): ConfirmProps {
    return { type: 'info', icon: <IconInfoCircle />, ...resolveConfirmProps('info', props) };
}

export function withSuccess(props: ModalConfirmProps): ConfirmProps {
    return { type: 'success', icon: <IconTickCircle />, ...resolveConfirmProps('success', props) };
}

export function withWarning(props: ModalConfirmProps): ConfirmProps {
    return { type: 'warning', icon: <IconAlertTriangle />, ...resolveConfirmProps('warning', props) };
}

export function withError(props: ModalConfirmProps): ConfirmProps {
    return { type: 'error', icon: <IconAlertCircle />, ...resolveConfirmProps('error', props) };
}

export function withConfirm(props: ModalConfirmProps): ConfirmProps {
    return { type: 'confirm', icon: <IconHelpCircle />, ...resolveConfirmProps('confirm', props) };
}
