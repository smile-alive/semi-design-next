import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { ItemKey, Mode, NavClickData, NavOpenChangeData, NavSlots, OnSelectedData } from './interface';

export interface NavContextView {
    isCollapsed: boolean;
    mode: Mode;
    /** True below a Sub: its title and list, inline or in the popup */
    isInSubNav: boolean;
    openKeys: ItemKey[];
    openKeysIsControlled: boolean;
    selectedKeys: ItemKey[];
    selectedKeysIsControlled: boolean;
    limitIndent: boolean;
    toggleIconPosition: 'left' | 'right';
    subNavMotion: boolean;
    subNavOpenDelay: number;
    subNavCloseDelay: number;
    tooltipShowDelay: number;
    tooltipHideDelay: number;
}

export interface NavContext {
    view: ComputedRef<NavContextView>;
    /** The Nav's #wrapper slot; slots are not reactive, so it is read during render */
    wrapper: () => NavSlots['wrapper'];
    toggleCollapsed: () => void;
    updateSelectedKeys: (keys: ItemKey[]) => void;
    addOpenKey: (key: ItemKey) => void;
    removeOpenKey: (key: ItemKey) => void;
    notifySelect: (data: OnSelectedData) => void;
    notifyClick: (data: NavClickData) => void;
    notifyOpenChange: (data: NavOpenChangeData) => void;
}

export const [provideNavContext, useNav] = createContext<NavContext>('Nav');
