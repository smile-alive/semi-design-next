import { children, createEffect, createMemo, createSignal, For, type JSX, on, onMount, Show, splitProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, getBarItemKey, getTabId } from '@fibrae/semi-foundation/tabs/constants';
import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import { serverHtml } from '../_base/is-markup';
import mergeRefs from '../_base/merge-refs';
import useRaf from '../_base/use-raf';
import useResizeObserver from '../_base/use-resize-observer';
import Button from '../button';
import Dropdown, { type GetDropdownTriggerProps } from '../dropdown';
import useLocale from '../locale/use-locale';
import OverflowList from '../overflow-list';
import { TabsContext, useTabsContext } from './context';
import type { OverflowItem, TabBarProps } from './interface';
import TabItem from './tab-item';

type Side = 'start' | 'end';

export default function TabBar(props: TabBarProps) {
    const [local, rest] = splitProps(props, [
        'activeKey',
        'aria-label',
        'aria-labelledby',
        'arrowPosition',
        'class',
        'collapsible',
        'deleteTabItem',
        'dropdownClassName',
        'dropdownProps',
        'dropdownStyle',
        'handleKeyDown',
        'list',
        'more',
        'onTabClick',
        'onVisibleTabsChange',
        'ref',
        'renderArrow',
        'renderIcon',
        'renderTab',
        'showRestInDropdown',
        'size',
        'tabBarExtraContent',
        'tabPosition',
        'type',
        'visibleTabsStyle',
    ]);

    const ctx = useTabsContext();
    const locale = useLocale('Tabs');

    const [bar, setBar] = createSignal<HTMLDivElement>();
    const [shouldCollapse, setShouldCollapse] = createSignal(false);
    let isFirstShowInViewport = true;

    // Bar width at which the tabs overflowed. The collapsed layout can fit every tab at that width, but the uncollapsed
    // one cannot, so leaving the collapse below this width would flip-flop between the two.
    let collapsedWidth = 0;

    const scheduleFrame = useRaf();

    const extra = children(() => local.tabBarExtraContent);

    // keyed by itemKey: tabList users often pass fresh objects, and keying by identity would rebuild every tab and drop focus
    const byKey = createMemo(() => new Map((local.list ?? []).map((pane) => [pane.itemKey, pane])));
    const keys = createMemo(() => (local.list ?? []).map((pane) => pane.itemKey), undefined, { equals: isEqual });

    // read while OverflowList renders the arrow sides, which every change re-creates
    const showRestInDropdown = createMemo(() => local.showRestInDropdown);
    const renderArrow = createMemo(() => local.renderArrow);

    // The tabs `more` moves into its menu; undefined when it moves none
    const moreLayout = createMemo(() => {
        const more = local.more;
        if (!more) {
            return undefined;
        }
        const split = TabsFoundation.splitMore(keys(), more);
        return split.moved.length ? split : undefined;
    });

    // An item equal to its previous one keeps that object, so fresh tabList objects with the same data do not re-render
    // the collapsed tabs.
    const overflowItems = createMemo(
        (previous: Map<string, OverflowItem>) =>
            new Map(
                keys().map((itemKey) => {
                    const pane = byKey().get(itemKey);
                    const item: OverflowItem = { key: getBarItemKey(itemKey), itemKey, tab: pane?.tab, disabled: pane?.disabled, closable: pane?.closable, active: itemKey === local.activeKey };
                    const old = previous.get(itemKey);
                    return [itemKey, old && isEqual(old, item) ? old : item] as const;
                })
            ),
        new Map(),
        { equals: isEqual }
    );

    // What OverflowList measures and keys by. It excludes `active`, so selecting a tab does not make OverflowList
    // re-render the visible tabs and drop their focus.
    const overflowKeys = createMemo(() => keys().map((itemKey) => ({ key: getBarItemKey(itemKey), itemKey })), undefined, { equals: isEqual });

    // A tablist may own only tabs, so the arrows, the more trigger and the extra content stay outside it
    const tablistProps: JSX.HTMLAttributes<HTMLDivElement> = {
        role: 'tablist',
        get 'aria-orientation'() {
            return local.tabPosition === 'left' ? 'vertical' : 'horizontal';
        },
        get 'aria-label'() {
            return local['aria-label'];
        },
        get 'aria-labelledby'() {
            return local['aria-labelledby'];
        },
    };

    const overflowSide = (side: { itemKey: string }[]) => side.flatMap(({ itemKey }) => overflowItems().get(itemKey) ?? []);

    const collapsed = () => (local.collapsible === 'auto' ? shouldCollapse() : Boolean(local.collapsible));

    const moreOptions = () => (typeof local.more === 'object' ? local.more : undefined);

    const shownKeys = () => (collapsed() ? keys() : (moreLayout()?.kept ?? keys()));

    // Overrides the Tabs' Tab stop with the one among the tabs this bar puts in its tablist
    const tabbableKey = createMemo(() =>
        TabsFoundation.getTabbableKey(
            shownKeys().flatMap((key) => byKey().get(key) ?? []),
            local.activeKey ?? null
        )
    );

    const barContext = ctx && { ...ctx, view: () => ({ ...ctx.view(), tabbableKey: tabbableKey() }) };

    // only float moves to the wrapper; the element keeps its other style
    const extraFloat = () => {
        const node = extra();
        if (isServer) {
            // the float in the style attribute of the markup's root tag
            return /^<[^>]*\sstyle="[^"]*\bfloat:\s*([\w-]+)/.exec(serverHtml(node) ?? '')?.[1] || 'inline-end';
        }
        return (node instanceof HTMLElement && node.style.getPropertyValue('float')) || 'inline-end';
    };

    // Not collapsed yet. Once collapsed, the OverflowList visible-state callback decides whether to leave the collapse,
    // so this only ever turns it on.
    const checkOverflow = () => {
        const barEl = bar();
        if (local.collapsible !== 'auto' || shouldCollapse() || !barEl) {
            return;
        }
        if (TabsFoundation.isTabsOverflowing(barEl, local.tabPosition)) {
            collapsedWidth = barEl.clientWidth;
            setShouldCollapse(true);
        }
    };

    const scrollActiveTabItemIntoView = (logicalPosition?: ScrollLogicalPosition, behavior?: ScrollBehavior) => TabsFoundation.scrollTabIntoView(bar(), getBarItemKey(local.activeKey ?? ''), logicalPosition, behavior);

    // Each place that shows a tab calls these once where it inserts the result, so renderTab and renderIcon create the
    // content there; they run again only when the entry object or its index changes
    const tabContent = (key: string) => {
        const pane = createMemo(() => byKey().get(key));
        const index = createMemo(() => keys().indexOf(key));
        return {
            tab: () => {
                const item = pane();
                return item && (local.renderTab ? local.renderTab(item, index()) : item.tab);
            },
            icon: () => {
                const item = pane();
                return item && local.renderIcon?.(item, index());
            },
        };
    };

    // not keyed by the pane object: a fresh object for the same key updates this TabItem instead of replacing it
    const renderTabItem = (key: string) => (
        <Show when={byKey().get(key)}>
            {(pane) => {
                const content = tabContent(key);
                return (
                    <TabItem
                        itemKey={key}
                        tab={content.tab()}
                        icon={content.icon()}
                        disabled={pane().disabled}
                        closable={pane().closable}
                        selected={key === local.activeKey}
                        size={local.size}
                        type={local.type}
                        tabPosition={local.tabPosition}
                        deleteTabItem={local.deleteTabItem}
                        handleKeyDown={local.handleKeyDown}
                        onClick={local.onTabClick}
                    />
                );
            }}
        </Show>
    );

    // as in React, the more menu puts the icon in the item's icon slot and the arrow menus put it before the title
    const renderMenuItem = (itemKey: string, iconSlot: boolean) => {
        const pane = () => byKey().get(itemKey);
        const content = tabContent(itemKey);
        const icon = children(content.icon);
        return (
            <Dropdown.Item icon={iconSlot ? icon() : undefined} disabled={pane()?.disabled} active={itemKey === local.activeKey} onClick={(event) => local.onTabClick?.(itemKey, event)}>
                <Show when={!iconSlot && hasContent(icon())}>
                    <span>{icon()}</span>
                </Show>
                {content.tab()}
            </Dropdown.Item>
        );
    };

    // takes the item off `items`, so repeated clicks before the next render step on to the following hidden tab
    const handleArrowClick = (items: OverflowItem[], pos: Side) => {
        const lastItem = pos === 'start' ? items.pop() : items.shift();
        if (lastItem) {
            TabsFoundation.scrollTabIntoView(bar(), getBarItemKey(lastItem.itemKey));
        }
    };

    const renderCollapse = (items: OverflowItem[], pos: Side) => {
        const arrowClass = clsx(`${cssClasses.TABS_BAR}-arrow-${pos}`, `${cssClasses.TABS_BAR}-arrow`);
        const arrowButton = (disabled?: boolean) => <Button aria-label={pos === 'start' ? locale().locale.prevTabs : locale().locale.nextTabs} disabled={disabled} theme="borderless" icon={pos === 'start' ? <IconChevronLeft /> : <IconChevronRight />} />;

        if (!items.length) {
            return (
                <div class={arrowClass} role="presentation">
                    {arrowButton(true)}
                </div>
            );
        }
        // the Button is the Tab stop; Dropdown would add 0 here
        const own = { class: arrowClass, role: 'presentation', tabIndex: -1, onClick: () => handleArrowClick(items, pos) } as const;
        if (!showRestInDropdown()) {
            return <div {...own}>{arrowButton()}</div>;
        }
        // the menu opens after an arrow click has already taken an item off `items`
        const menuKeys = items.map((item) => item.itemKey);
        return (
            <Dropdown
                style={local.dropdownStyle}
                clickToHide
                clickTriggerToHide
                // prevent the panel from popping up again after clicking
                disableFocusListener
                position={pos === 'start' ? 'bottomLeft' : 'bottomRight'}
                render={
                    <Dropdown.Menu>
                        <For each={menuKeys}>{(key) => renderMenuItem(key, false)}</For>
                    </Dropdown.Menu>
                }
                showTick
                trigger="hover"
                {...local.dropdownProps?.[pos]}
                // the user's class adds to the built-in one: the built-in class supplies the popup's max-height and scrolling
                class={clsx(local.dropdownClassName, `${cssClasses.TABS_BAR}-dropdown`, local.dropdownProps?.[pos]?.class)}
            >
                {(getTriggerProps: GetDropdownTriggerProps) => <div {...getTriggerProps(own)}>{arrowButton()}</div>}
            </Dropdown>
        );
    };

    // more.render replaces the trigger and, like other non-function Dropdown children, is wrapped in Dropdown's span
    const moreTrigger = () => {
        const render = moreOptions()?.render;
        if (render) {
            return render();
        }
        return (getTriggerProps: GetDropdownTriggerProps) => (
            <button
                {...getTriggerProps({
                    type: 'button',
                    get class() {
                        return clsx(`${cssClasses.TABS_BAR}-more-trigger`, `${cssClasses.TABS_BAR}-more-trigger-${local.type}`);
                    },
                })}
            >
                <span class={`${cssClasses.TABS_BAR}-more-trigger-content`}>
                    <span>{locale().locale.more}</span>
                    <IconChevronDown class={`${cssClasses.TABS_BAR}-more-trigger-content-icon`} />
                </span>
            </button>
        );
    };

    const renderArrowSide = (items: OverflowItem[], pos: Side) => {
        const render = renderArrow();
        if (!render) {
            return renderCollapse(items, pos);
        }
        const onArrowClick = () => handleArrowClick(items, pos);
        // the default arrow is created only where renderArrow calls defaultNode, so one it leaves out never exists
        const defaultNode = () => renderCollapse(items, pos);
        return render(items, pos, onArrowClick, defaultNode);
    };

    const handleVisibleStateChange = (visibleMap: Map<string, boolean>) => {
        const { visibleState, isShowInViewport, hasHidden } = TabsFoundation.readVisibleState(visibleMap);
        // only when the tabs component appears in the viewport for the first time triggered scrollActiveTabItemIntoView
        // refer to issue 2917 https://github.com/DouyinFE/semi-design/issues/2917
        if (isFirstShowInViewport && isShowInViewport) {
            scrollActiveTabItemIntoView('nearest', 'auto');
            isFirstShowInViewport = false;
        }
        // all false: the bar is off-screen, which must not change the collapse state
        if (local.collapsible === 'auto' && isShowInViewport) {
            const barEl = bar();
            setShouldCollapse(hasHidden || (barEl !== undefined && barEl.clientWidth <= collapsedWidth));
        }
        local.onVisibleTabsChange?.(visibleState);
    };

    createEffect(
        on(
            createMemo(() => local.activeKey),
            () => {
                if (collapsed()) {
                    scrollActiveTabItemIntoView();
                }
            },
            { defer: true }
        )
    );

    // tabs added, removed or reordered change how wide the bar must be, so the remembered width no longer applies
    createEffect(
        on(
            keys,
            () => {
                collapsedWidth = 0;
                checkOverflow();
            },
            { defer: true }
        )
    );

    useResizeObserver(
        createMemo(() => (local.collapsible === 'auto' ? bar() : undefined)),
        () => checkOverflow()
    );

    // ResizeObserver reports after mount as well; this frame is the fallback when it does not fire
    onMount(() => scheduleFrame(checkOverflow));

    return (
        <div
            {...rest}
            ref={mergeRefs(local.ref, (node: HTMLDivElement) => setBar(node))}
            class={clsx(local.class, cssClasses.TABS_BAR, {
                [cssClasses.TABS_BAR_LINE]: local.type === 'line',
                [cssClasses.TABS_BAR_CARD]: local.type === 'card',
                [cssClasses.TABS_BAR_BUTTON]: local.type === 'button',
                [cssClasses.TABS_BAR_SLASH]: local.type === 'slash',
                [`${cssClasses.TABS_BAR}-${local.tabPosition}`]: local.tabPosition,
                [`${cssClasses.TABS_BAR}-collapse`]: collapsed(),
            })}
        >
            <TabsContext.Provider value={barContext}>
                <Show
                    when={collapsed()}
                    fallback={
                        <>
                            <div {...tablistProps} class={`${cssClasses.TABS_BAR}-tablist`}>
                                <For each={shownKeys()}>{renderTabItem}</For>
                            </div>
                            <Show when={moreLayout()}>
                                {(layout) => (
                                    <>
                                        <Dropdown
                                            class={`${cssClasses.TABS_BAR}-more-dropdown-${local.type}`}
                                            clickToHide
                                            position="bottomLeft"
                                            render={
                                                <Dropdown.Menu>
                                                    <For each={layout().moved}>{(key) => renderMenuItem(key, true)}</For>
                                                </Dropdown.Menu>
                                            }
                                            showTick
                                            trigger="hover"
                                            {...moreOptions()?.dropdownProps}
                                        >
                                            {moreTrigger()}
                                        </Dropdown>
                                        {/* A panel is labelled by its tab's id, and a tab in the menu is not rendered: this hidden copy of its
                                            label takes the id, and aria-labelledby still reads hidden elements it points to */}
                                        <Show when={ctx}>
                                            {(tabs) => (
                                                <For each={layout().moved}>
                                                    {(key) => {
                                                        const content = tabContent(key);
                                                        return (
                                                            <span id={getTabId(tabs().view().tabsId, key)} hidden>
                                                                {content.tab()}
                                                            </span>
                                                        );
                                                    }}
                                                </For>
                                            )}
                                        </Show>
                                    </>
                                )}
                            </Show>
                        </>
                    }
                >
                    <OverflowList<{ key: string; itemKey: string }>
                        class={`${cssClasses.TABS_BAR}-overflow-list`}
                        wrapperStyle={local.visibleTabsStyle}
                        items={overflowKeys()}
                        overflowRenderDirection={local.arrowPosition}
                        overflowRenderer={([start, end]) => [renderArrowSide(overflowSide(start), 'start'), renderArrowSide(overflowSide(end), 'end')]}
                        visibleItemRenderer={(item) => renderTabItem(item.itemKey)}
                        wrapperProps={tablistProps}
                        renderMode="scroll"
                        onVisibleStateChange={handleVisibleStateChange}
                    />
                </Show>
            </TabsContext.Provider>
            <Show when={hasContent(extra())}>
                <div
                    class={clsx(cssClasses.TABS_BAR_EXTRA, {
                        [`${cssClasses.TABS_BAR}-${local.type}-extra`]: local.type,
                        [`${cssClasses.TABS_BAR}-${local.type}-extra-${local.size}`]: local.type && local.size,
                    })}
                    style={{ float: extraFloat() as JSX.CSSProperties['float'] }}
                    x-semi-prop="tabBarExtraContent"
                >
                    {extra()}
                </div>
            </Show>
        </div>
    );
}
