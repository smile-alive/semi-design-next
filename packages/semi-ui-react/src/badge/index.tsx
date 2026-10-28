import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/badge/constants';
import '@fibrae/semi-foundation/badge/badge.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import { useConfigContext } from '../config-provider/context';

const prefixCls = cssClasses.PREFIX;

export type BadgeType = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success';
export type BadgeTheme = 'solid' | 'light' | 'inverted';
export type BadgePosition = 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';

export interface BadgeProps extends ElementProps<'span'> {
    count?: React.ReactNode;
    dot?: boolean;
    type?: BadgeType;
    theme?: BadgeTheme;
    position?: BadgePosition;
    overflowCount?: number;
    style?: React.CSSProperties;
    className?: string;
    onMouseEnter?: (e: React.MouseEvent) => any;
    onMouseLeave?: (e: React.MouseEvent) => any;
    onClick?: (e: React.MouseEvent) => any;
    children?: React.ReactNode;
    countClassName?: string;
    countStyle?: React.CSSProperties;
    /** Attached to the root element */
    ref?: React.Ref<HTMLSpanElement>;
}

const defaultProps = {
    dot: false,
    type: 'primary',
    theme: 'solid',
} satisfies Partial<BadgeProps>;

function Badge(rawProps: BadgeProps) {
    const { ref, count, dot, type, theme, position, overflowCount, style, children, className, countClassName, countStyle, ...rest } = useDefaultProps('Badge', rawProps, defaultProps);

    const { direction } = useConfigContext();

    let content;

    const badgePosition = position === undefined ? (direction === 'rtl' ? 'leftTop' : 'rightTop') : position;
    const custom = count && !(typeof count === 'number' || typeof count === 'string');
    const showBadge = count != null;

    const wrapper = clsx(countClassName, {
        [`${prefixCls}-${type}`]: !custom,
        [`${prefixCls}-${theme}`]: !custom,
        [`${prefixCls}-${badgePosition}`]: Boolean(badgePosition) && Boolean(children),
        [`${prefixCls}-block`]: !children,
        [`${prefixCls}-dot`]: dot,
        [`${prefixCls}-count`]: !dot && !custom && showBadge,
        [`${prefixCls}-custom`]: custom,
    });

    if (typeof count === 'number') {
        content = overflowCount && overflowCount < count ? `${overflowCount}+` : `${count}`;
    } else {
        content = count;
    }

    return (
        <span {...rest} ref={ref} className={clsx(prefixCls, className)}>
            {children}
            <span className={wrapper} style={style || countStyle} x-semi-prop="count">
                {!dot && content}
            </span>
        </span>
    );
}

export default memo(Badge);
