import type { CSSProperties, VNode } from 'vue';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import type { TooltipEmits, TooltipProps } from '../tooltip/interface';

export type { Position, Trigger } from '../tooltip/interface';

export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';

/** Arrow and arrow keys are fixed: no arrow, and the Dropdown alone moves focus with Up and Down. */
export interface DropdownProps extends Omit<TooltipProps, 'showArrow' | 'arrowPointAtCenter' | 'disableArrowKeyDown'> {
    contentClassName?: string | unknown[];
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

export interface DropdownEmits extends TooltipEmits {}

export interface DropdownMenuIconSlotProps {
    item: DropDownMenuItemItem;
    index: number;
}

export interface DropdownSlots {
    default?: () => VNode[];
    /** Popup content; when given (even empty) it replaces `menu`. */
    content?: () => VNode[];
    /** Icon of each `node: 'item'` entry of `menu`; an empty result renders no icon. */
    menuIcon?: (props: DropdownMenuIconSlotProps) => VNode[];
}

export interface DropdownHandle {
    /** Focuses the trigger (a non-custom trigger only) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

export interface DropdownMenuProps {}

export interface DropdownMenuSlots {
    default?: () => VNode[];
}

export interface DropdownItemProps {
    active?: boolean;
    disabled?: boolean;
    /** Takes effect only outside a Dropdown; inside one, the Dropdown's showTick applies. */
    showTick?: boolean;
    type?: Type;
}

export interface DropdownItemSlots {
    default?: () => VNode[];
    icon?: () => VNode[];
}

export interface DropdownTitleProps {}

export interface DropdownTitleSlots {
    default?: () => VNode[];
}

export interface DropdownDividerProps {}

type DataAttributes = { [key: `data-${string}`]: unknown };
type AriaAttributes = { [key: `aria-${string}`]: unknown };

// Entries are often kept in ref() or reactive(), whose deep unwrap hits TS2589 on LiHTMLAttributes (libraries augment
// Vue's HTMLAttributes globally, motion-v adds DragControls) and on the recursive ClassValue and StyleValue. So entries
// take only these attributes, typed one level deep (style is not an array); they reach the li as attrs.
interface MenuEntryAttributes extends DataAttributes, AriaAttributes {
    class?: string | Record<string, unknown> | unknown[];
    style?: string | CSSProperties;
}

/** The listeners are the ones Dropdown.Item routes itself, as React's DropdownItem declares them */
export interface DropDownMenuItemItem extends DropdownItemProps, MenuEntryAttributes {
    node: 'item';
    name?: string | number;
    onClick?: (event: MouseEvent) => void;
    onContextmenu?: (event: MouseEvent) => void;
    onMouseenter?: (event: MouseEvent) => void;
    onMouseleave?: (event: MouseEvent) => void;
}

export interface DropDownMenuItemDivider extends DropdownDividerProps, MenuEntryAttributes {
    node: 'divider';
}

export interface DropDownMenuItemTitle extends DropdownTitleProps, MenuEntryAttributes {
    node: 'title';
    name?: string | number;
}

export type DropDownMenuItem = DropDownMenuItemItem | DropDownMenuItemDivider | DropDownMenuItemTitle;
