import type { StyleValue, VNode } from 'vue';
import type { TooltipProps } from '../tooltip/interface';

/** A route of the `routes` prop. Nodes are slots: the icon is `#icon`, a custom title is `#item` */
export interface Route {
    [x: string]: unknown;
    name?: string;
    path?: string;
    href?: string;
    noLink?: boolean;
    separator?: string;
    key?: string | number;
}

/** What a click on an item written in the default slot reports: `name` is the item's text */
export interface BreadcrumbItemInfo {
    name?: string;
    href?: string;
}

export interface ShowTooltipProps {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    /** The Tooltip of a truncated title; its content is the title itself. `class` and `style` land on the popup */
    opts?: Partial<TooltipProps> & { class?: unknown; style?: StyleValue };
}

export type MoreType = 'default' | 'popover';

export type BreadcrumbClick = (item: BreadcrumbItemInfo | Route, event: MouseEvent) => void;

export interface BreadcrumbProps {
    activeIndex?: number;
    autoCollapse?: boolean;
    compact?: boolean;
    maxItemCount?: number;
    moreType?: MoreType;
    routes?: Array<Route | string>;
    /** Text separator; the `#separator` slot wins when both are given */
    separator?: string;
    showTooltip?: boolean | ShowTooltipProps;
    /**
     * Receives the route for `routes`, or `{ name, href }` for Breadcrumb.Item children. A prop rather than an emit:
     * whether a handler exists decides if items without href are keyboard links. Written as `@click` as usual.
     */
    onClick?: BreadcrumbClick;
}

export interface BreadcrumbRouteSlotProps {
    /** The route as passed in; a string route is `{ name }` */
    route: Route;
    index: number;
}

export interface BreadcrumbMoreSlotProps {
    /** The collapsed items, without their separators, ready for `<component :is>` */
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
    href?: string;
    noLink?: boolean;
    route?: Route;
    /** Text separator; the `#separator` slot wins when both are given */
    separator?: string;
    shouldRenderSeparator?: boolean;
    onClick?: BreadcrumbClick;
}

export interface BreadcrumbItemSlots {
    default?: () => VNode[];
    icon?: () => VNode[];
    separator?: () => VNode[];
}
