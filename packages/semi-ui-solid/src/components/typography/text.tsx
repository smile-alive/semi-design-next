import type { JSX } from 'solid-js';
import type { TypographyTextPart } from '@fibrae/semi-foundation/components/typography/constants';
import type { ElementProps } from '../../base/index';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyBaseSize, TypographyCommonProps, TypographyEllipsisProps, TypographyIcon } from './interface';

export interface TextProps extends ElementProps<'span', OmitTypographyProps>, TypographyCommonProps, TypographyEllipsisProps {
    code?: boolean;
    icon?: TypographyIcon;
    classNames?: Partial<Record<TypographyTextPart, string>>;
    styles?: Partial<Record<TypographyTextPart, JSX.CSSProperties | string>>;
    size?: TypographyBaseSize;
    weight?: number;
}

export default function Text(props: TextProps) {
    // an explicit `component: undefined` in props would override a tag written before the spread
    return <Base {...(props as BaseTypographyProps)} component={props.component ?? 'span'} />;
}
