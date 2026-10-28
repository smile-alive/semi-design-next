import type { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import Typography, { type TitleProps } from '../../typography';

export default function h3(props: PropsWithChildren<TitleProps>) {
    return <Typography.Title heading={3} {...props} className={clsx(`${cssClasses.PREFIX}-component-header`, props.className)} />;
}
