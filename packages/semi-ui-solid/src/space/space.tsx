import { splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/space/constants';
import '@fibrae/semi-foundation/space/space.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export type Align = 'start' | 'center' | 'end' | 'baseline';
export type Spacing = 'loose' | 'medium' | 'tight' | number;

export interface SpaceProps extends ElementProps<'div'> {
    wrap?: boolean;
    align?: Align;
    vertical?: boolean;
    spacing?: Spacing | [Spacing, Spacing];
}

const defaultProps = {
    vertical: false,
    wrap: false,
    spacing: 'tight',
    align: 'center',
} satisfies Partial<SpaceProps>;

export default function Space(rawProps: SpaceProps) {
    const props = useDefaultProps('Space', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'spacing', 'style', 'vertical', 'wrap']);

    const axes = () => {
        const [horizontal, vertical] = Array.isArray(local.spacing) ? local.spacing : [local.spacing, local.spacing];
        return { horizontal, vertical };
    };

    // the consumer's style comes last so it can override a gap
    const style = () => {
        const { horizontal, vertical } = axes();
        const gap: Record<string, string> = {};
        if (typeof horizontal === 'number') {
            gap['column-gap'] = `${horizontal}px`;
        }
        if (typeof vertical === 'number') {
            gap['row-gap'] = `${vertical}px`;
        }
        const own = local.style;
        if (typeof own === 'string') {
            const declarations = Object.entries(gap).map(([name, value]) => `${name}: ${value}`);
            return [...declarations, own].join('; ');
        }
        return { ...gap, ...own } as JSX.CSSProperties;
    };

    return (
        <div
            {...rest}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-align-${local.align}`]: local.align,
                [`${prefixCls}-vertical`]: local.vertical,
                [`${prefixCls}-horizontal`]: !local.vertical,
                [`${prefixCls}-wrap`]: local.wrap && !local.vertical,
                [`${prefixCls}-tight-horizontal`]: axes().horizontal === strings.SPACING_TIGHT,
                [`${prefixCls}-tight-vertical`]: axes().vertical === strings.SPACING_TIGHT,
                [`${prefixCls}-medium-horizontal`]: axes().horizontal === strings.SPACING_MEDIUM,
                [`${prefixCls}-medium-vertical`]: axes().vertical === strings.SPACING_MEDIUM,
                [`${prefixCls}-loose-horizontal`]: axes().horizontal === strings.SPACING_LOOSE,
                [`${prefixCls}-loose-vertical`]: axes().vertical === strings.SPACING_LOOSE,
            })}
            style={style()}
            x-semi-prop="children"
        >
            {local.children}
        </div>
    );
}
