import React, { cloneElement, isValidElement, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { DEFAULT_TOOLTIP, cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
import BreadcrumbFoundation, { type BreadcrumbAdapter } from '@fibrae/semi-foundation/breadcrumb/foundation';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/breadcrumb/breadcrumb.scss';
import { IconMore } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import elementTypeOf from '../_base/element-type';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import type { TooltipProps } from '../tooltip';
import { BreadContext, type BreadContextType } from './bread-context';
import BreadcrumbItem, { type BreadcrumbItemInfo, type BreadcrumbItemProps, type RouteProps } from './item';

const clsPrefix = cssClasses.PREFIX;

export type { RouteProps, BreadcrumbItemProps, BreadcrumbItemInfo } from './item';
export interface showToolTipProps {
    width?: string | number;
    ellipsisPos?: 'end' | 'middle';
    opts?: TooltipProps;
}

export type MoreType = 'default' | 'popover';

export interface BreadcrumbProps extends BaseProps, ElementProps<'nav', 'onClick'> {
    routes?: Array<RouteProps | string>;
    /** Receives the route for `routes`, or `{ name: children, href }` for Breadcrumb.Item children */
    onClick?: (route: BreadcrumbItemInfo | RouteProps, event: React.MouseEvent) => void;
    separator?: React.ReactNode;
    compact?: boolean;
    style?: React.CSSProperties;
    renderItem?: (route: RouteProps) => React.ReactNode;
    className?: string;
    showTooltip?: boolean | showToolTipProps;
    maxItemCount?: number;
    autoCollapse?: boolean;
    /* Customize the contents of the ellipsis area */
    renderMore?: (restItem: Array<React.ReactNode>) => React.ReactNode;
    /* Style type for ellipsis area */
    moreType?: MoreType;
    'aria-label'?: React.AriaAttributes['aria-label'];
    activeIndex?: number;
    /** Attached to the nav */
    ref?: React.Ref<HTMLElement>;
}

interface BreadcrumbState {
    isCollapsed: boolean;
}

const defaultProps = {
    routes: [],
    separator: '/',
    compact: true,
    showTooltip: DEFAULT_TOOLTIP,
    autoCollapse: true,
    moreType: 'default',
    maxItemCount: 4,
} satisfies Partial<BreadcrumbProps>;

function Breadcrumb(rawProps: BreadcrumbProps) {
    const props = useDefaultProps('Breadcrumb', rawProps, defaultProps);
    const { ref, routes, onClick, separator, compact, renderItem, className, showTooltip, maxItemCount, autoCollapse, renderMore, moreType, activeIndex, children, 'aria-label': ariaLabel, ...rest } = props;

    const { locale } = useLocale('Breadcrumb');

    const navRef = useRef<HTMLElement>(null);
    let template: React.ReactNode[];

    const [foundation, state] = useFoundation<BreadcrumbFoundation<BreadcrumbProps, BreadcrumbState, React.MouseEvent>, BreadcrumbAdapter<BreadcrumbProps, BreadcrumbState, React.MouseEvent>, BreadcrumbProps, BreadcrumbState>(
        BreadcrumbFoundation,
        props,
        () => ({ isCollapsed: true }),
        (base) => ({
            // named parameters: a rest parameter makes the Oxc React Compiler skip the whole component
            notifyClick: (info, e) => base.getProps().onClick?.(info, e),
            expandCollapsed: () => base.setState({ isCollapsed: false }),
        })
    );

    const mergedRef = useMergedRef(ref, navRef);

    const context = useMemo<BreadContextType>(
        () => ({
            onClick: (info, e) => foundation.handleClick(info, e),
            hasOnClick: Boolean(onClick),
            showTooltip,
            compact,
            separator,
        }),
        [foundation, onClick, showTooltip, compact, separator]
    );

    const routeItems = routes?.length > 0 ? BreadcrumbFoundation.genRoutes(routes) : null;
    const childItems: React.ReactNode[] = routeItems ? [] : flattenChildren(children);
    const itemLength = routeItems ? routeItems.length : childItems.length;
    const { start: restStart, end: restEnd } = BreadcrumbFoundation.getCollapseRange(itemLength, maxItemCount, activeIndex);

    // Expanding removes the more button, which held focus: the first item it hid takes over, else the nav itself
    const handoverFocus = useFocusHandover<HTMLSpanElement>(() => {
        const nav = navRef.current;
        const target = nav?.children[restStart]?.querySelector<HTMLElement>('a[href], [tabindex]:not([tabindex="-1"])');
        if (target) {
            return target;
        }
        if (nav) {
            nav.tabIndex = -1;
        }
        return nav;
    });

    const restItemLength = restEnd - restStart + 1;
    const shouldCollapse = autoCollapse && restItemLength > 0 && state.isCollapsed;
    const hasRenderMore = typeof renderMore === 'function';
    const collapse = { collapsed: shouldCollapse, start: restStart, end: restEnd, hasCustomMore: hasRenderMore, moreType };

    const hasSeparator = (idx: number) => BreadcrumbFoundation.shouldRenderSeparator(idx, itemLength, collapse);

    const isActive = (idx: number) => BreadcrumbFoundation.isActive(idx, itemLength, activeIndex);

    if (routeItems) {
        template = routeItems.map((route, idx) => (
            // only the Item props a route may set, and its data-*, so other route fields stay off the DOM
            <BreadcrumbItem {...getDataAttr(route)} key={route._origin.key || `item-${route.name || route.path}-${idx}`} active={isActive(idx)} href={route.href} noLink={route.noLink} route={route._origin} separator={route.separator} shouldRenderSeparator={hasSeparator(idx)} icon={route.icon} onClick={route.onClick}>
                {renderItem ? renderItem(route._origin) : route.name}
            </BreadcrumbItem>
        ));
    } else {
        template = childItems.map((item, idx) => {
            const isItem = isValidElement<BreadcrumbItemProps>(item) && elementTypeOf(item) === 'Breadcrumb.Item';
            warning(isValidElement(item) && !isItem, '[Semi Breadcrumb]: Only accepts Breadcrumb.Item as its children');
            if (!isItem) {
                return item;
            }
            // flattenChildren already keyed the element from the caller's key
            return cloneElement(item, {
                active: isActive(idx),
                shouldRenderSeparator: hasSeparator(idx),
            });
        });
    }

    if (shouldCollapse) {
        const restItem = template.slice(restStart, restEnd + 1);
        let more: React.ReactNode;
        if (hasRenderMore) {
            more = renderMore(restItem);
        } else if (moreType === 'default') {
            more = <IconMore />;
        } else if (moreType === 'popover') {
            more = (
                <Popover
                    style={{ padding: 12 }}
                    content={restItem.map((item, idx) => (
                        <React.Fragment key={`restItem-${idx}`}>
                            {item}
                            {idx !== restItem.length - 1 && <span className={`${clsPrefix}-restItem`}>{separator}</span>}
                        </React.Fragment>
                    ))}
                    showArrow
                >
                    {/* the more button around it is the Tab stop and expands every item; Popover would add 0 here */}
                    <IconMore tabIndex={-1} />
                </Popover>
            );
        }
        const spread = (
            <span key={`more-${itemLength}`} ref={handoverFocus} className={`${clsPrefix}-collapse`}>
                <span className={`${clsPrefix}-item-wrap`}>
                    <span className={`${clsPrefix}-item ${clsPrefix}-item-more`} aria-label={locale.expand} role="button" tabIndex={0} onClick={(e) => foundation.handleExpand(e)} onKeyDown={(e) => foundation.handleExpandKeyDown(e)}>
                        {more}
                    </span>
                    <span className={`${clsPrefix}-separator`} x-semi-prop="separator">
                        {separator}
                    </span>
                </span>
            </span>
        );
        template = template.toSpliced(restStart, restItemLength, spread);
    }

    return (
        <BreadContext value={context}>
            <nav
                {...rest}
                ref={mergedRef}
                className={clsx(className, `${clsPrefix}-wrapper`, {
                    [`${clsPrefix}-wrapper-compact`]: compact,
                    [`${clsPrefix}-wrapper-loose`]: !compact,
                })}
                aria-label={ariaLabel ?? locale.label}
            >
                {template}
            </nav>
        </BreadContext>
    );
}

export default Object.assign(Breadcrumb, { Item: BreadcrumbItem });
