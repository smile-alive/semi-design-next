import type React from 'react';
import { useLayoutEffect } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/anchor/constants';
import isEnterPress from '@fibrae/semi-foundation/utils/is-enter-press';
import type { ElementProps } from '../_base/base';
import Typography from '../typography/index';
import { AnchorContext, useAnchorContext } from './anchor-context';

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

export default function Link({ ref, href = '#', title = '', className, children, style, disabled = false, ...rest }: LinkProps) {
    const context = useAnchorContext('Anchor.Link');

    let titleNode = title;

    const { activeLink, showTooltip, position, size, childMap, autoCollapse, onClick, addLink, removeLink, level } = context;
    const active = activeLink === href;

    const handleClick = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        if (!disabled) {
            onClick(e, href);
        }
    };

    // layout phase: Anchor's mount work reads the registered links
    useLayoutEffect(() => {
        addLink(href);
        return () => removeLink(href);
    }, [addLink, removeLink, href]);

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

    const expanded = !autoCollapse || active || childMap[href]?.has(activeLink);

    return (
        <div {...rest} ref={ref} className={clsx(`${prefixCls}-link`, className)} style={style} role="listitem">
            <div
                className={clsx(`${prefixCls}-link-title`, {
                    [`${prefixCls}-link-title-active`]: active,
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
                <AnchorContext value={{ ...context, level: level + 1 }}>
                    <div role="list">{children}</div>
                </AnchorContext>
            )}
        </div>
    );
}
