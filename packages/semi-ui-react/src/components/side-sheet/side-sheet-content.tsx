import type React from 'react';
import { type CSSProperties, type ReactNode, useId } from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses, type SideSheetPart } from '@fibrae/semi-foundation/components/side-sheet/constants';
import type { SheetSize, SideSheetProps } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';
import { isAriaKey } from '@fibrae/semi-foundation/utils';
import { IconClose } from '@fibrae/semi-icons-react';
import { hasContent } from '../../utils/index';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface SideSheetContentProps extends React.AriaAttributes {
    onClose?: (e: React.MouseEvent | KeyboardEvent) => void;
    closeIcon?: ReactNode;
    mask?: boolean;
    /** The sheet blocks the whole page (a mask in body); drives the default of aria-modal */
    modal?: boolean;
    maskClosable?: boolean;
    title?: React.ReactNode;
    closable?: boolean;
    sheetSize: SheetSize;
    style: CSSProperties;
    size: SideSheetProps['size'];
    className: string;
    classNames?: Partial<Record<SideSheetPart, string>>;
    styles?: Partial<Record<SideSheetPart, CSSProperties>>;
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
    maskClosable,
    title,
    closable,
    sheetSize,
    style,
    size,
    className,
    classNames,
    styles,
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

    const isAria = (_: unknown, key: string) => isAriaKey(key);

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
            {mask && <div className={clsx(`${prefixCls}-mask`, classNames?.mask)} style={styles?.mask} aria-hidden onClick={maskClosable ? onMaskClick : undefined} {...maskExtraProps} />}
            <div
                {...dialogAria}
                ref={dialogRef}
                className={clsx(`${prefixCls}-inner`, `${prefixCls}-inner-wrap`, `${prefixCls}-size-${size}`, classNames?.content)}
                style={{ ...style, ...styles?.content, ...dialogStyle }}
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
                    <div className={clsx(`${prefixCls}-header`, classNames?.header)} style={styles?.header}>
                        {hasTitle && (
                            <div id={titleId} className={`${prefixCls}-title`} aria-level={2} role="heading" x-semi-prop="title">
                                {title}
                            </div>
                        )}
                        {closable && <Button type="tertiary" className={`${prefixCls}-close`} aria-label={locale.close} size="small" theme="borderless" icon={closeIcon || <IconClose />} onClick={onClose} />}
                    </div>
                    <div className={clsx(`${prefixCls}-body`, classNames?.body)} style={styles?.body} x-semi-prop="children">
                        {children}
                    </div>
                    {hasFooter && (
                        <div className={clsx(`${prefixCls}-footer`, classNames?.footer)} style={styles?.footer} x-semi-prop="footer">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
