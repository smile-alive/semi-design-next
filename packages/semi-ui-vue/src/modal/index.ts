import confirm, { destroyAll, install, withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import type { ModalConfirmProps } from './interface';
import ModalBase from './modal.vue';
import useModal from './use-modal';

export type * from './interface';

// not in modal.vue: confirm -> ConfirmModal -> Modal would import back into Modal
const Modal: typeof ModalBase & {
    useModal: typeof useModal;
    info: (props: ModalConfirmProps) => ReturnType<typeof confirm>;
    success: (props: ModalConfirmProps) => ReturnType<typeof confirm>;
    error: (props: ModalConfirmProps) => ReturnType<typeof confirm>;
    warning: (props: ModalConfirmProps) => ReturnType<typeof confirm>;
    confirm: (props: ModalConfirmProps) => ReturnType<typeof confirm>;
    destroyAll: typeof destroyAll;
    /** Optional: static confirms (and the other static APIs) then render with this app's context. */
    install: typeof install;
} = Object.assign(ModalBase, {
    useModal,
    info: (props: ModalConfirmProps) => confirm(withInfo(props)),
    success: (props: ModalConfirmProps) => confirm(withSuccess(props)),
    error: (props: ModalConfirmProps) => confirm(withError(props)),
    warning: (props: ModalConfirmProps) => confirm(withWarning(props)),
    confirm: (props: ModalConfirmProps) => confirm(withConfirm(props)),
    destroyAll,
    install,
});
export default Modal;
