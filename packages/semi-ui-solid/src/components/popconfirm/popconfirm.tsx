import { type JSX, type Ref, Show, children, createEffect, createMemo, createRenderEffect, createSignal, createUniqueId, mergeProps, on, onCleanup, onMount, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/popconfirm/constants';
import PopconfirmFoundation, { type PopconfirmAdapter, type PopconfirmBaseState } from '@fibrae/semi-foundation/components/popconfirm/popconfirm-foundation';
import '@fibrae/semi-foundation/components/popconfirm/popconfirm.scss';
import { IconAlertTriangle, IconClose } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '../../base/index';
import { callHandler, hasContent } from '../../utils/index';
import Button, { type ButtonProps, type Type as ButtonType } from '../button';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover';
import { PopupContent, type RenderContentProps } from '../tooltip';

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
    focusTrigger: () => void;
}

export type PopconfirmState = PopconfirmBaseState;

type Foundation = PopconfirmFoundation<PopconfirmProps>;
type Adapter = PopconfirmAdapter<PopconfirmProps>;

const defaultProps = {
    // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
    role: 'dialog',
    stopPropagation: true,
    trigger: 'click',
    disabled: false,
    okType: 'primary',
    cancelType: 'tertiary',
    showCloseIcon: true,
} satisfies Partial<PopconfirmProps>;

const prefixCls = cssClasses.PREFIX;

interface FooterButtonProps {
    kind: 'cancel' | 'ok';
    own?: PopconfirmButtonProps;
    type?: ButtonType;
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
        'aria-describedby',
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

    // Tooltip's initial focus target of the mounted card
    let tooltipFocus: RenderContentProps['initialFocusRef'] | undefined;

    // the card reports which parts it rendered; the dialog's name and description point at them
    const [titled, setTitled] = createSignal(false);
    const [bodied, setBodied] = createSignal(false);

    const { foundation, state } = useFoundation<Foundation, Adapter, PopconfirmProps, PopconfirmState>(
        PopconfirmFoundation,
        props,
        (view) => PopconfirmFoundation.getInitialState(view),
        () => ({
            notifyConfirm: (event) => props.onConfirm?.(event),
            notifyCancel: (event) => props.onCancel?.(event),
            notifyVisibleChange: (visible) => props.onVisibleChange?.(visible),
            getFooter: () => footer,
            setInitialFocus: (button) => tooltipFocus?.(button),
            getPopup: () => popover?.getPopup(),
            focusTrigger: () => popover?.focusTrigger(),
        })
    );

    const titleId = `${createUniqueId()}-title`;
    const contentId = `${titleId}-content`;
    const ref = props.ref;

    // by value: a state write notifies even when equal, and handlePopupClose writes the state
    const open = createMemo(() => (props.visible !== undefined ? props.visible : state().visible));

    const labelledBy = () => {
        if (local['aria-labelledby'] || props['aria-label']) {
            return local['aria-labelledby'];
        }
        return titled() ? titleId : bodied() ? contentId : undefined;
    };

    // without a title the content already names the dialog
    const describedBy = () => local['aria-describedby'] || (titled() && bodied() ? contentId : undefined);

    const defaultPosition = () => (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    const renderCard = (renderProps: RenderContentProps) => {
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
            tooltipFocus = undefined;
        });

        onMount(() => {
            tooltipFocus = renderProps.initialFocusRef;
            foundation.handleFooterMounted();
        });

        const handleCancel = (event: MouseEvent) => foundation.handleCancel(event);
        const handleConfirm = (event: MouseEvent) => foundation.handleConfirm(event);

        return (
            // hides in-card clicks from document click listeners whatever stopPropagation says; Tooltip uses mousedown
            <div class={clsx(prefixCls, local.class)} style={local.style} onClick={(event) => event.stopImmediatePropagation()}>
                <div class={`${prefixCls}-inner`}>
                    <div class={`${prefixCls}-header`}>
                        <Show when={hasIcon()}>
                            <i class={`${prefixCls}-header-icon`} x-semi-prop="icon">
                                {icon()}
                            </i>
                        </Show>
                        <div class={`${prefixCls}-header-body`}>
                            <Show when={showTitle()}>
                                <div id={titleId} class={`${prefixCls}-header-title`} x-semi-prop="title">
                                    {title()}
                                </div>
                            </Show>
                        </div>
                        <Show when={local.showCloseIcon}>
                            <Button type={local.cancelType} class={`${prefixCls}-btn-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={handleCancel} />
                        </Show>
                    </div>
                    <Show when={showContent()}>
                        <div id={contentId} class={clsx(`${prefixCls}-body`, { [`${prefixCls}-body-withIcon`]: hasIcon() })} x-semi-prop="content">
                            {body()}
                        </div>
                    </Show>
                    <div ref={(node) => (footer = node)} class={`${prefixCls}-footer`}>
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

    if (typeof ref === 'function') {
        ref({ focusTrigger: () => popover?.focusTrigger() });
    }

    return (
        // the Popover stays mounted while disabled so toggling it never remounts the trigger; a custom trigger with
        // `visible` false is a Popover that cannot open
        <Popover
            {...rest}
            ref={(instance) => (popover = instance)}
            class={cssClasses.POPOVER}
            aria-describedby={describedBy()}
            aria-labelledby={labelledBy()}
            content={renderCard}
            position={local.position ?? defaultPosition()}
            trigger={local.disabled ? 'custom' : rest.trigger}
            visible={local.disabled ? false : open()}
            onVisibleChange={foundation.handleVisibleChange}
        >
            {local.children}
        </Popover>
    );
}
