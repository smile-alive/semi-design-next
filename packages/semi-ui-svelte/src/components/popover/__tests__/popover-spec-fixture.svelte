<script lang="ts">
    import type { PopoverSpecProps } from '@test/specs/popover';
    import type { TooltipTriggerProps } from '../../tooltip';
    import Popover from '../popover.svelte';

    let { store }: { store: PopoverSpecProps } = $props();

    // A one-way `visible` lets the component override it locally, so the spec's controlled value goes through a function binding that rejects writes
    let chosen = $state<boolean>();
</script>

{#snippet content()}
    {store.content}
    {#if store.contentButton}<button type="button">{store.contentButton}</button>{/if}
{/snippet}

{#snippet child({ props: triggerProps }: { props: TooltipTriggerProps })}
    <button {...triggerProps} type="button">trigger</button>
{/snippet}

<Popover
    aria-label={store.popupLabel}
    bind:visible={
        () => (store.visible === undefined ? chosen : store.visible),
        (value) => {
            chosen = value;
        }
    }
    {child}
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
    showArrow={store.showArrow}
    trigger={store.trigger}
>
    trigger
</Popover>
