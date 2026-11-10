import type React from 'react';
import { Children, isValidElement, useLayoutEffect, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/anchor/constants';
import AnchorFoundation, { type AnchorNode } from '@fibrae/semi-foundation/components/anchor/foundation';
import { isEnterPress } from '@fibrae/semi-foundation/utils';
import type { ElementProps } from '../../base/index';
import Typography from '../typography/index';
import { AnchorContext, useAnchorContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface LinkProps extends ElementProps<'div', 'title'> {
    href?: string;
    title?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    disabled?: boolean;
    /** Attached to the link's list item div */
    ref?: React.Ref<HTMLDivElement>;
}

// Collapsed links are not mounted and cannot register: the links nested in the element tree stand in for them
function normalizeChildren(children: React.ReactNode): AnchorNode[] {
    return Children.toArray(children).flatMap((child) => {
        if (!isValidElement<{ href?: string; children?: React.ReactNode }>(child)) {
            return [];
        }
        return [{ href: child.props.href, children: normalizeChildren(child.props.children) }];
    });
}

export default function Link({ ref, href = '#', title = '', className, children, style, disabled = false, ...rest }: LinkProps) {
    const context = useAnchorContext('Anchor.Link');

    let titleNode = title;

    const { activeLink, showTooltip, position, size, childMap, autoCollapse, onClick, addLink, removeLink, level, parentHref } = context;
    const active = activeLink === href;
    const nestedLinks = useMemo(() => AnchorFoundation.getChildMap([{ href, children: normalizeChildren(children) }])[href], [href, children]);

    const handleClick = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        if (!disabled) {
            onClick(e, href);
        }
    };

    // layout phase: Anchor's mount work reads the registered links
    useLayoutEffect(() => {
        addLink(href, parentHref);
        return () => removeLink(href);
    }, [addLink, removeLink, href, parentHref]);

    if (showTooltip) {
        const tooltip = typeof showTooltip === 'object' ? showTooltip : {};
        const opts = position ? { ...tooltip.opts, position } : { ...tooltip.opts };
        titleNode = (
            <Typography.Text
                type="tertiary"
                className={clsx(`${prefixCls}-link-tooltip`, {
                    [`${prefixCls}-link-tooltip-small`]: size === 'small',
                    [`${prefixCls}-link-tooltip-active`]: active,
                    [`${prefixCls}-link-tooltip-disabled`]: disabled,
                })}
                // the link title is the Tab stop; the ellipsis Tooltip would add another
                tabIndex={-1}
                ellipsis={{ showTooltip: { ...tooltip, opts } }}
                size={size === 'default' ? 'normal' : 'small'}
            >
                {title}
            </Typography.Text>
        );
    }

    const expanded = !autoCollapse || active || nestedLinks.has(activeLink) || childMap[href]?.has(activeLink);

    return (
        <div {...rest} ref={ref} className={clsx(`${prefixCls}-link`, className)} style={style} role="listitem">
            <div
                className={clsx(`${prefixCls}-link-title`, {
                    [cssClasses.LINK_TITLE_ACTIVE]: active,
                    [`${prefixCls}-link-title-disabled`]: disabled,
                })}
                style={{ paddingInlineStart: 8 * level }}
                aria-current={active ? 'location' : undefined}
                aria-disabled={disabled}
                role="link"
                tabIndex={0}
                title={(!showTooltip && typeof title === 'string' && title) || undefined}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (isEnterPress(e)) {
                        // else the same Enter also presses a button that onClick moved focus to
                        e.preventDefault();
                        handleClick(e);
                    }
                }}
            >
                {titleNode}
            </div>
            {expanded && (
                <AnchorContext value={{ ...context, level: level + 1, parentHref: href }}>
                    <div role="list">{children}</div>
                </AnchorContext>
            )}
        </div>
    );
}
