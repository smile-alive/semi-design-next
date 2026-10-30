<script lang="ts">
    import { onMount, untrack, type Snippet } from 'svelte';
    import { cssClasses, getBarItemKey, getTabId } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
    import { IconChevronDown } from '@fibrae/semi-icons-svelte';
    import watch from '../_base/watch.svelte.js';
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownTriggerProps } from '../dropdown/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { OverflowList } from '../overflow-list/index.js';
    import { observeResize } from '../resize-observer/index.js';
    import { requireTabsContext, setTabsContext } from './context.js';
    import type { OverflowItem, PlainTab, TabBarProps, TabsArrowSnippetProps, TabsMoreContentSnippetProps, TabsTabSnippetProps } from './interface.js';
    import TabBarArrow from './tab-bar-arrow.svelte';
    import TabItem from './tab-item.svelte';

    interface Props extends TabBarProps {
        /** The Tabs' aria-label and aria-labelledby, which name the tablist */
        tablistAttrs: Record<string, unknown>;
        tab?: Snippet<[TabsTabSnippetProps]>;
        icon?: Snippet<[TabsTabSnippetProps]>;
        arrow?: Snippet<[TabsArrowSnippetProps]>;
        moreTrigger?: Snippet;
        moreContent?: Snippet<[TabsMoreContentSnippetProps]>;
        extra?: Snippet;
        onVisibleTabsChange?: (visibleState: Map<string, boolean>) => void;
    }

    let { activeKey, list, type, size, tabPosition, collapsible, showRestInDropdown, more, arrowPosition, visibleTabsStyle, dropdownProps, tablistAttrs, class: className, style, tab, icon, arrow, moreTrigger, moreContent, extra, onVisibleTabsChange }: Props = $props();

    const ctx = requireTabsContext('TabBar');
    const locale = useLocale('Tabs');

    let bar = $state<HTMLDivElement>();
    let shouldCollapse = $state(false);

    // Bar width at which the tabs overflowed. The collapsed layout can fit every tab at that width, but the uncollapsed one
    // cannot, so leaving the collapse at or below this width would flip-flop between the two.
    let collapsedWidth = 0;
    let isFirstShowInViewport = true;
    const arrowClicks = new WeakMap<OverflowItem[], number>();

    const prefix = cssClasses.TABS_BAR;
    const collapsed = $derived(collapsible === 'auto' ? shouldCollapse : collapsible);

    // a derived string, so the watcher below only runs when a label really changes, not each time the list is rebuilt
    const labelsSignature = $derived(list.map((entry) => `${entry.itemKey}:${entry.tab}`).join('\n'));
    const overflowItems = $derived(list.map((item): OverflowItem => ({ key: getBarItemKey(item.itemKey), active: item.itemKey === activeKey, ...item })));

    const layout = $derived.by(() => {
        if (!more) {
            return { shown: list, hidden: [] as PlainTab[], dropdownProps: undefined };
        }
        const { kept, moved } = TabsFoundation.splitMore(list, more);
        return { shown: kept, hidden: moved, dropdownProps: typeof more === 'object' ? more.dropdownProps : undefined };
    });

    // the collapsed bar shows every tab; otherwise the tabs moved into the more menu are not in the tablist
    const tabbableKey = $derived(TabsFoundation.getTabbableKey(collapsed ? list : layout.shown, activeKey));

    // A tablist may own only tabs: arrows, more trigger and extra content stay outside it
    const tablistProps = $derived({ ...tablistAttrs, role: 'tablist', 'aria-orientation': tabPosition === 'left' ? ('vertical' as const) : ('horizontal' as const) });

    setTabsContext({
        get view() {
            return { ...ctx.view, tabbableKey };
        },
        tabClick: ctx.tabClick,
        handleKeyDown: ctx.handleKeyDown,
        deleteTab: ctx.deleteTab,
    });

    // Only turns collapse on; once collapsed, the OverflowList visible-state event decides when to leave it.
    const checkOverflow = () => {
        if (collapsible !== 'auto' || shouldCollapse || !bar) {
            return;
        }
        if (TabsFoundation.isTabsOverflowing(bar, tabPosition)) {
            collapsedWidth = bar.clientWidth;
            shouldCollapse = true;
        }
    };

    const scrollActiveTabItemIntoView = (logicalPosition?: ScrollLogicalPosition, behavior?: ScrollBehavior) => {
        TabsFoundation.scrollTabIntoView(bar, getBarItemKey(`${activeKey}`), logicalPosition, behavior);
    };

    const onTabClick = (itemKey: string, event: MouseEvent) => {
        ctx.tabClick(itemKey, event);
    };

    // Counts the clicks per items array, so repeated clicks before the next visibility update reach the following hidden tab
    const handleArrowClick = (items: OverflowItem[], position: 'start' | 'end') => {
        const taken = arrowClicks.get(items) ?? 0;
        arrowClicks.set(items, taken + 1);
        const next = position === 'start' ? items[items.length - 1 - taken] : items[taken];
        if (next) {
            TabsFoundation.scrollTabIntoView(bar, getBarItemKey(next.itemKey));
        }
    };

    const onVisibleStateChange = (visibleMap: Map<string, boolean>) => {
        const { visibleState, isShowInViewport, hasHidden } = TabsFoundation.readVisibleState(visibleMap);
        // first show only: https://github.com/DouyinFE/semi-design/issues/2917
        if (isFirstShowInViewport && isShowInViewport) {
            scrollActiveTabItemIntoView('nearest', 'auto');
            isFirstShowInViewport = false;
        }
        if (collapsible === 'auto' && isShowInViewport) {
            shouldCollapse = hasHidden || (bar !== undefined && bar.clientWidth <= collapsedWidth);
        }
        onVisibleTabsChange?.(visibleState);
    };

    // the remembered width no longer applies once tabs are added, removed or retitled
    watch(
        () => labelsSignature,
        () => {
            collapsedWidth = 0;
        }
    );

    watch(
        () => activeKey,
        () => {
            if (collapsed) {
                scrollActiveTabItemIntoView();
            }
        }
    );

    // The bar re-measures after what changes its tabs; a changed tab label made by a snippet is caught by the ResizeObserver
    $effect(() => {
        void [list, collapsible, tabPosition, size, type, more];
        untrack(checkOverflow);
    });

    // fallback for when ResizeObserver does not report after mount
    onMount(() => {
        const frame = requestAnimationFrame(checkOverflow);
        return () => cancelAnimationFrame(frame);
    });
