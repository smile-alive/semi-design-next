import React, { type ReactNode, type DetailedHTMLProps, type ComponentType } from 'react';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '../env';
import '@fibrae/semi-icons-core/styles/icons.scss';

export type IconSize = 'inherit' | 'extra-small' | 'small' | 'default' | 'large' | 'extra-large';

export interface IconProps extends DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
    svg: ReactNode;
    size?: IconSize;
    spin?: boolean;
    rotate?: number;
    prefixCls?: string;
    type?: string;
    fill?: string | string[];
}

function Icon({ svg, spin = false, rotate, style, className, prefixCls = BASE_CLASS_PREFIX, type, size = 'default', fill, ...props }: IconProps) {
    const classes = clsx(
        `${prefixCls}-icon`,
        {
            [`${prefixCls}-icon-extra-small`]: size === 'extra-small', // 8x8
            [`${prefixCls}-icon-small`]: size === 'small', // 12x12
            [`${prefixCls}-icon-default`]: size === 'default', // 16x16
            [`${prefixCls}-icon-large`]: size === 'large', // 20x20
            [`${prefixCls}-icon-extra-large`]: size === 'extra-large', // 24x24
            [`${prefixCls}-icon-spinning`]: spin === true,
            [`${prefixCls}-icon-${type}`]: Boolean(type),
        },
        className
    );
    // Decorative unless named (the type is no screen-reader name); a focusable icon stays exposed, since hiding it
    // leaves a silent tab stop and a11y checks flag it so the caller adds an aria-label
    const exposed = Boolean(props['aria-label'] || props['aria-labelledby']) || Number(props.tabIndex) >= 0;
    return (
        <span
            role={exposed ? 'img' : undefined}
            aria-hidden={exposed ? undefined : true}
            className={classes}
            style={{
                ...(Number.isSafeInteger(rotate) && { transform: `rotate(${rotate}deg)` }),
                ...style,
            }}
            {...props}
        >
            {fill ? React.cloneElement(svg as React.ReactElement, { fill } as any) : svg}
        </span>
    );
}

export function convertIcon(Svg: ComponentType, iconType: string) {
    const InnerIcon = (props: Omit<IconProps, 'svg' | 'type'>) => <Icon svg={React.createElement(Svg)} type={iconType} {...props} />;
    // elementType lets semi-ui-react recognise a builtin icon
    return Object.assign(InnerIcon, { elementType: 'Icon' });
}

// elementType lets semi-ui-react recognise a custom icon built on Icon
export default Object.assign(Icon, { elementType: 'Icon' });
