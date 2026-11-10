/**
 * Implementation reference from: https://github.com/ant-design/ant-design/blob/master/components/grid/col.tsx
 */
import type React from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/grid/constants';
import { getColClassName, getColStyle, type ColSize } from '@fibrae/semi-foundation/components/grid/utils';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';

export type { ColSize };

export interface ColProps extends ElementProps<'div'> {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function Col(rawProps: ColProps) {
    const { ref, span, order, offset, push, pull, className, style, children, xs, sm, md, lg, xl, xxl, ...rest } = useDefaultProps('Col', rawProps, {});

    const colStyle = { ...getColStyle({ span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }), ...style };

    return (
        <div {...rest} ref={ref} className={getColClassName(cssClasses.PREFIX, className)} style={colStyle} x-semi-prop="children">
            {children}
        </div>
    );
}
