import type React from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { ElementProps } from '../_base/base';
import type { DropdownProps } from '../dropdown';
import type { OverflowListProps } from '../overflow-list';
import type TabBar from './tab-bar';
import type { OverflowItem } from './tab-bar';

export type TabType = 'line' | 'card' | 'button' | 'slash';
export type TabSize = 'small' | 'medium' | 'large';
export type TabPosition = 'top' | 'left';

export interface PlainTab {
    disabled?: boolean;
    icon?: ReactNode;
    itemKey: string;
    tab?: ReactNode;
    closable?: boolean;
}

interface TabsDropDownProps {
    start?: DropdownProps;
    end?: DropdownProps;
}

export interface TabsProps extends ElementProps<'div', 'onChange'> {
    activeKey?: string | null;
    children?: ReactNode | Array<ReactNode>;
    className?: string;
    collapsible?: boolean | 'auto';
    contentStyle?: CSSProperties;
    defaultActiveKey?: string;
    keepDOM?: boolean;
    lazyRender?: boolean;
    onChange?: (activeKey: string) => void;
    onTabClick?: (activeKey: string, e: MouseEvent | KeyboardEvent) => void;
    renderTabBar?: (tabBarProps: TabBarProps, defaultTabBar: typeof TabBar) => ReactNode;
    showRestInDropdown?: boolean;
    size?: TabSize;
    style?: CSSProperties;
    tabBarClassName?: string;
    tabBarExtraContent?: ReactNode;
    tabBarStyle?: CSSProperties;
    tabList?: PlainTab[];
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    type?: TabType;
    onTabClose?: (tabKey: string) => void;
    preventScroll?: boolean;
    more?: number | { count: number; render?: () => ReactNode; dropdownProps?: DropdownProps };
    onVisibleTabsChange?: TabBarProps['onVisibleTabsChange'];
    visibleTabsStyle?: TabBarProps['visibleTabsStyle'];
    arrowPosition?: TabBarProps['arrowPosition'];
    renderArrow?: TabBarProps['renderArrow'];
    dropdownProps?: TabsDropDownProps;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export interface TabBarProps extends ElementProps<'div'> {
    activeKey?: string | null;
    /** Name the tablist; the Tabs' own aria-label and aria-labelledby arrive here */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    className?: string;
    collapsible?: boolean | 'auto';
    list?: Array<PlainTab>;
    onTabClick?: (activeKey: string, event: MouseEvent) => void;
    showRestInDropdown?: boolean;
    size?: TabSize;
    style?: CSSProperties;
    tabBarExtraContent?: ReactNode;
    tabPosition?: TabPosition;
    type?: TabType;
    dropdownClassName?: string;
    dropdownStyle?: CSSProperties;
    deleteTabItem?: (tabKey: string, event: MouseEvent) => void;
    handleKeyDown?: (event: React.KeyboardEvent, itemKey: string, closable: boolean) => void;
    more?: TabsProps['more'];
    onVisibleTabsChange?: (visibleState: Map<string, boolean>) => void;
    visibleTabsStyle?: CSSProperties;
    arrowPosition?: OverflowListProps['overflowRenderDirection'];
    renderArrow?: (items: OverflowItem[], pos: 'start' | 'end', handleArrowClick: () => void, defaultNode: ReactNode) => ReactNode;
    dropdownProps?: TabsDropDownProps;
    /** Attached to the bar element, merged with the internal ref */
    ref?: React.Ref<HTMLDivElement>;
}

export interface TabPaneProps extends ElementProps<'div'> {
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    icon?: ReactNode;
    itemKey?: string;
    style?: CSSProperties;
    tab?: ReactNode;
    closable?: boolean;
    tabIndex?: number;
    /** Attached to the pane's root div (role="tabpanel") */
    ref?: React.Ref<HTMLDivElement>;
}

export interface TabContextValue {
    activeKey?: string | null;
    type?: TabType;
    /** Default close handler for TabItems that are not given deleteTabItem, e.g. in a custom renderTabBar */
    deleteTabItem?: (tabKey: string, event: MouseEvent) => void;
    lazyRender?: boolean;
    panes?: Array<PlainTab>;
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    prevActiveKey?: string | null;
    forceDisableMotion?: boolean;
    tabsId?: string;
    /** The tab that takes the Tab stop when no tab in the tablist is selected (none is, or it sits in the more menu) */
    tabbableKey?: string;
    /** Default keydown handler for TabItems that are not given handleKeyDown, e.g. in a custom renderTabBar */
    handleKeyDown?: (event: React.KeyboardEvent, itemKey: string, closable: boolean) => void;
    /** false when only the active tab has a panel in the document */
    everyPanelMounted?: boolean;
}
