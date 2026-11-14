import type React from 'react';
import { type CSSProperties, type ReactNode, useId, useState } from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses, type ModalPart } from '@fibrae/semi-foundation/components/modal/constants';
import ModalContentFoundation, { type ModalContentAdapter, type ModalContentProps, isModal } from '@fibrae/semi-foundation/components/modal/modal-content-foundation';
import { isAriaKey } from '@fibrae/semi-foundation/utils';
import { IconClose } from '@fibrae/semi-icons-react';
import { useFoundation } from '../../base/index';
import { useMergedRef, useOverlayResources } from '../../hooks/index';
import { hasContent } from '../../utils/index';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

type Foundation = ModalContentFoundation<ModalContentReactProps, React.MouseEvent>;
type Adapter = ModalContentAdapter<ModalContentReactProps, React.MouseEvent>;

export interface ModalContentReactProps extends ModalContentProps, React.AriaAttributes {
    /** whether the dialog is shown: from opening until the leave animation ends */
    open: boolean;
    onClose: (e: React.MouseEvent | KeyboardEvent) => void;
    children?: React.ReactNode;
    modalRender?: (node: ReactNode) => ReactNode;
    /** Attached to the outer div inside the portal */
    ref?: React.Ref<HTMLDivElement>;
    // role and every aria-* land on the dialog element (F12); the other unknown props land on the outer div
    role?: 'dialog' | 'alertdialog';
    classNames?: Partial<Record<ModalPart, string>>;
    styles?: Partial<Record<ModalPart, CSSProperties>>;
}

class ModalContentRuntime {
    root: HTMLDivElement | null = null;
    dialog: HTMLDivElement | null = null;

    readonly attachRoot = (node: HTMLDivElement | null) => {
        this.root = node;
    };

    readonly attachDialog = (node: HTMLDivElement | null) => {
        this.dialog = node;
    };
}

