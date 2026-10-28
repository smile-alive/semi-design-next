import { splitProps } from 'solid-js';
import { strings } from '@fibrae/semi-foundation/typography/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import type { ElementProps } from '../_base/element-props';
import Base, { type BaseTypographyProps } from './base';
import type { OmitTypographyProps, TypographyCommonProps, TypographyEllipsisProps } from './interface';

export interface TitleProps extends ElementProps<'h1', OmitTypographyProps>, TypographyCommonProps, TypographyEllipsisProps {
    heading?: ArrayElement<typeof strings.HEADING>;
    weight?: ArrayElement<typeof strings.WEIGHT> | number;
}

export default function Title(props: TitleProps) {
    const [local, rest] = splitProps(props, ['heading']);

    const tag = () => {
        const heading = local.heading ?? 1;
        return strings.HEADING.includes(heading) ? (`h${heading}` as const) : 'h1';
    };

    return <Base headingTag={tag()} {...(rest as BaseTypographyProps)} component={rest.component ?? tag()} />;
}
