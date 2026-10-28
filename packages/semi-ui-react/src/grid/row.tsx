/**
 * Implementation reference from: https://github.com/ant-design/ant-design/blob/master/components/grid/row.tsx
 */
import type React from 'react';
import { cssClasses, type Breakpoint } from '@fibrae/semi-foundation/grid/constants';
import { gutterStyle, normalizeGutter, type Gutter } from '@fibrae/semi-foundation/grid/gutter';
import { getRowClassName } from '@fibrae/semi-foundation/grid/utils';
import '@fibrae/semi-foundation/grid/grid.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

export type { Breakpoint, Gutter };

export interface RowProps extends ElementProps<'div'> {
    type?: 'flex';
    align?: 'top' | 'middle' | 'bottom';
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    gutter?: Gutter | [Gutter, Gutter];
    prefixCls?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { prefixCls: cssClasses.PREFIX } satisfies Partial<RowProps>;

export default function Row(rawProps: RowProps) {
    const props = useDefaultProps('Row', rawProps, defaultProps);
    const { ref, prefixCls, type, justify, align, className, style, children, gutter = 0, ...rest } = props;

    const [horizontal, vertical] = normalizeGutter(gutter);
    const classes = getRowClassName(prefixCls, { type, justify, align }, className);

    const rowStyle = {
        ...gutterStyle('x', horizontal),
        ...gutterStyle('y', vertical),
        ...style,
    } as React.CSSProperties;

    return (
        <div {...rest} ref={ref} className={classes} style={rowStyle} x-semi-prop="children">
            {children}
        </div>
    );
}
