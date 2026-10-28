import '@fibrae/semi-foundation/modal/modal.scss';
import confirm, { destroyAll, withConfirm, withError, withInfo, withSuccess, withWarning } from './confirm';
import ModalBase, { type ModalReactProps } from './modal';
import useModal from './use-modal';

export type { ConfirmProps } from './confirm';
export type { ModalHookApi } from './use-modal';

export type Directions = 'ltr' | 'rtl';

export type { ModalReactProps } from './modal';
export type { ModalState } from '@fibrae/semi-foundation/modal/modal-foundation';

// statics are attached here: confirm -> ConfirmModal -> Modal would form a runtime cycle in modal.tsx
const Modal = Object.assign(ModalBase, {
    useModal,
    info: (props: ModalReactProps) => confirm(withInfo(props)),
    success: (props: ModalReactProps) => confirm(withSuccess(props)),
    error: (props: ModalReactProps) => confirm(withError(props)),
    warning: (props: ModalReactProps) => confirm(withWarning(props)),
    confirm: (props: ModalReactProps) => confirm(withConfirm(props)),
    destroyAll,
});

export default Modal;
