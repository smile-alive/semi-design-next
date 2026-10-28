import type { DropdownMenuContext } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { createContext } from '../_base/create-context';
import type { TooltipProps } from '../tooltip/index';

export interface DropdownContextType extends Omit<DropdownMenuContext, 'direction'> {
    trigger?: TooltipProps['trigger'];
}

export const [DropdownContext, useDropdownContext] = createContext<DropdownContextType>('Dropdown', { defaultValue: { menuDepth: 0 } });
