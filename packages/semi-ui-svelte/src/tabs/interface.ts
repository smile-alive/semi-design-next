import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { DropdownProps } from '../dropdown/index.js';

export type TabType = 'line' | 'card' | 'button' | 'slash';
export type TabSize = 'small' | 'medium' | 'large';
export type TabPosition = 'top' | 'left';

/** A `tabList` entry holds data only; markup for its tab and icon goes to the Tabs `tab` and `icon` snippets */
export interface PlainTab {
    itemKey: string;
    tab?: string | number;
    disabled?: boolean;
    closable?: boolean;
}

export type TabsDropdownItemProps = DropdownProps;

export interface TabsDropdownProps {
    start?: TabsDropdownItemProps;
    end?: TabsDropdownItemProps;
}

/** The menu content is the `moreContent` snippet and the trigger the `moreTrigger` snippet */
export interface TabsMore {
    count: number;
    dropdownProps?: TabsDropdownItemProps;
}

/** A tab of the collapsed bar as OverflowList keeps it */
export interface OverflowItem extends PlainTab {
    /** `${itemKey}-bar` */
    key: string;
    active: boolean;
}

export interface TabsTabSnippetProps {
    item: PlainTab;
    index: number;
}

export interface TabsPanelSnippetProps extends TabsTabSnippetProps {
    itemKey: string;
}

/** The data of the default tab bar; its behavior reaches the TabItems inside the Tabs on its own */
export interface TabBarProps {
    activeKey: string | null;
    list: PlainTab[];
    type: TabType;
    size: TabSize;
    tabPosition: TabPosition;
    collapsible: boolean | 'auto';
    showRestInDropdown: boolean;
    more?: number | TabsMore;
    arrowPosition: 'both' | 'start' | 'end';
    visibleTabsStyle?: string;
    dropdownProps?: TabsDropdownProps;
    class?: string;
    style?: string;
}

export interface TabsTabBarSnippetProps {
    tabBarProps: TabBarProps;
    /** The default tab bar, ready for `{@render tabBar()}` */
    tabBar: Snippet;
}

export interface TabsArrowSnippetProps {
    /** The tabs scrolled out on this side */
    items: OverflowItem[];
    position: 'start' | 'end';
    /** Scrolls the next hidden tab of this side into view */
    onClick: () => void;
    /** The default arrow, ready for `{@render defaultNode()}` */
    defaultNode: Snippet;
}

export interface TabsMoreContentSnippetProps {
    /** The tabs moved into the more menu */
    items: PlainTab[];
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
    /** null selects no tab and still counts as controlled */
    activeKey?: string | null;
    arrowPosition?: 'both' | 'start' | 'end';
    collapsible?: boolean | 'auto';
    contentStyle?: string;
    dropdownProps?: TabsDropdownProps;
    keepDOM?: boolean;
    lazyRender?: boolean;
    more?: number | TabsMore;
    preventScroll?: boolean;
    showRestInDropdown?: boolean;
    size?: TabSize;
    tabBarClassName?: string;
    tabBarStyle?: string;
    tabList?: PlainTab[];
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    type?: TabType;
    visibleTabsStyle?: string;
    onChange?: (activeKey: string) => void;
    onTabClick?: (activeKey: string, event: MouseEvent | KeyboardEvent) => void;
    onTabClose?: (tabKey: string) => void;
    onVisibleTabsChange?: (visibleState: Map<string, boolean>) => void;
    /** The content area when there is no `panel`: one tabpanel labelled by the selected tab */
    children?: Snippet;
    /** The content of each `tabList` entry; it makes every entry its own tabpanel (keepDOM, lazyRender and motion apply) */
    panel?: Snippet<[TabsPanelSnippetProps]>;
    /** The tab of each `tabList` entry; without it the entry's `tab` text shows */
    tab?: Snippet<[TabsTabSnippetProps]>;
    /** The icon of each `tabList` entry; the icon container renders even when the snippet outputs nothing */
    icon?: Snippet<[TabsTabSnippetProps]>;
    tabBarExtraContent?: Snippet;
    /** Replaces the tab bar */
    tabBar?: Snippet<[TabsTabBarSnippetProps]>;
    /** Replaces each arrow of the collapsed bar */
    arrow?: Snippet<[TabsArrowSnippetProps]>;
    /** Replaces the trigger of the more menu */
    moreTrigger?: Snippet;
    /** Replaces the content of the more menu */
    moreContent?: Snippet<[TabsMoreContentSnippetProps]>;
}

/** Internal: Tabs renders one pane per `panel` entry; the pane reads everything else from the Tabs context */
export interface TabPaneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    itemKey: string;
    children?: Snippet;
}

export interface TabItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onclick'> {
    itemKey?: string;
    selected?: boolean;
    disabled?: boolean;
    closable?: boolean;
    /** Defaults to the size of the enclosing Tabs */
    size?: TabSize;
    /** Defaults to the type of the enclosing Tabs, else 'line' */
    type?: TabType;
    /** Defaults to the tab position of the enclosing Tabs, else 'top' */
    tabPosition?: TabPosition;
    /** Not called while disabled */
    onClick?: (itemKey: string, event: MouseEvent) => void;
    tab?: Snippet;
    /** The icon container renders even when the snippet outputs nothing */
    icon?: Snippet;
}
