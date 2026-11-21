import type { ClassValue, StyleValue, VNode } from 'vue';
import type { BreadcrumbItemPart, BreadcrumbPart } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import type { ShowTooltip } from '../typography/interface';

export interface Route {
    [x: string]: unknown;
    name?: string;
    path?: string;
    href?: string;
    noLink?: boolean;
    separator?: string;
    key?: string | number;
}

export interface BreadcrumbItemInfo {
    name?: string;
    href?: string;
}

export interface ShowTooltipProps {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    /** The Tooltip of a truncated title; its content is the title itself. `class` and `style` land on the popup */
    opts?: ShowTooltip['opts'];
}

export type MoreType = 'default' | 'popover';

export type BreadcrumbClick = (item: BreadcrumbItemInfo | Route, event: MouseEvent) => void;

export interface BreadcrumbProps {
    activeIndex?: number;
    autoCollapse?: boolean;
    /** `item*` keys apply to every Breadcrumb.Item, before the item's own classNames */
    classNames?: Partial<Record<BreadcrumbPart, ClassValue>>;
    compact?: boolean;
    maxItemCount?: number;
    moreType?: MoreType;
    routes?: Array<Route | string>;
    /** Text separator; the `#separator` slot wins when both are given */
    separator?: string;
    showTooltip?: boolean | ShowTooltipProps;
    styles?: Partial<Record<BreadcrumbPart, StyleValue>>;
    /**
     * Receives the route for `routes`, or `{ name, href }` for Breadcrumb.Item children. A prop rather than an emit:
     * whether a handler exists decides if items without href are keyboard links. Written as `@click` as usual.
     */
    onClick?: BreadcrumbClick;
}

export interface BreadcrumbRouteSlotProps {
    route: Route;
    index: number;
}

export interface BreadcrumbMoreSlotProps {
    restItems: VNode[];
}

export interface BreadcrumbSlots {
    default?: () => VNode[];
    separator?: () => VNode[];
    item?: (props: BreadcrumbRouteSlotProps) => VNode[];
    icon?: (props: BreadcrumbRouteSlotProps) => VNode[];
    more?: (props: BreadcrumbMoreSlotProps) => VNode[];
}

export interface BreadcrumbItemProps {
    active?: boolean;
    /** Applied after the `item*` classNames of the parent Breadcrumb */
    classNames?: Partial<Record<BreadcrumbItemPart, ClassValue>>;
    href?: string;
    noLink?: boolean;
    route?: Route;
    separator?: string;
    shouldRenderSeparator?: boolean;
    styles?: Partial<Record<BreadcrumbItemPart, StyleValue>>;
    onClick?: BreadcrumbClick;
}

export interface BreadcrumbItemSlots {
    default?: () => VNode[];
    icon?: () => VNode[];
    separator?: () => VNode[];
}