export default function ModalContent(props: ModalContentReactProps) {
    const {
        ref,
        open,
        onClose,
        isFullScreen,
        contentClassName,
        maskClassName,
        maskExtraProps,
        contentExtraProps,
        children,
        modalRender,
        classNames,
        styles,
        centered,
        className,
        closable,
        closeIcon,
        closeOnEsc,
        footer,
        header,
        height,
        icon,
        mask,
        maskClosable,
        maskFixed,
        inBody,
        preventScroll,
        size,
        style,
        title,
        width,
        initialFocus,
        direction,
        role,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        'aria-modal': ariaModal,
        ...others
    } = props;

    const { locale } = useLocale('Modal');

    const [runtime] = useState(() => new ModalContentRuntime());
    let headerNode: ReactNode = null;

    const [foundation] = useFoundation<Foundation, Adapter, ModalContentReactProps, Record<string, any>>(
        ModalContentFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyClose: (e) => base.getProps().onClose(e),
            getRoot: () => runtime.root,
            getDialog: () => runtime.dialog,
        })
    );

    const dialogId = `dialog-${useId()}`;

    // destructured so the runtime itself never sits in a ref position (the Compiler would treat it as a ref)
    const { attachRoot, attachDialog } = runtime;
    const rootRef = useMergedRef(ref, attachRoot);
    const closer = closable ? <Button key="close-btn" type="tertiary" className={`${cssClasses.DIALOG}-close`} aria-label={locale.close} size="small" theme="borderless" icon={closeIcon || <IconClose x-semi-prop="closeIcon" />} onClick={foundation.close} /> : null;

    const iconNode = icon ? (
        <span className={`${cssClasses.DIALOG}-icon-wrapper`} x-semi-prop="icon">
            {icon}
        </span>
    ) : null;

    const hasHeaderProp = header !== undefined;
    const hasTitle = title != null;

    const isAria = (_: unknown, key: string) => isAriaKey(key);

    const dialogAria = pickBy(others, isAria);
    const rest = omitBy(others, isAria);

    // Portal puts its container in the document before the layout effects, so the dialog can take focus
    useOverlayResources(foundation, open);

    if (hasHeaderProp) {
        headerNode = header;
    } else if (hasTitle) {
        headerNode = (
            <div className={clsx(`${cssClasses.DIALOG}-header`, classNames?.header)} style={styles?.header}>
                {iconNode}
                {/* h5 look, h2 outline: the sheet's title is level 2 as well */}
                <Typography.Title id={`${dialogId}-title`} component="h2" className={`${cssClasses.DIALOG}-title`} heading={5} x-semi-prop="title">
                    {title}
                </Typography.Title>
                {closer}
            </div>
        );
    }

    const bodyCls = clsx(`${cssClasses.DIALOG}-body`, { [`${cssClasses.DIALOG}-withIcon`]: icon }, classNames?.body);

    const bodyNode = (
        <div className={bodyCls} style={styles?.body} x-semi-prop="children">
            {children}
        </div>
    );

    const dialogStyle: CSSProperties = {};

    if (width) {
        dialogStyle.width = width;
    }

    if (height) {
        dialogStyle.height = height;
    }

    if (isFullScreen) {
        dialogStyle.width = '100%';
        dialogStyle.height = '100%';
        dialogStyle.margin = 'unset';
    }

    const modalContentElement = (
        <div
            {...dialogAria}
            ref={attachDialog}
            className={clsx(
                `${cssClasses.DIALOG}-content`,
                contentClassName,
                {
                    [`${cssClasses.DIALOG}-content-fullScreen`]: isFullScreen,
                    [`${cssClasses.DIALOG}-content-height-set`]: height || style?.height,
                },
                classNames?.content
            )}
            style={styles?.content}
            // no default description: a rich body would be read out whole
            aria-describedby={ariaDescribedby}
            aria-label={ariaLabel}
            // the title exists only in the default header; an aria-label must not be shadowed by a generated reference
            aria-labelledby={ariaLabelledby ?? (!ariaLabel && !hasHeaderProp && hasTitle ? `${dialogId}-title` : undefined)}
            aria-modal={ariaModal ?? (isModal(props) ? 'true' : undefined)}
            role={role ?? 'dialog'}
            tabIndex={-1}
            // the animation class is on this element, so its events bind here
            {...contentExtraProps}
        >
            {headerNode}
            {hasTitle || hasHeaderProp ? (
                bodyNode
            ) : (
                <div className={`${cssClasses.DIALOG}-body-wrapper`}>
                    {iconNode}
                    {bodyNode}
                    {closer}
                </div>
            )}
            {hasContent(footer) && (
                <div className={clsx(`${cssClasses.DIALOG}-footer`, classNames?.footer)} style={styles?.footer} x-semi-prop="footer">
                    {footer}
                </div>
            )}
        </div>
    );

    return (
        <div
            // the portal carries the context direction; the Modal's own direction overrides it
            dir={direction}
            {...rest}
            ref={rootRef}
            className={clsx(className, {
                [`${cssClasses.DIALOG}-no-mask`]: !mask,
                [`${cssClasses.DIALOG}-popup`]: !inBody && !maskFixed,
                [`${cssClasses.DIALOG}-fixed`]: maskFixed,
            })}
        >
            {mask && <div key="mask" {...maskExtraProps} className={clsx(`${cssClasses.DIALOG}-mask`, maskClassName, classNames?.mask)} style={styles?.mask} />}
            <div className={clsx(`${cssClasses.DIALOG}-wrap`, { [`${cssClasses.DIALOG}-wrap-center`]: centered })} role="none" onClick={maskClosable ? (e) => foundation.handleMaskClick(e) : undefined} onMouseUp={maskClosable ? () => foundation.handleMaskMouseUp() : undefined}>
                <div
                    key="dialog-element"
                    id={dialogId}
                    className={clsx(cssClasses.DIALOG, {
                        [`${cssClasses.DIALOG}-centered`]: centered,
                        [`${cssClasses.DIALOG}-${size}`]: size,
                    })}
                    style={{ ...style, ...dialogStyle }}
                    // only the mask's mouseup clears the mark, so mark only while it listens
                    onMouseDown={maskClosable ? () => foundation.handleDialogMouseDown() : undefined}
                >
                    {modalRender ? modalRender(modalContentElement) : modalContentElement}
                </div>
            </div>
        </div>
    );
}
