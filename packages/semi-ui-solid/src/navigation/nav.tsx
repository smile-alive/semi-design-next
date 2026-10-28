import { type JSX, type ResolvedChildren, For, Show, children, createMemo, createSignal, mergeProps, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, numbers } from '@fibrae/semi-foundation/navigation/constants';
import NavigationFoundation, { type NavItemType, type NavigationAdapter, type NavigationState } from '@fibrae/semi-foundation/navigation/foundation';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { isToken } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useLocale from '../locale/use-locale';
import { NavContext, type NavContextValue, type NavView } from './context';
import { FooterView, NAV_FOOTER } from './footer';
import { HeaderView, NAV_HEADER } from './header';
import type { NavFooterProps, NavHeaderProps, NavItemProps, NavItemRenderProps, NavProps, SubNavProps } from './interface';
import NavItem, { NAV_ITEM } from './item';
import SubNav, { NAV_SUB, NavNodes, getSubNodes } from './sub-nav';

const prefix = cssClasses.PREFIX;

type FoundationProps = Omit<NavProps, 'children'> & { children: NavItemType[] };
type Foundation = NavigationFoundation<FoundationProps>;
type Adapter = NavigationAdapter<FoundationProps>;

const defaultProps = {
    subNavCloseDelay: numbers.DEFAULT_SUBNAV_CLOSE_DELAY,
    subNavOpenDelay: numbers.DEFAULT_SUBNAV_OPEN_DELAY,
    tooltipHideDelay: numbers.DEFAULT_TOOLTIP_HIDE_DELAY,
    tooltipShowDelay: numbers.DEFAULT_TOOLTIP_SHOW_DELAY,
    toggleIconPosition: 'right',
    limitIndent: true,
    subNavMotion: true,
    mode: 'vertical',
} satisfies Partial<NavProps>;

// items configs may carry app data (e.g. `path`), so only these keys, `data-*` and `aria-*` reach the item
const ITEM_CONFIG_KEYS: ReadonlySet<string> = new Set(['itemKey', 'indent', 'isCollapsed', 'link', 'linkOptions', 'disabled', 'class', 'style', 'forwardRef', 'ref', 'tabIndex', 'tooltipHideDelay', 'tooltipShowDelay', 'onClick', 'onMouseEnter', 'onMouseLeave']);
const SUB_CONFIG_KEYS: ReadonlySet<string> = new Set(['itemKey', 'indent', 'isCollapsed', 'isOpen', 'disabled', 'class', 'style', 'ref', 'dropdownStyle', 'dropdownProps', 'subDropdownProps', 'onMouseEnter', 'onMouseLeave']);

function pickConfigProps(config: object, allowed: ReadonlySet<string>) {
    return Object.fromEntries(Object.entries(config).filter(([key]) => allowed.has(key) || /^(data|aria)-/.test(key)));
}

const isRenderable = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

/**
 * The itemKey tree read from the tokens, so a component that forwards itemKey to Nav.Item or Nav.Sub counts as well. It
 * cannot be collected by registration from the mounted items: a closed Sub does not mount its children, and the first
 * render needs the tree to open the ancestors of the selected item. The foundation drops an entry without itemKey
 * together with its subtree.
 */
function getItemsFromNodes(nodes: readonly unknown[]): NavItemType[] {
    return nodes.flatMap((node) => {
        if (isToken<NavItemProps>(node, NAV_ITEM)) {
            return [{ itemKey: node.props.itemKey }];
        }
        if (isToken<SubNavProps>(node, NAV_SUB)) {
            return [{ itemKey: node.props.itemKey, items: getItemsFromNodes(getSubNodes(node.props)) }];
        }
        return [];
    });
}

/** A header or footer given as a props object, as opposed to content, a token or a node */
function isSlotConfig(value: unknown): value is object {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype && Object.getOwnPropertySymbols(value).length === 0;
}

/** The props of the Header or Footer a `header` or `footer` prop stands for: its own token, a props object, or content */
function slotProps<P extends object>(value: ResolvedChildren, type: string) {
    if (isToken<P>(value, type)) {
        return value.props;
    }
    if (isSlotConfig(value)) {
        // the views read logo and collapseButton through children(), which calls a config's render functions where they are shown
        return value as P;
    }
    return hasContent(value) ? ({ children: value } as P) : undefined;
}

