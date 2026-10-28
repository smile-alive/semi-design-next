import type { AnchorHTMLAttributes, CSSProperties, StyleValue, VNode } from 'vue';
import type { ItemKey } from '@fibrae/semi-foundation/navigation/item-foundation';
import type { DropdownProps } from '../dropdown/interface';

export type { ItemKey } from '@fibrae/semi-foundation/navigation/item-foundation';
export type Mode = 'vertical' | 'horizontal';

type DataAttributes = { [key: `data-${string}`]: unknown };
type AriaAttributes = { [key: `aria-${string}`]: unknown };

// ref()/reactive() deep unwrap hits TS2589 on Vue's HTML attribute types (libraries augment HTMLAttributes, motion-v
// adds DragControls) and on recursive ClassValue/StyleValue, so attributes are typed one level deep, as in Dropdown.
interface EntryAttributes extends DataAttributes, AriaAttributes {
    class?: string | Record<string, unknown> | unknown[];
    style?: string | CSSProperties;
}

/** The attributes of the item or header link; Nav spreads them onto the a element */
export interface NavLinkOptions extends EntryAttributes {
    download?: boolean | string;
    href?: string;
    hreflang?: string;
    ping?: string;
    referrerpolicy?: AnchorHTMLAttributes['referrerpolicy'];
    rel?: string;
    target?: string;
    title?: string;
    type?: string;
    onClick?: (event: MouseEvent) => void;
}

/** Dropdown props of a popup Sub, plus the listener and attributes Dropdown takes as attrs */
export type SubDropdownProps = DropdownProps & {
    class?: EntryAttributes['class'];
    style?: EntryAttributes['style'];
    onVisibleChange?: (visible: boolean) => void;
};

export interface NavItemProps {
    disabled?: boolean;
    indent?: boolean | number;
    /** Or'ed with the collapsed state of the Nav */
    isCollapsed?: boolean;
    itemKey?: ItemKey;
    level?: number;
    link?: string;
    linkOptions?: NavLinkOptions;
    /** The item's text and payload; `#text` replaces what is shown */
    text?: string | number;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
}

export interface SelectedData {
    itemKey: ItemKey;
    text?: string | number;
    domEvent?: MouseEvent | KeyboardEvent;
}

export interface NavItemEmits {
    click: [data: SelectedData];
}

export interface NavItemSlots {
    icon?: () => VNode[];
    text?: () => VNode[];
    toggleIcon?: () => VNode[];
}

export interface SubNavProps {
    disabled?: boolean;
    dropdownProps?: SubDropdownProps;
    /** Wins over the style in dropdownProps */
    dropdownStyle?: StyleValue;
    indent?: boolean | number;
    itemKey?: ItemKey;
    level?: number;
    /** Applies when dropdownProps is not given */
    subDropdownProps?: SubDropdownProps;
    text?: string | number;
}

export interface SubNavSlots {
    default?: () => VNode[];
    expandIcon?: () => VNode[];
    icon?: () => VNode[];
    text?: () => VNode[];
}

export interface NavHeaderProps {
    link?: string;
    linkOptions?: NavLinkOptions;
    /** Also names the header link while the Nav is collapsed and the text is hidden */
    text?: string;
}

export interface NavHeaderSlots {
    default?: () => VNode[];
    logo?: () => VNode[];
    text?: () => VNode[];
}

export interface NavFooterProps {
    /** Shows the collapse button while the footer has no content and the Nav is vertical */
    collapseButton?: boolean;
}

export interface NavCollapseTextSlotProps {
    collapsed: boolean;
}

export interface NavFooterSlots {
    default?: () => VNode[];
    /** Replaces the built-in collapse button */
    collapseButton?: () => VNode[];
    /** Text of the built-in collapse button; a text-only result also names the icon-only button */
    collapseText?: (props: NavCollapseTextSlotProps) => VNode[];
}

export interface NavCollapseButtonProps {
    collapsed: boolean;
}

