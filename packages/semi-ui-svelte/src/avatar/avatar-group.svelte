<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';
    import useDefaultProps from '../_base/use-default-props.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import AvatarGroupMore from './avatar-group-more.svelte';
    import Avatar from './avatar.svelte';
    import type { AvatarGroupProps } from './interface.js';

    const defaults = useDefaultProps('AvatarGroup');
    let { size = defaults('size', 'medium'), shape = defaults('shape', 'circle'), overlapFrom = defaults('overlapFrom', 'start'), maxCount = defaults('maxCount'), items = [], item, more, ...rest }: AvatarGroupProps = $props();

    const locale = useLocale('Avatar');

    const prefix = cssClasses.PREFIX;
    const visibleCount = $derived(maxCount === undefined ? items.length : Math.min(items.length, maxCount));
    const visible = $derived(items.slice(0, visibleCount));
    const overflow = $derived(items.slice(visibleCount));
    const overlapClass = $derived(`${prefix}-item-${overlapFrom}-${visibleCount}`);

    const moreLabel = $derived.by(() => {
        const label = locale().locale.more.replace('${count}', String(overflow.length));
        const names = overflow
            .map((entry) => entry.alt)
            .filter(Boolean)
            .join(',');
        return names ? `${label}: ${names}` : label;
    });
</script>

<div {...rest} class={[`${prefix}-group`, rest.class]} role="list">
    {#each visible as entry, index (index)}
        {#snippet content()}{@render item?.({ item: entry, index })}{/snippet}
        <Avatar {...entry} children={item ? content : entry.children} class={[entry.class, `${prefix}-item-${overlapFrom}-${index}`]} role="listitem" {shape} {size} />
    {/each}
    {#if overflow.length > 0}
        <AvatarGroupMore itemClass={overlapClass} {shape} {size}>
            {#if more}
                {@render more({ restNumber: overflow.length, restAvatars: overflow })}
            {:else}
                <Avatar alt={moreLabel} class="{prefix}-item-more">+{overflow.length}</Avatar>
            {/if}
        </AvatarGroupMore>
    {/if}
</div>
