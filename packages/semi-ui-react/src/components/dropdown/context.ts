import type React from 'react';
import type { DropdownMenuPart } from '@fibrae/semi-foundation/components/dropdown/constants';
import type { DropdownMenuContext } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import { createContext } from '../../base/index';
import type { TooltipProps } from '../tooltip/index';

export interface DropdownContextType extends Omit<DropdownMenuContext, 'direction'> {
    trigger?: TooltipProps['trigger'];
    /** Already merged with the enclosing Dropdowns', so a submenu keeps the parts of the menus around it */
    classNames?: Partial<Record<DropdownMenuPart, string>>;
    styles?: Partial<Record<DropdownMenuPart, React.CSSProperties>>;
}

export const [DropdownContext, useDropdownContext] = createContext<DropdownContextType>('Dropdown', { defaultValue: { menuDepth: 0 } });
