import confirm, { destroyAll, withType } from './confirm.svelte.js';
import type { ModalConfirmProps } from './interface.js';
import ModalBase from './modal.svelte';
import useModal from './use-modal.js';

const typed = (type: Parameters<typeof withType>[0]) => (props: ModalConfirmProps) => confirm(withType(type, props));

// Svelte components are functions, so the static methods attach to the component itself
export const Modal = Object.assign(ModalBase, {
    useModal,
    info: typed('info'),
    success: typed('success'),
    error: typed('error'),
    warning: typed('warning'),
    confirm: typed('confirm'),
    destroyAll,
});

export type { ConfirmType as ModalConfirmType, Directions as ModalDirections, ModalButtonProps, ModalConfirmProps, ModalHandle, ModalHookApi, ModalHookRef, ModalNode, ModalProps, ModalSize, ModalState, OKType as ModalOKType } from './interface.js';
