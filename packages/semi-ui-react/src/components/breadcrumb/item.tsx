import React, { cloneElement, isValidElement, memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type BreadcrumbItemPart } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter, type Route, type BreadcrumbItemInfo as BaseBreadcrumbItemInfo } from '@fibrae/semi-foundation/components/breadcrumb/item-foundation';
import { type ElementProps, type BaseProps, useFoundation } from '../../base/index';
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
    /** Applied after the `item*` classNames of the parent Breadcrumb */
    classNames?: Partial<Record<BreadcrumbItemPart, string>>;
    styles?: Partial<Record<BreadcrumbItemPart, React.CSSProperties>>;
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
    const { ref, onClick, icon, href, separator, noLink, active, shouldRenderSeparator = true, route, children, className, style, classNames, styles, ...rest } = props as BreadcrumbItemInternalProps;

    const context = useBreadContext();

    let inner: React.ReactNode;

    const { classNames: parentClassNames, styles: parentStyles } = context;

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

    let iconNode = fitNavIcon(icon, compact ? 'small' : 'default', clsx(`${clsPrefix}-item-icon`, parentClassNames?.itemIcon, classNames?.icon));

    const hasHref = href != null;
    const itemInfo: BreadcrumbItemInfo = route ?? { name: children, ...(hasHref && { href }) };

    if ((parentStyles?.itemIcon || styles?.icon) && isValidElement<{ style?: React.CSSProperties }>(iconNode)) {
        iconNode = cloneElement(iconNode, { style: { ...iconNode.props.style, ...parentStyles?.itemIcon, ...styles?.icon } });
    }

    const titleCls = clsx(`${clsPrefix}-item-title`, parentClassNames?.itemTitle, classNames?.title);
    const titleStyle = { ...parentStyles?.itemTitle, ...styles?.title };

    if (typeof children === 'number' || (children && typeof children === 'string')) {
        const { showTooltip } = context;
        const tooltip = BreadcrumbItemFoundation.getTooltipConfig(showTooltip);
        inner = (
            <>
                {iconNode}
                <span className={titleCls} style={titleStyle}>
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
                {children != null && children !== false && children !== '' && (
                    <span className={clsx(titleCls, `${clsPrefix}-item-title-inline`)} style={titleStyle}>
                        {children}
                    </span>
                )}
            </>
        );
    }

    const itemCls = clsx(
        `${clsPrefix}-item`,
        {
            [`${clsPrefix}-item-active`]: active,
            [`${clsPrefix}-item-link`]: !noLink,
        },
        parentClassNames?.itemLink,
        classNames?.link
    );

    const linkStyle = { ...parentStyles?.itemLink, ...styles?.link };
    const isKeyboardLink = BreadcrumbItemFoundation.isKeyboardLink({ active, hasHref, noLink, hasOnClick: Boolean(onClick) || context.hasOnClick });

    const handleClick = (e: React.MouseEvent) => foundation.handleClick(itemInfo, e);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => foundation.handleKeyDown(e, isKeyboardLink);

    const item =
        active || !hasHref ? (
            <span className={itemCls} style={linkStyle} role={isKeyboardLink ? 'link' : undefined} tabIndex={isKeyboardLink ? 0 : undefined} onClick={handleClick} onKeyDown={handleKeyDown}>
                {inner}
            </span>
        ) : (
            <a className={itemCls} style={linkStyle} href={href} onClick={handleClick}>
                {inner}
            </a>
        );

    return (
        <li {...rest} ref={ref} className={clsx(`${clsPrefix}-item-wrap`, parentClassNames?.item, className)} style={{ ...parentStyles?.item, ...style }} aria-current={active ? 'page' : undefined}>
            {item}
            {shouldRenderSeparator &&
                (separator || (
                    <span className={clsx(`${clsPrefix}-separator`, parentClassNames?.separator, classNames?.separator)} style={{ ...parentStyles?.separator, ...styles?.separator }}>
                        {context.separator}
                    </span>
                ))}
        </li>
    );
}

export default Object.assign(memo(BreadcrumbItem), { elementType: 'Breadcrumb.Item' });
