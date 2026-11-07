import type { ComputedRef } from 'vue';
import type { DropdownMenuContext, DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import { createContext } from '../../base/create-context';
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
    close: () => void;
    /** Closes that popup and the popups of every enclosing menu */
    closeAll: () => void;
    getPopupId: () => string;
}

export const [provideDropdownContext, useDropdownContext] = createContext<DropdownContext>('Dropdown', { optional: true });

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
