import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type TypographyParagraphPart } from '@fibrae/semi-foundation/components/typography/constants';
import Base from './base';
import type { TypographyBaseSize, TypographyBaseSpacing, OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

type OmitParagraphProps = OmitTypographyProps;

export interface ParagraphProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, OmitParagraphProps>, TypographyCommonProps, TypographyEllipsisProps {
    size?: TypographyBaseSize;
    spacing?: TypographyBaseSpacing;
    classNames?: Partial<Record<TypographyParagraphPart, string>>;
    styles?: Partial<Record<TypographyParagraphPart, React.CSSProperties>>;
    /** Attached to the root element */
    ref?: React.Ref<HTMLParagraphElement>;
}

const prefixCls = cssClasses.PREFIX;

function Paragraph(props: ParagraphProps) {
    return <Base {...props} component={props.component ?? 'p'} className={clsx(props.className, `${prefixCls}-paragraph`)} />;
}

export default memo(Paragraph);
