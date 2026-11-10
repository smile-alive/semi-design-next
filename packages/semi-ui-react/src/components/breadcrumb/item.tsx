import React, { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter, type Route, type BreadcrumbItemInfo as BaseBreadcrumbItemInfo } from '@fibrae/semi-foundation/components/breadcrumb/item-foundation';
import type { ElementProps } from '../../base/base';
import type { BaseProps } from '../../base/base-props';
import useFoundation from '../../base/use-foundation';
import { fitNavIcon } from '../navigation/nav-icon';
import Typography, { type ShowTooltip } from '../typography';
import { type BreadContextType, useBreadContext } from './context';

type Foundation = BreadcrumbItemFoundation<BreadcrumbItemProps, React.MouseEvent>;
type Adapter = BreadcrumbItemAdapter<BreadcrumbItemProps, React.MouseEvent>;

const clsPrefix = cssClasses.PREFIX;

/** What a click on an item written as children reports: the children become `name` */
export interface BreadcrumbItemInfo extends BaseBreadcrumbItemInfo {
    name?: React.ReactNode;
}

export interface RouteProps extends Route {
    icon?: React.ReactNode;
}
export interface BreadcrumbItemProps extends BaseProps, ElementProps<'li', 'onClick'> {
    onClick?: (item: BreadcrumbItemInfo | RouteProps, e: React.MouseEvent) => void;
    icon?: React.ReactNode;
    href?: string;
    separator?: React.ReactNode;
    noLink?: boolean;
    /** Attached to the item's li */
    ref?: React.Ref<HTMLLIElement>;
}

/** Set by Breadcrumb, kept out of the public BreadcrumbItemProps */
export interface BreadcrumbItemInternalProps extends BreadcrumbItemProps {
    active?: boolean;
    shouldRenderSeparator?: boolean;
    route?: RouteProps;
}

function BreadcrumbItem(props: BreadcrumbItemProps) {
    const { ref, onClick, icon, href, separator, noLink, active, shouldRenderSeparator = true, route, children, className, ...rest } = props as BreadcrumbItemInternalProps;

    const context = useBreadContext();

    let inner: React.ReactNode;

    const [foundation] = useFoundation<Foundation, Adapter, BreadcrumbItemProps, object, BreadContextType>(
        BreadcrumbItemFoundation,
        props,
        () => ({}),
        (base) => ({
            // named parameters: a rest parameter makes the Oxc React Compiler skip the whole component
            notifyClick: (item, e) => base.getProps().onClick?.(item, e),
            notifyParent: (item, e) => base.getContext('onClick')?.(item, e),
        }),
        context
    );

    const { compact } = context;
    const hasHref = href != null;
    const itemInfo: BreadcrumbItemInfo = route ?? { name: children, ...(hasHref && { href }) };
    const iconNode = fitNavIcon(icon, compact ? 'small' : 'default', `${clsPrefix}-item-icon`);

    if (typeof children === 'number' || (children && typeof children === 'string')) {
        const { showTooltip } = context;
        const tooltip = BreadcrumbItemFoundation.getTooltipConfig(showTooltip);
        inner = (
            <>
                {iconNode}
                <span className={`${clsPrefix}-item-title`}>
                    <Typography.Text
                        style={{ maxWidth: tooltip.width }}
                        ellipsis={{
                            // Breadcrumb documents opts as TooltipProps; Typography types them as Popover & Tooltip
                            showTooltip: tooltip.opts ? { opts: tooltip.opts as ShowTooltip['opts'] } : false,
                            pos: tooltip.ellipsisPos,
                        }}
                        size={compact ? 'small' : 'normal'}
                    >
                        {children}
                    </Typography.Text>
                </span>
            </>
        );
    } else {
        inner = (
            <>
                {iconNode}
                {children != null && children !== false && children !== '' && <span className={`${clsPrefix}-item-title ${clsPrefix}-item-title-inline`}>{children}</span>}
            </>
        );
    }

    const itemCls = clsx(`${clsPrefix}-item`, {
        [`${clsPrefix}-item-active`]: active,
        [`${clsPrefix}-item-link`]: !noLink,
    });

    const isKeyboardLink = BreadcrumbItemFoundation.isKeyboardLink({ active, hasHref, noLink, hasOnClick: Boolean(onClick) || context.hasOnClick });

    const handleClick = (e: React.MouseEvent) => foundation.handleClick(itemInfo, e);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => foundation.handleKeyDown(e, isKeyboardLink);

    const item =
        active || !hasHref ? (
            <span className={itemCls} role={isKeyboardLink ? 'link' : undefined} tabIndex={isKeyboardLink ? 0 : undefined} onClick={handleClick} onKeyDown={handleKeyDown}>
                {inner}
            </span>
        ) : (
            <a className={itemCls} href={href} onClick={handleClick}>
                {inner}
            </a>
        );

    return (
        <li {...rest} ref={ref} className={clsx(`${clsPrefix}-item-wrap`, className)} aria-current={active ? 'page' : undefined}>
            {item}
            {shouldRenderSeparator && (separator || <span className={`${clsPrefix}-separator`}>{context.separator}</span>)}
        </li>
    );
}

export default Object.assign(memo(BreadcrumbItem), { elementType: 'Breadcrumb.Item' });
