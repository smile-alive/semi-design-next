import type { JSX } from 'solid-js';
import type { BreadcrumbItemInfo as BaseBreadcrumbItemInfo, Route } from '@fibrae/semi-foundation/breadcrumb/item-foundation';
import type { ElementProps } from '../_base/element-props';
import type { TooltipProps } from '../tooltip';

export interface showToolTipProps {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    opts?: TooltipProps;
}

export type MoreType = 'default' | 'popover';

/** What a click on an item written as children reports: the children become `name` */
export interface BreadcrumbItemInfo extends BaseBreadcrumbItemInfo {
    name?: JSX.Element;
}

/** A route of `routes`: data only, its icon comes from `renderIcon` and a custom title from `renderItem` */
export interface RouteProps extends Omit<Route, 'icon' | 'name' | 'separator'> {
    name?: string;
    separator?: string;
    onClick?: (item: BreadcrumbItemInfo | RouteProps, e: MouseEvent) => void;
}

export interface BreadcrumbItemProps extends ElementProps<'span', 'onClick'> {
    icon?: JSX.Element;
    href?: string;
    separator?: JSX.Element;
    noLink?: boolean;
    onClick?: (item: BreadcrumbItemInfo | RouteProps, e: MouseEvent) => void;
}

/** What the Breadcrumb adds to the props an item was written with */
export interface BreadcrumbItemViewProps extends BreadcrumbItemProps {
    active?: boolean;
    shouldRenderSeparator?: boolean;
    route?: RouteProps;
}

export interface BreadcrumbProps extends ElementProps<'nav', 'onClick'> {
    routes?: Array<RouteProps | string>;
    /** Receives the route for `routes`, or `{ name: children, href }` for Breadcrumb.Item children */
    onClick?: (route: BreadcrumbItemInfo | RouteProps, event: MouseEvent) => void;
    separator?: JSX.Element;
    compact?: boolean;
    renderItem?: (route: RouteProps) => JSX.Element;
    /** The icon of an item of `routes`; `index` counts all items, including the collapsed ones */
    renderIcon?: (route: RouteProps, index: number) => JSX.Element;
    showTooltip?: boolean | showToolTipProps;
    maxItemCount?: number;
    autoCollapse?: boolean;
    /** Customizes the content of the ellipsis area; receives the hidden routes, or the props of the hidden Breadcrumb.Item children */
    renderMore?: (restItems: Array<RouteProps | BreadcrumbItemProps>) => JSX.Element;
    /** Style type for the ellipsis area */
    moreType?: MoreType;
    activeIndex?: number;
}
