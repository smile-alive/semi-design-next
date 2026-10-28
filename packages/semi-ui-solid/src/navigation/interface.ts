import type { JSX } from 'solid-js';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import type { ItemKey, SelectedItemProps } from '@fibrae/semi-foundation/navigation/item-foundation';
import type { ElementProps } from '../_base/element-props';
import type { DropdownProps } from '../dropdown';

export type { ItemKey };

export type Mode = 'vertical' | 'horizontal';

export interface SelectedData extends SelectedItemProps<NavItemProps> {
    text?: JSX.Element;
}

export interface NavItemProps extends ElementProps<'li', 'onClick' | 'children' | 'tabIndex'> {
    disabled?: boolean;
    forwardRef?: (ele: HTMLLIElement) => void;
    icon?: JSX.Element;
    /** Keeps a blank icon slot in front of the text when there is no icon; a number counts only as truthy */
    indent?: boolean | number;
    isCollapsed?: boolean;
    itemKey?: ItemKey;
    /** Nesting depth for the indentation of `limitIndent={false}`; items from `items` get it automatically, Nav.Item children must pass it */
    level?: number;
    link?: string;
    linkOptions?: JSX.AnchorHTMLAttributes<HTMLAnchorElement>;
    /** On the link or button that takes focus */
    tabIndex?: number;
    text?: JSX.Element;
    toggleIcon?: JSX.Element;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;

    onClick?: (clickItems: SelectedData) => void;
}

export interface SubNavProps extends ElementProps<'li', 'onClick'> {
    disabled?: boolean;
    dropdownStyle?: JSX.CSSProperties | string;
    icon?: JSX.Element;
    indent?: boolean | number;
    itemKey?: ItemKey;
    /** As on NavItemProps */
    level?: number;
    text?: JSX.Element;
    expandIcon?: JSX.Element;
    dropdownProps?: DropdownProps;
    /** Used when `dropdownProps` is not given */
    subDropdownProps?: DropdownProps;
}

export interface OnSelectedData {
    itemKey: ItemKey;
    selectedKeys: ItemKey[];
    selectedItems: (NavItemProps | SubNavProps)[];
    domEvent: MouseEvent | KeyboardEvent;
}

export interface OnClickData {
    itemKey?: ItemKey;
    text?: JSX.Element;
    openKeys?: ItemKey[];
    domEvent?: MouseEvent | KeyboardEvent;
    isOpen?: boolean;
}

export interface OnOpenChangeData {
    itemKey?: ItemKey;
    openKeys?: ItemKey[];
    domEvent?: MouseEvent | KeyboardEvent;
    isOpen?: boolean;
}

/** An entry of `items`: Item or Sub data, the attributes its li takes, and nested entries; Nav's `renderItem*` give its content */
export interface NavItemConfig extends Omit<NavItemProps, 'icon' | 'level' | 'text' | 'toggleIcon'>, Pick<SubNavProps, 'dropdownProps' | 'dropdownStyle' | 'subDropdownProps'> {
    items?: (string | NavItemConfig)[];
    /** The entry's text and payload; `renderItemText` replaces what is shown */
    text?: string | number;
}

/** A string entry is both the text and the itemKey of a plain item */
export type NavItems = (string | NavItemConfig)[];

export interface NavItemRenderProps {
    item: NavItemConfig;
    /** Nesting depth of the entry, 0 at the top */
    level: number;
}

export interface RenderWrapperData {
    /** The item's li (a Dropdown.Item li inside a popup); render it exactly once */
    itemElement: JSX.Element;
    isInSubNav: boolean;
    isSubNav: boolean;
    /** What the item or sub was given */
    props: NavItemProps | SubNavProps;
}

export interface NavHeaderProps extends ElementProps<'div'> {
    link?: string;
    linkOptions?: JSX.AnchorHTMLAttributes<HTMLAnchorElement>;
    logo?: JSX.Element;
    /** Also names the header link while the Nav is collapsed and the text is hidden; other content goes in children */
    text?: string | number;
}

export interface NavFooterProps extends ElementProps<'div'> {
    /** `true` for the built-in button, or a node to use instead; only shown when the footer has no children */
    collapseButton?: JSX.Element;
    collapseText?: (collapsed?: boolean) => JSX.Element;
}

/** The `header` prop as data: content comes from render functions, called only when shown */
export interface NavHeaderConfig extends Omit<NavHeaderProps, 'children' | 'logo'> {
    logo?: () => JSX.Element;
}

/** The `footer` prop as data: content comes from render functions, called only when shown */
export interface NavFooterConfig extends Omit<NavFooterProps, 'children' | 'collapseButton'> {
    /** `true` for the built-in button, or a render function for one to use instead */
    collapseButton?: boolean | (() => JSX.Element);
}

export interface CollapseButtonProps {
    locale?: Locale['Navigation'];
    collapseText?: (isCollapsed: boolean) => JSX.Element;
    isCollapsed?: boolean;
    onClick?: (nextCollapsed: boolean) => void;
}

export interface NavProps extends ElementProps<'nav', 'onClick' | 'onSelect'> {
    bodyStyle?: JSX.CSSProperties | string;
    defaultIsCollapsed?: boolean;
    defaultOpenKeys?: ItemKey[];
    defaultSelectedKeys?: ItemKey[];
    /** Applied to the Dropdown of every Sub made from `items` that has no dropdown props of its own */
    subDropdownProps?: DropdownProps;
    /** Expand arrow of the Subs made from `items`; Nav.Sub children take their own */
    expandIcon?: JSX.Element;
    footer?: JSX.Element | NavFooterConfig;
    header?: JSX.Element | NavHeaderConfig;
    isCollapsed?: boolean;
    items?: NavItems;
    limitIndent?: boolean;
    mode?: Mode;
    openKeys?: ItemKey[];
    selectedKeys?: ItemKey[];
    subNavCloseDelay?: number;
    subNavMotion?: boolean;
    subNavOpenDelay?: number;
    toggleIconPosition?: 'left' | 'right';
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
    onClick?: (data: OnClickData) => void;
    onCollapseChange?: (isCollapse: boolean) => void;
    onOpenChange?: (data: OnOpenChangeData) => void;
    onSelect?: (data: OnSelectedData) => void;
    /** For the entries of `items` */
    renderItemIcon?: (props: NavItemRenderProps) => JSX.Element;
    /** For the entries of `items`; without it the entry's `text` shows */
    renderItemText?: (props: NavItemRenderProps) => JSX.Element;
    /** For the items made from `items` */
    renderItemToggleIcon?: (props: NavItemRenderProps) => JSX.Element;
    /** For the Subs made from `items`; given, it replaces `expandIcon` */
    renderItemExpandIcon?: (props: NavItemRenderProps) => JSX.Element;
    renderWrapper?: (data: RenderWrapperData) => JSX.Element;
}
