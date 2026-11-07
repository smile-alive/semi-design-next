<script lang="ts">
    import { onMount, tick, untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/side-sheet/constants';
    import SideSheetFoundation, { type SideSheetAdapter, type SideSheetProps as SideSheetBaseProps, type SideSheetState } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';
    import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/components/side-sheet/side-sheet.scss';
    import { IconClose } from '@fibrae/semi-icons-svelte';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs.js';
    import Portal from '../_base/portal.svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import IconButton from '../icon-button/icon-button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { SideSheetProps } from './interface.js';

    type Foundation = SideSheetFoundation<SideSheetBaseProps>;
    type Adapter = SideSheetAdapter<SideSheetBaseProps>;

    const defaults = useDefaultProps('SideSheet');

    // No fallback on `visible`: a bound `undefined` would throw with one, and undefined means closed
    let {
        afterVisibleChange,
        bodyStyle = defaults('bodyStyle'),
        canVerticalSetWidth = defaults('canVerticalSetWidth'),
        closable = defaults('closable', true),
        closeIcon = defaults('closeIcon'),
        closeOnEsc = defaults('closeOnEsc', false),
        disableScroll = defaults('disableScroll', true),
        footer = defaults('footer'),
        getPopupContainer = defaults('getPopupContainer'),
        headerStyle = defaults('headerStyle'),
        height = defaults('height'),
        keepDOM = defaults('keepDOM', false),
        mask = defaults('mask', true),
        maskClosable = defaults('maskClosable', true),
        maskStyle = defaults('maskStyle'),
        motion = defaults('motion', true),
        onCancel,
        placement = defaults('placement', 'right'),
        size = defaults('size', 'small'),
        style = defaults('style'),
        title = defaults('title'),
        visible = $bindable(),
        width = defaults('width'),
        zIndex = defaults('zIndex', 1000),
        children: body,
        ...rest
    }: SideSheetProps = $props();

    const config = getConfigContext();
    const locale = useLocale('SideSheet');

    const uid = $props.id();
    let rootEl = $state.raw<HTMLDivElement | null>(null);
    let dialogEl = $state.raw<HTMLDivElement | null>(null);
    let displayNone = $state(true);
    let animating = $state<'show' | 'hide'>();
    let started = false;

    const prefix = cssClasses.PREFIX;
    const hidden = $derived(visible ? false : !motion || displayNone);
    const shouldRender = $derived(Boolean(visible) || keepDOM || (motion && !hidden));
    const hasTitle = $derived(typeof title === 'string' ? title !== '' : Boolean(title));
    const sheetSize = $derived(SideSheetFoundation.getSheetSize({ placement, canVerticalSetWidth, width, height, mask }));
    const attrs = $derived(splitControlAttrs(rest, isAriaKey));
    const horizontal = $derived(placement === 'top' || placement === 'bottom');
    const maskAnimation = $derived(animating ? `${prefix}-animation-mask_${animating}` : undefined);
    const dialogAnimation = $derived(animating ? `${prefix}-animation-content_${animating}_${placement}` : undefined);

    const foundationProps: SideSheetBaseProps = {
        get closeOnEsc() {
            return closeOnEsc;
        },
        get disableScroll() {
            return disableScroll;
        },
        get visible() {
            return visible;
        },
        get mask() {
            return mask;
        },
        get getPopupContainer() {
            return getPopupContainer ?? config.getPopupContainer;
        },
    };

    const { foundation } = useFoundation<Foundation, Adapter, SideSheetBaseProps, SideSheetState>(
        SideSheetFoundation,
        foundationProps,
        () => SideSheetFoundation.getInitialState(),
        () => ({
            notifyCancel: (event) => {
                visible = false;
                onCancel?.(event);
            },
            notifyAfterVisibleChange: (isVisible) => afterVisibleChange?.(isVisible),
            getRoot: () => rootEl,
            getDialog: () => dialogEl,
        })
    );

    // aria-* go to the dialog (F12); the title names it unless the caller does, since a generated reference would
    // shadow aria-label
    const dialogAttrs = (inBody: boolean) => ({
        'aria-labelledby': !attrs.control['aria-label'] && hasTitle ? `${uid}-title` : undefined,
        'aria-modal': SideSheetFoundation.isModal({ mask, inBody }) ? true : undefined,
        ...attrs.control,
    });

    const onMaskClick = (event: MouseEvent) => {
        if (maskClosable) {
            foundation.handleCancel(event);
        }
    };

    const onClose = (event: MouseEvent) => foundation.handleCancel(event);

    // animation events bubble; a descendant's animation is not the sheet's
    const onAnimationEnd = (event: AnimationEvent) => {
        if (event.target === event.currentTarget) {
            endAnimation();
        }
    };

    const endAnimation = () => {
        if (animating === 'hide') {
            displayNone = true;
        }
        animating = undefined;
    };

    // Before the DOM updates, so the focus is recorded ahead of anything in the sheet taking it, and the classes of the
    // new run are in the first render. The initial run is the mount: shown with an enter animation, or hidden without
    // a leave one.
    $effect.pre(() => {
        const open = visible;
        untrack(() => {
            if (open) {
                displayNone = false;
                animating = motion ? 'show' : undefined;
                foundation.recordFocus();
            } else if (started) {
                animating = motion ? 'hide' : undefined;
            }
            started = true;
        });
    });

    // No animationend comes when the page cancels the animation (`animation: none`); getAnimations() flushes style, so it
    // lists the animation the class started. Transitions are excluded: they never fire animationend. The pre effect above
    // writes `animating` while the flush is running, so the class reaches the DOM in the next pass of it, after this
    // effect: the check waits for tick(), which flushes that pass.
    $effect(() => {
        const run = animating;
        const element = dialogEl;
        if (!run || !element?.isConnected) {
            return;
        }
        void tick().then(() => {
            if (animating === run && element.isConnected && !element.getAnimations().some((animation) => 'animationName' in animation)) {
                endAnimation();
            }
        });
    });

    $effect(() => {
        const element = dialogEl;
        if (!visible || !element || !rootEl) {
            return;
        }
        untrack(() => {
            foundation.beforeShow();
            warnIfDialogUnnamed(element, 'SideSheet');
        });
        return foundation.afterHide;
    });

    watch(() => hidden, foundation.handleHiddenChange);

    onMount(() => () => foundation.handleHiddenChange(true));

    export function getRoot() {
        return rootEl;
    }
</script>

{#if shouldRender}
    <Portal {getPopupContainer} {zIndex}>
        {#snippet children({ inBody })}
            <div
                {...attrs.root}
                bind:this={rootEl}
                class={[
                    prefix,
                    `${prefix}-${placement}`,
                    rest.class,
                    {
                        [`${prefix}-popup`]: !inBody,
                        [`${prefix}-horizontal`]: horizontal,
                        [`${prefix}-hidden`]: keepDOM && hidden,
                        [`${prefix}-fixed`]: !mask,
                        [`${prefix}-size-${size}`]: !mask,
                    },
                ]}
                style:width={toCssLength(sheetSize.rootWidth)}
            >
                {#if mask}
                    <!-- Pointer-only surface: the keyboard closes the sheet with its close button and Escape -->
                    <div aria-hidden="true" class={[`${prefix}-mask`, maskAnimation]} style={maskStyle} onclick={onMaskClick}></div>
                {/if}
                <div
                    {...dialogAttrs(inBody)}
                    bind:this={dialogEl}
                    class={[`${prefix}-inner`, `${prefix}-inner-wrap`, `${prefix}-size-${size}`, dialogAnimation]}
                    role="dialog"
                    {style}
                    style:height={toCssLength(sheetSize.dialogHeight)}
                    style:width={toCssLength(sheetSize.dialogWidth)}
                    tabindex="-1"
                    onanimationend={onAnimationEnd}
                >
                    <div class={`${prefix}-content`}>
                        <div class={`${prefix}-header`} style={headerStyle}>
                            {#if hasTitle}
                                <div aria-level="2" class={`${prefix}-title`} id={`${uid}-title`} role="heading" x-semi-prop="title">
                                    {#if typeof title === 'string'}{title}{:else}{@render title?.()}{/if}
                                </div>
                            {/if}
                            {#if closable}
                                <IconButton aria-label={locale().locale.close} class={`${prefix}-close`} size="small" theme="borderless" type="tertiary" onclick={onClose}>
                                    {#snippet icon()}
                                        {#if closeIcon}{@render closeIcon()}{:else}<IconClose />{/if}
                                    {/snippet}
                                </IconButton>
                            {/if}
                        </div>
                        <div class={`${prefix}-body`} style={bodyStyle} x-semi-prop="children">
                            {@render body?.()}
                        </div>
                        {#if footer}
                            <div class={`${prefix}-footer`} x-semi-prop="footer">
                                {@render footer()}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/snippet}
    </Portal>
{/if}
