import type React from 'react';
import { memo } from 'react';
import { strings, type TypographyTitlePart } from '@fibrae/semi-foundation/components/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import Base from './base';
import type { OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

type OmitTitleProps = OmitTypographyProps;

export interface TitleProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, OmitTitleProps>, TypographyCommonProps, TypographyEllipsisProps {
    heading?: ArrayElement<typeof strings.HEADING>;
    weight?: ArrayElement<typeof strings.WEIGHT> | number;
    classNames?: Partial<Record<TypographyTitlePart, string>>;
    styles?: Partial<Record<TypographyTitlePart, React.CSSProperties>>;
    /** Attached to the root element */
    ref?: React.Ref<HTMLHeadingElement>;
}

function Title({ heading = 1, ...rest }: TitleProps) {
    const component = strings.HEADING.includes(heading) ? (`h${heading}` as const) : 'h1';

    return <Base headingTag={component} {...rest} component={rest.component ?? component} />;
}

export default memo(Title);
