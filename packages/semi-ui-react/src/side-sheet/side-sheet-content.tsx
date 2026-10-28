import type React from 'react';
import { type CSSProperties, type ReactNode, useId } from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/side-sheet/constants';
import type { SheetSize, SideSheetProps } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';
import { IconClose } from '@fibrae/semi-icons-react';
import { hasContent } from '../_utils';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface SideSheetContentProps extends React.AriaAttributes {
    onClose?: (e: React.MouseEvent | KeyboardEvent) => void;
    closeIcon?: ReactNode;
    mask?: boolean;
    /** The sheet blocks the whole page (a mask in body); drives the default of aria-modal */
    modal?: boolean;
    maskStyle?: CSSProperties;
    maskClosable?: boolean;
    maskClassName?: string;
    title?: React.ReactNode;
    closable?: boolean;
    headerStyle?: CSSProperties;
    sheetSize: SheetSize;
    style: CSSProperties;
    size: SideSheetProps['size'];
    bodyStyle?: CSSProperties;
    className: string;
    dialogClassName?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    maskExtraProps?: { [key: string]: any };
    wrapperExtraProps?: { [key: string]: any };
    /** Attached to the wrapper div */
    ref?: React.Ref<HTMLDivElement>;
    /** Attached to the role="dialog" element */
    dialogRef?: React.Ref<HTMLDivElement>;
}

export default function SideSheetContent({
    ref,
    dialogRef,
    onClose,
    closeIcon,
    mask,
    modal,
    maskStyle,
    maskClosable,
    maskClassName,
    title,
    closable,
    headerStyle,
    sheetSize,
    style,
    size,
    bodyStyle,
    className,
    dialogClassName,
    children,
    footer,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-modal': ariaModal,
    maskExtraProps,
    wrapperExtraProps,
    ...others
}: SideSheetContentProps) {
    const { locale } = useLocale('SideSheet');

    const titleId = useId();

    // 0 is a valid ReactNode and must render
    const hasTitle = hasContent(title);
    const hasFooter = hasContent(footer);
    const dialogStyle: CSSProperties = { ...(sheetSize.dialogWidth ? { width: sheetSize.dialogWidth } : {}), height: sheetSize.dialogHeight };

    const isAria = (_: unknown, key: string) => key.startsWith('aria-');

    const dialogAria = pickBy(others, isAria);
    const rest = omitBy(others, isAria);

    const onMaskClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose?.(e);
        }
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={clsx(className, {
                [`${prefixCls}-fixed`]: !mask,
                [`${prefixCls}-size-${size}`]: !mask,
            })}
            style={{ width: sheetSize.rootWidth }}
        >
            {mask && <div className={clsx(`${prefixCls}-mask`, maskClassName)} style={maskStyle} aria-hidden onClick={maskClosable ? onMaskClick : undefined} {...maskExtraProps} />}
            <div
                {...dialogAria}
                ref={dialogRef}
                className={clsx(`${prefixCls}-inner`, `${prefixCls}-inner-wrap`, dialogClassName, `${prefixCls}-size-${size}`)}
                style={{ ...style, ...dialogStyle }}
                aria-describedby={ariaDescribedby}
                aria-label={ariaLabel}
                // a generated reference would shadow aria-label
                aria-labelledby={ariaLabelledby ?? (!ariaLabel && hasTitle ? titleId : undefined)}
                aria-modal={ariaModal ?? (modal ? 'true' : undefined)}
                role="dialog"
                tabIndex={-1}
                {...wrapperExtraProps}
            >
                <div className={`${prefixCls}-content`}>
                    <div className={`${prefixCls}-header`} style={headerStyle}>
                        {hasTitle && (
                            <div id={titleId} className={`${prefixCls}-title`} aria-level={2} role="heading" x-semi-prop="title">
                                {title}
                            </div>
                        )}
                        {closable && <Button type="tertiary" className={`${prefixCls}-close`} aria-label={locale.close} size="small" theme="borderless" icon={closeIcon || <IconClose />} onClick={onClose} />}
                    </div>
                    <div className={`${prefixCls}-body`} style={bodyStyle} x-semi-prop="children">
                        {children}
                    </div>
                    {hasFooter && (
                        <div className={`${prefixCls}-footer`} x-semi-prop="footer">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
