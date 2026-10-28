import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
import { getItemRole } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { IconTick } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { menuItems, useDropdownContext } from './context';

export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';

export interface DropdownItemProps extends ElementProps<'li', 'type'> {
    disabled?: boolean;
    type?: Type;
    active?: boolean;
    icon?: JSX.Element;
    /** Only outside a Dropdown: inside one, the Dropdown's showTick decides */
    showTick?: boolean;
    forwardRef?: (element: HTMLLIElement) => void;
}

const prefix = cssClasses.PREFIX;

export default function DropdownItem(props: DropdownItemProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'disabled', 'type', 'active', 'icon', 'showTick', 'forwardRef', 'ref', 'onClick', 'onMouseDown', 'onMouseEnter', 'onMouseLeave', 'onContextMenu', 'onKeyDown']);

    const context = useDropdownContext();

    const icon = children(() => local.icon);

    const disabled = () => Boolean(local.disabled);

    const showTick = () => (context ? context.view().showTick : local.showTick);

    const role = () => getItemRole(context?.view().selectionMode, showTick());

    // a click-triggered outer popup closes on mousedown, unmounting a submenu before its click: below the top level
    // (and outside any Dropdown) the press is the click
    const topLevel = () => context?.view().menuDepth === 1;

    const handleClick = (e: MouseEvent & { currentTarget: HTMLLIElement; target: Element }) => {
        // detail 0: activated from the keyboard
        if (!local.disabled && (topLevel() || e.detail === 0)) {
            callHandler(local.onClick, e);
        }
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLLIElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        if (!local.disabled && !topLevel() && e.button === 0) {
            callHandler(local.onClick, e);
        }
    };

    return (
        <li
            {...rest}
            // registered before the consumer's ref, which a Dropdown triggered by this item reads it from
            ref={mergeRefs((node: HTMLLIElement) => menuItems.set(node, disabled), local.forwardRef, local.ref)}
            class={clsx(local.class, `${prefix}-item`, {
                [`${prefix}-item-disabled`]: local.disabled,
                [`${prefix}-item-withTick`]: showTick(),
                [`${prefix}-item-${local.type}`]: local.type,
                [`${prefix}-item-active`]: local.active,
            })}
            role={role()}
            aria-checked={role() === 'menuitem' ? undefined : Boolean(local.active)}
            aria-disabled={Boolean(local.disabled)}
            tabIndex={-1}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={(e) => !local.disabled && callHandler(local.onMouseEnter, e)}
            onMouseLeave={(e) => !local.disabled && callHandler(local.onMouseLeave, e)}
            onContextMenu={(e) => !local.disabled && callHandler(local.onContextMenu, e)}
            onKeyDown={(e) => callHandler(local.onKeyDown, e)}
        >
            {/* every item renders a tick (transparent when inactive), so it stays out of the item's name */}
            <Show when={showTick()}>
                <IconTick style={local.active ? undefined : { color: 'transparent' }} />
            </Show>
            <Show when={hasContent(icon())}>
                <div class={`${prefix}-item-icon`}>{icon()}</div>
            </Show>
            {local.children}
        </li>
    );
}
