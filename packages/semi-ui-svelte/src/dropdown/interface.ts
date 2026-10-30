import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import type { TooltipProps, TooltipTriggerProps } from '../tooltip/index.js';

/**
 * What Dropdown puts on the trigger element, spread first: `<button {...props}>`. `class` must be merged by the
 * caller (`class={[props.class, 'own']}`), and the attachment under a symbol key must survive the spread.
 */
export type DropdownTriggerProps = Omit<TooltipTriggerProps, 'aria-haspopup' | 'aria-expanded' | 'aria-controls'> & {
    /** `semi-dropdown-showing` while the menu is open */
    class?: string;
    'aria-haspopup'?: 'menu';
    'aria-expanded'?: boolean;
};

export interface DropdownMenuIconArgs {
    item: DropDownMenuItemItem;
    index: number;
}

/**
 * No arrow and no arrow-key option: the Dropdown alone moves focus with Up and Down. No `wrapWhenSpecial`: Tooltip
 * wraps a special trigger only in its own span, and Dropdown always renders the trigger itself. No element props: F11.
 */
export interface DropdownProps extends Omit<TooltipProps, 'showArrow' | 'arrowPointAtCenter' | 'disableArrowKeyDown' | 'arrow' | 'child' | 'children' | 'content' | 'wrapWhenSpecial'> {
    /** Wrapped in a span, which takes the trigger attributes */
    children?: Snippet;
    /** Renders the trigger element itself, which takes `props`; use it for a button, a link or a parent `DropdownItem` */
    child?: Snippet<[{ props: DropdownTriggerProps }]>;
    /** Popup content; when given (even empty) it replaces `menu` */
    content?: Snippet;
    /** Icon of each `node: 'item'` entry of `menu`; the icon container is rendered even when the snippet outputs nothing */
    menuIcon?: Snippet<[DropdownMenuIconArgs]>;
    /** On the menu container `.semi-dropdown`; `class` goes on the popup `.semi-dropdown-wrapper` */
    contentClassName?: string;
    menu?: DropDownMenuItem[];
    /**
     * How the items of this menu are selected (a submenu takes its own Dropdown's value); `active` marks the selected
     * items, and only showTick shows a tick:
     * - 'single': role="menuitemradio" with aria-checked;
     * - 'multiple': role="menuitemcheckbox" with aria-checked;
     * - unset: menuitemcheckbox with aria-checked when showTick is on, otherwise menuitem without aria-checked.
     */
    selectionMode?: DropdownSelectionMode;
    showTick?: boolean;
}

export interface DropdownHandle {
    /** Focuses the trigger (a non-custom trigger only) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

export interface DropdownMenuProps extends HTMLAttributes<HTMLUListElement> {}

export interface DropdownItemProps extends HTMLAttributes<HTMLLIElement> {
    active?: boolean;
    disabled?: boolean;
    /** Takes effect only outside a Dropdown; inside one, the Dropdown's showTick applies. */
    showTick?: boolean;
    type?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
    /** The icon container is rendered even when the snippet outputs nothing */
    icon?: Snippet;
}

export interface DropdownTitleProps extends HTMLAttributes<HTMLLIElement> {}

export interface DropdownDividerProps extends HTMLAttributes<HTMLLIElement> {}

/** The listeners are the ones Dropdown.Item routes itself: `onclick`, `onmouseenter`, `onmouseleave`, `oncontextmenu` */
export interface DropDownMenuItemItem extends Omit<DropdownItemProps, 'children' | 'icon'> {
    node: 'item';
    name?: string | number;
}

export interface DropDownMenuItemDivider extends DropdownDividerProps {
    node: 'divider';
}

export interface DropDownMenuItemTitle extends Omit<DropdownTitleProps, 'children'> {
    node: 'title';
    name?: string | number;
}

export type DropDownMenuItem = DropDownMenuItemItem | DropDownMenuItemDivider | DropDownMenuItemTitle;
