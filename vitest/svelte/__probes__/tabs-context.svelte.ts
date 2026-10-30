import { createContext } from 'svelte';

export interface PaneEntry {
    title: string;
}

export const [getTabsContext, setTabsContext] = createContext<{ register: (pane: PaneEntry) => () => void }>();
