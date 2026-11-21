import type React from 'react';
import { memo } from 'react';
import type { TypographyTextPart } from '@fibrae/semi-foundation/components/typography/constants';
import Base from './base';
import type { TypographyBaseSize, OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

type OmitTextProps = OmitTypographyProps;

export interface TextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, OmitTextProps>, TypographyCommonProps, TypographyEllipsisProps {
    children?: React.ReactNode;
    code?: boolean;
    icon?: React.ReactNode | string;
    classNames?: Partial<Record<TypographyTextPart, string>>;
    styles?: Partial<Record<TypographyTextPart, React.CSSProperties>>;
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
