import type { ComputedRef } from 'vue';
import type { DropdownMenuContext, DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { createContext } from '../_base/create-context';
import type { Trigger } from '../tooltip/interface';

export interface DropdownContextView {
    /** How many menus enclose this point: 1 inside a top-level menu */
    menuDepth: number;
    showTick: boolean;
    selectionMode?: DropdownSelectionMode;
    trigger: Trigger;
}

export interface DropdownContext {
    view: ComputedRef<DropdownContextView>;
    /** Closes the popup that renders the menu, without moving focus */
    close: () => void;
    /** Closes that popup and the popups of every enclosing menu */
    closeAll: () => void;
    getPopupId: () => string;
}

export const [provideDropdownContext, useDropdownContext] = createContext<DropdownContext>('Dropdown', { optional: true });

/** The foundation context; outside any menu the depth is 0. */
export function menuContext(ctx?: DropdownContext, direction?: 'ltr' | 'rtl'): DropdownMenuContext {
    return {
        ...ctx?.view.value,
        menuDepth: ctx?.view.value.menuDepth ?? 0,
        close: ctx?.close,
        closeAll: ctx?.closeAll,
        getPopupId: ctx?.getPopupId,
        direction,
    };
}
