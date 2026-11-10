import React, { type CSSProperties, type ReactNode, Children } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/divider/constants';
import '@fibrae/semi-foundation/components/divider/divider.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';

const prefixCls = cssClasses.PREFIX;

export interface DividerProps extends ElementProps<'div'> {
    align?: 'left' | 'right' | 'center';
    margin?: number | string;
    children?: ReactNode;
    className?: string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
    style?: CSSProperties;
    /** Ref of the divider's root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { layout: 'horizontal', align: 'center' } satisfies Partial<DividerProps>;

export default function Divider(rawProps: DividerProps) {
    const { layout, dashed, align, className, margin, style, children, ...rest } = useDefaultProps('Divider', rawProps, defaultProps);

    let overrideDefaultStyle: CSSProperties = {};

    const nodes = layout === 'horizontal' ? Children.toArray(children).filter((node) => node !== '') : [];
    const hasText = nodes.length > 0;
    const isTextOnly = nodes.every((node) => typeof node === 'string' || typeof node === 'number');

    const dividerClassNames = clsx(prefixCls, className, {
        [`${prefixCls}-horizontal`]: layout === 'horizontal',
        [`${prefixCls}-vertical`]: layout === 'vertical',
        [`${prefixCls}-dashed`]: !!dashed,
        [`${prefixCls}-with-text`]: hasText,
        [`${prefixCls}-with-text-${align}`]: hasText,
    });

    if (margin !== undefined) {
        if (layout === 'vertical') {
            overrideDefaultStyle = {
                marginLeft: margin,
                marginRight: margin,
            };
        } else if (layout === 'horizontal') {
            overrideDefaultStyle = {
                marginTop: margin,
                marginBottom: margin,
            };
        }
    }

    return (
        // a separator's children are presentational, so a divider with text has no role
        <div aria-orientation={!hasText && layout === 'vertical' ? 'vertical' : undefined} role={hasText ? undefined : 'separator'} {...rest} className={dividerClassNames} style={{ ...overrideDefaultStyle, ...style }}>
            {hasText &&
                (isTextOnly ? (
                    <span className={`${prefixCls}_inner-text`} x-semi-prop="children">
                        {nodes}
                    </span>
                ) : (
                    children
                ))}
        </div>
    );
}
