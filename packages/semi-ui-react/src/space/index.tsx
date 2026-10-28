import type React from 'react';
import { memo, type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';
import { strings, cssClasses } from '@fibrae/semi-foundation/space/constants';
import '@fibrae/semi-foundation/space/space.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';

const prefixCls = cssClasses.PREFIX;

export type Align = 'start' | 'center' | 'end' | 'baseline';
export type Spacing = 'loose' | 'medium' | 'tight' | number;

export interface SpaceProps extends ElementProps<'div'> {
    wrap?: boolean;
    align?: Align;
    vertical?: boolean;
    spacing?: Spacing | [Spacing, Spacing];
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    vertical: false,
    wrap: false,
    spacing: 'tight',
    align: 'center',
} satisfies Partial<SpaceProps>;

function Space(rawProps: SpaceProps) {
    const props = useDefaultProps('Space', rawProps, defaultProps);
    const { ref, children = null, style, className, spacing, wrap, align, vertical, ...rest } = props;

    let spacingHorizontalType = '';
    let spacingVerticalType = '';

    const isWrap = wrap && vertical ? false : wrap;
    const gapStyle: CSSProperties = {};

    if (typeof spacing === 'string') {
        spacingHorizontalType = spacing;
        spacingVerticalType = spacing;
    } else if (typeof spacing === 'number') {
        gapStyle.rowGap = spacing;
        gapStyle.columnGap = spacing;
    } else if (Array.isArray(spacing)) {
        if (typeof spacing[0] === 'string') {
            spacingHorizontalType = spacing[0];
        } else if (typeof spacing[0] === 'number') {
            gapStyle.columnGap = `${spacing[0]}px`;
        }
        if (typeof spacing[1] === 'string') {
            spacingVerticalType = spacing[1];
        } else if (typeof spacing[1] === 'number') {
            gapStyle.rowGap = `${spacing[1]}px`;
        }
    }

    const classNames = clsx(prefixCls, className, {
        [`${prefixCls}-align-${align}`]: align,
        [`${prefixCls}-vertical`]: vertical,
        [`${prefixCls}-horizontal`]: !vertical,
        [`${prefixCls}-wrap`]: isWrap,
        [`${prefixCls}-tight-horizontal`]: spacingHorizontalType === strings.SPACING_TIGHT,
        [`${prefixCls}-tight-vertical`]: spacingVerticalType === strings.SPACING_TIGHT,
        [`${prefixCls}-medium-horizontal`]: spacingHorizontalType === strings.SPACING_MEDIUM,
        [`${prefixCls}-medium-vertical`]: spacingVerticalType === strings.SPACING_MEDIUM,
        [`${prefixCls}-loose-horizontal`]: spacingHorizontalType === strings.SPACING_LOOSE,
        [`${prefixCls}-loose-vertical`]: spacingVerticalType === strings.SPACING_LOOSE,
    });

    return (
        <div {...rest} ref={ref} className={classNames} style={{ ...gapStyle, ...style }} x-semi-prop="children">
            {children}
        </div>
    );
}

export default memo(Space);
