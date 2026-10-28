import type { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import Typography, { type TitleProps } from '../../typography';

export default function h2(props: PropsWithChildren<TitleProps>) {
    return <Typography.Title heading={2} {...props} className={clsx(`${cssClasses.PREFIX}-component-header`, props.className)} />;
}
