import type { Accessor, JSX } from 'solid-js';
import type { DropdownMenuPart } from '@fibrae/semi-foundation/components/dropdown/constants';
import type { DropdownMenuContext, DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import { createContext } from '../../base/index';
import type { Trigger } from '../tooltip';

export interface DropdownContextView {
    /** Already merged with the enclosing Dropdowns', so a submenu keeps the parts of the menus around it */
    classNames?: Partial<Record<DropdownMenuPart, string>>;
    styles?: Partial<Record<DropdownMenuPart, JSX.CSSProperties | string>>;
    /** How many menus enclose this point: 1 inside a top-level menu */
    menuDepth: number;
    showTick: boolean;
    /** Not inherited: a submenu takes its own Dropdown's value */
    selectionMode?: DropdownSelectionMode;
    trigger: Trigger;
}

export interface DropdownContextValue {
    view: Accessor<DropdownContextView>;
    /** Closes the popup that renders the menu, without moving focus */
    close: () => void;
    /** Closes that popup and the popups of every enclosing menu */
    closeAll: () => void;
    getPopupId: () => string;
}

export const [DropdownContext, useDropdownContext] = createContext<DropdownContextValue>('Dropdown', { optional: true });

export function menuContext(context?: DropdownContextValue, direction?: 'ltr' | 'rtl'): DropdownMenuContext {
    return {
        ...context?.view(),
        menuDepth: context?.view().menuDepth ?? 0,
        close: context?.close,
        closeAll: context?.closeAll,
        getPopupId: context?.getPopupId,
        direction,
    };
}

/**
 * Each Dropdown.Item's li -> whether it is disabled. Solid cannot read a child's component type (S-H4), so a Dropdown
 * finds out here that its trigger is a parent item: a menu button even with a checkbox or radio role, and one that
 * opens no submenu while disabled.
 */
export const menuItems = new WeakMap<Element, Accessor<boolean>>();