</script>

{#snippet tabItem(entry: PlainTab, index: number)}
    {#snippet label()}
        {#if tab}
            {@render tab({ item: entry, index })}
        {:else}
            {entry.tab}
        {/if}
    {/snippet}
    {#snippet iconContent()}
        {@render icon?.({ item: entry, index })}
    {/snippet}
    <TabItem closable={entry.closable} disabled={entry.disabled} icon={icon ? iconContent : undefined} itemKey={entry.itemKey} selected={entry.itemKey === activeKey} {size} tab={label} {tabPosition} {type} />
{/snippet}

{#snippet moreButton({ props }: { props: DropdownTriggerProps })}
    <button {...props} class={[`${prefix}-more-trigger`, `${prefix}-more-trigger-${type}`, props.class]} type="button">
        <span class="{prefix}-more-trigger-content">
            <span>{locale().locale.more}</span>
            <IconChevronDown class="{prefix}-more-trigger-content-icon" />
        </span>
    </button>
{/snippet}

{#snippet moreMenu()}
    {#if moreContent}
        {@render moreContent({ items: layout.hidden })}
    {:else}
        <DropdownMenu>
            {#each layout.hidden as entry (entry.itemKey)}
                {@const index = list.indexOf(entry)}
                {#snippet iconContent()}
                    {@render icon?.({ item: entry, index })}
                {/snippet}
                <DropdownItem active={entry.itemKey === activeKey} disabled={entry.disabled} icon={icon ? iconContent : undefined} onclick={(event) => onTabClick(entry.itemKey, event)}>
                    {#if tab}
                        {@render tab({ item: entry, index })}
                    {:else}
                        {entry.tab}
                    {/if}
                </DropdownItem>
            {/each}
        </DropdownMenu>
    {/if}
{/snippet}

{#snippet arrowOf(items: OverflowItem[], position: 'start' | 'end')}
    {#snippet defaultArrow()}
        <TabBarArrow dropdownProps={dropdownProps?.[position]} {icon} {items} {list} onArrowClick={() => handleArrowClick(items, position)} {onTabClick} {position} {showRestInDropdown} {tab} />
    {/snippet}
    {#if arrow}
        {@render arrow({ items, position, onClick: () => handleArrowClick(items, position), defaultNode: defaultArrow })}
    {:else}
        {@render defaultArrow()}
    {/if}
{/snippet}

<div
    {@attach collapsible === 'auto' ? observeResize(checkOverflow) : undefined}
    bind:this={bar}
    class={[
        prefix,
        `${prefix}-${tabPosition}`,
        className,
        {
            [cssClasses.TABS_BAR_LINE]: type === 'line',
            [cssClasses.TABS_BAR_CARD]: type === 'card',
            [cssClasses.TABS_BAR_BUTTON]: type === 'button',
            [cssClasses.TABS_BAR_SLASH]: type === 'slash',
            [`${prefix}-collapse`]: collapsed,
        },
    ]}
    {style}
>
    {#if collapsed}
        <OverflowList class="{prefix}-overflow-list" itemKey="key" items={overflowItems} {onVisibleStateChange} overflowRenderDirection={arrowPosition} renderMode="scroll" wrapperProps={tablistProps} wrapperStyle={visibleTabsStyle}>
            {#snippet item({ item: overflowItem, index })}
                {@render tabItem(list[index] ?? overflowItem, index)}
            {/snippet}
            {#snippet overflow({ items, position })}
                {@render arrowOf(items as OverflowItem[], position)}
            {/snippet}
        </OverflowList>
    {:else}
        <div {...tablistProps} class="{prefix}-tablist">
            {#each layout.shown as entry, index (entry.itemKey)}
                {@render tabItem(entry, index)}
            {/each}
        </div>
        {#if layout.hidden.length}
            <Dropdown child={moreTrigger ? undefined : moreButton} children={moreTrigger} clickToHide position="bottomLeft" showTick trigger="hover" {...layout.dropdownProps} class={[`${prefix}-more-dropdown-${type}`, layout.dropdownProps?.class].filter(Boolean).join(' ')} content={moreMenu} />
            <!-- A panel is labelled by its tab's id, and a tab in the menu is not rendered: this hidden copy of its label
                 takes the id, and aria-labelledby still reads hidden elements it points to -->
            {#each layout.hidden as entry, offset (entry.itemKey)}
                <span hidden id={getTabId(ctx.view.tabsId, entry.itemKey)}>
                    {#if tab}
                        {@render tab({ item: entry, index: layout.shown.length + offset })}
                    {:else}
                        {entry.tab}
                    {/if}
                </span>
            {/each}
        {/if}
    {/if}
    {#if extra}
        <div class={[cssClasses.TABS_BAR_EXTRA, `${prefix}-${type}-extra`, `${prefix}-${type}-extra-${size}`]} style="float: inline-end" x-semi-prop="tabBarExtraContent">
            {@render extra()}
        </div>
    {/if}
</div>
