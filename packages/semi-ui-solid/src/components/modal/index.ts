import confirm, { destroyAll, withType } from './confirm';
import ModalBase, { type ModalProps } from './modal';
import useModal from './use-modal';

export type { ConfirmProps, ModalHookRef } from './confirm';
export type { ModalButtonProps, ModalProps, ModalState } from './modal';
export type { ModalHookApi } from './use-modal';

// statics are attached here: confirm -> ConfirmModal -> Modal would form a runtime cycle in modal.tsx
const Modal = Object.assign(ModalBase, {
    useModal,
    info: (props: ModalProps) => confirm(withType('info', props)),
    success: (props: ModalProps) => confirm(withType('success', props)),
    error: (props: ModalProps) => confirm(withType('error', props)),
    warning: (props: ModalProps) => confirm(withType('warning', props)),
    confirm: (props: ModalProps) => confirm(withType('confirm', props)),
    destroyAll,
});

export default Modal;
