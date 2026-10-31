<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/navigation/constants';
    import NavigationFoundation, { type NavItemType, type NavigationAdapter, type NavigationBaseProps, type NavigationState } from '@fibrae/semi-foundation/navigation/foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { setNavContext } from './context.js';
    import type { ItemKey, NavProps } from './interface.js';
    import NavFooter from './nav-footer.svelte';
    import NavHeader from './nav-header.svelte';
    import NavItems from './nav-items.svelte';

    type Foundation = NavigationFoundation<NavigationBaseProps>;
    type Adapter = NavigationAdapter<NavigationBaseProps>;

    const defaults = useDefaultProps('Nav');

    // No fallback on the bindable props: a bound `undefined` (form reset) would throw with one
    let {
        isCollapsed = $bindable(),
        openKeys = $bindable(),
        selectedKeys = $bindable(),
        bodyStyle = defaults('bodyStyle'),
        items = defaults('items'),
        limitIndent = defaults('limitIndent', true),
        mode = defaults('mode', 'vertical'),
        subDropdownProps = defaults('subDropdownProps'),
        subNavCloseDelay = defaults('subNavCloseDelay', numbers.DEFAULT_SUBNAV_CLOSE_DELAY),
        subNavMotion = defaults('subNavMotion', true),
        subNavOpenDelay = defaults('subNavOpenDelay', numbers.DEFAULT_SUBNAV_OPEN_DELAY),
        toggleIconPosition = defaults('toggleIconPosition', 'right'),
        tooltipHideDelay = defaults('tooltipHideDelay', numbers.DEFAULT_TOOLTIP_HIDE_DELAY),
        tooltipShowDelay = defaults('tooltipShowDelay', numbers.DEFAULT_TOOLTIP_SHOW_DELAY),
        header = defaults('header'),
        footer = defaults('footer'),
        children,
        wrapper,
        icon,
        text,
        toggleIcon,
        expandIcon,
        onClick,
        onCollapseChange,
        onOpenChange,
        onSelect,
        ...rest
    }: NavProps = $props();

    let navElement = $state<HTMLElement>();

    // Texts remount on collapse/expand, so they fade in only while the width animates
    let settledCollapsed = $state(untrack(() => isCollapsed ?? false));

    // Nav.Item and Nav.Sub written as children are not read by the Nav (a snippet cannot expose them), so their tree is empty
    const NO_TREE: NavItemType[] = [];
    const prefix = cssClasses.PREFIX;

    // null is a controlled empty value, which the foundation's readers handle
    const foundationProps: NavigationBaseProps = {
        get children() {
            return children ? NO_TREE : undefined;
        },
        get isCollapsed() {
            return isCollapsed;
        },
        get items() {
            return items;
        },
        get mode() {
            return mode;
        },
        get openKeys() {
            return openKeys as ItemKey[] | undefined;
        },
        get selectedKeys() {
            return selectedKeys as ItemKey[] | undefined;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, NavigationBaseProps, NavigationState>(
        NavigationFoundation,
        foundationProps,
        (view) => NavigationFoundation.getInitialState(view),
        (base) => ({
            getItemsFromChildren: () => NO_TREE,
            setIsCollapsed: (next) => base.setState({ isCollapsed: next }),
            // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
            notifyCollapseChange: (next) => {
                isCollapsed = next;
                onCollapseChange?.(next);
            },
            updateSelectedKeys: (keys) => base.setState({ selectedKeys: keys }),
            updateOpenKeys: (keys) => base.setState({ openKeys: [...keys] }),
        })
    );

    const collapsed = $derived(NavigationFoundation.getIsCollapsed(foundationProps, states()));
    const openKeysIsControlled = $derived(NavigationFoundation.isOpenKeysControlled(foundationProps, collapsed));
    const shownOpenKeys = $derived(NavigationFoundation.getOpenKeys(foundationProps, states(), collapsed));
    const formatted = $derived(NavigationFoundation.getFormattedItems({ items }));
    const shownSelectedKeys = $derived(NavigationFoundation.getSelectedKeys(foundationProps, states(), formatted.itemKeysMap));
    const collapseAnimating = $derived(collapsed !== settledCollapsed);

    setNavContext({
        get isCollapsed() {
            return collapsed;
        },
        get mode() {
            return mode;
        },
        isInSubNav: false,
        level: 0,
        get openKeys() {
            return shownOpenKeys;
        },
        get openKeysIsControlled() {
            return openKeysIsControlled;
        },
        get selectedKeys() {
            return shownSelectedKeys;
        },
        get selectedKeysIsControlled() {
            return selectedKeys !== undefined;
        },
        get limitIndent() {
            return limitIndent;
        },
        get toggleIconPosition() {
            return toggleIconPosition;
        },
        get subNavMotion() {
            return subNavMotion;
        },
        get subNavOpenDelay() {
            return subNavOpenDelay;
        },
        get subNavCloseDelay() {
            return subNavCloseDelay;
        },
        get tooltipShowDelay() {
            return tooltipShowDelay;
        },
        get tooltipHideDelay() {
            return tooltipHideDelay;
        },
        get wrapper() {
            return wrapper;
        },
        toggleCollapsed: foundation.handleCollapseChange,
        updateSelectedKeys: foundation.updateSelectedKeys,
        addOpenKey: foundation.addOpenKey,
        removeOpenKey: foundation.removeOpenKey,
        notifySelect: (data) => {
            selectedKeys = data.selectedKeys;
            onSelect?.(data);
        },
        notifyClick: (data) => onClick?.(data),
        notifyOpenChange: (data) => {
            // Written only while the prop is set: an unset openKeys stays uncontrolled, so a later selectedKeys change
            // still opens the ancestors of the selected item (a written value would count as given)
            if (openKeys !== undefined) {
                openKeys = data.openKeys;
            }
            onOpenChange?.(data);
        },
    });

    const handleTransitionEnd = (event: TransitionEvent & { currentTarget: HTMLElement }) => {
        rest.ontransitionend?.(event);
        if (event.target === event.currentTarget && event.propertyName === 'width') {
            settledCollapsed = collapsed;
        }
    };

    // $state.snapshot: a parent mutating its own array in place still shows up as a change
    // children is part of it so the foundation compares the previous props with the same shape, otherwise every change looks like a new tree
    const snapshot = () => ({ children: foundationProps.children, items, selectedKeys: $state.snapshot(selectedKeys), openKeys: $state.snapshot(openKeys) });

    let previous = untrack(snapshot);

    // New items rebuild the menu from the props, otherwise a changed (deep compared) selectedKeys or openKeys is copied into state
    watch(snapshot, (next) => {
        const before = previous;
        previous = next;
        foundation.handlePropsUpdate(before as NavigationBaseProps);
    });

    // no transitionend comes when the width does not animate; getAnimations flushes style, so it lists this update's transition
    watch(
        () => collapsed,
        (next) => {
            const animatesWidth = navElement?.getAnimations().some((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'width');
            if (!animatesWidth) {
                settledCollapsed = next;
            }
        }
    );
</script>

<!-- APG disclosure navigation: a navigation landmark holding plain lists of links and buttons -->
<nav
    bind:this={navElement}
    {...rest}
    class={[
        prefix,
        rest.class,
        {
            [`${prefix}-collapsed`]: collapsed,
            [`${prefix}-collapse-animating`]: collapseAnimating,
            [`${prefix}-horizontal`]: mode === 'horizontal',
            [`${prefix}-vertical`]: mode === 'vertical',
        },
    ]}
    ontransitionend={handleTransitionEnd}
>
    <div class={`${prefix}-inner`}>
        <div class={[`${prefix}-header-list-outer`, { [`${prefix}-header-list-outer-collapsed`]: collapsed }]}>
            {#if typeof header === 'function'}
                {@render header()}
            {:else if header}
                <NavHeader {...header} />
            {/if}
            <div class={`${prefix}-list-wrapper`} style={bodyStyle}>
                <ul class={`${prefix}-list`}>
                    {#if formatted.formattedItems.length}
                        <NavItems {expandIcon} {icon} items={formatted.formattedItems} level={0} {subDropdownProps} {text} {toggleIcon} />
                    {/if}
                    {@render children?.()}
                </ul>
            </div>
        </div>
        {#if typeof footer === 'function'}
            {@render footer()}
        {:else if footer}
            <NavFooter {...footer} />
        {/if}
    </div>
</nav>
