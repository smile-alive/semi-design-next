import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import '@fibrae/semi-foundation/typography/typography.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface TypographyProps extends ElementProps<'article'> {
    component?: React.ElementType;
    /** Attached to the root element */
    ref?: React.Ref<HTMLElement>;
}

const defaultProps = {
    component: 'article',
} satisfies Partial<TypographyProps>;

// The element Text, Title, Paragraph and Numeral render through: they are not the bare Typography, so the global
// defaults of Typography must not reach them.
export const TypographyElement = memo(function TypographyElement({ component: Component = defaultProps.component, className, children, ref, ...rest }: TypographyProps) {
    return (
        <Component {...rest} ref={ref} className={clsx(prefixCls, className)}>
            {children}
        </Component>
    );
});

function Typography(rawProps: TypographyProps) {
    return <TypographyElement {...useDefaultProps('Typography', rawProps, defaultProps)} />;
}

export default memo(Typography);
