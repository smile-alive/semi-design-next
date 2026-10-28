import type React from 'react';
import { memo } from 'react';
import Base from './base';
import type { TypographyBaseSize, OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

type OmitTextProps = OmitTypographyProps;

export interface TextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, OmitTextProps>, TypographyCommonProps, TypographyEllipsisProps {
    children?: React.ReactNode;
    code?: boolean;
    icon?: React.ReactNode | string;
    size?: TypographyBaseSize;
    weight?: number;
    /** Attached to the root element */
    ref?: React.Ref<HTMLSpanElement>;
}

function Text(props: TextProps) {
    // an explicit `component: undefined` in props would override a tag written before the spread
    return <Base {...props} component={props.component ?? 'span'} />;
}

export default memo(Text);
