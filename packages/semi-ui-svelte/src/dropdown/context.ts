import { SvelteMap } from 'svelte/reactivity';
import type { DropdownMenuContext, DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { createContext } from '../_base/create-context.js';
import type { Trigger } from '../tooltip/index.js';

export interface DropdownContextView {
    /** How many menus enclose this point: 1 inside a top-level menu */
    readonly menuDepth: number;
    readonly showTick: boolean;
    readonly selectionMode?: DropdownSelectionMode;
    readonly trigger: Trigger;
}

/** What a Dropdown provides to its popup content; its trigger reads the context of the menu around the Dropdown */
export interface DropdownContext {
    /** Getters over the Dropdown's props, so readers stay reactive */
    readonly view: DropdownContextView;
    /** Closes the popup that renders the menu, without moving focus */
    close: () => void;
    /** Closes that popup and the popups of every enclosing menu */
    closeAll: () => void;
    getPopupId: () => string;
}

export const [getDropdownContext, setDropdownContext] = createContext<DropdownContext>('Dropdown', { optional: true });

/** The foundation context; outside any menu the depth is 0 */
export function menuContext(context?: DropdownContext, direction?: 'ltr' | 'rtl'): DropdownMenuContext {
    return {
        ...context?.view,
        menuDepth: context?.view.menuDepth ?? 0,
        close: context?.close,
        closeAll: context?.closeAll,
        getPopupId: context?.getPopupId,
        direction,
    };
}

/**
 * Each Dropdown.Item's li -> whether it is disabled. A snippet cannot read its child's props, so a Dropdown finds out
 * here that its trigger is a parent item: a menu button even with a checkbox or radio role, and one that opens no
 * submenu while disabled.
 */
export const menuItems = new SvelteMap<Element, () => boolean>();
