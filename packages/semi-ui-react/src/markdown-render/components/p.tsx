import { type PropsWithChildren, type ReactNode, Children, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import Typography, { type ParagraphProps } from '../../typography';
import img from './img';

function containsImage(children: ReactNode): boolean {
    return Children.toArray(children).some((child) => isValidElement<{ children?: ReactNode }>(child) && (child.type === img || containsImage(child.props.children)));
}

export default function p(props: PropsWithChildren<ParagraphProps>) {
    // the image renders a div, invalid inside a p, so such a paragraph becomes a div; only the Semi img is detected
    return <Typography.Paragraph {...(containsImage(props.children) ? { component: 'div' } : null)} {...props} className={clsx(`${cssClasses.PREFIX}-component-p`, props.className)} />;
}
