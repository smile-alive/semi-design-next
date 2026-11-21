import type { CSSProperties, VNode } from 'vue';
import type { DropdownItemPart, DropdownPart } from '@fibrae/semi-foundation/components/dropdown/constants';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import type { TooltipEmits, TooltipProps } from '../tooltip/interface';

export type { Position, Trigger } from '../tooltip/interface';

export type Type = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';

// Vue's ClassValue and StyleValue recurse through a type alias, and ref() over DropdownProps with them hits TS2589.
// PartClass stops at one level; PartStyle recurses through an interface, which ref() unwraps lazily, so it stays
// assignable both ways with StyleValue. The interface is exported because the emitted .vue declarations name it.
type PartClass = string | false | null | undefined | Record<string, unknown> | unknown[];
type PartStyle = string | false | null | undefined | CSSProperties | PartStyleList;
export interface PartStyleList extends Array<PartStyle> {}

/** Arrow and arrow keys are fixed: no arrow, and the Dropdown alone moves focus with Up and Down. */
export interface DropdownProps extends Omit<TooltipProps, 'showArrow' | 'arrowPointAtCenter' | 'disableArrowKeyDown' | 'classNames' | 'styles'> {
    classNames?: Partial<Record<DropdownPart, PartClass>>;
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
    styles?: Partial<Record<DropdownPart, PartStyle>>;
}

export interface DropdownEmits extends TooltipEmits {}

export interface DropdownMenuIconSlotProps {
    item: DropdownMenuItemType;
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
    classNames?: Partial<Record<DropdownItemPart, PartClass>>;
    disabled?: boolean;
    styles?: Partial<Record<DropdownItemPart, PartStyle>>;
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
export interface DropdownMenuItemType extends DropdownItemProps, MenuEntryAttributes {
    node: 'item';
    name?: string | number;
    onClick?: (event: MouseEvent) => void;
    onContextmenu?: (event: MouseEvent) => void;
    onMouseenter?: (event: MouseEvent) => void;
    onMouseleave?: (event: MouseEvent) => void;
}

export interface DropdownMenuItemDividerType extends DropdownDividerProps, MenuEntryAttributes {
    node: 'divider';
}

export interface DropdownMenuItemTitleType extends DropdownTitleProps, MenuEntryAttributes {
    node: 'title';
    name?: string | number;
}

export type DropdownMenuItem = DropdownMenuItemType | DropdownMenuItemDividerType | DropdownMenuItemTitleType;
