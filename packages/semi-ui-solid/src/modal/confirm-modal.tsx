import { createRenderEffect, createSignal, createUniqueId, onCleanup, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type ConfirmType, settleConfirm } from '@fibrae/semi-foundation/modal/confirm';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import { IconAlertCircle, IconAlertTriangle, IconHelpCircle, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import useConfig from '../config-provider/use-config';
import Modal, { type ModalProps } from './modal';

export interface ConfirmProps extends ModalProps {
    type: ConfirmType;
}

const defaultIcons = {
    info: IconInfoCircle,
    success: IconTickCircle,
    warning: IconAlertTriangle,
    error: IconAlertCircle,
    confirm: IconHelpCircle,
};

const confirmCls = `${cssClasses.DIALOG}-confirm`;

export default function ConfirmModal(props: ConfirmProps) {
    const [local, rest] = splitProps(props, ['title', 'content', 'icon', 'type', 'onCancel', 'onOk', 'class', 'direction']);

    // Modal.confirm renders outside any ConfigProvider and passes the direction itself
    const config = useConfig();

    const [visible, setVisible] = createSignal(true);
    const [confirmLoading, setConfirmLoading] = createSignal<boolean>();
    const [cancelLoading, setCancelLoading] = createSignal<boolean>();

    const contentId = `${confirmCls}-content-${createUniqueId()}`;

    // `null` removes the icon; only an omitted one takes the type's default
    const icon = createIconSlot(
        () => (local.icon === undefined ? <Dynamic component={defaultIcons[local.type]} /> : local.icon),
        () => 'extra-large'
    );

    const settle = (result: unknown, setLoading: (loading: boolean) => void) => settleConfirm(result, { setLoading, close: () => setVisible(false) });

    // the type colors only a Semi icon, which a custom element cannot be recognized as otherwise
    createRenderEffect(() => {
        const tokens = [`${confirmCls}-icon`, `${cssClasses.DIALOG}-${local.type}-icon`];
        const nodes = icon.toArray().filter((node): node is Element => node instanceof Element && node.classList.contains(`${BASE_CLASS_PREFIX}-icon`));
        for (const node of nodes) {
            node.classList.add(...tokens);
        }
        onCleanup(() => {
            for (const node of nodes) {
                node.classList.remove(...tokens);
            }
        });
    });

    // APG alert dialog: a confirm interrupts and is described by its message
    return (
        <Modal
            class={clsx(local.class, confirmCls)}
            aria-describedby={contentId}
            role="alertdialog"
            title={local.title == null ? local.title : <span class={`${confirmCls}-title-text`}>{local.title}</span>}
            cancelLoading={cancelLoading()}
            confirmLoading={confirmLoading()}
            direction={local.direction ?? config().direction}
            visible={visible()}
            icon={icon()}
            onCancel={(e) => settle(local.onCancel?.(e), setCancelLoading)}
            onOk={(e) => settle(local.onOk?.(e), setConfirmLoading)}
            {...rest}
        >
            <div id={contentId} class={clsx(`${confirmCls}-content`, { [`${confirmCls}-content-withIcon`]: hasContent(icon()) })} x-semi-prop="content">
                {local.content}
            </div>
        </Modal>
    );
}
