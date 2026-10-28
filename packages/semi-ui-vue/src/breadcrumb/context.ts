import type { ComputedRef, VNode } from 'vue';
import { createContext } from '../_base/create-context';
import type { BreadcrumbClick, ShowTooltipProps } from './interface';

export interface BreadcrumbContextView {
    compact: boolean;
    showTooltip: boolean | ShowTooltipProps;
    separator: string;
    hasOnClick: boolean;
}

export interface BreadcrumbContext {
    view: ComputedRef<BreadcrumbContextView>;
    onClick: BreadcrumbClick;
    /** Called in the Item's render so the slot content is tracked there */
    separatorSlot: () => VNode[] | undefined;
}

export const [provideBreadcrumbContext, useBreadcrumbContext] = createContext<BreadcrumbContext>('Breadcrumb', { optional: true });
