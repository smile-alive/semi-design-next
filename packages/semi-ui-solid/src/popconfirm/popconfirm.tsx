import { type JSX, type Ref, Show, children, createEffect, createMemo, createRenderEffect, createSignal, createUniqueId, mergeProps, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/popconfirm/constants';
import PopconfirmFoundation, { type PopconfirmAdapter } from '@fibrae/semi-foundation/popconfirm/popconfirm-foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/popconfirm/popconfirm.scss';
import { IconAlertTriangle, IconClose } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Button, { type ButtonProps, type Type as ButtonType } from '../button';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover';
import { type GetTriggerProps, PopupContent, type RenderContentProps } from '../tooltip';

/** `autoFocus` only selects the initially focused button, so it never reaches the DOM */
export interface PopconfirmButtonProps extends ButtonProps {
    autoFocus?: boolean;
}

export interface PopconfirmProps extends PopoverProps {
    cancelText?: string;
    cancelButtonProps?: PopconfirmButtonProps;
    cancelType?: ButtonType;
    /** On the card (`.semi-popconfirm`), not the popup */
    class?: string;
    /** On the card (`.semi-popconfirm`), not the popup */
    style?: JSX.CSSProperties | string;
    defaultVisible?: boolean;
    disabled?: boolean;
    /** `null` or `false` shows no icon; left out, the warning icon */
    icon?: JSX.Element;
    okText?: string;
    okType?: ButtonType;
    okButtonProps?: PopconfirmButtonProps;
    title?: JSX.Element;
    showCloseIcon?: boolean;
    /**
     * Receives the button's native click event; a returned Promise keeps the button loading until it settles. Any
     * other return is ignored, so `() => setVisible(false)` type-checks although a setter returns its value.
     */
    onCancel?: (e: MouseEvent) => unknown;
    onConfirm?: (e: MouseEvent) => unknown;
}

export interface PopconfirmHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
}

export interface PopconfirmState {
    visible: boolean;
    cancelLoading: boolean;
    confirmLoading: boolean;
}

type Foundation = PopconfirmFoundation<PopconfirmProps, PopconfirmState>;
type Adapter = PopconfirmAdapter<PopconfirmProps, PopconfirmState>;

const defaultProps = {
    // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
    role: 'dialog',
    stopPropagation: true,
    trigger: 'click',
    disabled: false,
    okType: 'primary',
    cancelType: 'tertiary',
    prefixCls: cssClasses.PREFIX,
    showCloseIcon: true,
} satisfies Partial<PopconfirmProps>;

// A disabled Popconfirm is only its trigger: the function form gets the own props back untouched
const passthrough: GetTriggerProps = (own = {} as never) => own as never;

interface FooterButtonProps {
    kind: 'cancel' | 'ok';
    own: PopconfirmButtonProps | undefined;
    type: ButtonType | undefined;
    pending: boolean;
    onPress: (event: MouseEvent) => void;
    children: JSX.Element;
}

function FooterButton(props: FooterButtonProps) {
    const own = mergeProps(() => props.own);
    const [local, rest] = splitProps(own, ['autoFocus', 'loading', 'onClick']);

    // data-type locates the button for focus; a pending callback keeps its loading over the user's
    return (
        <Button
            type={props.type}
            theme={props.kind === 'ok' ? 'solid' : undefined}
            {...rest}
            data-type={props.kind}
            loading={props.pending || local.loading}
            onClick={(event) => {
                callHandler(local.onClick, event);
                props.onPress(event);
            }}
        >
            {props.children}
        </Button>
    );
}

