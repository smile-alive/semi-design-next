import type { DropdownMenuContext } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import { createContext } from '../../base/index';
import type { TooltipProps } from '../tooltip/index';

export interface DropdownContextType extends Omit<DropdownMenuContext, 'direction'> {
    trigger?: TooltipProps['trigger'];
}

export const [DropdownContext, useDropdownContext] = createContext<DropdownContextType>('Dropdown', { defaultValue: { menuDepth: 0 } });
