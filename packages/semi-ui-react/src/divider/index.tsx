import React, { type CSSProperties, type ReactNode, Children } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/divider/constants';
import '@fibrae/semi-foundation/divider/divider.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export interface DividerProps extends ElementProps<'div'> {
    /** The position of title inside divider */
    align?: 'left' | 'right' | 'center';
    /** space between divider and surroundings **/
    margin?: number | string;
    /** The wrapped title */
    children?: ReactNode;
    /** Style class name */
    className?: string;
    /** Whether line is dashed  */
    dashed?: boolean;
    /** The direction type of divider */
    layout?: 'horizontal' | 'vertical';
    /** Divider inline style */
    style?: CSSProperties;
    /** Ref of the divider's root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { layout: 'horizontal', align: 'center' } satisfies Partial<DividerProps>;

export default function Divider(rawProps: DividerProps) {
    const props = useDefaultProps('Divider', rawProps, defaultProps);
    const { layout, dashed, align, className, margin, style, children, ...rest } = props;

    let overrideDefaultStyle: CSSProperties = {};

    const nodes = layout === 'horizontal' ? Children.toArray(children).filter((node) => node !== '') : [];
    const hasText = nodes.length > 0;
    const isTextOnly = nodes.every((node) => typeof node === 'string' || typeof node === 'number');

    const dividerClassNames = clsx(`${prefixCls}-divider`, className, {
        [`${prefixCls}-divider-horizontal`]: layout === 'horizontal',
        [`${prefixCls}-divider-vertical`]: layout === 'vertical',
        [`${prefixCls}-divider-dashed`]: !!dashed,
        [`${prefixCls}-divider-with-text`]: hasText,
        [`${prefixCls}-divider-with-text-${align}`]: hasText,
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
                    <span className={`${prefixCls}-divider_inner-text`} x-semi-prop="children">
                        {nodes}
                    </span>
                ) : (
                    children
                ))}
        </div>
    );
}
