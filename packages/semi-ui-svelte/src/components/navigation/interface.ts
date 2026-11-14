import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
import type { NavPart, SubNavPart } from '@fibrae/semi-foundation/components/navigation/constants';
import type { ItemKey } from '@fibrae/semi-foundation/components/navigation/item-foundation';
import type { IconSize } from '@fibrae/semi-icons-svelte';
import type { DropdownProps } from '../dropdown/index.js';

export type { ItemKey } from '@fibrae/semi-foundation/components/navigation/item-foundation';
export type Mode = 'vertical' | 'horizontal';

type DataAttributes = { [key: `data-${string}`]: unknown };
type AriaAttributes = { [key: `aria-${string}`]: unknown };

interface EntryAttributes extends DataAttributes, AriaAttributes {
    class?: ClassValue;
    style?: string;
    onmouseenter?: (event: MouseEvent) => void;
    onmouseleave?: (event: MouseEvent) => void;
}

export type NavLinkOptions = HTMLAnchorAttributes;

export interface NavItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
    disabled?: boolean;
    indent?: boolean;
    /** Or'ed with the collapsed state of the Nav */
    isCollapsed?: boolean;
    itemKey?: ItemKey;
    /** Nesting depth for the indentation of `limitIndent={false}`; the Sub above it provides it, so it only overrides */
    level?: number;
    link?: string;
    linkOptions?: NavLinkOptions;
    /** The item's text and payload of `onSelect` and `onClick`; `label` replaces what is shown */
    text?: string | number;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
    /** Replaces the shown text. Named `label`: `text` is the prop, and a prop and a snippet share one namespace */
    label?: Snippet;
    icon?: Snippet<[NavIconArgs]>;
    toggleIcon?: Snippet<[NavIconArgs]>;
    /** The item's own click, with the item's data; the native `onclick` still reaches the li */
    onClick?: (data: SelectedData) => void;
}

export interface NavIconArgs {
    /** The size the slot is made for; hand it to a Semi icon (`<IconHome {size} />`) */
    size: IconSize;
}

export interface NavExpandIconArgs extends NavIconArgs {
    /** Rotates the arrow while the list opens and closes; put it on the icon element */
    class?: string;
}

export interface SelectedData {
    itemKey: ItemKey;
    text?: string | number;
    domEvent?: MouseEvent | KeyboardEvent;
}

export type SubDropdownProps = DropdownProps;

export interface SubNavProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
    classNames?: Partial<Record<SubNavPart, ClassValue>>;
    disabled?: boolean;
    dropdownProps?: SubDropdownProps;
    indent?: boolean;
    itemKey?: ItemKey;
    level?: number;
    /** `dropdown` wins over the style in dropdownProps */
    styles?: Partial<Record<SubNavPart, string>>;
    /** Applies when dropdownProps is not given */
    subDropdownProps?: SubDropdownProps;
    text?: string | number;
    children?: Snippet;
    /** Replaces the shown text. Named `label`: `text` is the prop, and a prop and a snippet share one namespace */
    label?: Snippet;
    icon?: Snippet<[NavIconArgs]>;
    expandIcon?: Snippet<[NavExpandIconArgs]>;
}

export interface NavHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    link?: string;
    linkOptions?: NavLinkOptions;
    /** Also names the header link while the Nav is collapsed and the text is hidden; other content goes in children */
    text?: string | number;
    logo?: Snippet;
    children?: Snippet;
}

export interface NavFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Shows the collapse button while the footer has no children and the Nav is vertical; a snippet replaces the built-in one */
    collapseButton?: boolean | Snippet;
    /** Text of the built-in collapse button; a text-only result also names the icon-only button */
    collapseText?: Snippet<[{ collapsed: boolean }]>;
    children?: Snippet;
}

export interface NavCollapseButtonProps {
    collapsed: boolean;
    collapseText?: Snippet<[{ collapsed: boolean }]>;
    onToggle: () => void;
}

export interface NavItemConfig extends EntryAttributes {
    classNames?: Partial<Record<SubNavPart, ClassValue>>;
    disabled?: boolean;
    dropdownProps?: SubDropdownProps;
    indent?: boolean;
    isCollapsed?: boolean;
    itemKey?: ItemKey;
    items?: (string | NavItemConfig)[];
    link?: string;
    linkOptions?: NavLinkOptions;
    styles?: Partial<Record<SubNavPart, string>>;
    text?: string | number;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
}

export type NavItems = (string | NavItemConfig)[];

export interface NavHeaderConfig extends Omit<NavHeaderProps, 'children'> {}

export interface NavFooterConfig extends Omit<NavFooterProps, 'children'> {}

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

export interface NavWrapperArgs {
    /** The item's li (a Dropdown.Item li inside a popup); render it exactly once with `{@render itemElement()}` */
    itemElement: Snippet;
    isSubNav: boolean;
    isInSubNav: boolean;
    props: Partial<NavItemProps> | Partial<SubNavProps>;
}

export interface NavItemRenderProps {
    item: NavItemConfig;
    level: number;
}

export interface NavProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    classNames?: Partial<Record<NavPart, ClassValue>>;
    styles?: Partial<Record<NavPart, string>>;
    /** Applies in vertical mode only; bindable */
    isCollapsed?: boolean;
    items?: NavItems;
    limitIndent?: boolean;
    mode?: Mode;
    /** Bindable; null is a controlled empty value */
    openKeys?: ItemKey[] | null;
    /** Bindable; null is a controlled empty value */
    selectedKeys?: ItemKey[] | null;
    subDropdownProps?: SubDropdownProps;
    subNavCloseDelay?: number;
    subNavMotion?: boolean;
    subNavOpenDelay?: number;
    toggleIconPosition?: 'left' | 'right';
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
    header?: NavHeaderConfig | Snippet;
    footer?: NavFooterConfig | Snippet;
    children?: Snippet;
    wrapper?: Snippet<[NavWrapperArgs]>;
    icon?: Snippet<[NavItemRenderProps & NavIconArgs]>;
    /** Without it the entry's text shows */
    text?: Snippet<[NavItemRenderProps]>;
    toggleIcon?: Snippet<[NavItemRenderProps & NavIconArgs]>;
    expandIcon?: Snippet<[NavItemRenderProps & NavExpandIconArgs]>;
    onClick?: (data: NavClickData) => void;
    onCollapseChange?: (isCollapsed: boolean) => void;
    onOpenChange?: (data: NavOpenChangeData) => void;
    onSelect?: (data: OnSelectedData) => void;
}
