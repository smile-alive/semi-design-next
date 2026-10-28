import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import ScrollItem from './scroll-item';

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

export interface ScrollListProps extends ElementProps<'div'> {
    header?: JSX.Element;
    footer?: JSX.Element;
    children?: JSX.Element;
    bodyHeight?: number | string;
    prefixCls?: string;
    /** Names the header slot after the prop of the component that renders this one (TimePicker's own props) */
    'x-semi-header-alias'?: string;
    'x-semi-footer-alias'?: string;
}

function ScrollList(rawProps: ScrollListProps) {
    const props = useDefaultProps('ScrollList', rawProps, {});
    const [local, rest] = splitProps(props, ['children', 'header', 'footer', 'prefixCls', 'bodyHeight', 'class', 'x-semi-header-alias', 'x-semi-footer-alias']);

    const header = children(() => local.header);
    const footer = children(() => local.footer);

    const prefix = () => local.prefixCls || cssClasses.PREFIX;

    return (
        <div {...rest} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role} class={clsx(local.class, prefix())}>
            <Show when={hasContent(header())}>
                <div class={`${prefix()}-header`}>
                    <div class={`${prefix()}-header-title`} x-semi-prop={local['x-semi-header-alias'] || 'header'}>
                        {header()}
                    </div>
                    <div class={`${prefix()}-line`} />
                </div>
            </Show>
            {/* a style object does not add px to numbers; 0 leaves the stylesheet height, as in React */}
            <div class={`${prefix()}-body`} style={{ height: typeof local.bodyHeight === 'number' ? (local.bodyHeight ? `${local.bodyHeight}px` : undefined) : local.bodyHeight || undefined }} x-semi-prop="children">
                {local.children}
            </div>
            <Show when={hasContent(footer())}>
                <div class={`${prefix()}-footer`} x-semi-prop={local['x-semi-footer-alias'] || 'footer'}>
                    {footer()}
                </div>
            </Show>
        </div>
    );
}

export default Object.assign(ScrollList, { Item: ScrollItem });
