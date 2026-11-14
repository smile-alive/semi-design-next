import type { Component, JSX } from 'solid-js';
import type { TabsPart } from '@fibrae/semi-foundation/components/tabs/constants';
import type { ElementProps } from '../../base/index';
import type { DropdownProps, GetDropdownTriggerProps } from '../dropdown';

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
    key: string;
    active: boolean;
}

export interface TabsDropdownProps {
    start?: DropdownProps;
    end?: DropdownProps;
}

/** `render` spreads `getTriggerProps()` onto its own trigger element, as Dropdown's function children do */
export type TabsMore = number | { count: number; render?: (getTriggerProps: GetDropdownTriggerProps) => JSX.Element; dropdownProps?: DropdownProps };

export interface TabBarProps extends ElementProps<'div'> {
    activeKey?: string | null;
    /** Names the tablist */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    /** Only `visibleTabs` is read: the scroll wrapper that holds the visible tabs */
    classNames?: Partial<Record<'visibleTabs', string>>;
    collapsible?: boolean | 'auto';
    list?: PlainTab[];
    onTabClick?: (activeKey: string, event: MouseEvent | KeyboardEvent) => void;
    showRestInDropdown?: boolean;
    size?: TabSize;
    styles?: Partial<Record<'visibleTabs', JSX.CSSProperties | string>>;
    tabBarExtraContent?: JSX.Element;
    tabPosition?: TabPosition;
    type?: TabType;
    dropdownClassName?: string;
    dropdownStyle?: JSX.CSSProperties | string;
    deleteTabItem?: (tabKey: string, event: MouseEvent) => void;
    handleKeyDown?: (event: KeyboardEvent, itemKey: string, closable: boolean) => void;
    more?: TabsMore;
    onVisibleTabsChange?: (visibleState: Map<string, boolean>) => void;
    arrowPosition?: 'both' | 'start' | 'end';
    /** `defaultNode` creates the default arrow; call it where the arrow is inserted */
    renderArrow?: (items: OverflowItem[], pos: 'start' | 'end', handleArrowClick: () => void, defaultNode: () => JSX.Element) => JSX.Element;
    dropdownProps?: TabsDropdownProps;
    /** The content of each tab in `list`; without it the entry's `tab` shows */
    renderTab?: TabRender;
    renderIcon?: TabRender;
}

export interface TabsProps extends ElementProps<'div', 'onChange'> {
    activeKey?: string | null;
    children?: JSX.Element;
    classNames?: Partial<Record<TabsPart, string>>;
    collapsible?: boolean | 'auto';
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
    styles?: Partial<Record<TabsPart, JSX.CSSProperties | string>>;
    tabBarExtraContent?: JSX.Element;
    tabList?: PlainTab[];
    /** The content of each `tabList` tab; without it the entry's `tab` shows */
    renderTab?: TabRender;
    renderIcon?: TabRender;
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    type?: TabType;
    more?: TabsMore;
    onVisibleTabsChange?: TabBarProps['onVisibleTabsChange'];
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