/** An entry of `items`: Item or Sub data, the attributes and listeners its li takes, and nested entries */
export interface NavItemConfig extends EntryAttributes {
    disabled?: boolean;
    dropdownProps?: SubDropdownProps;
    dropdownStyle?: EntryAttributes['style'];
    indent?: boolean | number;
    itemKey?: ItemKey;
    items?: (string | NavItemConfig)[];
    link?: string;
    linkOptions?: NavLinkOptions;
    onMouseenter?: (event: MouseEvent) => void;
    onMouseleave?: (event: MouseEvent) => void;
    text?: string | number;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
}

/** A string entry is both the text and the itemKey of a plain item */
export type NavItems = (string | NavItemConfig)[];

export interface NavHeaderConfig extends NavHeaderProps, EntryAttributes {}

export interface NavFooterConfig extends NavFooterProps, EntryAttributes {}

export interface NavProps {
    bodyStyle?: StyleValue;
    defaultIsCollapsed?: boolean;
    defaultOpenKeys?: ItemKey[];
    defaultSelectedKeys?: ItemKey[];
    footer?: NavFooterConfig;
    header?: NavHeaderConfig;
    /** Applies in vertical mode only */
    isCollapsed?: boolean;
    items?: NavItems;
    limitIndent?: boolean;
    mode?: Mode;
    /** null is a controlled empty value */
    openKeys?: ItemKey[] | null;
    /** null is a controlled empty value */
    selectedKeys?: ItemKey[] | null;
    /** Dropdown props of the Subs generated from `items` */
    subDropdownProps?: SubDropdownProps;
    subNavCloseDelay?: number;
    subNavMotion?: boolean;
    subNavOpenDelay?: number;
    toggleIconPosition?: 'left' | 'right';
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
}

export interface OnSelectedData {
    itemKey: ItemKey;
    /** The selected item's key only, without its parents */
    selectedKeys: ItemKey[];
    selectedItems: NavItemProps[];
    domEvent: MouseEvent | KeyboardEvent;
}

export interface NavClickData {
    itemKey?: ItemKey;
    text?: string | number;
    openKeys?: ItemKey[];
    domEvent?: MouseEvent | KeyboardEvent;
    isOpen?: boolean;
}

export interface NavOpenChangeData {
    itemKey: ItemKey;
    openKeys: ItemKey[];
    /** Missing when a popup Sub opens or closes by hover */
    domEvent?: MouseEvent | KeyboardEvent;
    isOpen: boolean;
}

export interface NavEmits {
    'update:selectedKeys': [selectedKeys: ItemKey[]];
    'update:openKeys': [openKeys: ItemKey[]];
    'update:isCollapsed': [isCollapsed: boolean];
    select: [data: OnSelectedData];
    click: [data: NavClickData];
    openChange: [data: NavOpenChangeData];
    collapseChange: [isCollapsed: boolean];
}

export interface NavWrapperSlotProps {
    /** The item's li; mount it with `<component :is="itemElement" />` */
    itemElement: VNode;
    isSubNav: boolean;
    isInSubNav: boolean;
    /** The props of the Nav.Item or Nav.Sub */
    props: NavItemProps | SubNavProps;
}

export interface NavItemSlotProps {
    item: NavItemConfig;
    /** Nesting depth of the entry, 0 at the top */
    level: number;
}

export interface NavSlots {
    default?: () => VNode[];
    /** Content of the header, after the one configured by `header` */
    header?: () => VNode[];
    /** Content of the footer; it replaces the collapse button configured by `footer` */
    footer?: () => VNode[];
    wrapper?: (props: NavWrapperSlotProps) => VNode[];
    /** For the entries of `items` */
    icon?: (props: NavItemSlotProps) => VNode[];
    /** For the entries of `items`; without it the entry's text shows */
    text?: (props: NavItemSlotProps) => VNode[];
    /** For the entries of `items` */
    toggleIcon?: (props: NavItemSlotProps) => VNode[];
    /** For the Subs generated from `items` */
    expandIcon?: (props: NavItemSlotProps) => VNode[];
}
