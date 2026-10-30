import type React from 'react';
import { type CSSProperties, type ReactNode, useEffect, useId, useInsertionEffect, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import ModalContentFoundation, { type ModalContentAdapter, type ModalContentProps, isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { IconClose } from '@fibrae/semi-icons-react';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import { hasContent } from '../_utils';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';
import Typography from '../typography';

export interface ModalContentReactProps extends ModalContentProps, React.AriaAttributes {
    /** whether the dialog is shown: from opening until the leave animation ends */
    open: boolean;
    children?: React.ReactNode;
    modalRender?: (node: ReactNode) => ReactNode;
    /** Attached to the outer div inside the portal */
    ref?: React.Ref<HTMLDivElement>;
    /** The default footer button (its `data-type`) focused on opening when the content holds no focused element */
    initialFocus?: 'ok' | 'cancel';
    // role and every aria-* land on the dialog element (F12); the other unknown props land on the outer div
    role?: 'dialog' | 'alertdialog';
}

class ModalContentRuntime {
    root: HTMLDivElement | null = null;
    dialog: HTMLDivElement | null = null;
    readonly focusScope = new FocusScope();
    readonly layer = new ReleaseHolder();
    // the first element outside the default footer that held focus when the dialog opened
    bodyFocus: HTMLElement | null = null;

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
        bodyStyle,
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
        maskStyle,
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

    const [foundation] = useFoundation<ModalContentFoundation<ModalContentReactProps, React.MouseEvent>, ModalContentAdapter<ModalContentReactProps, React.MouseEvent>, ModalContentReactProps, Record<string, any>>(
        ModalContentFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyClose: (e) => base.getProps().onClose(e),
            openLayer: (onEscape) => runtime.layer.hold(() => openLayer({ element: runtime.root, modal: isModal(base.getProps()), onEscape })),
            closeLayer: () => runtime.layer.release(),
            trapFocus: () => {
                const { dialog } = runtime;
                const { preventScroll, initialFocus } = base.getProps();
                const footer = dialog.querySelector(`:scope > .${cssClasses.DIALOG}-footer`);
                const active = FocusTrapHandle.getActiveElement(dialog);
                // React's autoFocus acts only on mount, so a keepDOM reopen refocuses the body element the first open
                // focused, else picks the default button; FocusScope would otherwise focus the tabIndex=-1 dialog first.
                // Known limit: keepDOM with lazyRender={false} that starts hidden mounts under display:none, where
                // autoFocus cannot focus, so nothing is remembered and the default button wins.
                if (dialog.contains(active)) {
                    if (!runtime.bodyFocus && active !== dialog && !footer?.contains(active)) {
                        runtime.bodyFocus = active as HTMLElement;
                    }
                } else {
                    FocusTrapHandle.pickInitialFocus(dialog, { remembered: runtime.bodyFocus, footer, initialFocus })?.focus({ preventScroll });
                }
                runtime.focusScope.engage(dialog, isModal(base.getProps()), preventScroll);
            },
            releaseFocus: () => {
                runtime.dialog?.blur();
                runtime.focusScope.deactivate();
            },
            restoreFocus: () => runtime.focusScope.restoreIfAllowed(runtime.dialog, isModal(base.getProps()), base.getProp('preventScroll')),
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

    const isAria = (_: unknown, key: string) => key.startsWith('aria-');

    const dialogAria = pickBy(others, isAria);
    const rest = omitBy(others, isAria);

    // records the opener before the layout phase, where the footer's autoFocus button takes focus
    useInsertionEffect(() => {
        if (open) {
            runtime.focusScope.record();
        }
    }, [open, runtime]);

    // Portal puts its container in the document before this layout effect, so the dialog can take focus
    useLayoutEffect(() => {
        if (!open) {
            return undefined;
        }
        foundation.show();
        return foundation.hide;
    }, [open, foundation]);

    // after the mutation-phase cleanup React refocuses the previously focused element if still in the document
    // (a keepDOM dialog's button), so restore again in the layout phase
    useDidUpdate(open, (isOpen) => {
        if (!isOpen) {
            foundation.restoreFocus();
        }
    });

    useEffect(() => {
        if (open) {
            warnIfDialogUnnamed(runtime.dialog, 'Modal');
        }
    }, [open, runtime]);

    if (hasHeaderProp) {
        headerNode = header;
    } else if (hasTitle) {
        headerNode = (
            <div className={`${cssClasses.DIALOG}-header`}>
                {iconNode}
                {/* h5 look, h2 outline: the sheet's title is level 2 as well */}
                <Typography.Title id={`${dialogId}-title`} component="h2" className={`${cssClasses.DIALOG}-title`} heading={5} x-semi-prop="title">
                    {title}
                </Typography.Title>
                {closer}
            </div>
        );
    }

    const bodyCls = clsx(`${cssClasses.DIALOG}-body`, { [`${cssClasses.DIALOG}-withIcon`]: icon });

    const bodyNode = (
        <div className={bodyCls} style={bodyStyle} x-semi-prop="children">
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
            className={clsx(`${cssClasses.DIALOG}-content`, contentClassName, {
                [`${cssClasses.DIALOG}-content-fullScreen`]: isFullScreen,
                [`${cssClasses.DIALOG}-content-height-set`]: height || style?.height,
            })}
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
                <div className={`${cssClasses.DIALOG}-footer`} x-semi-prop="footer">
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
            {mask && <div key="mask" {...maskExtraProps} className={clsx(`${cssClasses.DIALOG}-mask`, maskClassName)} style={maskStyle} />}
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
