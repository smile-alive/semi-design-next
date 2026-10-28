/** @jsxImportSource vue */
// JSX because confirm() mounts a ConfirmModal vnode outside any template and sets its appContext by hand.

import { type App, render } from 'vue';
import { resolveConfirmProps } from '@fibrae/semi-foundation/modal/confirm';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-vue';
import { assertClient } from '../_base/client-only';
import { rootAppContext, setInstalledApp } from '../_base/installed-app';
import ConfirmModal from './confirm-modal.vue';
import type { ConfirmProps, ModalConfirmProps } from './interface';

const destroyFns: Array<() => void> = [];

export function destroyAll() {
    for (const close of destroyFns.splice(0)) {
        close();
    }
}

/** Optional: static confirms (and the other static APIs) then render with this app's context. */
export function install(app: App) {
    setInstalledApp(app);
}

export default function confirm(props: ConfirmProps) {
    assertClient('Modal.confirm', 'Modal.useModal');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const appContext = rootAppContext();

    let current: ConfirmProps = { ...props };
    // rendering after the container is gone would mount on a detached div nothing unmounts
    let destroyed = false;

    const destroy = () => {
        destroyed = true;
        render(null, div);
        div.remove();
        const index = destroyFns.indexOf(close);
        if (index !== -1) {
            destroyFns.splice(index, 1);
        }
    };

    const mount = (config: ConfirmProps) => {
        if (destroyed) {
            return;
        }
        const { afterClose, ...rest } = config;
        const vnode = (
            <ConfirmModal
                {...rest}
                onAfterClose={() => {
                    afterClose?.();
                    destroy();
                }}
            />
        );
        vnode.appContext = appContext;
        render(vnode, div);
    };

    const close = () => {
        current = { ...current, visible: false };
        mount(current);
    };

    const update = (config: ModalConfirmProps) => {
        current = { ...current, ...config };
        mount(current);
    };

    mount(current);
    destroyFns.push(close);
    return { destroy: close, update };
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
