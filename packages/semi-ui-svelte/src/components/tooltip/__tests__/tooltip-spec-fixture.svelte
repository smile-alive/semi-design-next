<script lang="ts">
    import type { TooltipSpecProps } from '@test/specs/tooltip';
    import type { TooltipTriggerProps } from '../interface';
    import Tooltip from '../tooltip.svelte';

    let { store }: { store: TooltipSpecProps } = $props();

    // A one-way `visible` lets the component override it locally, so the spec's controlled value goes through a function binding that rejects writes
    let chosen = $state<boolean>();
</script>

{#snippet content()}
    {store.content}
    {#if store.contentButton}<button type="button">{store.contentButton}</button>{/if}
{/snippet}

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} disabled={store.triggerDisabled} type="button">trigger</button>
{/snippet}

<Tooltip
    aria-label={store.popupLabel}
    bind:visible={
        () => (store.visible === undefined ? chosen : store.visible),
        (value) => {
            chosen = value;
        }
    }
    {child}
    clickToHide={store.clickToHide}
    clickTriggerToHide={store.clickTriggerToHide}
    closeOnEsc={store.closeOnEsc}
    condition={store.condition}
    {content}
    keepDOM={store.keepDOM}
    motion={false}
    mouseEnterDelay={store.mouseEnterDelay}
    mouseLeaveDelay={store.mouseLeaveDelay}
    onClickOutSide={store.onClickOutSide}
    onEscKeyDown={store.onEscKeyDown}
    onVisibleChange={store.onVisibleChange}
    returnFocusOnClose={store.returnFocusOnClose}
    role={store.role}
    trigger={store.trigger}
>
    trigger
</Tooltip>
