import { splitProps } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
import { getColClassName, type ColSize } from '@fibrae/semi-foundation/grid/utils';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

export type { ColSize };

export interface ColProps extends ElementProps<'div'> {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
    prefixCls?: string;
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
}

const defaultProps = { prefixCls: cssClasses.PREFIX } satisfies Partial<ColProps>;

export default function Col(rawProps: ColProps) {
    const props = useDefaultProps('Col', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'lg', 'md', 'offset', 'order', 'prefixCls', 'pull', 'push', 'sm', 'span', 'xl', 'xs', 'xxl']);

    return (
        <div {...rest} class={getColClassName(local.prefixCls, local, local.class)} x-semi-prop="children">
            {local.children}
        </div>
    );
}
