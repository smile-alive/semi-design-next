import type { Accessor } from 'solid-js';
import { createContext } from '../_base/create-context';
import type { TabPosition, TabType } from './interface';

export interface TabsView {
    tabsId: string;
    /** Every pane is in the DOM, so every tab may point to its panel */
    everyPanelMounted: boolean;
    type: TabType;
    tabPosition: TabPosition;
    /** The tab that takes the Tab stop when no tab in the tablist is selected (none is, or it sits in the more menu) */
    tabbableKey?: string;
}

/** Defaults for the TabItems that are not given these handlers, e.g. in a custom renderTabBar */
export interface TabsContextValue {
    view: Accessor<TabsView>;
    deleteTabItem: (tabKey: string, event: MouseEvent) => void;
    handleKeyDown: (event: KeyboardEvent, itemKey: string, closable: boolean) => void;
}

export const [TabsContext, useTabsContext] = createContext<TabsContextValue>('Tabs', { optional: true });
