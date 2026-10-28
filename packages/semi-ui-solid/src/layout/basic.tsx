import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
import '@fibrae/semi-foundation/layout/layout.scss';
import type { ElementProps } from '../_base/element-props';

export interface BasicProps extends ElementProps<'section'> {
    prefixCls?: string;
    tagName?: keyof HTMLElementTagNameMap;
    type?: string;
}

function Basic(props: BasicProps) {
    const [local, rest] = splitProps(props, ['class', 'prefixCls', 'tagName', 'type']);

    return <Dynamic component={local.tagName} {...rest} class={clsx(local.class, `${local.prefixCls ?? cssClasses.PREFIX}-${local.type}`)} />;
}

export function Header(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'header'} tagName={props.tagName ?? 'header'} />;
}

export function Footer(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'footer'} tagName={props.tagName ?? 'footer'} />;
}

export function Content(props: BasicProps) {
    return <Basic {...props} type={props.type ?? 'content'} tagName={props.tagName ?? 'main'} />;
}
