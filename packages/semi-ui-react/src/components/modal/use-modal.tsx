import { type ReactElement, useMemo, useState } from 'react';
import ConfirmInstance from '@fibrae/semi-foundation/components/modal/confirm-instance';
import { type ConfirmProps, withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import ConfirmModal from './confirm-modal';
import type { ModalReactProps } from './modal';

let uuid = 0;

export interface HookModalRef {
    destroy: () => void;
    update: (newConfig: ModalReactProps) => void;
}

export interface ModalHookApi {
    info: (config: ModalReactProps) => HookModalRef;
    success: (config: ModalReactProps) => HookModalRef;
    error: (config: ModalReactProps) => HookModalRef;
    warning: (config: ModalReactProps) => HookModalRef;
    confirm: (config: ModalReactProps) => HookModalRef;
}

export default function useModal(): [ModalHookApi, ReactElement] {
    const [elements, setElements] = useState<ReactElement[]>([]);

    const api = useMemo(() => {
        const open =
            (withType: (config: ModalReactProps) => ConfirmProps) =>
            (config: ModalReactProps): HookModalRef => {
                uuid += 1;
                const key = `semi-modal-${uuid}`;
                const element = (props: ConfirmProps) => <ConfirmModal key={key} {...props} onMount={instance.handleMount} />;
                const instance = new ConfirmInstance(withType(config), {
                    render: (props) => setElements((list) => list.map((item) => (item.key === key ? element(props) : item))),
                    remove: () => setElements((list) => list.filter((item) => item.key !== key)),
                });
                setElements((list) => [...list, element(instance.props)]);
                return instance.handle;
            };

        return {
            info: open(withInfo),
            success: open(withSuccess),
            error: open(withError),
            warning: open(withWarning),
            confirm: open(withConfirm),
        };
    }, []);

    return [api, <>{elements}</>];
}
