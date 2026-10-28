import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';
import type { NavProps, ItemKey } from './index';
export interface NavContextType {
    isCollapsed?: boolean;
    mode?: NavProps['mode'];
    openKeys?: ItemKey[];
    /** Asks the Nav to flip its collapsed state; the Nav then reports it through NavProps.onCollapseChange */
    toggleCollapsed?: () => void;
    selectedKeys?: ItemKey[];
    toggleIconPosition?: 'left' | 'right';
    selectedKeysIsControlled?: boolean;
    openKeysIsControlled?: boolean;
    limitIndent?: boolean;
    isInSubNav?: boolean;
    locale?: Locale['Navigation'];
    subNavMotion?: NavProps['subNavMotion'];
    subNavCloseDelay?: NavProps['subNavCloseDelay'];
    subNavOpenDelay?: NavProps['subNavOpenDelay'];
    renderWrapper?: NavProps['renderWrapper'];
    tooltipShowDelay?: number;
    tooltipHideDelay?: number;
    onSelect?: NavProps['onSelect'];
    onOpenChange?: NavProps['onOpenChange'];
    onClick?: NavProps['onClick'];
    updateSelectedKeys?: (keys: ItemKey[]) => void;
    addOpenKey?: (itemKey: ItemKey) => void;
    removeOpenKey?: (itemKey: ItemKey) => void;
}

export const [NavContext, useNavContext] = createContext<NavContextType>('Navigation', {
    defaultValue: {
        isCollapsed: false,
        isInSubNav: false,
        selectedKeys: [],
        openKeys: [],
    },
});