export default function Popconfirm(rawProps: PopconfirmProps & { ref?: Ref<PopconfirmHandle> }) {
    const props = useDefaultProps('Popconfirm', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'aria-labelledby',
        'cancelButtonProps',
        'cancelText',
        'cancelType',
        'children',
        'class',
        'content',
        'defaultVisible',
        'disabled',
        'icon',
        'okButtonProps',
        'okText',
        'okType',
        'onCancel',
        'onConfirm',
        'onVisibleChange',
        'position',
        'prefixCls',
        'ref',
        'showCloseIcon',
        'style',
        'title',
        'visible',
    ]);

    const locale = useLocale('Popconfirm');
    const config = useConfig();

    let popover: PopoverHandle | undefined;
    let footer: HTMLDivElement | undefined;

    // Tooltip mounts the card only after `visible` turns true, so the focus request waits for the footer to exist
    let pendingFocus: 'cancel' | 'ok' | null = null;

    // the card reports which parts it rendered; the dialog's name and description point at them
    const [titled, setTitled] = createSignal(false);
    const [bodied, setBodied] = createSignal(false);

    const titleId = `${createUniqueId()}-title`;
    const contentId = `${titleId}-content`;
    const ref = props.ref;

    const focusButton = (type: 'cancel' | 'ok') => {
        const button = footer?.querySelector<HTMLElement>(`[data-type=${type}]`);
        if (button) {
            button.focus({ preventScroll: true });
        } else {
            pendingFocus = type;
        }
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, PopconfirmProps, PopconfirmState>(
        PopconfirmFoundation,
        props,
        () => ({ cancelLoading: false, confirmLoading: false, visible: props.defaultVisible || false }),
        (base) => ({
            setVisible: (visible) => base.setState({ visible }),
            updateConfirmLoading: (confirmLoading) => base.setState({ confirmLoading }),
            updateCancelLoading: (cancelLoading) => base.setState({ cancelLoading }),
            notifyConfirm: (event) => props.onConfirm?.(event),
            notifyCancel: (event) => props.onCancel?.(event),
            notifyVisibleChange: (visible) => props.onVisibleChange?.(visible),
            focusCancelButton: () => focusButton('cancel'),
            focusOkButton: () => focusButton('ok'),
            focusPrevFocusElement: () => {
                pendingFocus = null;
                // focus that already left the card (Tab away from a focus trigger) stays where it went
                if (FocusTrapHandle.shouldRestoreFocus(footer?.closest('[popover]'), false)) {
                    popover?.focusTrigger();
                }
            },
        })
    );

    // by value: a state write notifies even when equal, and handlePopupClose writes the state
    const open = createMemo(() => (props.visible !== undefined ? props.visible : state().visible));

    // the title names the dialog; without one, the content is the question being confirmed
    const labelledBy = () => {
        if (local['aria-labelledby'] || props['aria-label']) {
            return local['aria-labelledby'];
        }
        return titled() ? titleId : bodied() ? contentId : undefined;
    };

    const defaultPosition = () => (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    // As Tooltip's renderTrigger: children() reads the getter once and unwraps JSX compiled to an accessor (Show, For),
    // so a function still left is the trigger render function, called untracked like Tooltip calls it. The memo keeps
    // its output: insert() reads a returned For or Show in the same scope, so a plain accessor would call it again
    const disabledTrigger = () => {
        const resolved = children(() => local.children as JSX.Element);
        const output = createMemo(() => {
            const value = resolved() as unknown;
            return typeof value === 'function' ? untrack(() => (value as (get: GetTriggerProps) => JSX.Element)(passthrough)) : (value as JSX.Element);
        });
        return <>{output()}</>;
    };

    const renderCard = (renderProps: RenderContentProps) => {
        let card: HTMLDivElement | undefined;
        const icon = children(() => {
            const value = local.icon;
            return value === undefined ? <IconAlertTriangle size="extra-large" /> : value;
        });
        const title = children(() => local.title);
        const body = children(() => <PopupContent content={local.content} renderProps={renderProps} />);
        const hasIcon = () => hasContent(icon());
        const showTitle = () => hasContent(title());
        const showContent = () => hasContent(body());

        // render effects run before the user effects of Tooltip that check the dialog's name
        createRenderEffect(() => {
            setTitled(showTitle());
            setBodied(showContent());
        });
        onCleanup(() => {
            setTitled(false);
            setBodied(false);
            footer = undefined;
        });

        // Tooltip owns the dialog element and has no describedby prop; without a title the content already names it
        createEffect(() => {
            const dialog = card?.closest('[popover]');
            if (!dialog || !showTitle() || !showContent()) {
                return;
            }
            dialog.setAttribute('aria-describedby', contentId);
            onCleanup(() => dialog.removeAttribute('aria-describedby'));
        });

        // Tooltip focuses its initial target once the popup has opened; the autoFocus button wins over content's
        onMount(() => {
            const button = pendingFocus && footer?.querySelector<HTMLElement>(`[data-type=${pendingFocus}]`);
            if (button) {
                pendingFocus = null;
                renderProps.initialFocusRef(button);
            }
        });

        const handleCancel = (event: MouseEvent) => foundation.handleCancel(event);
        const handleConfirm = (event: MouseEvent) => foundation.handleConfirm(event);

        return (
            // hides in-card clicks from document click listeners whatever stopPropagation says; Tooltip uses mousedown
            <div ref={(node) => (card = node)} class={clsx(local.prefixCls, local.class)} style={local.style} onClick={(event) => event.stopImmediatePropagation()}>
                <div class={`${local.prefixCls}-inner`}>
                    <div class={`${local.prefixCls}-header`}>
                        <Show when={hasIcon()}>
                            <i class={`${local.prefixCls}-header-icon`} x-semi-prop="icon">
                                {icon()}
                            </i>
                        </Show>
                        <div class={`${local.prefixCls}-header-body`}>
                            <Show when={showTitle()}>
                                <div id={titleId} class={`${local.prefixCls}-header-title`} x-semi-prop="title">
                                    {title()}
                                </div>
                            </Show>
                        </div>
                        <Show when={local.showCloseIcon}>
                            <Button type={local.cancelType} class={`${local.prefixCls}-btn-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={handleCancel} />
                        </Show>
                    </div>
                    <Show when={showContent()}>
                        <div id={contentId} class={clsx(`${local.prefixCls}-body`, { [`${local.prefixCls}-body-withIcon`]: hasIcon() })} x-semi-prop="content">
                            {body()}
                        </div>
                    </Show>
                    <div ref={(node) => (footer = node)} class={`${local.prefixCls}-footer`}>
                        <FooterButton kind="cancel" own={local.cancelButtonProps} type={local.cancelType} pending={state().cancelLoading} onPress={handleCancel}>
                            {local.cancelText || locale().locale.cancel}
                        </FooterButton>
                        <FooterButton kind="ok" own={local.okButtonProps} type={local.okType} pending={state().confirmLoading} onPress={handleConfirm}>
                            {local.okText || locale().locale.confirm}
                        </FooterButton>
                    </div>
                </div>
            </div>
        );
    };

    // Tooltip reports only Popconfirm's own requests, so focus follows the `visible` it is given, whoever set it
    createEffect(
        on(open, (isOpen) => {
            if (isOpen) {
                foundation.handlePopupOpen();
            }
        })
    );

    // compared with the first run like the open effect above: a close before it means the card never opened
    createEffect(
        on(
            open,
            (isOpen) => {
                if (!isOpen) {
                    foundation.handlePopupClose();
                }
            },
            { defer: true }
        )
    );

    // a disabled Popconfirm renders no popup, so an open one reports the close instead of reopening when re-enabled
    useWatch(
        () => local.disabled,
        (disabled) => {
            if (disabled && open()) {
                foundation.handleVisibleChange(false);
            }
        }
    );

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({ focusTrigger: () => popover?.focusTrigger() });
    }

    return (
        <Show when={!local.disabled} fallback={disabledTrigger()}>
            <Popover {...rest} ref={(instance) => (popover = instance)} class={cssClasses.POPOVER} aria-labelledby={labelledBy()} content={renderCard} position={local.position ?? defaultPosition()} visible={open()} onVisibleChange={(visible) => foundation.handleVisibleChange(visible)}>
                {local.children}
            </Popover>
        </Show>
    );
}
