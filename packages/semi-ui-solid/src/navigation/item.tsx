import { type JSX, Index, Show, children, mergeProps, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cloneDeep, isPlainObject } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
import ItemFoundation, { type ItemAdapter, countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import callHandler from '../_base/call-handler';
import { splitControlAttrs } from '../_base/control-attrs';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import { createToken } from '../_base/token';
import useFoundation from '../_base/use-foundation';
import DropdownItem from '../dropdown/dropdown-item';
import Tooltip, { type GetTriggerProps } from '../tooltip';
import { useNavContext } from './context';
import type { ItemKey, NavItemProps, OnSelectedData, SubNavProps } from './interface';

const prefix = cssClasses.PREFIX;
const itemPrefix = `${prefix}-item`;

export const NAV_ITEM = 'Nav.Item';

// Nav renders the item from this token (ItemView); standing alone it renders nothing
export default function NavItem(props: NavItemProps) {
    return createToken(NAV_ITEM, props);
}

/** The class of an icon slot `<i>`: the info icon, or the expand and toggle icon on the side `toggleIconPosition` names */
export function iconSlotClass(toggle: boolean, toggleIconPosition: 'left' | 'right') {
    return clsx(`${itemPrefix}-icon`, toggle ? `${itemPrefix}-icon-toggle-${toggleIconPosition}` : `${itemPrefix}-icon-info`);
}

/** The aria-* attributes of an item belong to the link, button or title that takes focus, not to the li */
export const isAriaKey = (key: string): key is `aria-${string}` => key.startsWith('aria-');

export const plainTrigger: GetTriggerProps = (own = {} as never) => own as never;

/** onSelect reports the props an item was given, as React does without its ref: plain data is copied, nodes and functions are kept */
function reportedProps(props: object) {
    return Object.fromEntries(
        Object.entries(props)
            .filter(([key, value]) => key !== 'ref' && value !== undefined)
            .map(([key, value]) => [key, isPlainObject(value) || Array.isArray(value) ? cloneDeep(value) : value])
    );
}

/** Passes the item's li through `Nav`'s `renderWrapper`; `element` must be created once by the caller, not written inline */
export function ItemWrapper(props: { element: JSX.Element; isInSubNav: boolean; isSubNav: boolean; wrapperProps: NavItemProps | SubNavProps }) {
    const context = useNavContext();

    return (
        // Show runs the callback once per function, which is the one call renderWrapper promises
        <Show keyed when={context.view().renderWrapper} fallback={props.element}>
            {(renderWrapper) => renderWrapper({ itemElement: props.element, isSubNav: props.isSubNav, isInSubNav: props.isInSubNav, props: props.wrapperProps })}
        </Show>
    );
}

/** The li of an item: a button or link in the list, or a Dropdown.Item inside a collapsed or horizontal popup */
export function ItemView(props: NavItemProps) {
    const [local, rest] = splitProps(props, ['class', 'disabled', 'forwardRef', 'icon', 'indent', 'isCollapsed', 'itemKey', 'level', 'link', 'linkOptions', 'ref', 'style', 'tabIndex', 'text', 'toggleIcon', 'tooltipHideDelay', 'tooltipShowDelay', 'type', 'onClick']);
    const [aria, liRest] = splitControlAttrs(rest, isAriaKey);

    const context = useNavContext('Nav.Item');

    const view = context.view;

    const icon = createIconSlot(
        () => local.icon,
        () => 'large'
    );

    const toggleIcon = createIconSlot(
        () => local.toggleIcon,
        () => 'default'
    );

    const text = children(() => local.text);

    const isCollapsed = () => Boolean(local.isCollapsed) || view().isCollapsed;

    const horizontal = () => view().mode === strings.MODE_HORIZONTAL;

    const selected = () => view().selectedKeys.includes(local.itemKey as ItemKey);

    const { foundation } = useFoundation<ItemFoundation, ItemAdapter<NavItemProps>, NavItemProps, object>(
        ItemFoundation,
        props,
        () => ({}),
        () => ({
            cloneDeep: (value) => reportedProps(value as object) as typeof value,
            selectSelf: () => context.updateSelectedKeys([props.itemKey as ItemKey]),
            getSelectedKeysIsControlled: () => view().selectedKeysIsControlled,
            notifyGlobalOnSelect: (data) => context.notifySelect(data as OnSelectedData),
            notifyGlobalOnClick: (data) => context.notifyClick(data),
            notifyClick: (data) => props.onClick?.(data),
            getSelected: selected,
        })
    );

    // aria-* goes to the link or button that takes focus; a disabled item stays focusable so that it can be found, and
    // the foundation ignores its activation
    const controlOwn = {
        get 'aria-current'() {
            return selected() ? ('page' as const) : undefined;
        },
        get 'aria-disabled'() {
            return local.disabled || undefined;
        },
        get tabIndex() {
            return local.tabIndex;
        },
    };

    const isPopupItem = () => view().isInSubNav && (isCollapsed() || horizontal());

    const hasLink = () => typeof local.link === 'string';

    // present in both states and only active while collapsed: swapping the wrapper would remount the focused control
    const tooltipped = () => !view().isInSubNav && !horizontal();

    const placeholders = () =>
        Array.from({
            length: countPlaceholderIcons({ mode: view().mode, limitIndent: view().limitIndent, isCollapsed: isCollapsed(), hasIcon: hasContent(icon()), indent: local.indent ?? false, level: local.level ?? 0 }),
        });

    // a horizontal bar leaves out the slots that hold nothing
    const showToggle = () => !horizontal() || hasContent(toggleIcon());

    const showIcon = () => (hasContent(icon()) || Boolean(local.indent) || view().isInSubNav) && (!horizontal() || hasContent(icon()));

    const itemChildren = () => (
        <>
            <Index each={placeholders()}>{() => <i class={iconSlotClass(false, view().toggleIconPosition)} />}</Index>
            <Show when={view().toggleIconPosition === strings.TOGGLE_ICON_LEFT && showToggle()}>
                <i class={iconSlotClass(true, view().toggleIconPosition)}>{toggleIcon()}</i>
            </Show>
            <Show when={showIcon()}>
                <i class={iconSlotClass(false, view().toggleIconPosition)}>{icon()}</i>
            </Show>
            <Show when={text() != null}>
                <span class={`${prefix}-item-text`}>{text()}</span>
            </Show>
            <Show when={view().toggleIconPosition === strings.TOGGLE_ICON_RIGHT && showToggle()}>
                <i class={iconSlotClass(true, view().toggleIconPosition)}>{toggleIcon()}</i>
            </Show>
        </>
    );

    const handleClick = (event: MouseEvent) => foundation.handleClick(event);

    const control = (trigger: GetTriggerProps) => (
        <Show
            when={hasLink()}
            fallback={
                <button
                    {...trigger(
                        mergeProps(aria, controlOwn, {
                            type: 'button' as const,
                            class: `${prefix}-item-button`,
                            onClick: handleClick,
                        })
                    )}
                >
                    {itemChildren()}
                </button>
            }
        >
            <a
                href={local.link}
                {...local.linkOptions}
                {...trigger(
                    mergeProps(aria, controlOwn, {
                        get class() {
                            return clsx(`${prefix}-item-link`, local.linkOptions?.class);
                        },
                        onClick: (event: MouseEvent & { currentTarget: HTMLAnchorElement; target: Element }) => {
                            callHandler(local.linkOptions?.onClick, event);
                            handleClick(event);
                        },
                    })
                )}
            >
                {itemChildren()}
            </a>
        </Show>
    );

    const inlineItem = () => (
        <li
            {...liRest}
            // the Show memo around this branch tracks these reads; a spread signal object would rebuild the item
            ref={untrack(() => mergeRefs((node: HTMLLIElement) => forwardFocus(node, () => node.querySelector<HTMLElement>('a, button')), local.forwardRef, local.ref))}
            class={clsx(local.class || `${itemPrefix}-normal`, {
                [itemPrefix]: true,
                [`${itemPrefix}-selected`]: selected(),
                [`${itemPrefix}-collapsed`]: isCollapsed(),
                [`${itemPrefix}-disabled`]: local.disabled,
                [`${itemPrefix}-has-link`]: hasLink(),
                [`${itemPrefix}-has-button`]: !hasLink(),
            })}
            style={local.style}
        >
            <Show when={tooltipped()} fallback={control(plainTrigger)}>
                <Tooltip condition={isCollapsed()} content={local.text} mouseEnterDelay={local.tooltipShowDelay ?? view().tooltipShowDelay} mouseLeaveDelay={local.tooltipHideDelay ?? view().tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false}>
                    {(trigger: GetTriggerProps) => control(trigger)}
                </Tooltip>
            </Show>
        </li>
    );

    // Dropdown activates the li on Enter and Space; clicking the link instead applies its target and rel, and the
    // bubbled click is reported once
    const handlePopupClick = (event: MouseEvent & { currentTarget: HTMLLIElement; target: Element }) => {
        const link = event.target === event.currentTarget && hasLink() ? event.currentTarget.querySelector('a') : null;
        if (link) {
            link.click();
            return;
        }
        handleClick(event);
    };

    const popupItem = () => (
        <DropdownItem
            {...rest}
            ref={mergeRefs(local.ref)}
            forwardRef={local.forwardRef}
            class={clsx(local.class, {
                [itemPrefix]: true,
                [`${itemPrefix}-selected`]: selected(),
                [`${itemPrefix}-collapsed`]: isCollapsed(),
                [`${itemPrefix}-disabled`]: local.disabled,
            })}
            style={local.style}
            aria-current={selected() ? 'page' : undefined}
            disabled={Boolean(local.disabled)}
            active={selected()}
            onClick={handlePopupClick}
        >
            {/* the li is the menuitem, so the link inside is not a focus target of its own */}
            <Show when={hasLink()} fallback={itemChildren()}>
                <a tabIndex={-1} href={local.link} {...local.linkOptions} class={clsx(`${prefix}-item-link`, local.linkOptions?.class)}>
                    {itemChildren()}
                </a>
            </Show>
        </DropdownItem>
    );

    const element = (
        <Show when={isPopupItem()} fallback={inlineItem()}>
            {popupItem()}
        </Show>
    );

    return <ItemWrapper element={element} isInSubNav={view().isInSubNav} isSubNav={false} wrapperProps={props} />;
}
