import type { ElementProps } from '../_base/element-props';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyBaseSize, TypographyCommonProps, TypographyEllipsisProps, TypographyIcon } from './interface';

export interface TextProps extends ElementProps<'span', OmitTypographyProps>, TypographyCommonProps, TypographyEllipsisProps {
    code?: boolean;
    icon?: TypographyIcon;
    size?: TypographyBaseSize;
    weight?: number;
}

export default function Text(props: TextProps) {
    // an explicit `component: undefined` in props would override a tag written before the spread
    return <Base {...(props as BaseTypographyProps)} component={props.component ?? 'span'} />;
}
