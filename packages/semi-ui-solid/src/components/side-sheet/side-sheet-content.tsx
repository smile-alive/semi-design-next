import { type JSX, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type SideSheetPart } from '@fibrae/semi-foundation/components/side-sheet/constants';
import type { SheetSize } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';
import { isAriaKey, toCssLength } from '@fibrae/semi-foundation/utils';
import { IconClose } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../../base/index';
import { splitControlAttrs, hasContent, mergeStyles } from '../../utils/index';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

type Style = JSX.CSSProperties | string;

export interface SideSheetContentProps extends ElementProps<'div', 'onClose' | 'style' | 'title'> {
    onClose: (e: MouseEvent) => void;
    closeIcon?: JSX.Element;
    mask?: boolean;
    /** The sheet blocks the whole page (a mask in body); drives the default of aria-modal */
    modal?: boolean;
    maskClosable?: boolean;
    title?: JSX.Element;
    closable?: boolean;
    sheetSize: SheetSize;
    /** On the role="dialog" element */
    style?: Style;
    size?: 'small' | 'medium' | 'large';
    classNames?: Partial<Record<SideSheetPart, string>>;
    styles?: Partial<Record<SideSheetPart, Style>>;
    footer?: JSX.Element;
    /** Attached to the mask */
    maskRef?: (element: HTMLDivElement) => void;
    /** Attached to the role="dialog" element */
    dialogRef?: (element: HTMLDivElement) => void;
}

export default function SideSheetContent(props: SideSheetContentProps) {
    const [local, others] = splitProps(props, ['children', 'class', 'classNames', 'closable', 'closeIcon', 'dialogRef', 'footer', 'mask', 'maskClosable', 'maskRef', 'modal', 'onClose', 'ref', 'sheetSize', 'size', 'style', 'styles', 'title']);

    // F12: aria-* name and describe the dialog, the rest stays on the outer element
    const [dialogAria, rest] = splitControlAttrs(others, isAriaKey);

    const locale = useLocale('SideSheet');

    const titleId = createUniqueId();

    const title = children(() => local.title);
    const footer = children(() => local.footer);
    const closeIcon = children(() => (local.closable ? local.closeIcon : undefined));

    // 0 is a valid title and must render
    const hasTitle = () => hasContent(title());

    const rootStyle = (): JSX.CSSProperties => (local.sheetSize.rootWidth ? { width: toCssLength(local.sheetSize.rootWidth) } : {});

    const dialogStyle = () => {
        const { dialogWidth, dialogHeight } = local.sheetSize;
        const size: JSX.CSSProperties = { ...(dialogWidth ? { width: toCssLength(dialogWidth) } : {}), height: toCssLength(dialogHeight) };
        // the computed size wins over the consumer's style
        return mergeStyles(local.style, local.styles?.content, size);
    };

    const onMaskClick = (event: MouseEvent) => {
        if (local.maskClosable && event.target === event.currentTarget) {
            local.onClose(event);
        }
    };

    return (
        <div
            {...rest}
            ref={local.ref}
            class={clsx(local.class, {
                [`${prefixCls}-fixed`]: !local.mask,
                [`${prefixCls}-size-${local.size}`]: !local.mask,
            })}
            style={rootStyle()}
        >
            <Show when={local.mask}>
                <div ref={local.maskRef} class={clsx(`${prefixCls}-mask`, local.classNames?.mask)} style={local.styles?.mask} aria-hidden="true" onClick={onMaskClick} />
            </Show>
            <div
                {...dialogAria}
                ref={local.dialogRef}
                class={clsx(`${prefixCls}-inner`, `${prefixCls}-inner-wrap`, `${prefixCls}-size-${local.size}`, local.classNames?.content)}
                style={dialogStyle()}
                // a generated reference would shadow aria-label
                aria-labelledby={dialogAria['aria-labelledby'] ?? (!dialogAria['aria-label'] && hasTitle() ? titleId : undefined)}
                aria-modal={dialogAria['aria-modal'] ?? (local.modal ? 'true' : undefined)}
                role="dialog"
                tabIndex={-1}
            >
                <div class={`${prefixCls}-content`}>
                    <div class={clsx(`${prefixCls}-header`, local.classNames?.header)} style={local.styles?.header}>
                        <Show when={hasTitle()}>
                            <div id={titleId} class={`${prefixCls}-title`} aria-level={2} role="heading" x-semi-prop="title">
                                {title()}
                            </div>
                        </Show>
                        <Show when={local.closable}>
                            <IconButton type="tertiary" class={`${prefixCls}-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={closeIcon() || <IconClose />} onClick={local.onClose} />
                        </Show>
                    </div>
                    <div class={clsx(`${prefixCls}-body`, local.classNames?.body)} style={local.styles?.body} x-semi-prop="children">
                        {local.children}
                    </div>
                    <Show when={hasContent(footer())}>
                        <div class={clsx(`${prefixCls}-footer`, local.classNames?.footer)} style={local.styles?.footer} x-semi-prop="footer">
                            {footer()}
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}
