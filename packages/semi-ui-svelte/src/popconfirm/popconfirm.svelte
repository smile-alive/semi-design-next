<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { cssClasses } from '@fibrae/semi-foundation/popconfirm/constants';
    import PopconfirmFoundation, { type PopconfirmAdapter, type PopconfirmBaseProps } from '@fibrae/semi-foundation/popconfirm/popconfirm-foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/popconfirm/popconfirm.scss';
    import { IconAlertTriangle, IconClose } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { Button } from '../button/index.js';
    import { useConfig } from '../config-provider/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import type { FocusTarget, RenderContentProps, TooltipTriggerProps } from '../tooltip/index.js';
    import type { PopconfirmButtonProps, PopconfirmProps, PopconfirmState } from './interface.js';

    type Foundation = PopconfirmFoundation<PopconfirmBaseProps, PopconfirmState>;
    type Adapter = PopconfirmAdapter<PopconfirmBaseProps, PopconfirmState>;

    const defaults = useDefaultProps('Popconfirm');

    // No fallback on `visible`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        visible = $bindable(),
        children,
        child,
        title = defaults('title'),
        content,
        icon = defaults('icon'),
        class: className = defaults('class'),
        style = defaults('style'),
        cancelButtonProps = defaults('cancelButtonProps'),
        cancelText = defaults('cancelText'),
        cancelType = defaults('cancelType', 'tertiary'),
        disabled = defaults('disabled', false),
        okButtonProps = defaults('okButtonProps'),
        okText = defaults('okText'),
        okType = defaults('okType', 'primary'),
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        showCloseIcon = defaults('showCloseIcon', true),
        // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
        role = defaults('role', 'dialog'),
        stopPropagation = defaults('stopPropagation', true),
        trigger = defaults('trigger', 'click'),
        position = defaults('position'),
        showArrow = defaults('showArrow'),
        autoAdjustOverflow = defaults('autoAdjustOverflow'),
        motion = defaults('motion'),
        closeOnEsc = defaults('closeOnEsc'),
        returnFocusOnClose = defaults('returnFocusOnClose'),
        guardFocus = defaults('guardFocus'),
        arrowPointAtCenter = defaults('arrowPointAtCenter'),
        clickToHide = defaults('clickToHide'),
        disableArrowKeyDown = defaults('disableArrowKeyDown'),
        disableFocusListener = defaults('disableFocusListener'),
        keepDOM = defaults('keepDOM'),
        condition = defaults('condition'),
        mouseEnterDelay = defaults('mouseEnterDelay'),
        mouseLeaveDelay = defaults('mouseLeaveDelay'),
        contentClassName = defaults('contentClassName'),
        spacing = defaults('spacing'),
        arrowStyle = defaults('arrowStyle'),
        'aria-label': ariaLabel = defaults('aria-label'),
        'aria-labelledby': ariaLabelledby = defaults('aria-labelledby'),
        'aria-describedby': ariaDescribedby = defaults('aria-describedby'),
        onCancel = defaults('onCancel'),
        onConfirm = defaults('onConfirm'),
        onVisibleChange,
        onClickOutSide,
        onEscKeyDown,
        onOpen,
        afterOpen,
        afterClose,
    }: PopconfirmProps = $props();

    const config = useConfig();
    const locale = useLocale('Popconfirm');

    const uid = $props.id();
    let popover = $state<Popover>();
    let footer = $state.raw<HTMLDivElement | null>(null);

    // Tooltip mounts the card only once it shows, so a focus request waits for the footer to exist
    let pendingFocus: 'cancel' | 'ok' | null = null;

    // Tooltip focuses its initial target after the card opens, which would override a button focused here, so the
    // button is handed to Tooltip too; the content's target is used only when no button wins
    let tooltipFocus: ((target: FocusTarget) => void) | undefined;
    let contentFocus: FocusTarget | undefined;
    let popupNode: HTMLElement | null = null;

    const titleId = `${uid}-title`;
    const contentId = `${titleId}-content`;

    const contentProps: RenderContentProps = {
        initialFocusRef: (target) => {
            contentFocus = target;
        },
    };

    // A disabled Popconfirm renders the trigger alone; a spread of no props leaves the user's element as written
    const noTriggerProps = {} as TooltipTriggerProps;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: PopconfirmBaseProps = {
        get cancelButtonProps() {
            return cancelButtonProps;
        },
        get okButtonProps() {
            return okButtonProps;
        },
        get visible() {
            return visible;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, PopconfirmBaseProps, PopconfirmState>(
        PopconfirmFoundation,
        foundationProps,
        () => ({ visible: false, cancelLoading: false, confirmLoading: false }),
        (base) => ({
            setVisible: (next) => base.setState({ visible: next }),
            updateConfirmLoading: (confirmLoading) => base.setState({ confirmLoading }),
            updateCancelLoading: (cancelLoading) => base.setState({ cancelLoading }),
            notifyConfirm: (event) => onConfirm?.(event),
            notifyCancel: (event) => onCancel?.(event),
            notifyVisibleChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                visible = next;
                onVisibleChange?.(next);
            },
            focusCancelButton: () => {
                pendingFocus = 'cancel';
                applyFocus();
            },
            focusOkButton: () => {
                pendingFocus = 'ok';
                applyFocus();
            },
            focusPrevFocusElement: () => {
                pendingFocus = null;
                // focus that already left the card (Tab away from a focus trigger) stays where it went
                if (FocusTrapHandle.shouldRestoreFocus(popupNode, false)) popover?.focusTrigger();
            },
        })
    );

    const popoverVisible = $derived(visible !== undefined ? visible : states().visible);
    const popoverPosition = $derived(position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const hasTitle = $derived(title !== undefined && title !== '');
    const labelledBy = $derived(ariaLabelledby || ariaLabel ? ariaLabelledby : hasTitle ? titleId : content ? contentId : undefined);
    const describedBy = $derived(ariaDescribedby || (hasTitle && content ? contentId : undefined));

    // type and theme may be overridden; data-type locates the button for autoFocus, and the pending loading guards
    // against a second click. autoFocus only selects the initially focused button, so it never reaches the DOM
    const footerButton = (kind: 'cancel' | 'ok', custom?: PopconfirmButtonProps) => {
        const { autoFocus: _autoFocus, onclick: _onclick, ...rest } = custom ?? {};
        const pending = kind === 'ok' ? states().confirmLoading : states().cancelLoading;
        return {
            type: kind === 'ok' ? okType : cancelType,
            theme: kind === 'ok' ? ('solid' as const) : undefined,
            ...rest,
            'data-type': kind,
            loading: rest.loading || pending,
        };
    };

    const cancelProps = $derived(footerButton('cancel', cancelButtonProps));
    const okProps = $derived(footerButton('ok', okButtonProps));

    const applyFocus = () => {
        if (!footer) {
            return;
        }
        popupNode = footer.closest('[popover]');
        if (pendingFocus) {
            const button = footer.querySelector<HTMLElement>(`[data-type=${pendingFocus}]`);
            button?.focus({ preventScroll: true });
            if (button) tooltipFocus?.(button);
            pendingFocus = null;
        } else if (contentFocus) {
            tooltipFocus?.(contentFocus);
        }
    };

    const holdFocusRef = (initialFocusRef: RenderContentProps['initialFocusRef']): Attachment<HTMLDivElement> => {
        return () => {
            tooltipFocus = initialFocusRef;
        };
    };

    // Native listener: Tooltip stops the popup's clicks natively under stopPropagation (on by default here), which
    // keeps them from Svelte's delegated onclick on the document. The user's onclick runs first, then the built-in flow
    const onClick = (custom: PopconfirmButtonProps | undefined, run: (event: MouseEvent) => void): Attachment<HTMLElement> => {
        return (element) => {
            const listener = (event: MouseEvent) => {
                (custom?.onclick as ((event: MouseEvent) => void) | null | undefined)?.(event);
                run(event);
            };
            element.addEventListener('click', listener);
            return () => element.removeEventListener('click', listener);
        };
    };

    $effect(() => {
        if (footer) {
            untrack(applyFocus);
        } else {
            contentFocus = undefined;
        }
    });

    // Tooltip reports only Popconfirm's own requests, so focus follows the `visible` it is given, whoever set it
    watch(
        () => popoverVisible,
        (next) => (next ? foundation.handlePopupOpen() : foundation.handlePopupClose())
    );

    // a disabled Popconfirm renders no popup, so an open one reports the close instead of reopening when re-enabled
    watch(
        () => disabled,
        (next) => {
            if (next && popoverVisible) foundation.handleVisibleChange(false);
        }
    );

    onMount(() => {
        if (popoverVisible) foundation.handlePopupOpen();
    });

    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    export function focusTrigger() {
        popover?.focusTrigger();
    }
</script>

{#snippet closeIcon()}
    <IconClose />
{/snippet}

{#snippet card({ initialFocusRef }: RenderContentProps)}
    <div {@attach holdFocusRef(initialFocusRef)} class={[prefixCls, className]} {style}>
        <div class={`${prefixCls}-inner`}>
            <div class={`${prefixCls}-header`}>
                {#if icon !== null}
                    <i class={`${prefixCls}-header-icon`} x-semi-prop="icon">
                        {#if icon}
                            {@render icon()}
                        {:else}
                            <IconAlertTriangle size="extra-large" />
                        {/if}
                    </i>
                {/if}
                <div class={`${prefixCls}-header-body`}>
                    {#if hasTitle}
                        <div class={`${prefixCls}-header-title`} id={titleId} x-semi-prop="title">
                            {#if typeof title === 'function'}
                                {@render title()}
                            {:else}
                                {title}
                            {/if}
                        </div>
                    {/if}
                </div>
                {#if showCloseIcon}
                    <Button {@attach onClick(undefined, foundation.handleCancel)} aria-label={locale().locale.close} class={`${prefixCls}-btn-close`} icon={closeIcon} size="small" theme="borderless" type={cancelType} />
                {/if}
            </div>
            {#if content}
                <div class={[`${prefixCls}-body`, { [`${prefixCls}-body-withIcon`]: icon !== null }]} id={contentId} x-semi-prop="content">
                    {@render content(contentProps)}
                </div>
            {/if}
            <div bind:this={footer} class={`${prefixCls}-footer`}>
                <Button {...cancelProps} {@attach onClick(cancelButtonProps, foundation.handleCancel)}>
                    {cancelText || locale().locale.cancel}
                </Button>
                <Button {...okProps} {@attach onClick(okButtonProps, foundation.handleConfirm)}>
                    {okText || locale().locale.confirm}
                </Button>
            </div>
        </div>
    </div>
{/snippet}

{#if disabled}
    {#if child}
        {@render child({ props: noTriggerProps })}
    {:else}
        {@render children?.()}
    {/if}
{:else}
    <Popover
        {afterClose}
        {afterOpen}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        {arrowPointAtCenter}
        {arrowStyle}
        {autoAdjustOverflow}
        bind:this={popover}
        bind:visible={() => popoverVisible, (next) => foundation.handleVisibleChange(Boolean(next))}
        {child}
        {children}
        class={cssClasses.POPOVER}
        {clickToHide}
        {closeOnEsc}
        {condition}
        content={card}
        {contentClassName}
        {disableArrowKeyDown}
        {disableFocusListener}
        {guardFocus}
        {keepDOM}
        {motion}
        {mouseEnterDelay}
        {mouseLeaveDelay}
        {onClickOutSide}
        {onEscKeyDown}
        {onOpen}
        position={popoverPosition}
        {returnFocusOnClose}
        {role}
        {showArrow}
        {spacing}
        {stopPropagation}
        {trigger}
    />
{/if}
