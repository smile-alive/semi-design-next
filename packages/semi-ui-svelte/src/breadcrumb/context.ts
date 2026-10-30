import type { Snippet } from 'svelte';
import { createContext } from '../_base/create-context.js';
import type { BreadcrumbClick, BreadcrumbIconContext, BreadcrumbProps, BreadcrumbRouteContext } from './interface.js';

export interface BreadcrumbContext {
    readonly compact: boolean;
    readonly showTooltip: NonNullable<BreadcrumbProps['showTooltip']>;
    readonly separator: string | Snippet;
    // onClick below always routes through the Breadcrumb; only a handler the user gave makes plain-text items keyboard stops
    readonly hasOnClick: boolean;
    readonly item?: Snippet<[BreadcrumbRouteContext]>;
    readonly icon?: Snippet<[BreadcrumbIconContext]>;
    onClick: BreadcrumbClick;
}

export const [getBreadcrumbContext, setBreadcrumbContext] = createContext<BreadcrumbContext>('Breadcrumb');