export default function Nav(rawProps: NavProps) {
    const props = useDefaultProps('Nav', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'bodyStyle',
        'children',
        'class',
        'defaultIsCollapsed',
        'defaultOpenKeys',
        'defaultSelectedKeys',
        'expandIcon',
        'footer',
        'header',
        'isCollapsed',
        'items',
        'limitIndent',
        'mode',
        'onClick',
        'onCollapseChange',
        'onOpenChange',
        'onSelect',
        'onTransitionEnd',
        'openKeys',
        'ref',
        'renderItemExpandIcon',
        'renderItemIcon',
        'renderItemText',
        'renderItemToggleIcon',
        'renderWrapper',
        'selectedKeys',
        'style',
        'subDropdownProps',
        'subNavCloseDelay',
        'subNavMotion',
        'subNavOpenDelay',
        'toggleIconPosition',
        'tooltipHideDelay',
        'tooltipShowDelay',
    ]);

    const localeResult = useLocale('Navigation');

    let navElement: HTMLElement | undefined;

    const resolved = children(() => local.children);
    const nodes = createMemo(() => resolved.toArray().filter(isRenderable));
    const headerTokens = createMemo(() => nodes().flatMap((node) => (isToken<NavHeaderProps>(node, NAV_HEADER) ? [node] : [])));
    const footerTokens = createMemo(() => nodes().flatMap((node) => (isToken<NavFooterProps>(node, NAV_FOOTER) ? [node] : [])));
    const body = createMemo(() => nodes().filter((node) => !isToken(node, NAV_HEADER) && !isToken(node, NAV_FOOTER)));

    // compared by value, so a Sub whose children change in place rebuilds the menu, and an unrelated update does not
    const tree = createMemo(() => getItemsFromNodes(body()), [], { equals: isEqual });

    // Read once, by everything: a spread signal object notifies every key, and formatting the same items again would
    // remount every row
    const itemsSource = createMemo(() => local.items);

    // the foundation reads the item tree where React hands it the children
    const foundationProps: FoundationProps = mergeProps(props, {
        get children() {
            return tree();
        },
        get items() {
            return itemsSource();
        },
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, NavigationState>(
        NavigationFoundation,
        foundationProps,
        (view) => NavigationFoundation.getInitialState(view, tree()),
        (base) => ({
            getItemsFromChildren: () => tree(),
            setIsCollapsed: (isCollapsed) => base.setState({ isCollapsed }),
            notifyCollapseChange: (isCollapsed) => base.getProps().onCollapseChange?.(isCollapsed),
            updateSelectedKeys: (selectedKeys) => base.setState({ selectedKeys }),
            updateOpenKeys: (openKeys) => base.setState({ openKeys: [...openKeys] }),
        })
    );

    const isCollapsed = createMemo(() => NavigationFoundation.getIsCollapsed(foundationProps, state()));
    const openKeysIsControlled = createMemo(() => NavigationFoundation.isOpenKeysControlled(foundationProps, isCollapsed()));
    const openKeys = createMemo(() => NavigationFoundation.getOpenKeys(foundationProps, state(), isCollapsed()));
    const formattedItems = createMemo(() => NavigationFoundation.formatItems(itemsSource()));
    const itemKeysMap = createMemo(() => NavigationFoundation.getFormattedItems({ items: itemsSource() }, tree()).itemKeysMap);
    const selectedKeys = createMemo(() => NavigationFoundation.getSelectedKeys(foundationProps, state(), itemKeysMap()));

    // texts remount on collapse, so they fade in only while the width animates
    const [settledCollapsed, setSettledCollapsed] = createSignal(untrack(isCollapsed));

    const selectedKeysSource = createMemo(() => local.selectedKeys);
    const openKeysSource = createMemo(() => local.openKeys);

    // a props object resolves to itself
    const headerContent = children(() => local.header as JSX.Element);
    const footerContent = children(() => local.footer as JSX.Element);
    const headerSlot = createMemo(() => slotProps<NavHeaderProps>(headerContent(), NAV_HEADER));
    const footerSlot = createMemo(() => slotProps<NavFooterProps>(footerContent(), NAV_FOOTER));

    const view: NavView = {
        get isCollapsed() {
            return isCollapsed();
        },
        isInSubNav: false,
        get limitIndent() {
            return local.limitIndent;
        },
        get mode() {
            return local.mode;
        },
        get openKeys() {
            return openKeys();
        },
        get openKeysIsControlled() {
            return openKeysIsControlled();
        },
        get renderWrapper() {
            return local.renderWrapper;
        },
        get selectedKeys() {
            return selectedKeys();
        },
        get selectedKeysIsControlled() {
            return local.selectedKeys !== undefined;
        },
        get subNavCloseDelay() {
            return local.subNavCloseDelay;
        },
        get subNavMotion() {
            return local.subNavMotion;
        },
        get subNavOpenDelay() {
            return local.subNavOpenDelay;
        },
        get toggleIconPosition() {
            return local.toggleIconPosition;
        },
        get tooltipHideDelay() {
            return local.tooltipHideDelay;
        },
        get tooltipShowDelay() {
            return local.tooltipShowDelay;
        },
    };

    const context: NavContextValue = {
        view: () => view,
        locale: () => localeResult().locale,
        toggleCollapsed: foundation.handleCollapseChange,
        notifySelect: (data) => local.onSelect?.(data),
        notifyOpenChange: (data) => local.onOpenChange?.(data),
        notifyClick: (data) => local.onClick?.(data),
        updateSelectedKeys: foundation.updateSelectedKeys,
        addOpenKey: foundation.addOpenKey,
        removeOpenKey: foundation.removeOpenKey,
    };

    // React compares the previous props; the snapshot is what the foundation reads of them
    const snapshot = () => ({ items: itemsSource(), children: tree(), selectedKeys: local.selectedKeys, openKeys: local.openKeys });

    let previous = untrack(snapshot);

    // Items made from `items`. shortcut: a new `items` array remounts every row (the focused one loses focus), unlike
    // React, which keeps rows by key; upgrade by reusing tokens per itemKey.
    // The renderItem* calls stay in the JSX attributes: compiled to getters, they run when the Item or Sub view reads
    // them in the branch that shows them, not when the tokens are made for a closed Sub.
    function renderItems(items: NavItemType[], level: number) {
        return items.map((item) => {
            const data: NavItemRenderProps = { item, level };
            const subItems: NavItemType[] | undefined = item.items;
            if (Array.isArray(subItems) && subItems.length) {
                return (
                    // the Nav-level subDropdownProps is a default: a config's own wins
                    <SubNav
                        subDropdownProps={local.subDropdownProps}
                        {...(pickConfigProps(item, SUB_CONFIG_KEYS) as SubNavProps)}
                        level={level}
                        icon={local.renderItemIcon?.(data)}
                        text={local.renderItemText ? local.renderItemText(data) : item.text}
                        expandIcon={local.renderItemExpandIcon ? local.renderItemExpandIcon(data) : local.expandIcon}
                    >
                        {renderItems(subItems, level + 1)}
                    </SubNav>
                );
            }
            return <NavItem {...(pickConfigProps(item, ITEM_CONFIG_KEYS) as NavItemProps)} level={level} icon={local.renderItemIcon?.(data)} text={local.renderItemText ? local.renderItemText(data) : item.text} toggleIcon={local.renderItemToggleIcon?.(data)} />;
        });
    }

    // a component created outside JSX can be an accessor, which children() resolves to the token
    const itemNodes = children(() => renderItems(formattedItems(), 0));
    const listNodes = createMemo(() => [...itemNodes.toArray(), ...body()]);

    const collapseAnimating = () => isCollapsed() !== settledCollapsed();

    const handleTransitionEnd = (event: TransitionEvent & { currentTarget: HTMLElement; target: Element }) => {
        callHandler(local.onTransitionEnd, event);
        if (event.target === event.currentTarget && event.propertyName === 'width') {
            setSettledCollapsed(isCollapsed());
        }
    };

    useWatch(
        () => [itemsSource(), tree(), selectedKeysSource(), openKeysSource()],
        () => {
            const prevProps = previous;
            previous = snapshot();
            foundation.handlePropsUpdate(prevProps);
        }
    );

    // no transitionend comes when the width does not animate; getAnimations flushes style, so it lists this update's transition
    useWatch(isCollapsed, (collapsed) => {
        const animatesWidth = navElement?.getAnimations().some((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'width');
        if (!animatesWidth) {
            setSettledCollapsed(collapsed);
        }
    });

    return (
        <NavContext.Provider value={context}>
            {/* APG disclosure navigation: a landmark holding lists of links and buttons */}
            <nav
                {...rest}
                // the Provider's children memo tracks this read; a spread signal object would rebuild every item
                ref={untrack(() => mergeRefs(local.ref, (node: HTMLElement) => (navElement = node)))}
                class={clsx(prefix, local.class, {
                    [`${prefix}-collapsed`]: isCollapsed(),
                    [`${prefix}-collapse-animating`]: collapseAnimating(),
                    [`${prefix}-horizontal`]: local.mode === 'horizontal',
                    [`${prefix}-vertical`]: local.mode === 'vertical',
                })}
                style={local.style}
                onTransitionEnd={handleTransitionEnd}
            >
                <div class={`${prefix}-inner`}>
                    <div class={clsx(`${prefix}-header-list-outer`, { [`${prefix}-header-list-outer-collapsed`]: isCollapsed() })}>
                        <Show keyed when={headerSlot()}>
                            {(slot) => <HeaderView {...slot} />}
                        </Show>
                        <For each={headerTokens()}>{(token) => <HeaderView {...token.props} />}</For>
                        <div class={`${prefix}-list-wrapper`} style={local.bodyStyle}>
                            <ul class={`${prefix}-list`}>
                                <NavNodes nodes={listNodes()} />
                            </ul>
                        </div>
                    </div>
                    <Show keyed when={footerSlot()}>
                        {(slot) => <FooterView {...slot} />}
                    </Show>
                    <For each={footerTokens()}>{(token) => <FooterView {...token.props} />}</For>
                </div>
            </nav>
        </NavContext.Provider>
    );
}
