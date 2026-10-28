import { type ValidComponent, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import '@fibrae/semi-foundation/typography/typography.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface TypographyProps extends ElementProps<'article'> {
    component?: ValidComponent;
}

const defaultProps = {
    component: 'article',
} satisfies Partial<TypographyProps>;

// The element Text, Title, Paragraph and Numeral render through: they are not the bare Typography, so the global
// defaults of Typography must not reach them.
export function TypographyElement(props: TypographyProps) {
    const [local, rest] = splitProps(props, ['component', 'class', 'children']);

    return (
        <Dynamic {...rest} component={local.component ?? defaultProps.component} class={clsx(prefixCls, local.class)}>
            {local.children}
        </Dynamic>
    );
}

export default function Typography(rawProps: TypographyProps) {
    const props = useDefaultProps('Typography', rawProps, defaultProps);

    return <TypographyElement {...props} />;
}
