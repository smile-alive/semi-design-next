<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/anchor/constants';
    import isEnterPress from '@fibrae/semi-foundation/utils/is-enter-press';
    import { TypographyText } from '../typography/index.js';
    import { getAnchorContext } from './context.js';
    import type { AnchorClickEvent, AnchorLinkItem } from './interface.js';
    import LinkItem from './link-item.svelte';

    const { item, level }: { item: AnchorLinkItem; level: number } = $props();

    const anchor = getAnchorContext('Anchor link');

    const prefixCls = cssClasses.PREFIX;
    const href = $derived(item.href ?? '#');
    const active = $derived(anchor.activeLink === href);

    // Collapsed branches are not rendered, so the tree, not the DOM, says which branch holds the active link
    const expanded = $derived(!anchor.autoCollapse || active || Boolean(anchor.childMap[href]?.has(anchor.activeLink)));

    const tooltip = $derived.by(() => {
        const { showTooltip, position } = anchor;
        const config = typeof showTooltip === 'object' ? showTooltip : {};
        // The position can be set through showTooltip; a copy keeps the caller's object as it was
        return { ...config, opts: position ? { ...config.opts, position } : { ...config.opts } };
    });

    const handleClick = (event: AnchorClickEvent) => {
        if (!item.disabled) {
            anchor.onClick(event, href);
        }
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (isEnterPress(event)) {
            // otherwise the same Enter also presses a button that the click handler moved focus to
            event.preventDefault();
            handleClick(event);
        }
    };
</script>

{#snippet text()}
    {#if anchor.title}
        {@render anchor.title({ item, level })}
    {:else}
        {item.title}
    {/if}
{/snippet}

<div class={`${prefixCls}-link`} role="listitem">
    <div
        aria-current={active ? 'location' : undefined}
        aria-disabled={Boolean(item.disabled)}
        class={[`${prefixCls}-link-title`, { [`${prefixCls}-link-title-active`]: active, [`${prefixCls}-link-title-disabled`]: item.disabled }]}
        role="link"
        style={`padding-inline-start: ${8 * level}px`}
        tabindex="0"
        title={(!anchor.showTooltip && !anchor.title && item.title) || undefined}
        onclick={handleClick}
        onkeydown={handleKeydown}
    >
        <!-- the link title is the Tab stop; the ellipsis Tooltip would add another -->
        {#if anchor.showTooltip}
            <TypographyText
                class={[`${prefixCls}-link-tooltip`, { [`${prefixCls}-link-tooltip-small`]: anchor.size === 'small', [`${prefixCls}-link-tooltip-active`]: active, [`${prefixCls}-link-tooltip-disabled`]: item.disabled }]}
                ellipsis={{ showTooltip: tooltip }}
                size={anchor.size === 'default' ? 'normal' : 'small'}
                tabindex={-1}
                type="tertiary"
            >
                {@render text()}
            </TypographyText>
        {:else}
            {@render text()}
        {/if}
    </div>
    {#if item.children?.length && expanded}
        <div role="list">
            {#each item.children as child, index (index)}
                <LinkItem item={child} level={level + 1} />
            {/each}
        </div>
    {/if}
</div>
