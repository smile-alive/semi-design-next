<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import { isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
    import ModalFoundation, { type ModalAdapter, type ModalProps as FoundationModalProps, type ModalState } from '@fibrae/semi-foundation/modal/modal-foundation';
    import { coversPage } from '@fibrae/semi-foundation/utils/dom';
    import isPromise from '@fibrae/semi-foundation/utils/is-promise';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
    import '@fibrae/semi-foundation/modal/modal.scss';
    import Portal from '../_base/portal.svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import Button from '../button/button.svelte';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { ModalButtonProps, ModalProps } from './interface.js';
    import ModalContent from './modal-content.svelte';

    type FoundationProps = Pick<FoundationModalProps, 'visible'>;
    type Foundation = ModalFoundation<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;
    type Adapter = ModalAdapter<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;

    const defaults = useDefaultProps('Modal');

    // No fallback on `visible`: a bound `undefined` (form reset) would throw with one
    let {
        visible = $bindable(),
        afterClose,
        bodyStyle = defaults('bodyStyle'),
        cancelButtonProps = defaults('cancelButtonProps'),
        cancelLoading = defaults('cancelLoading'),
        cancelText = defaults('cancelText'),
        centered = defaults('centered', false),
        closable = defaults('closable', true),
        closeOnEsc = defaults('closeOnEsc', true),
        confirmLoading = defaults('confirmLoading'),
        footerFill = defaults('footerFill'),
        fullScreen = defaults('fullScreen', false),
        getPopupContainer = defaults('getPopupContainer'),
        hasCancel = defaults('hasCancel', true),
        height = defaults('height'),
        keepDOM = defaults('keepDOM', false),
        lazyRender = defaults('lazyRender', true),
        mask = defaults('mask', true),
        maskClosable = defaults('maskClosable', true),
        maskFixed = defaults('maskFixed', false),
        maskStyle = defaults('maskStyle'),
        modalContentClass = defaults('modalContentClass'),
        motion = defaults('motion', true),
        okButtonProps = defaults('okButtonProps'),
        okText = defaults('okText'),
        okType = defaults('okType', 'primary'),
        onCancel = defaults('onCancel'),
        onOk = defaults('onOk'),
        preventScroll = defaults('preventScroll'),
        size = defaults('size', 'small'),
        title = defaults('title'),
        width = defaults('width'),
        zIndex = defaults('zIndex', 1000),
        children: body,
        header,
        footer,
        icon,
        closeIcon,
        modal,
        ...rest
    }: ModalProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Modal');

    let contentRef = $state.raw<ReturnType<typeof ModalContent> | null>(null);
    let displayNone = $state(untrack(() => !(visible ?? defaults('visible', false))));
    let haveRendered = $state(false);
    const scroll = new ReleaseHolder();

    // Starts true for a modal mounted visible: its effects run a flush late, and a close before then (a confirm
    // destroyed right after it was created) must still report afterClose.
    let closePending = untrack(() => Boolean(visible ?? defaults('visible', false)));

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, ModalState>(
        ModalFoundation,
        {
            get visible() {
                return open;
            },
        },
        () => ({}),
        () => ({
            // the page keeps scrolling behind a non-modal dialog (no mask, or a mask confined to a custom container)
            disabledBodyScroll: () => {
                if (isModal({ mask, maskFixed, inBody: coversPage(getPopupContainer ?? config.getPopupContainer) })) {
                    scroll.hold(lockBodyScroll);
                } else {
                    scroll.release();
                }
            },
            enabledBodyScroll: () => scroll.release(),
            notifyCancel: (event) => {
                const result = onCancel?.(event);
                // the foundation rethrows a rejection; a rejected cancel only skips the close
                if (isPromise(result)) {
                    (result as Promise<unknown>).then(
                        () => {
                            visible = false;
                        },
                        () => {}
                    );
                } else {
                    visible = false;
                }
                return result;
            },
            notifyOk: (event) => onOk?.(event),
            notifyClose: () => afterClose?.(),
            toggleDisplayNone: (value) => {
                displayNone = value;
            },
        })
    );

    const open = $derived(Boolean(visible ?? defaults('visible', false)));

    // without motion the animation end never comes, so hidden does not wait for it
    const hidden = $derived(open ? false : !motion || displayNone);
    const shouldRender = $derived(open || (keepDOM && (!lazyRender || haveRendered)) || (motion && !hidden));

    const cancel = (event: MouseEvent | KeyboardEvent) => foundation.handleCancel(event);

    // autoFocus only selects the initially focused button; data-type locates the button for it
    const footerButton = (kind: 'cancel' | 'ok', custom?: ModalButtonProps) => {
        const { autoFocus: _autoFocus, onclick, ...own } = custom ?? {};
        const pending = kind === 'ok' ? states().onOKReturnPromiseStatus : states().onCancelReturnPromiseStatus;
        const loading = kind === 'ok' ? confirmLoading : cancelLoading;
        return {
            type: kind === 'ok' ? okType : ('tertiary' as const),
            theme: kind === 'ok' ? ('solid' as const) : undefined,
            block: footerFill,
            loading: loading === undefined ? pending === 'pending' : loading,
            ...own,
            'data-type': kind,
            style: kind === 'cancel' && footerFill ? ['margin-inline-start: unset', own.style].filter(Boolean).join(';') : own.style,
            onclick: (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
                onclick?.(event);
                if (kind === 'ok') {
                    foundation.handleOk(event);
                } else {
                    cancel(event);
                }
            },
        };
    };

    const cancelProps = $derived(footerButton('cancel', cancelButtonProps));
    const okProps = $derived(footerButton('ok', okButtonProps));

    const takePendingClose = () => {
        const pending = closePending;
        closePending = false;
        return pending;
    };

    // before the DOM updates: showing reaches it with `visible`, hiding waits for the leave animation
    $effect.pre(() => {
        if (open) {
            displayNone = false;
        }
    });

    $effect.pre(() => {
        if (shouldRender) {
            haveRendered = true;
        }
    });

    $effect(() => {
        if (!hidden) return;
        // without motion the content unmounts with no leave, so nothing else records the hide; a later switch to motion
        // would otherwise mount an invisible full-page wrap
        displayNone = true;
        if (takePendingClose()) {
            foundation.afterClose();
        }
    });

    // Runs once mounted: the first run resolves getPopupContainer, whose in-tree target exists only then
    $effect(() => {
        if (hidden) return;
        closePending = true;
        foundation.beforeShow();
        return foundation.afterHide;
    });

    // the unmount of a shown dialog reports its close once
    onMount(() => () => {
        if (takePendingClose()) {
            foundation.afterClose();
        }
    });

    export function getRoot() {
        return contentRef?.getRoot() ?? null;
    }
</script>

{#snippet defaultFooter()}
    <div class={{ [`${cssClasses.DIALOG}-footerfill`]: footerFill }}>
        {#if hasCancel}
            <Button {...cancelProps}>
                {cancelText || locale().locale.cancel}
            </Button>
        {/if}
        <Button {...okProps}>
            {okText || locale().locale.confirm}
        </Button>
    </div>
{/snippet}

{#if shouldRender}
    <Portal {getPopupContainer} {zIndex}>
        {#snippet children({ inBody })}
            <ModalContent
                {...rest}
                bind:this={contentRef}
                {bodyStyle}
                {centered}
                children={body}
                class={[rest.class, { [`${cssClasses.DIALOG}-displayNone`]: keepDOM && hidden }]}
                {closable}
                {closeIcon}
                {closeOnEsc}
                contentClass={modalContentClass}
                footer={footer === undefined ? defaultFooter : footer}
                {header}
                {height}
                {icon}
                {inBody}
                initialFocus={ModalFoundation.getInitialFocus({ customFooter: footer !== undefined, okButtonProps, hasCancel, cancelButtonProps })}
                isFullScreen={fullScreen}
                {mask}
                {maskClosable}
                {maskFixed}
                {maskStyle}
                {modal}
                {motion}
                onAfterLeave={() => foundation.toggleDisplayNone(true)}
                onClose={cancel}
                {preventScroll}
                {size}
                {title}
                visible={open}
                {width}
            />
        {/snippet}
    </Portal>
{/if}
