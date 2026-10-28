import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import Typography, { type TitleProps } from '../../typography';

function heading(level: NonNullable<TitleProps['heading']>) {
    return function MarkdownHeading(props: TitleProps) {
        return <Typography.Title heading={level} {...props} class={clsx(`${cssClasses.PREFIX}-component-header`, props.class)} />;
    };
}

export const h1 = heading(1);
export const h2 = heading(2);
export const h3 = heading(3);
export const h4 = heading(4);
export const h5 = heading(5);
export const h6 = heading(6);
