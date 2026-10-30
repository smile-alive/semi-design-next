<script lang="ts">
    import { cssClasses, getPopoverRole, getPopoverSpacing } from '@fibrae/semi-foundation/popover/constants';
    import '@fibrae/semi-foundation/popover/popover.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import { type RenderContentProps, Tooltip } from '../tooltip/index.js';
    import Arrow from './arrow.svelte';
    import type { PopoverProps } from './interface.js';

    const defaults = useDefaultProps('Popover');

    // No fallback on `visible`: a bound `undefined` (back to uncontrolled) would throw with one
    let {
        visible = $bindable(),
        children,
        child,
        content,
        class: className = defaults('class'),
        style = defaults('style'),
        showArrow = defaults('showArrow', false),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        motion = defaults('motion', true),
        trigger = defaults('trigger', 'hover'),
        position = defaults('position', 'bottom'),
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        // Tooltip defaults these three to false; a Popover card is interactive
        closeOnEsc = defaults('closeOnEsc', true),
        returnFocusOnClose = defaults('returnFocusOnClose', true),
        guardFocus = defaults('guardFocus', true),
        role = defaults('role'),
        mouseEnterDelay = defaults('mouseEnterDelay'),
        mouseLeaveDelay = defaults('mouseLeaveDelay'),
        contentClassName = defaults('contentClassName'),
        spacing = defaults('spacing'),
        stopPropagation = defaults('stopPropagation'),
        arrowStyle = defaults('arrowStyle'),
        arrowPointAtCenter = defaults('arrowPointAtCenter'),
        clickToHide = defaults('clickToHide'),
        disableArrowKeyDown = defaults('disableArrowKeyDown'),
        disableFocusListener = defaults('disableFocusListener'),
        keepDOM = defaults('keepDOM'),
        condition = defaults('condition'),
        'aria-label': ariaLabel = defaults('aria-label'),
        'aria-labelledby': ariaLabelledby = defaults('aria-labelledby'),
        'aria-describedby': ariaDescribedby = defaults('aria-describedby'),
        onVisibleChange,
        onClickOutSide,
        onEscKeyDown,
        onOpen,
        afterOpen,
        afterClose,
    }: PopoverProps = $props();

    let tooltip = $state<Tooltip>();

    const popupRole = $derived(getPopoverRole(role, trigger));
    const popupSpacing = $derived(getPopoverSpacing(spacing, showArrow));
    const stop = $derived(stopPropagation === undefined ? undefined : Boolean(stopPropagation));

    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    export function focusTrigger() {
        tooltip?.focusTrigger();
    }

    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves */
    export function rePosition() {
        tooltip?.rePosition();
    }
</script>

{#snippet card(slotProps: RenderContentProps)}
    <div class={[prefixCls, contentClassName]}>
        <div class={`${prefixCls}-content`}>
            {@render content?.(slotProps)}
        </div>
    </div>
{/snippet}

{#snippet popArrow()}
    <Arrow {arrowStyle} popStyle={style} {position} />
{/snippet}

<Tooltip
    {afterClose}
    {afterOpen}
    aria-describedby={ariaDescribedby}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    arrow={popArrow}
    {arrowPointAtCenter}
    {autoAdjustOverflow}
    bind:this={tooltip}
    bind:visible
    {child}
    {children}
    class={className}
    {clickToHide}
    {closeOnEsc}
    {condition}
    content={card}
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
    {onVisibleChange}
    {position}
    {prefixCls}
    {returnFocusOnClose}
    role={popupRole}
    {showArrow}
    spacing={popupSpacing}
    stopPropagation={stop}
    {style}
    {trigger}
/>
