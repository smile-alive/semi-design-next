<script lang="ts">
    import Avatar from '../avatar.svelte';
    import type { AvatarProps } from '../interface';

    interface Store extends AvatarProps {
        label?: string;
        node?: boolean;
        hover?: string;
        top?: boolean;
        bottom?: boolean;
        customMarks?: boolean;
    }

    let { store }: { store: Store } = $props();
    const avatarProps = $derived.by(() => {
        const { label: _label, node: _node, hover: _hover, top: _top, bottom: _bottom, customMarks, topSlot, bottomSlot, ...props } = store;
        return customMarks ? { ...props, topSlot: { render: customTop }, bottomSlot: { render: customBottom } } : { ...props, topSlot, bottomSlot };
    });
</script>

{#snippet customTop()}<em>custom top</em>{/snippet}
{#snippet customBottom()}<em>custom bottom</em>{/snippet}
{#snippet hoverMask()}{store.hover}{/snippet}
{#snippet topText()}直播{/snippet}
{#snippet bottomText()}NEW{/snippet}

<Avatar {...avatarProps} bottomSlotText={store.bottom ? bottomText : undefined} hoverMask={store.hover === undefined ? undefined : hoverMask} topSlotText={store.top ? topText : undefined}>
    {#if store.node}
        <b>{store.label ?? 'Semi'}</b>
    {:else}
        {store.label ?? 'Semi'}
    {/if}
</Avatar>
