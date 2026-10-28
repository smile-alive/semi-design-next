import type React from 'react';
import { memo } from 'react';
import { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import Base from './base';
import type { OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

type OmitTitleProps = OmitTypographyProps;

export interface TitleProps extends Omit<React.HTMLAttributes<HTMLHeadingElement>, OmitTitleProps>, TypographyCommonProps, TypographyEllipsisProps {
    heading?: ArrayElement<typeof strings.HEADING>;
    weight?: ArrayElement<typeof strings.WEIGHT> | number;
    /** Attached to the root element */
    ref?: React.Ref<HTMLHeadingElement>;
}

function Title({ heading = 1, ...rest }: TitleProps) {
    const component = strings.HEADING.includes(heading) ? (`h${heading}` as const) : 'h1';

    return <Base headingTag={component} {...rest} component={rest.component ?? component} />;
}

export default memo(Title);
