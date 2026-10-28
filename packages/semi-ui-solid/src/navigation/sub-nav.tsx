import { type Accessor, type JSX, For, Index, Match, Show, Switch, children, createMemo, createUniqueId, mergeProps, splitProps, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses as dropdownClasses } from '@fibrae/semi-foundation/dropdown/constants';
import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
import { countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
import SubNavFoundation, { type SubNavAdapter } from '@fibrae/semi-foundation/navigation/sub-nav-foundation';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import { IconChevronDown, IconChevronRight } from '@fibrae/semi-icons-solid';
import { splitControlAttrs } from '../_base/control-attrs';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import isMarkup, { serverHtml } from '../_base/is-markup';
import mergeRefs from '../_base/merge-refs';
import { createToken, isToken } from '../_base/token';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import Collapsible from '../collapsible';
import Dropdown, { type DropdownProps, type GetDropdownTriggerProps } from '../dropdown';
import Tooltip, { type GetTriggerProps } from '../tooltip';
import { NavContext, type NavContextValue, type NavView, useNavContext } from './context';
import type { ItemKey, NavItemProps, SubNavProps } from './interface';
import { ItemView, ItemWrapper, NAV_ITEM, iconSlotClass, isAriaKey, plainTrigger } from './item';

const prefix = cssClasses.PREFIX;
const itemPrefix = `${prefix}-item`;
const dropdownItemPrefix = `${dropdownClasses.PREFIX}-item`;

export const NAV_SUB = 'Nav.Sub';

// The resolved children of each Sub, by its props object. A closed Sub mounts none of its children, yet the Nav needs
// their itemKeys at once (to open the ancestors of the selected item), so the Sub resolves them when it is created.
// shortcut: content other than Nav.Item and Nav.Sub is created with the Nav's ancestors' context, not with the popup's,
// so a Dropdown-aware component written straight into a Sub does not see the Dropdown it ends up in; if needed, resolve
// in the Sub view and collect the keys from a second resolution.
const subNodesOf = new WeakMap<object, Accessor<unknown[]>>();

export function registerSubNodes(props: object, nodes: Accessor<unknown[]>) {
    subNodesOf.set(props, nodes);
}

export function getSubNodes(props: object) {
    return subNodesOf.get(props)?.() ?? [];
}

// Nav renders the sub from this token (SubView); standing alone it renders nothing
export default function SubNav(props: SubNavProps) {
    const resolved = children(() => props.children);

    registerSubNodes(props, () => resolved.toArray());

    return createToken(NAV_SUB, props);
}

const isRenderable = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

const isListItem = (node: unknown) => (isServer ? /^<li[\s>]/.test(serverHtml(node) ?? '') : node instanceof HTMLLIElement);

function renderNode(node: unknown) {
    if (isToken<NavItemProps>(node, NAV_ITEM)) {
        return <ItemView {...node.props} />;
    }
    if (isToken<SubNavProps>(node, NAV_SUB)) {
        return <SubView {...node.props} children={getSubNodes(node.props) as JSX.Element} />;
    }
    if (!isRenderable(node) || (typeof node === 'object' && !isMarkup(node) && !Array.isArray(node))) {
        // Header, Footer and Nav.Item data of another kind have no place inside a list
        return null;
    }
    // a ul may hold only li; an li the caller wrote is kept, anything else sits in an li that has no box
    return isListItem(node) ? (node as JSX.Element) : <li class={`${prefix}-list-extra`}>{node as JSX.Element}</li>;
}

/** Renders the resolved children of a Nav or Sub as list items */
export function NavNodes(props: { nodes: readonly unknown[] }) {
    return <For each={props.nodes}>{renderNode}</For>;
}

/** The wrapper li of a sub, with its title and its list: inline, or inside a popup when the list is a Dropdown */
export function SubView(props: SubNavProps) {
    const [local, restProps] = splitProps(props, ['children', 'class', 'disabled', 'dropdownProps', 'dropdownStyle', 'expandIcon', 'icon', 'indent', 'itemKey', 'level', 'ref', 'style', 'subDropdownProps', 'text']);

    // aria-* goes to the title, which takes focus
    const [aria, rest] = splitControlAttrs(restProps, isAriaKey);

    const outer = useNavContext('Nav.Sub');

    const subListId = createUniqueId();
    let wrapperLi: HTMLLIElement | undefined;

    const view = outer.view;

    // the Subs and Items under this one are in a Sub; the wrapper li belongs to the enclosing list and keeps the outer value
    const innerView: NavView = mergeProps(view(), { isInSubNav: true });

    const inner: NavContextValue = { ...outer, view: () => innerView };

    const icon = createIconSlot(
        () => local.icon,
        () => 'large'
    );

    // defaults first so the user's dropdownProps win; only what Nav controls is written after them
    const dropdownOptions = createMemo((): DropdownProps => ({ trigger: 'hover', ...(local.dropdownProps ?? local.subDropdownProps) }));

    const isOpen = () => local.itemKey != null && view().openKeys.includes(local.itemKey);

    const { foundation } = useFoundation<SubNavFoundation, SubNavAdapter<SubNavProps>, SubNavProps, object>(
        SubNavFoundation,
        props,
        () => ({}),
        () => ({
            getOpenKeys: () => view().openKeys,
            getOpenKeysIsControlled: () => view().openKeysIsControlled,
            updateOpen: (open) => (open ? outer.addOpenKey : outer.removeOpenKey)(props.itemKey as ItemKey),
            notifyGlobalOpenChange: (data) => outer.notifyOpenChange(data),
            notifyGlobalOnClick: (data) => outer.notifyClick(data),
            getIsOpen: isOpen,
        })
    );

    // Collapsing or expanding the nav swaps the title's wrapper (inline disclosure button <-> popup trigger), which remounts
    // it; focus follows to the new title
    const handoverFocus = useFocusHandover<HTMLElement>(() => wrapperLi?.querySelector<HTMLElement>(`.${prefix}-sub-title`));

    const isSelected = () => local.itemKey != null && view().selectedKeys.includes(local.itemKey);

    const horizontal = () => view().mode === strings.MODE_HORIZONTAL;

    const nested = () => view().isInSubNav;

    const isPopup = () => view().isCollapsed || horizontal();

    // inside a popup menu the title is the menuitem that opens a submenu
    const menuTitle = () => isPopup() && nested();

    const content = () => local.children as unknown as unknown[];

    const rotateClass = () => (!view().isCollapsed && !horizontal() && view().subNavMotion ? `${prefix}-icon-rotate-${isOpen() ? '180' : '0'}` : undefined);

    const toggleIcon = createIconSlot(
        () => {
            if (view().isCollapsed || (horizontal() && nested())) {
                return nested() ? <IconChevronRight /> : null;
            }
            // read only in the branch that shows it; no rotation in horizontal mode: the list is a dropdown
            return local.expandIcon || <IconChevronDown />;
        },
        () => 'default',
        rotateClass
    );

    const placeholders = () => Array.from({ length: countPlaceholderIcons({ mode: view().mode, limitIndent: view().limitIndent, isCollapsed: view().isCollapsed, hasIcon: hasContent(icon()), indent: local.indent ?? false, level: local.level ?? 0 }) });

    const showIcon = () => hasContent(icon()) || Boolean(local.indent) || (nested() && !horizontal());

    // a span: a button takes phrasing content only
    const titleInner = () => (
        <span class={`${prefix}-item-inner`}>
            <Index each={placeholders()}>{() => <i class={iconSlotClass(false, view().toggleIconPosition)} />}</Index>
            <Show when={view().toggleIconPosition === strings.TOGGLE_ICON_LEFT}>
                <i class={iconSlotClass(true, view().toggleIconPosition)}>{toggleIcon()}</i>
            </Show>
            <Show when={showIcon()}>
                <i class={iconSlotClass(false, view().toggleIconPosition)}>{icon()}</i>
            </Show>
            <span class={`${prefix}-item-text`}>{local.text}</span>
            <Show when={view().toggleIconPosition === strings.TOGGLE_ICON_RIGHT}>
                <i class={iconSlotClass(true, view().toggleIconPosition)}>{toggleIcon()}</i>
            </Show>
        </span>
    );

    const handleTitleClick = (event: MouseEvent) => (isPopup() ? foundation.handlePopupClick(event) : foundation.handleClick(event));

    const titleClass = () =>
        clsx(`${prefix}-sub-title`, {
            [`${prefix}-sub-title-selected`]: isSelected(),
            [`${prefix}-sub-title-disabled`]: local.disabled,
        });

    const renderTitle = (trigger: GetTriggerProps) => (
        <Show
            when={menuTitle()}
            fallback={
                // APG disclosure navigation; a popup title gets aria-haspopup and aria-expanded from Dropdown
                <button
                    {...trigger(
                        mergeProps(aria, {
                            type: 'button' as const,
                            ref: handoverFocus,
                            get class() {
                                return titleClass();
                            },
                            // the list is unmounted while closed, so an id reference to it only exists when it is open
                            get 'aria-controls'() {
                                return !isPopup() && isOpen() ? subListId : undefined;
                            },
                            get 'aria-disabled'() {
                                return local.disabled || undefined;
                            },
                            get 'aria-expanded'() {
                                return isPopup() ? undefined : isOpen();
                            },
                            onClick: handleTitleClick,
                        })
                    )}
                >
                    {titleInner()}
                </button>
            }
        >
            {/* Dropdown adds aria-haspopup and aria-expanded to the menuitem and moves focus with the arrow keys */}
            <div
                {...trigger(
                    mergeProps(aria, {
                        ref: handoverFocus,
                        role: 'menuitem' as const,
                        tabIndex: -1,
                        get class() {
                            return titleClass();
                        },
                        get 'aria-disabled'() {
                            return Boolean(local.disabled);
                        },
                        onClick: handleTitleClick,
                    })
                )}
            >
                {titleInner()}
            </div>
        </Show>
    );

    // a disabled sub opens no Dropdown; collapsed, its hidden text shows in a tooltip instead
    const titleArea = () => (
        <Switch fallback={renderTitle(plainTrigger)}>
            <Match when={view().isCollapsed && local.disabled}>
                <Tooltip content={local.text} mouseEnterDelay={view().tooltipShowDelay} mouseLeaveDelay={view().tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false}>
                    {(trigger: GetTriggerProps) => renderTitle(trigger)}
                </Tooltip>
            </Match>
            <Match when={isPopup() && !local.disabled}>
                <Dropdown
                    mouseEnterDelay={view().subNavOpenDelay}
                    mouseLeaveDelay={view().subNavCloseDelay}
                    position={horizontal() && !nested() ? 'bottomLeft' : 'rightTop'}
                    render={
                        <Dropdown.Menu>
                            <NavNodes nodes={content()} />
                        </Dropdown.Menu>
                    }
                    {...dropdownOptions()}
                    style={local.dropdownStyle ?? dropdownOptions().style}
                    // the user's class adds to the built-in popover class, which carries the collapsed popup's styling
                    class={clsx({ [`${prefix}-popover`]: view().isCollapsed }, dropdownOptions().class)}
                    onVisibleChange={(visible) => {
                        foundation.handleDropdownVisibleChange(visible);
                        dropdownOptions().onVisibleChange?.(visible);
                    }}
                >
                    {(trigger: GetDropdownTriggerProps) => renderTitle(trigger as unknown as GetTriggerProps)}
                </Dropdown>
            </Match>
        </Switch>
    );

    const subUl = () => (
        <ul
            id={subListId}
            class={clsx(`${prefix}-sub`, {
                [`${prefix}-sub-open`]: isOpen(),
                [`${prefix}-sub-popover`]: isPopup(),
            })}
        >
            <NavNodes nodes={content()} />
        </ul>
    );

    const subList = () => (
        <Show when={!horizontal()}>
            <Show when={view().subNavMotion} fallback={<Show when={isOpen() && !view().isCollapsed}>{subUl()}</Show>}>
                <Collapsible fade isOpen={isOpen()} keepDOM={false} motion={view().subNavMotion}>
                    <Show when={!view().isCollapsed}>{subUl()}</Show>
                </Collapsible>
            </Show>
        </Show>
    );

    const setWrapper = (node: HTMLLIElement) => {
        wrapperLi = node;
        forwardFocus(node, () => node.querySelector<HTMLElement>(`.${prefix}-sub-title`));
    };

    const body = () => (
        <NavContext.Provider value={inner}>
            {titleArea()}
            {subList()}
        </NavContext.Provider>
    );

    const inlineItem = () => (
        <li
            {...rest}
            // the Show memo around this branch tracks this read; a spread signal object would rebuild the sub
            ref={untrack(() => mergeRefs(setWrapper, local.ref))}
            class={clsx(`${prefix}-sub-wrap`, local.class, {
                [itemPrefix]: true,
                [`${itemPrefix}-sub`]: true,
                [`${itemPrefix}-collapsed`]: view().isCollapsed,
                [`${itemPrefix}-disabled`]: local.disabled,
            })}
            style={local.style}
        >
            {body()}
        </li>
    );

    // A nested sub inside a popup is a list item that holds the menuitem (its title), not a menuitem itself: two nested
    // menuitems would both be found by the menu's arrow keys
    const popupItem = () => (
        <li
            {...rest}
            ref={untrack(() => mergeRefs(setWrapper, local.ref))}
            role="none"
            class={clsx(`${prefix}-sub-wrap`, local.class, dropdownItemPrefix, {
                [itemPrefix]: true,
                [`${itemPrefix}-sub`]: true,
                [`${itemPrefix}-selected`]: isSelected(),
                [`${itemPrefix}-collapsed`]: view().isCollapsed,
                [`${itemPrefix}-disabled`]: local.disabled,
                [`${dropdownItemPrefix}-disabled`]: local.disabled,
                [`${dropdownItemPrefix}-active`]: isSelected(),
            })}
            style={local.style}
        >
            {body()}
        </li>
    );

    const element = (
        <Show when={menuTitle()} fallback={inlineItem()}>
            {popupItem()}
        </Show>
    );

    return <ItemWrapper element={element} isInSubNav={nested()} isSubNav wrapperProps={props} />;
}
