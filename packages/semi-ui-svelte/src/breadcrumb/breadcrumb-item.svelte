<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
    import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter } from '@fibrae/semi-foundation/breadcrumb/item-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { TypographyText } from '../typography/index.js';
    import { getBreadcrumbContext } from './context.js';
    import type { BreadcrumbRoute } from './interface.js';

    interface ItemProps {
        route: BreadcrumbRoute;
        index: number;
        active: boolean;
        shouldRenderSeparator: boolean;
        [data: `data-${string}`]: string | undefined;
    }

    type Foundation = BreadcrumbItemFoundation<Pick<ItemProps, 'route'>, object, MouseEvent>;
    type Adapter = BreadcrumbItemAdapter<Pick<ItemProps, 'route'>, object, MouseEvent>;

    // Only the Breadcrumb renders items; `rest` holds the route's data-* attributes
    const { route, index, active, shouldRenderSeparator, ...rest }: ItemProps = $props();

    const context = getBreadcrumbContext('Breadcrumb item');

    const { foundation } = useFoundation<Foundation, Adapter, Pick<ItemProps, 'route'>, object>(
        BreadcrumbItemFoundation,
        {
            get route() {
                return route;
            },
        },
        () => ({}),
        () => ({
            notifyClick: () => undefined,
            // the foundation types the info loosely; this item always reports its route
            notifyParent: (item, event) => context.onClick(item as BreadcrumbRoute, event),
        })
    );

    const prefix = cssClasses.PREFIX;
    const hasHref = $derived(route.href != null);
    const isLink = $derived(!active && hasHref);
    const isKeyboardLink = $derived(BreadcrumbItemFoundation.isKeyboardLink({ active, hasHref, noLink: route.noLink, hasOnClick: context.hasOnClick }));
    const tooltip = $derived(BreadcrumbItemFoundation.getTooltipConfig(context.showTooltip));
    const ellipsis = $derived({ showTooltip: tooltip.opts ? { opts: tooltip.opts } : false, pos: tooltip.ellipsisPos });
    const itemClass = $derived([`${prefix}-item`, { [`${prefix}-item-active`]: active, [`${prefix}-item-link`]: !route.noLink }]);

    const handleClick = (event: MouseEvent) => foundation.handleClick(route, event);

    const handleKeydown = (event: KeyboardEvent & { currentTarget: HTMLElement }) => foundation.handleKeyDown(event, isKeyboardLink);
</script>

{#snippet inner()}
    {@render context.icon?.({ route, index, size: context.compact ? 'small' : 'default', class: `${prefix}-item-icon` })}{#if context.item}
        <span class={`${prefix}-item-title ${prefix}-item-title-inline`}>{@render context.item({ route, index })}</span>
    {:else if route.name}
        <span class={`${prefix}-item-title`}><TypographyText {ellipsis} size={context.compact ? 'small' : 'normal'} style={`max-width: ${toCssLength(tooltip.width)}`}>{route.name}</TypographyText></span>
    {/if}
{/snippet}

<span {...rest} aria-current={active ? 'page' : undefined} class={`${prefix}-item-wrap`}>
    {#if isLink}
        <a class={itemClass} href={route.href} onclick={handleClick}>{@render inner()}</a>
    {:else}
        <span class={itemClass} role={isKeyboardLink ? 'link' : undefined} tabindex={isKeyboardLink ? 0 : undefined} onclick={handleClick} onkeydown={handleKeydown}>{@render inner()}</span>
    {/if}{#if shouldRenderSeparator}
        {#if route.separator}{route.separator}{:else}
            <span class={`${prefix}-separator`}>
                {#if typeof context.separator === 'function'}
                    {@render context.separator()}
                {:else}
                    {context.separator}
                {/if}
            </span>
        {/if}
    {/if}
</span>
