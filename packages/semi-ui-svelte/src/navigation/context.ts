import { createContext } from '../_base/create-context.js';
import type { ItemKey, Mode, NavClickData, NavOpenChangeData, NavProps, OnSelectedData } from './interface.js';

/** Getters over the Nav's live values, so readers stay reactive; a Sub provides a copy of it to its own subtree */
export interface NavContextValue {
    readonly isCollapsed: boolean;
    readonly mode: Mode;
    /** True below a Sub: its title and list, inline or in the popup */
    readonly isInSubNav: boolean;
    /** Nesting depth of the items and Subs rendered at this point, 0 at the top */
    readonly level: number;
    readonly openKeys: ItemKey[];
    readonly openKeysIsControlled: boolean;
    readonly selectedKeys: ItemKey[];
    readonly selectedKeysIsControlled: boolean;
    readonly limitIndent: boolean;
    readonly toggleIconPosition: 'left' | 'right';
    readonly subNavMotion: boolean;
    readonly subNavOpenDelay: number;
    readonly subNavCloseDelay: number;
    readonly tooltipShowDelay: number;
    readonly tooltipHideDelay: number;
    readonly wrapper: NavProps['wrapper'];
    toggleCollapsed: () => void;
    updateSelectedKeys: (keys: ItemKey[]) => void;
    addOpenKey: (key: ItemKey) => void;
    removeOpenKey: (key: ItemKey) => void;
    notifySelect: (data: OnSelectedData) => void;
    notifyClick: (data: NavClickData) => void;
    notifyOpenChange: (data: NavOpenChangeData) => void;
}

export const [getNavContext, setNavContext] = createContext<NavContextValue>('Nav');
