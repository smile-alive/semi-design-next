import { Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { isAlertType } from '@fibrae/semi-foundation/base';
import { cssClasses, getStackLayerTransform, numbers, type ToastPart } from '@fibrae/semi-foundation/components/toast/constants';
import ToastFoundation, { type ToastAdapter, type ToastProps as FoundationToastProps, type ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-solid';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useNoticeClose } from '../../primitives/index';
import { hasContent, createIconSlot, mergeStyles } from '../../utils/index';
import useConfig from '../config-provider/use-config';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import { useToastListContext } from './context';

const prefixCls = cssClasses.PREFIX;

/**
 * An element, or a function the toast calls where it renders. JSX created in an event handler has no owner, so only a
 * function reads the context around a hook's holder.
 */
export type ToastNode = JSX.Element | (() => JSX.Element);

/** Options of one toast; unknown keys such as `data-*` and `dir` land on the toast element (F2) */
export interface ToastProps extends Omit<FoundationToastProps, 'className' | 'content' | 'icon' | 'style'>, ElementProps<'div', 'children' | 'content' | 'onClose' | 'ref' | 'style'> {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
    id?: string;
    /** `icon` lands on the type icon; a custom icon takes its class only when it is a Semi icon, never its style */
    classNames?: Partial<Record<ToastPart, string>>;
    content: ToastNode;
    /** Replaces the icon of `type`; a Semi icon without a size of its own is sized large */
    icon?: ToastNode;
    motion?: boolean;
    style?: JSX.CSSProperties | string;
    styles?: Partial<Record<ToastPart, JSX.CSSProperties | string>>;
}

export interface ToastItemProps extends Omit<ToastProps, 'content' | 'stack'> {
    content?: ToastNode;
    ref?: (element: HTMLDivElement) => void;
    stack?: boolean;
    stackExpanded?: boolean;
    positionInList?: { index: number; length: number };
}

export type { ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';

type Foundation = ToastFoundation<ToastItemProps>;
type Adapter = ToastAdapter<ToastItemProps>;

const defaultProps = {
    content: '',
    duration: numbers.duration,
    textMaxWidth: 450,
    showClose: true,
    stack: false,
    stackExpanded: false,
    theme: 'normal',
} satisfies Partial<ToastItemProps>;

const typeIcons = {
    warning: IconAlertTriangle,
    success: IconTickCircle,
    info: IconInfoCircle,
    error: IconAlertCircle,
};

export default function Toast(rawProps: ToastItemProps) {
    const props = useDefaultProps('Toast', rawProps, defaultProps);

    // list-level options (offsets, zIndex, container) ride along in a toast's options and must stay off the DOM
    const [local, rest] = splitProps(props, [
        'bottom',
        'class',
        'classNames',
        'close',
        'content',
        'dir',
        'direction',
        'duration',
        'getPopupContainer',
        'icon',
        'id',
        'left',
        'motion',
        'onClose',
        'positionInList',
        'right',
        'showClose',
        'stack',
        'stackExpanded',
        'style',
        'styles',
        'textMaxWidth',
        'theme',
        'top',
        'type',
        'zIndex',
    ]);

    const config = useConfig();
    const locale = useLocale('Toast');
    const list = useToastListContext();

    const { foundation } = useFoundation<Foundation, Adapter, ToastItemProps, ToastState>(
        ToastFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyWrapperToRemove: (id) => base.getProps().close?.(id),
            notifyClose: () => base.getProps().onClose?.(),
        })
    );

    const icon = createIconSlot(
        () => local.icon as JSX.Element,
        () => 'large',
        () => clsx(`${prefixCls}-icon`, local.classNames?.icon)
    );

    const isAlert = () => isAlertType(local.type);

    const typeIcon = () => typeIcons[local.type as keyof typeof typeIcons];

    const style = (): JSX.CSSProperties | string => mergeStyles(local.style, { transform: getStackLayerTransform(local.positionInList) });

    useNoticeClose(foundation, list);

    // The wrapper is there without stack too: the list decides stacking from its newest toast, so a toast can switch
    // modes while shown, and a changed element structure would remount it, losing its state and focus.
    return (
        <div
            class={
                clsx({
                    [`${prefixCls}-zero-height-wrapper`]: local.stack,
                    [`${prefixCls}-zero-height-wrapper-expanded`]: local.stack && local.stackExpanded,
                }) || undefined
            }
        >
            <div
                {...rest}
                dir={local.dir ?? (local.direction || config().direction)}
                class={clsx(prefixCls, local.class, `${prefixCls}-${local.type}`, { [`${prefixCls}-light`]: local.theme === 'light' })}
                style={style()}
                aria-label={locale().locale[local.type as keyof ReturnType<typeof locale>['locale']] ?? locale().locale.default}
                // A status element inserted with its text is announced unreliably; the list's live region announces it.
                aria-live={isAlert() ? undefined : 'off'}
                role={isAlert() ? 'alert' : 'status'}
            >
                <div class={clsx(`${prefixCls}-content`, local.classNames?.content)} style={local.styles?.content}>
                    <Show when={hasContent(icon())} fallback={<Dynamic component={typeIcon()} size="large" class={clsx(`${prefixCls}-icon`, `${prefixCls}-icon-${local.type}`, local.classNames?.icon)} style={local.styles?.icon} />}>
                        {icon()}
                    </Show>
                    <span class={clsx(`${prefixCls}-content-text`, local.classNames?.text)} style={mergeStyles({ 'max-width': toCssLength(local.textMaxWidth) }, local.styles?.text)} x-semi-prop="content">
                        {local.content as JSX.Element}
                    </span>
                    <Show when={local.showClose}>
                        <div class={clsx(`${prefixCls}-close-button`, local.classNames?.close)} style={local.styles?.close}>
                            <IconButton type="tertiary" aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose x-semi-prop="icon" />} onClick={foundation.close} />
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
}
