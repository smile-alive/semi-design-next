import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import type { ElementProps } from '../_base/element-props';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyBaseSize, TypographyBaseSpacing, TypographyCommonProps, TypographyEllipsisProps } from './interface';

export interface ParagraphProps extends ElementProps<'p', OmitTypographyProps>, TypographyCommonProps, TypographyEllipsisProps {
    size?: TypographyBaseSize;
    spacing?: TypographyBaseSpacing;
}

const prefixCls = cssClasses.PREFIX;

export default function Paragraph(props: ParagraphProps) {
    return <Base {...(props as BaseTypographyProps)} component={props.component ?? 'p'} class={clsx(props.class, `${prefixCls}-paragraph`)} />;
}
