import { splitProps, type JSX } from 'solid-js';
import { cssClasses, type Breakpoint } from '@fibrae/semi-foundation/components/grid/constants';
import { gutterStyle, normalizeGutter, type Gutter } from '@fibrae/semi-foundation/components/grid/gutter';
import { getRowClassName } from '@fibrae/semi-foundation/components/grid/utils';
import '@fibrae/semi-foundation/components/grid/grid.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';

export type { Breakpoint, Gutter };

export interface RowProps extends ElementProps<'div'> {
    align?: 'top' | 'middle' | 'bottom';
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    gutter?: Gutter | [Gutter, Gutter];
}

export default function Row(rawProps: RowProps) {
    const props = useDefaultProps('Row', rawProps, {});
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'gutter', 'justify', 'style']);

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
        <div {...rest} class={getRowClassName(cssClasses.PREFIX, { justify: local.justify, align: local.align }, local.class)} style={style()} x-semi-prop="children">
            {local.children}
        </div>
    );
}
