import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
import '@fibrae/semi-foundation/components/layout/layout.scss';
import type { ElementProps } from '../../base/index';

export interface BasicProps extends ElementProps<'section'> {
    tagName?: keyof HTMLElementTagNameMap;
}

function Basic(props: BasicProps & { type: string }) {
    const [local, rest] = splitProps(props, ['class', 'tagName', 'type']);

    return <Dynamic component={local.tagName} {...rest} class={clsx(local.class, `${cssClasses.PREFIX}-${local.type}`)} />;
}

export function Header(props: BasicProps) {
    return <Basic {...props} type="header" tagName={props.tagName ?? 'header'} />;
}

export function Footer(props: BasicProps) {
    return <Basic {...props} type="footer" tagName={props.tagName ?? 'footer'} />;
}

export function Content(props: BasicProps) {
    return <Basic {...props} type="content" tagName={props.tagName ?? 'main'} />;
}
