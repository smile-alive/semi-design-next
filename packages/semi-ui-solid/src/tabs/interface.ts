import type { Component, JSX } from 'solid-js';
import type { ElementProps } from '../_base/element-props';
import type { DropdownProps } from '../dropdown';

export type TabType = 'line' | 'card' | 'button' | 'slash';
export type TabSize = 'small' | 'medium' | 'large';
export type TabPosition = 'top' | 'left';

/** A `tabList` entry holds data only; markup for its tab and icon comes from the Tabs `renderTab` and `renderIcon` */
export interface PlainTab {
    itemKey: string;
    tab?: string | number;
    disabled?: boolean;
    closable?: boolean;
}

/** Called where the result is inserted, again when the entry's data or index changes */
export type TabRender = (item: PlainTab, index: number) => JSX.Element;

/** A tab of the collapsed bar. Data only: with TabPane children it has no `tab`; use `tabList` when the text is needed */
export interface OverflowItem extends PlainTab {
    /** `${itemKey}-bar` */
    key: string;
    active: boolean;
}

export interface TabsDropdownProps {
    start?: DropdownProps;
    end?: DropdownProps;
}

export type TabsMore = number | { count: number; render?: () => JSX.Element; dropdownProps?: DropdownProps };

export interface TabBarProps extends ElementProps<'div'> {
    activeKey?: string | null;
    /** Names the tablist */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    collapsible?: boolean | 'auto';
    list?: PlainTab[];
    onTabClick?: (activeKey: string, event: MouseEvent | KeyboardEvent) => void;
    showRestInDropdown?: boolean;
    size?: TabSize;
    tabBarExtraContent?: JSX.Element;
    tabPosition?: TabPosition;
    type?: TabType;
    dropdownClassName?: string;
    dropdownStyle?: JSX.CSSProperties | string;
    deleteTabItem?: (tabKey: string, event: MouseEvent) => void;
    handleKeyDown?: (event: KeyboardEvent, itemKey: string, closable: boolean) => void;
    more?: TabsMore;
    onVisibleTabsChange?: (visibleState: Map<string, boolean>) => void;
    visibleTabsStyle?: JSX.CSSProperties | string;
    arrowPosition?: 'both' | 'start' | 'end';
    /** `defaultNode` creates the default arrow; call it where the arrow is inserted */
    renderArrow?: (items: OverflowItem[], pos: 'start' | 'end', handleArrowClick: () => void, defaultNode: () => JSX.Element) => JSX.Element;
    dropdownProps?: TabsDropdownProps;
    /** The content of each tab in `list`; without it the entry's `tab` shows */
    renderTab?: TabRender;
    /** The icon of each tab in `list` */
    renderIcon?: TabRender;
}

export interface TabsProps extends ElementProps<'div', 'onChange'> {
    activeKey?: string | null;
    children?: JSX.Element;
    collapsible?: boolean | 'auto';
    contentStyle?: JSX.CSSProperties | string;
    defaultActiveKey?: string;
    keepDOM?: boolean;
    lazyRender?: boolean;
    onChange?: (activeKey: string) => void;
    onTabClick?: (activeKey: string, event: MouseEvent | KeyboardEvent) => void;
    onTabClose?: (tabKey: string) => void;
    preventScroll?: boolean;
    /** Called once; tabBarProps is live, so read its fields inside JSX */
    renderTabBar?: (tabBarProps: TabBarProps, DefaultTabBar: Component<TabBarProps>) => JSX.Element;
    showRestInDropdown?: boolean;
    size?: TabSize;
    tabBarClassName?: string;
    tabBarExtraContent?: JSX.Element;
    tabBarStyle?: JSX.CSSProperties | string;
    tabList?: PlainTab[];
    /** The content of each `tabList` tab; without it the entry's `tab` shows */
    renderTab?: TabRender;
    /** The icon of each `tabList` tab */
    renderIcon?: TabRender;
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    type?: TabType;
    more?: TabsMore;
    onVisibleTabsChange?: TabBarProps['onVisibleTabsChange'];
    visibleTabsStyle?: TabBarProps['visibleTabsStyle'];
    arrowPosition?: TabBarProps['arrowPosition'];
    renderArrow?: TabBarProps['renderArrow'];
    dropdownProps?: TabsDropdownProps;
    /** Names the tablist, not the root */
    'aria-label'?: string;
    'aria-labelledby'?: string;
}

/** Undeclared attributes and ref land on the role="tabpanel" div */
export interface TabPaneProps extends ElementProps<'div'> {
    children?: JSX.Element;
    closable?: boolean;
    disabled?: boolean;
    icon?: JSX.Element;
    itemKey?: string;
    tab?: JSX.Element;
}

export interface TabItemProps extends ElementProps<'div', 'onClick'> {
    tab?: JSX.Element;
    icon?: JSX.Element;
    size?: TabSize;
    type?: TabType;
    tabPosition?: TabPosition;
    selected?: boolean;
    closable?: boolean;
    disabled?: boolean;
    itemKey?: string;
    handleKeyDown?: TabBarProps['handleKeyDown'];
    deleteTabItem?: TabBarProps['deleteTabItem'];
    onClick?: (itemKey: string, event: MouseEvent) => void;
}
