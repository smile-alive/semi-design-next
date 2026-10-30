import { createContext } from '../_base/create-context.js';
import type { TabPosition, TabSize, TabType } from './interface.js';

export interface TabsView {
    activeKey: string | null;
    /** The previously selected key, null on mount; the entering pane slides in from its side */
    prevActiveKey: string | null;
    /** A pane added and selected by the same update shows without sliding in */
    forceDisableMotion: boolean;
    paneKeys: string[];
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

// TabItem is public and can sit in a custom bar, so keyboard and close reach it here, not via props
export interface TabsContextValue {
    readonly view: TabsView;
    tabClick: (itemKey: string, event: MouseEvent) => void;
    handleKeyDown: (event: KeyboardEvent, itemKey: string, closable: boolean) => void;
    deleteTab: (itemKey: string) => void;
}

// TabItem works outside Tabs, so the context is optional there; the parts only Tabs renders require it
export const [getTabsContext, setTabsContext] = createContext<TabsContextValue>('Tabs', { optional: true });

export function requireTabsContext(caller: string) {
    const ctx = getTabsContext();
    if (!ctx) {
        throw new Error(`${caller} must be used inside Tabs`);
    }
    return ctx;
}
