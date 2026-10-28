import { splitProps, type JSX } from 'solid-js';
import { cssClasses, type Breakpoint } from '@fibrae/semi-foundation/grid/constants';
import { gutterStyle, normalizeGutter, type Gutter } from '@fibrae/semi-foundation/grid/gutter';
import { getRowClassName } from '@fibrae/semi-foundation/grid/utils';
import '@fibrae/semi-foundation/grid/grid.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

export type { Breakpoint, Gutter };

export interface RowProps extends ElementProps<'div'> {
    type?: 'flex';
    align?: 'top' | 'middle' | 'bottom';
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    gutter?: Gutter | [Gutter, Gutter];
    prefixCls?: string;
}

const defaultProps = { prefixCls: cssClasses.PREFIX } satisfies Partial<RowProps>;

export default function Row(rawProps: RowProps) {
    const props = useDefaultProps('Row', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'gutter', 'justify', 'prefixCls', 'style', 'type']);

    // the consumer's style comes last so it can override a gutter variable
    const style = () => {
        const [horizontal, vertical] = normalizeGutter(local.gutter ?? 0);
        const gutter = { ...gutterStyle('x', horizontal), ...gutterStyle('y', vertical) };
        const own = local.style;
        if (typeof own === 'string') {
            const declarations = Object.entries(gutter).map(([name, value]) => `${name}: ${value}`);
            return [...declarations, own].join('; ');
        }
        return { ...gutter, ...own } as JSX.CSSProperties;
    };

    return (
        <div {...rest} class={getRowClassName(local.prefixCls, { type: local.type, justify: local.justify, align: local.align }, local.class)} style={style()} x-semi-prop="children">
            {local.children}
        </div>
    );
}
