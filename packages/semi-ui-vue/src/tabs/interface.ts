import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { DropdownProps } from '../dropdown/interface';

export type TabType = 'line' | 'card' | 'button' | 'slash';
export type TabSize = 'small' | 'medium' | 'large';
export type TabPosition = 'top' | 'left';

/** A `tabList` entry holds data only; markup for its tab and icon goes to the Tabs `#tab` and `#icon` slots */
export interface PlainTab {
    itemKey: string;
    tab?: string | number;
    disabled?: boolean;
    closable?: boolean;
}

/** Dropdown props of a bar side, plus the class, style and listener Dropdown takes as attrs */
export type TabsDropdownItemProps = DropdownProps & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onVisibleChange?: (visible: boolean) => void;
};

export interface TabsDropdownProps {
    start?: TabsDropdownItemProps;
    end?: TabsDropdownItemProps;
}

/** The menu content is the `#moreContent` slot and the trigger the `#more` slot */
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

export interface TabsProps {
    /** null selects no tab and still counts as controlled */
    activeKey?: string | null;
    arrowPosition?: 'both' | 'start' | 'end';
    // Boolean comes first: Vue reads the shorthand `<Tabs collapsible>` as true only when Boolean precedes String
    collapsible?: boolean | 'auto';
    contentStyle?: StyleValue;
    defaultActiveKey?: string;
    dropdownProps?: TabsDropdownProps;
    keepDOM?: boolean;
    lazyRender?: boolean;
    more?: number | TabsMore;
    preventScroll?: boolean;
    showRestInDropdown?: boolean;
    size?: TabSize;
    tabBarClassName?: string;
    tabBarStyle?: StyleValue;
    /** An array, even an empty one, makes the default slot plain content instead of TabPanes */
    tabList?: PlainTab[];
    tabPaneMotion?: boolean;
    tabPosition?: TabPosition;
    type?: TabType;
    visibleTabsStyle?: StyleValue;
}

export interface TabsEmits {
    'update:activeKey': [activeKey: string];
    change: [activeKey: string];
    tabClick: [activeKey: string, event: MouseEvent | KeyboardEvent];
    tabClose: [tabKey: string];
    visibleTabsChange: [visibleState: Map<string, boolean>];
}

/** The data of the default tab bar; its behavior reaches the TabItems inside the Tabs on its own */
export interface TabBarProps {
    activeKey: string | null;
    /** TabPane entries carry `tab` only when the pane's `#tab` slot is plain text */
    list: PlainTab[];
    type: TabType;
    size: TabSize;
    tabPosition: TabPosition;
    collapsible: boolean | 'auto';
    showRestInDropdown: boolean;
    more?: number | TabsMore;
    arrowPosition: 'both' | 'start' | 'end';
    visibleTabsStyle?: StyleValue;
    dropdownProps?: TabsDropdownProps;
    class?: string;
    style?: StyleValue;
}

export interface TabsTabSlotProps {
    item: PlainTab;
    index: number;
}

export interface TabsTabBarSlotProps {
    tabBarProps: TabBarProps;
    /** The default tab bar, ready for `<component :is="tabBar" />` */
    tabBar: VNode;
}

export interface TabsArrowSlotProps {
    /** The tabs scrolled out on this side */
    items: OverflowItem[];
    position: 'start' | 'end';
    /** Scrolls the next hidden tab of this side into view */
    onClick: () => void;
    /** The default arrow, ready for `<component :is="defaultNode" />` */
    defaultNode: VNode;
}

export interface TabsMoreContentSlotProps {
    /** The tabs moved into the more menu */
    items: PlainTab[];
}

export interface TabsSlots {
    /** TabPanes, or the content when `tabList` is an array */
    default?: () => VNode[];
    /** The tab of each `tabList` entry; without it the entry's `tab` text shows */
    tab?: (props: TabsTabSlotProps) => VNode[];
    /** The icon of each `tabList` entry; an empty result renders no icon */
    icon?: (props: TabsTabSlotProps) => VNode[];
    tabBarExtraContent?: () => VNode[];
    /** Replaces the tab bar */
    tabBar?: (props: TabsTabBarSlotProps) => VNode[];
    /** Replaces each arrow of the collapsed bar */
    arrow?: (props: TabsArrowSlotProps) => VNode[];
    /** Replaces the trigger of the more menu */
    more?: () => VNode[];
    /** Replaces the content of the more menu */
    moreContent?: (props: TabsMoreContentSlotProps) => VNode[];
}

export interface TabPaneProps {
    itemKey?: string;
    disabled?: boolean;
    closable?: boolean;
}

export interface TabPaneSlots {
    default?: () => VNode[];
    /** The pane's tab, rendered by the Tabs */
    tab?: () => VNode[];
    /** The icon of the pane's tab, rendered by the Tabs */
    icon?: () => VNode[];
}

export interface TabItemProps {
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
}

export interface TabItemEmits {
    /** Not emitted while disabled */
    click: [itemKey: string, event: MouseEvent];
}

export interface TabItemSlots {
    tab?: () => VNode[];
    /** An empty result renders no icon */
    icon?: () => VNode[];
}
