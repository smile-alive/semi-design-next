import { splitProps } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/components/grid/constants';
import { getColClassName, type ColSize } from '@fibrae/semi-foundation/components/grid/utils';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';

export type { ColSize };

export interface ColProps extends ElementProps<'div'> {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
}

export default function Col(rawProps: ColProps) {
    const props = useDefaultProps('Col', rawProps, {});
    const [local, rest] = splitProps(props, ['children', 'class', 'lg', 'md', 'offset', 'order', 'pull', 'push', 'sm', 'span', 'xl', 'xs', 'xxl']);

    return (
        <div {...rest} class={getColClassName(cssClasses.PREFIX, local, local.class)} x-semi-prop="children">
            {local.children}
        </div>
    );
}
