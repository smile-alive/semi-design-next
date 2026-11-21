import type { JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type TypographyParagraphPart } from '@fibrae/semi-foundation/components/typography/constants';
import type { ElementProps } from '../../base/index';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyBaseSize, TypographyBaseSpacing, TypographyCommonProps, TypographyEllipsisProps } from './interface';

export interface ParagraphProps extends ElementProps<'p', OmitTypographyProps>, TypographyCommonProps, TypographyEllipsisProps {
    size?: TypographyBaseSize;
    spacing?: TypographyBaseSpacing;
    classNames?: Partial<Record<TypographyParagraphPart, string>>;
    styles?: Partial<Record<TypographyParagraphPart, JSX.CSSProperties | string>>;
}

const prefixCls = cssClasses.PREFIX;

export default function Paragraph(props: ParagraphProps) {
    return <Base {...(props as BaseTypographyProps)} component={props.component ?? 'p'} class={clsx(props.class, `${prefixCls}-paragraph`)} />;
}
