import type { Component, JSX } from 'solid-js';

export type IconSize = 'inherit' | 'extra-small' | 'small' | 'default' | 'large' | 'extra-large';

export type IconFill = string | string[];

export interface SvgProps extends Omit<JSX.SvgSVGAttributes<SVGSVGElement>, 'fill'> {
    fill?: IconFill;
}

export interface IconProps extends JSX.HTMLAttributes<HTMLSpanElement> {
    /** The svg to wrap; a component rather than an element, so Icon can hand it `fill` */
    svg?: Component<{ fill?: IconFill }>;
    size?: IconSize;
    spin?: boolean;
    rotate?: number;
    prefixCls?: string;
    type?: string;
    fill?: IconFill;
}
