import type React from 'react';
import type { BreadcrumbPart } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import { createContext } from '../../base/index';
import type { ShowTooltipProps } from './breadcrumb';
import type { BreadcrumbItemInfo } from './item';

export interface BreadContextType {
    onClick?: (info: BreadcrumbItemInfo, event: React.MouseEvent) => void;
    // onClick above always routes through the Breadcrumb; only a handler the user gave makes plain-text items keyboard stops
    hasOnClick?: boolean;
    showTooltip?: boolean | ShowTooltipProps;
    compact?: boolean;
    separator?: React.ReactNode;
    classNames?: Partial<Record<BreadcrumbPart, string>>;
    styles?: Partial<Record<BreadcrumbPart, React.CSSProperties>>;
}

export const [BreadContext, useBreadContext] = createContext<BreadContextType>('Breadcrumb', { defaultValue: {} });
