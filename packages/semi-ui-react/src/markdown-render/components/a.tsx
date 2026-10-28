import type { PropsWithChildren } from 'react';
import Typography, { type TextProps } from '../../typography';
import { LinkContext } from './link-context';

export default function a(props: PropsWithChildren<TextProps>) {
    return (
        <LinkContext value>
            <Typography.Text link={props}>{props.children}</Typography.Text>
        </LinkContext>
    );
}
