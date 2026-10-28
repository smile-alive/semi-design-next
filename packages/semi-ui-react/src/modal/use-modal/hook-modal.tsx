import type React from 'react';
import { useImperativeHandle, useState } from 'react';
import type { ConfirmProps } from '../confirm';
import ConfirmModal from '../confirm-modal';
import type { ModalReactProps } from '../modal';

interface HookModalProps {
    afterClose: () => void;
    config: ConfirmProps;
    ref?: React.Ref<HookModalRef>;
}

export interface HookModalRef {
    destroy: () => void;
    update: (newConfig: ModalReactProps) => void;
}

export default function HookModal({ ref, afterClose, config }: HookModalProps) {
    const [innerConfig, setInnerConfig] = useState(config);

    // read from the state so update({ afterClose }) takes effect
    const mergeAfterClose = () => {
        innerConfig.afterClose?.();
        afterClose();
    };

    useImperativeHandle(ref, () => ({
        destroy: () => setInnerConfig((originConfig) => ({ ...originConfig, visible: false })),
        update: (newConfig) => setInnerConfig((originConfig) => ({ ...originConfig, ...newConfig })),
    }));

    return <ConfirmModal {...innerConfig} afterClose={mergeAfterClose} />;
}
