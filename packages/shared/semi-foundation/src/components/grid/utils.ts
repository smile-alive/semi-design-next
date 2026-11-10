import clsx from 'clsx';
import { breakpoints } from './gutter';

export interface ColSize {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
}

export interface ColStyleProps extends ColSize {
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
}

const sizeKeys = ['span', 'offset', 'push', 'pull', 'order'] as const;

export function getColClassName(prefixCls: string, className?: string) {
    return clsx(`${prefixCls}-col`, className);
}

/**
 * Variables read back by grid.scss. The unsuffixed layer is `span` itself, which `xs` overrides, then each breakpoint
 * overrides the smaller ones. Every key, 0 included, is written when given: grid.scss falls through only on unset.
 */
export function getColStyle({ span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }: ColStyleProps): Record<`--${string}`, string> {
    const responsive = { xs, sm, md, lg, xl, xxl };
    const layers: [string, ColSize][] = [
        ['', { span, order, offset, push, pull }],
        ...breakpoints.map((bp): [string, ColSize] => {
            const size = responsive[bp];
            return [`-${bp}`, typeof size === 'number' ? { span: size } : (size ?? {})];
        }),
    ];
    // display has no numeric form, so a span of 0 is carried by its own variable, and each later span resets it
    const hides = layers.some(([, size]) => size.span === 0);
    const style: Record<`--${string}`, string> = {};
    for (const [suffix, size] of layers) {
        for (const key of sizeKeys) {
            if (size[key] !== undefined) {
                style[`--semi-col-${key}${suffix}`] = String(size[key]);
            }
        }
        if (hides && size.span !== undefined) {
            style[`--semi-col-display${suffix}`] = size.span === 0 ? 'none' : 'block';
        }
    }
    return style;
}

export interface RowClassProps {
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    align?: 'top' | 'middle' | 'bottom';
}

export function getRowClassName(prefixCls: string, { justify, align }: RowClassProps, className?: string) {
    const prefix = `${prefixCls}-row`;
    return clsx(
        prefix,
        {
            [`${prefix}-justify-${justify}`]: justify,
            [`${prefix}-align-${align}`]: align,
        },
        className
    );
}
