import type { Accessor } from 'solid-js';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';
import type { ItemKey, Mode, NavProps, OnClickData, OnOpenChangeData, OnSelectedData } from './interface';

/**
 * Live values: every field is a getter over a memo, so a view that reads one field only re-runs when that field
 * changes, not on every selection or open change.
 */
export interface NavView {
    isCollapsed: boolean;
    isInSubNav: boolean;
    limitIndent: boolean;
    mode: Mode;
    openKeys: ItemKey[];
    openKeysIsControlled: boolean;
    renderWrapper: NavProps['renderWrapper'];
    selectedKeys: ItemKey[];
    selectedKeysIsControlled: boolean;
    subNavCloseDelay: number;
    subNavMotion: boolean;
    subNavOpenDelay: number;
    toggleIconPosition: 'left' | 'right';
    tooltipHideDelay: number;
    tooltipShowDelay: number;
}

export interface NavContextValue {
    /** Returns the same object every time; read its fields inside the expression that needs them */
    view: Accessor<NavView>;
    locale: Accessor<Locale['Navigation']>;
    /** Asks the Nav to flip its collapsed state; the Nav then reports it through `onCollapseChange` */
    toggleCollapsed: () => void;
    notifySelect: (data: OnSelectedData) => void;
    notifyOpenChange: (data: OnOpenChangeData) => void;
    notifyClick: (data: OnClickData) => void;
    updateSelectedKeys: (keys: ItemKey[]) => void;
    addOpenKey: (itemKey: ItemKey) => void;
    removeOpenKey: (itemKey: ItemKey) => void;
}

export const [NavContext, useNavContext] = createContext<NavContextValue>('Nav');
