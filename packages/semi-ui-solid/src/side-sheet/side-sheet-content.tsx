import { type JSX, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/side-sheet/constants';
import type { SheetSize } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import { IconClose } from '@fibrae/semi-icons-solid';
import { splitControlAttrs } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeStyles from '../_base/merge-styles';
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
    maskStyle?: Style;
    maskClosable?: boolean;
    maskClass?: string;
    title?: JSX.Element;
    closable?: boolean;
    headerStyle?: Style;
    sheetSize: SheetSize;
    /** On the role="dialog" element */
    style?: Style;
    size?: 'small' | 'medium' | 'large';
    bodyStyle?: Style;
    dialogClass?: string;
    footer?: JSX.Element;
    /** Attached to the mask */
    maskRef?: (element: HTMLDivElement) => void;
    /** Attached to the role="dialog" element */
    dialogRef?: (element: HTMLDivElement) => void;
}

const isAriaKey = (key: string): key is `aria-${string}` => key.startsWith('aria-');

export default function SideSheetContent(props: SideSheetContentProps) {
    const [local, others] = splitProps(props, ['bodyStyle', 'children', 'class', 'closable', 'closeIcon', 'dialogClass', 'dialogRef', 'footer', 'headerStyle', 'mask', 'maskClass', 'maskClosable', 'maskRef', 'maskStyle', 'modal', 'onClose', 'ref', 'sheetSize', 'size', 'style', 'title']);

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
        return mergeStyles(local.style, size);
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
                <div ref={local.maskRef} class={clsx(`${prefixCls}-mask`, local.maskClass)} style={local.maskStyle} aria-hidden="true" onClick={onMaskClick} />
            </Show>
            <div
                {...dialogAria}
                ref={local.dialogRef}
                class={clsx(`${prefixCls}-inner`, `${prefixCls}-inner-wrap`, local.dialogClass, `${prefixCls}-size-${local.size}`)}
                style={dialogStyle()}
                // a generated reference would shadow aria-label
                aria-labelledby={dialogAria['aria-labelledby'] ?? (!dialogAria['aria-label'] && hasTitle() ? titleId : undefined)}
                aria-modal={dialogAria['aria-modal'] ?? (local.modal ? 'true' : undefined)}
                role="dialog"
                tabIndex={-1}
            >
                <div class={`${prefixCls}-content`}>
                    <div class={`${prefixCls}-header`} style={local.headerStyle}>
                        <Show when={hasTitle()}>
                            <div id={titleId} class={`${prefixCls}-title`} aria-level={2} role="heading" x-semi-prop="title">
                                {title()}
                            </div>
                        </Show>
                        <Show when={local.closable}>
                            <IconButton type="tertiary" class={`${prefixCls}-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={closeIcon() || <IconClose />} onClick={local.onClose} />
                        </Show>
                    </div>
                    <div class={`${prefixCls}-body`} style={local.bodyStyle} x-semi-prop="children">
                        {local.children}
                    </div>
                    <Show when={hasContent(footer())}>
                        <div class={`${prefixCls}-footer`} x-semi-prop="footer">
                            {footer()}
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}
