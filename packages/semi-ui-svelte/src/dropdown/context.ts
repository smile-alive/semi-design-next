import { SvelteMap } from 'svelte/reactivity';
import type { DropdownMenuContext, DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import { createContext } from '../_base/create-context.js';
import type { Trigger } from '../tooltip/index.js';

export interface DropdownContextView {
    readonly menuDepth: number;
    readonly showTick: boolean;
    readonly selectionMode?: DropdownSelectionMode;
    readonly trigger: Trigger;
}

export interface DropdownContext {
    readonly view: DropdownContextView;
    close: () => void;
    closeAll: () => void;
    getPopupId: () => string;
}

export const [getDropdownContext, setDropdownContext] = createContext<DropdownContext>('Dropdown', { optional: true });

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
