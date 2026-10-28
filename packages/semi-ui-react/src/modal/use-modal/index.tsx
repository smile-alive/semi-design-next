import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { withConfirm, withError, withInfo, withSuccess, withWarning } from '../confirm';
import type { ModalReactProps } from '../modal';
import HookModal, { type HookModalRef } from './hook-modal';

let uuid = 0;

export interface ModalHookApi {
    info: (config: ModalReactProps) => HookModalRef;
    success: (config: ModalReactProps) => HookModalRef;
    error: (config: ModalReactProps) => HookModalRef;
    warning: (config: ModalReactProps) => HookModalRef;
    confirm: (config: ModalReactProps) => HookModalRef;
}

export default function useModal(): [ModalHookApi, ReactElement] {
    const [elements, setElements] = useState<ReactNode[]>([]);

    const api = useMemo(() => {
        const patchElement = (element: ReactNode) => {
            setElements((originElements) => [...originElements, element]);
            return () => setElements((originElements) => originElements.filter((ele) => ele !== element));
        };

        const getConfirmFunc = (withFunc: typeof withConfirm | typeof withInfo | typeof withSuccess | typeof withError | typeof withWarning): ModalHookApi['confirm'] => {
            return (config) => {
                uuid += 1;

                // calls before the modal mounts wait for the handle
                let handle: HookModalRef | null = null;
                let closed = false;
                const pending: Array<(modal: HookModalRef) => void> = [];
                const run = (operation: (modal: HookModalRef) => void) => {
                    if (closed) {
                        return;
                    }
                    if (handle) {
                        operation(handle);
                    } else {
                        pending.push(operation);
                    }
                };

                let closeFunc: () => void;
                const modal = (
                    <HookModal
                        key={`semi-modal-${uuid}`}
                        ref={(modalHandle) => {
                            handle = modalHandle;
                            if (modalHandle) {
                                for (const operation of pending.splice(0)) {
                                    operation(modalHandle);
                                }
                            }
                        }}
                        afterClose={() => {
                            closed = true;
                            closeFunc();
                        }}
                        config={withFunc(config)}
                    />
                );

                closeFunc = patchElement(modal);

                return {
                    destroy: () => run((modalHandle) => modalHandle.destroy()),
                    update: (newConfig) => run((modalHandle) => modalHandle.update(newConfig)),
                };
            };
        };

        return {
            info: getConfirmFunc(withInfo),
            success: getConfirmFunc(withSuccess),
            error: getConfirmFunc(withError),
            warning: getConfirmFunc(withWarning),
            confirm: getConfirmFunc(withConfirm),
        };
    }, []);

    return [api, <>{elements}</>];
}
