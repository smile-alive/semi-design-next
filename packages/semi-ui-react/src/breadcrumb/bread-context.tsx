import type React from 'react';
import { createContext } from '../_base/create-context';
import type { showToolTipProps } from './index';
import type { BreadcrumbItemInfo } from './item';

export interface BreadContextType {
    onClick?: (info: BreadcrumbItemInfo, event: React.MouseEvent) => void;
    // onClick above always routes through the Breadcrumb; only a handler the user gave makes plain-text items keyboard stops
    hasOnClick?: boolean;
    showTooltip?: boolean | showToolTipProps;
    compact?: boolean;
    separator?: React.ReactNode;
}

export const [BreadContext, useBreadContext] = createContext<BreadContextType>('Breadcrumb', { defaultValue: {} });
