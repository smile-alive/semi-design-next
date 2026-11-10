import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import hasContent from '../../utils/has-content';
import ScrollItem from './scroll-item';

export interface ScrollListProps extends ElementProps<'div'> {
    header?: JSX.Element;
    footer?: JSX.Element;
    children?: JSX.Element;
    bodyHeight?: number | string;
}

/** Set by TimePicker to name the slots after its own props */
interface InternalProps extends ScrollListProps {
    'x-semi-header-alias'?: string;
    'x-semi-footer-alias'?: string;
}

const prefix = cssClasses.PREFIX;

function ScrollList(rawProps: ScrollListProps) {
    const props = useDefaultProps('ScrollList', rawProps as InternalProps, {});
    const [local, rest] = splitProps(props, ['children', 'header', 'footer', 'bodyHeight', 'class', 'x-semi-header-alias', 'x-semi-footer-alias']);

    const header = children(() => local.header);
    const footer = children(() => local.footer);

    return (
        <div {...rest} role={namedRole(rest)} class={clsx(local.class, prefix)}>
            <Show when={hasContent(header())}>
                <div class={`${prefix}-header`}>
                    <div class={`${prefix}-header-title`} x-semi-prop={local['x-semi-header-alias'] || 'header'}>
                        {header()}
                    </div>
                    <div class={`${prefix}-line`} />
                </div>
            </Show>
            {/* a style object does not add px to numbers; 0 leaves the stylesheet height, as in React */}
            <div class={`${prefix}-body`} style={{ height: typeof local.bodyHeight === 'number' ? (local.bodyHeight ? `${local.bodyHeight}px` : undefined) : local.bodyHeight || undefined }} x-semi-prop="children">
                {local.children}
            </div>
            <Show when={hasContent(footer())}>
                <div class={`${prefix}-footer`} x-semi-prop={local['x-semi-footer-alias'] || 'footer'}>
                    {footer()}
                </div>
            </Show>
        </div>
    );
}

export default Object.assign(ScrollList, { Item: ScrollItem });
