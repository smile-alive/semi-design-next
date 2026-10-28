import { Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import hasContent from '../_base/has-content';
import { createToken } from '../_base/token';
import { useNavContext } from './context';
import type { NavHeaderProps } from './interface';

const prefix = cssClasses.PREFIX;

export const NAV_HEADER = 'Nav.Header';

// Nav renders the header from this token (HeaderView); standing alone it renders nothing
export default function NavHeader(props: NavHeaderProps) {
    return createToken(NAV_HEADER, props);
}

export function HeaderView(props: NavHeaderProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'link', 'linkOptions', 'logo', 'style', 'text']);

    const context = useNavContext('Nav.Header');

    const logo = children(() => local.logo);
    const body = children(() => local.children);

    const isCollapsed = () => context.view().isCollapsed;

    const inner = () => (
        <>
            <Show when={hasContent(logo())}>
                <i class={`${prefix}-header-logo`}>{logo()}</i>
            </Show>
            <Show when={local.text != null && !isCollapsed()}>
                <span class={`${prefix}-header-text`}>{local.text}</span>
            </Show>
            {body()}
        </>
    );

    // collapsed, the text is dropped, so it names the link
    const linkLabel = () => (isCollapsed() && local.text != null ? `${local.text}` : undefined);

    return (
        <div {...rest} class={clsx(local.class, `${prefix}-header`, { [`${prefix}-header-collapsed`]: isCollapsed() })} style={local.style}>
            <Show when={typeof local.link === 'string'} fallback={inner()}>
                <a aria-label={linkLabel()} href={local.link} {...local.linkOptions} class={clsx(`${prefix}-header-link`, local.linkOptions?.class)}>
                    {inner()}
                </a>
            </Show>
        </div>
    );
}
