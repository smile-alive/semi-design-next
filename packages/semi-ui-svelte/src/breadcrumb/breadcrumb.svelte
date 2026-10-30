<script lang="ts">
    import { DEFAULT_TOOLTIP, cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
    import BreadcrumbFoundation, { type BreadcrumbAdapter } from '@fibrae/semi-foundation/breadcrumb/foundation';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import '@fibrae/semi-foundation/breadcrumb/breadcrumb.scss';
    import { IconMore } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import BreadcrumbItem from './breadcrumb-item.svelte';
    import { setBreadcrumbContext } from './context.js';
    import type { BreadcrumbProps, BreadcrumbRoute } from './interface.js';

    interface BreadcrumbState {
        isCollapsed: boolean;
    }

    type Foundation = BreadcrumbFoundation<BreadcrumbProps, BreadcrumbState, MouseEvent>;
    type Adapter = BreadcrumbAdapter<BreadcrumbProps, BreadcrumbState, MouseEvent>;

    const defaults = useDefaultProps('Breadcrumb');

    let {
        activeIndex = defaults('activeIndex'),
        autoCollapse = defaults('autoCollapse', true),
        compact = defaults('compact', true),
        maxItemCount = defaults('maxItemCount', 4),
        moreType = defaults('moreType', 'default'),
        routes = defaults('routes', []),
        separator = defaults('separator', '/'),
        showTooltip = defaults('showTooltip', DEFAULT_TOOLTIP),
        onClick,
        item,
        icon,
        more,
        ...rest
    }: BreadcrumbProps = $props();

    const locale = useLocale('Breadcrumb');

    let root = $state<HTMLElement>();
    let moreArea = $state<HTMLSpanElement>();

    const prefix = cssClasses.PREFIX;

    const foundationProps: BreadcrumbProps = {
        get onClick() {
            return onClick;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BreadcrumbProps, BreadcrumbState>(
        BreadcrumbFoundation,
        foundationProps,
        () => ({ isCollapsed: true }),
        (base) => ({
            notifyClick: (info, event) => onClick?.(info as BreadcrumbRoute, event),
            expandCollapsed: () => {
                // Expanding removes the more button, which held focus: the first item it hid takes over, else the nav itself
                const from = moreArea?.contains(document.activeElement) ? moreArea : undefined;
                base.setState({ isCollapsed: false }, () => {
                    if (!from) {
                        return;
                    }
                    const target = root?.children[range.start]?.querySelector<HTMLElement>('a[href], [tabindex]:not([tabindex="-1"])');
                    if (!target && root) {
                        root.tabIndex = -1;
                    }
                    handoverFocus(from, target ?? root);
                });
            },
        })
    );

    const entries = $derived(
        BreadcrumbFoundation.genRoutes(routes).map((route, index) => ({
            index,
            route: route._origin,
            // Only the Item attributes a route may set stay; other route fields stay off the DOM
            attrs: getDataAttr(route) as Record<`data-${string}`, string>,
            key: String(route._origin.key || `item-${route.name || route.path}-${index}`),
        }))
    );

    const total = $derived(entries.length);
    const range = $derived(BreadcrumbFoundation.getCollapseRange(total, maxItemCount, activeIndex));
    const collapsed = $derived(autoCollapse && range.end >= range.start && states().isCollapsed);
    const before = $derived(collapsed ? entries.slice(0, range.start) : entries);
    const after = $derived(collapsed ? entries.slice(range.end + 1) : []);
    const hidden = $derived(collapsed ? entries.slice(range.start, range.end + 1) : []);

    setBreadcrumbContext({
        get compact() {
            return compact;
        },
        get showTooltip() {
            return showTooltip;
        },
        get separator() {
            return separator;
        },
        get hasOnClick() {
            return Boolean(onClick);
        },
        get item() {
            return item;
        },
        get icon() {
            return icon;
        },
        onClick: foundation.handleClick,
    });

    const itemProps = (entry: (typeof entries)[number]) => ({
        ...entry.attrs,
        route: entry.route as BreadcrumbRoute,
        index: entry.index,
        active: BreadcrumbFoundation.isActive(entry.index, total, activeIndex),
        shouldRenderSeparator: BreadcrumbFoundation.shouldRenderSeparator(entry.index, total, { collapsed, start: range.start, end: range.end, hasCustomMore: Boolean(more), moreType }),
    });
</script>

{#snippet separatorContent()}
    {#if typeof separator === 'function'}
        {@render separator()}
    {:else}
        {separator}
    {/if}
{/snippet}

<nav {...rest} aria-label={rest['aria-label'] ?? locale().locale.label} bind:this={root} class={[`${prefix}-wrapper`, compact ? `${prefix}-wrapper-compact` : `${prefix}-wrapper-loose`, rest.class]}>
    {#each before as entry (entry.key)}
        <BreadcrumbItem {...itemProps(entry)} />
    {/each}
    {#if collapsed}
        <span bind:this={moreArea} class={`${prefix}-collapse`}>
            <span class={`${prefix}-item-wrap`}>
                <span aria-label={locale().locale.expand} class={`${prefix}-item ${prefix}-item-more`} role="button" tabindex="0" onclick={foundation.handleExpand} onkeydown={foundation.handleExpandKeyDown}>
                    {#if more}
                        {@render more({ restItems: hidden.map(({ route, index }) => ({ route, index })) })}
                    {:else if moreType === 'default'}
                        <IconMore />
                    {:else}
                        <Popover showArrow style="padding: 12px">
                            <!-- the more button around it is the Tab stop and expands every item -->
                            {#snippet child({ props })}<IconMore {...props} tabindex={-1} />{/snippet}
                            {#snippet content()}
                                {#each hidden as entry, i (entry.key)}
                                    <BreadcrumbItem {...itemProps(entry)} />
                                    {#if i < hidden.length - 1}
                                        <span class={`${prefix}-restItem`}>{@render separatorContent()}</span>
                                    {/if}
                                {/each}
                            {/snippet}
                        </Popover>
                    {/if}
                </span>
                <span class={`${prefix}-separator`} x-semi-prop="separator">{@render separatorContent()}</span>
            </span>
        </span>
    {/if}
    {#each after as entry (entry.key)}
        <BreadcrumbItem {...itemProps(entry)} />
    {/each}
</nav>
