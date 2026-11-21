import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { BreadcrumbItemPart, BreadcrumbPart } from '@fibrae/semi-foundation/components/breadcrumb/constants';
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
    /** Applied after the `item*` classNames of the Breadcrumb */
    classNames?: Partial<Record<BreadcrumbItemPart, ClassValue>>;
    styles?: Partial<Record<BreadcrumbItemPart, string>>;
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
    /** The icon's own class and the icon classNames; put it on the icon element together with `style` */
    class: ClassValue;
    style?: string;
}

export interface BreadcrumbMoreContext {
    restItems: BreadcrumbRouteContext[];
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
    activeIndex?: number;
    autoCollapse?: boolean;
    /** `item*` keys apply to every item, before the route's own classNames */
    classNames?: Partial<Record<BreadcrumbPart, ClassValue>>;
    compact?: boolean;
    maxItemCount?: number;
    moreType?: BreadcrumbMoreType;
    routes?: Array<BreadcrumbRoute | string>;
    separator?: string | Snippet;
    showTooltip?: boolean | BreadcrumbShowTooltip;
    styles?: Partial<Record<BreadcrumbPart, string>>;
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
