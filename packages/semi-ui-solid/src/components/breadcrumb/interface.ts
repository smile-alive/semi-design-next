import type { JSX } from 'solid-js';
import type { BreadcrumbItemInfo as BaseBreadcrumbItemInfo, Route } from '@fibrae/semi-foundation/components/breadcrumb/item-foundation';
import type { ElementProps } from '../../base/element-props';
import type { TooltipProps } from '../tooltip';

export interface ShowTooltipProps {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    opts?: TooltipProps;
}

export type MoreType = 'default' | 'popover';

export interface BreadcrumbItemInfo extends BaseBreadcrumbItemInfo {
    name?: JSX.Element;
}

/** A route of `routes`: data only, its icon comes from `renderIcon` and a custom title from `renderItem` */
export interface RouteProps extends Omit<Route, 'icon' | 'name' | 'separator'> {
    name?: string;
    separator?: string;
    onClick?: (item: BreadcrumbItemInfo | RouteProps, e: MouseEvent) => void;
}

export interface BreadcrumbItemProps extends ElementProps<'li', 'onClick'> {
    icon?: JSX.Element;
    href?: string;
    separator?: JSX.Element;
    noLink?: boolean;
    onClick?: (item: BreadcrumbItemInfo | RouteProps, e: MouseEvent) => void;
}

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
    showTooltip?: boolean | ShowTooltipProps;
    maxItemCount?: number;
    autoCollapse?: boolean;
    /** Customizes the content of the ellipsis area; receives the hidden routes, or the props of the hidden Breadcrumb.Item children */
    renderMore?: (restItems: Array<RouteProps | BreadcrumbItemProps>) => JSX.Element;
    moreType?: MoreType;
    activeIndex?: number;
}
