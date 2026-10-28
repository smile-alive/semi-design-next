import type React from 'react';
import { cloneElement, useEffectEvent, useId, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { settleConfirm } from '@fibrae/semi-foundation/modal/confirm';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import '@fibrae/semi-foundation/modal/modal.scss';
import { isSemiIcon } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import type { ConfirmProps } from './confirm';
import Modal from './modal';

// onMount is private to Modal.confirm, which has to know when the first commit happened
export default function ConfirmModal({ title, content, icon, type, onCancel, onOk, onMount, className, direction: directionProp, ...rest }: ConfirmProps & { onMount?: () => void }) {
    // Modal.confirm renders outside any ConfigProvider and passes the direction itself
    const { direction: contextDirection } = useConfigContext();

    const [visible, setVisible] = useState(true);
    const [confirmLoading, setConfirmLoading] = useState<boolean>();
    const [cancelLoading, setCancelLoading] = useState<boolean>();

    const contentId = `${cssClasses.DIALOG}-confirm-content-${useId()}`;
    const direction = directionProp ?? contextDirection;
    const confirmCls = `${cssClasses.DIALOG}-confirm`;
    const wrapperCls = clsx(className, confirmCls);
    const typeCls = clsx(`${cssClasses.DIALOG}-${type}`);

    const iconNode = isSemiIcon(icon)
        ? cloneElement(icon as React.ReactElement<{ size?: string; className?: string }>, {
              className: clsx(`${confirmCls}-icon`, `${typeCls}-icon`, (icon as React.ReactElement<{ className?: string }>).props.className),
              size: icon.props.size ?? 'extra-large',
          })
        : icon;

    const titleNode = title == null ? null : <span className={`${confirmCls}-title-text`}>{title}</span>;

    const contentCls = clsx(`${confirmCls}-content`, {
        [`${confirmCls}-content-withIcon`]: icon,
    });

    const notifyMount = useEffectEvent(() => onMount?.());

    const settle = (result: unknown, setLoading: (loading: boolean) => void) => settleConfirm(result, { setLoading, close: () => setVisible(false) });

    const handleOk = (e: React.MouseEvent) => settle(onOk?.(e), setConfirmLoading);

    const handleCancel = (e: React.MouseEvent | KeyboardEvent) => settle(onCancel?.(e), setCancelLoading);

    useLayoutEffect(() => notifyMount(), []);

    // APG alert dialog: a confirm interrupts and is described by its message
    return (
        <Modal className={wrapperCls} aria-describedby={contentId} role="alertdialog" title={titleNode} cancelLoading={cancelLoading} confirmLoading={confirmLoading} direction={direction} visible={visible} icon={iconNode} onCancel={handleCancel} onOk={handleOk} {...rest}>
            <div id={contentId} className={contentCls} x-semi-prop="content">
                {content}
            </div>
        </Modal>
    );
}
