import { Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import hasContent from '../_base/has-content';
import { createToken } from '../_base/token';
import CollapseButton from './collapse-button';
import { useNavContext } from './context';
import type { NavFooterProps } from './interface';

const prefix = cssClasses.PREFIX;

export const NAV_FOOTER = 'Nav.Footer';

// Nav renders the footer from this token (FooterView); standing alone it renders nothing
export default function NavFooter(props: NavFooterProps) {
    return createToken(NAV_FOOTER, props);
}

export function FooterView(props: NavFooterProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'collapseButton', 'collapseText']);

    const context = useNavContext('Nav.Footer');

    const body = children(() => local.children);

    // the button only stands in for a footer without children, and a horizontal bar has nothing to collapse
    const buttonSlot = () => context.view().mode !== strings.MODE_HORIZONTAL && !hasContent(body());

    const button = children(() => (buttonSlot() ? local.collapseButton : undefined));

    const isCollapsed = () => context.view().isCollapsed;

    const showButton = () => buttonSlot() && Boolean(button());

    return (
        <div {...rest} class={clsx(local.class, `${prefix}-footer`, { [`${prefix}-footer-collapsed`]: isCollapsed() })}>
            <Show when={showButton()} fallback={body()}>
                <Show when={hasContent(button())} fallback={<CollapseButton collapseText={local.collapseText} isCollapsed={isCollapsed()} locale={context.locale()} onClick={context.toggleCollapsed} />}>
                    {button()}
                </Show>
            </Show>
        </div>
    );
}
