import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { TabPosition, TabSize, TabType } from './interface';

export interface TabsView {
    activeKey: string | null;
    /** The previously selected key, null on mount; the entering pane slides in from its side */
    prevActiveKey: string | null;
    /** A pane added and selected by the same update shows without sliding in */
    forceDisableMotion: boolean;
    paneKeys: (string | undefined)[];
    lazyRender: boolean;
    tabPaneMotion: boolean;
    tabPosition: TabPosition;
    type: TabType;
    size: TabSize;
    tabsId: string;
    /** false when only the active tab has a panel in the document */
    everyPanelMounted: boolean;
    /** The tab that takes the Tab stop when no tab in the tablist is selected (none is, or it sits in the more menu) */
    tabbableKey?: string;
}

// TabItem is public and can sit in a custom bar, so keyboard and close reach it here, not via exposed props
export interface TabsContext {
    view: ComputedRef<TabsView>;
    tabClick: (itemKey: string, event: MouseEvent) => void;
    handleKeyDown: (event: KeyboardEvent, itemKey: string, closable: boolean) => void;
    deleteTab: (itemKey: string) => void;
}

export const [provideTabsContext, useTabsContext] = createContext<TabsContext>('Tabs', { optional: true });
