import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { IconSize } from '@fibrae/semi-icons-svelte';
import type { ShowTooltip } from '../typography/interface.js';

export interface BreadcrumbRoute {
    [x: string]: unknown;
    name?: string;
    path?: string;
    href?: string;
    noLink?: boolean;
    /** Text separator after this item only; replaces the shared separator */
    separator?: string;
    key?: string | number;
}

export interface BreadcrumbShowTooltip {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    /** The Tooltip of a truncated title; its content is the title itself. `class` and `style` land on the popup */
    opts?: ShowTooltip['opts'];
}

export type BreadcrumbMoreType = 'default' | 'popover';

export type BreadcrumbClick = (route: BreadcrumbRoute, event: MouseEvent) => void;

export interface BreadcrumbRouteContext {
    route: BreadcrumbRoute;
    /** Counts every route, the collapsed ones included */
    index: number;
}

export interface BreadcrumbIconContext extends BreadcrumbRouteContext {
    size: IconSize;
    class: string;
}

export interface BreadcrumbMoreContext {
    restItems: BreadcrumbRouteContext[];
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
    activeIndex?: number;
    autoCollapse?: boolean;
    compact?: boolean;
    maxItemCount?: number;
    moreType?: BreadcrumbMoreType;
    routes?: Array<BreadcrumbRoute | string>;
    separator?: string | Snippet;
    showTooltip?: boolean | BreadcrumbShowTooltip;
    /**
     * A prop, not the nav's native click listener: whether a handler exists decides if items without href are
     * keyboard links.
     */
    onClick?: BreadcrumbClick;
    /** Custom title of every item; rendered inline, without the truncating text */
    item?: Snippet<[BreadcrumbRouteContext]>;
    icon?: Snippet<[BreadcrumbIconContext]>;
    more?: Snippet<[BreadcrumbMoreContext]>;
}
