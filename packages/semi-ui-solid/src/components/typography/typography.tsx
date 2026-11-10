import { type ValidComponent, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/typography/constants';
import '@fibrae/semi-foundation/components/typography/typography.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';

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
