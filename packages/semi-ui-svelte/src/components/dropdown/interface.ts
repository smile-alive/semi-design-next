import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { DropdownPart } from '@fibrae/semi-foundation/components/dropdown/constants';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import type { TooltipProps, TooltipTriggerProps } from '../tooltip/index.js';

/**
 * What Dropdown puts on the trigger element, spread first: `<button {...props}>`. `class` must be merged by the
 * caller (`class={[props.class, 'own']}`), and the attachment under a symbol key must survive the spread.
 */
export type DropdownTriggerProps = Omit<TooltipTriggerProps, 'aria-haspopup' | 'aria-expanded' | 'aria-controls'> & {
    class?: string;
    'aria-haspopup'?: 'menu';
    'aria-expanded'?: boolean;
};

export interface DropdownMenuIconArgs {
    item: DropdownMenuItemType;
    index: number;
}

/**
 * No arrow and no arrow-key option: the Dropdown alone moves focus with Up and Down. No `wrapWhenSpecial`: Tooltip
 * wraps a special trigger only in its own span, and Dropdown always renders the trigger itself. No element props: F11.
 */
export interface DropdownProps extends Omit<TooltipProps, 'showArrow' | 'arrowPointAtCenter' | 'disableArrowKeyDown' | 'arrow' | 'child' | 'children' | 'classNames' | 'content' | 'styles' | 'wrapWhenSpecial'> {
    children?: Snippet;
    /** Renders the trigger element itself, which takes `props`; use it for a button, a link or a parent `DropdownItem` */
    child?: Snippet<[{ props: DropdownTriggerProps }]>;
    /** Popup content; when given (even empty) it replaces `menu` */
    content?: Snippet;
    /** Icon of each `node: 'item'` entry of `menu`; the icon container is rendered even when the snippet outputs nothing */
    menuIcon?: Snippet<[DropdownMenuIconArgs]>;
    /** `content` is the menu container `.semi-dropdown`, as `style` is; `class` goes on the popup `.semi-dropdown-wrapper` */
    classNames?: Partial<Record<DropdownPart, ClassValue>>;
    menu?: DropdownMenuItem[];
    /**
     * How the items of this menu are selected (a submenu takes its own Dropdown's value); `active` marks the selected
     * items, and only showTick shows a tick:
     * - 'single': role="menuitemradio" with aria-checked;
     * - 'multiple': role="menuitemcheckbox" with aria-checked;
     * - unset: menuitemcheckbox with aria-checked when showTick is on, otherwise menuitem without aria-checked.
     */
    selectionMode?: DropdownSelectionMode;
    showTick?: boolean;
    styles?: Partial<Record<DropdownPart, string>>;
}

export interface DropdownHandle {
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
    icon?: Snippet;
}

export interface DropdownTitleProps extends HTMLAttributes<HTMLLIElement> {}

export interface DropdownDividerProps extends HTMLAttributes<HTMLLIElement> {}

/** The listeners are the ones Dropdown.Item routes itself: `onclick`, `onmouseenter`, `onmouseleave`, `oncontextmenu` */
export interface DropdownMenuItemType extends Omit<DropdownItemProps, 'children' | 'icon'> {
    node: 'item';
    name?: string | number;
}

export interface DropdownMenuItemDividerType extends DropdownDividerProps {
    node: 'divider';
}

export interface DropdownMenuItemTitleType extends Omit<DropdownTitleProps, 'children'> {
    node: 'title';
    name?: string | number;
}

export type DropdownMenuItem = DropdownMenuItemType | DropdownMenuItemDividerType | DropdownMenuItemTitleType;
