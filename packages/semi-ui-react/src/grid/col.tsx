/**
 * Implementation reference from: https://github.com/ant-design/ant-design/blob/master/components/grid/col.tsx
 */
import type React from 'react';
import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
import { getColClassName, type ColSize } from '@fibrae/semi-foundation/grid/utils';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

export type { ColSize };

export interface ColProps extends ElementProps<'div'> {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
    className?: string;
    prefixCls?: string;
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

const defaultProps = { prefixCls: cssClasses.PREFIX } satisfies Partial<ColProps>;

export default function Col(rawProps: ColProps) {
    const props = useDefaultProps('Col', rawProps, defaultProps);
    const { ref, prefixCls, span, order, offset, push, pull, className, style, children, xs, sm, md, lg, xl, xxl, ...rest } = props;

    const classes = getColClassName(prefixCls, { span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }, className);

    return (
        <div {...rest} ref={ref} className={classes} style={style} x-semi-prop="children">
            {children}
        </div>
    );
}
