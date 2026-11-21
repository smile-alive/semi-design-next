import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type ScrollListPart } from '@fibrae/semi-foundation/components/scroll-list/constants';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { hasContent, mergeStyles } from '../../utils/index';
import ScrollItem from './scroll-item';

export interface ScrollListProps extends ElementProps<'div'> {
    header?: JSX.Element;
    footer?: JSX.Element;
    children?: JSX.Element;
    bodyHeight?: number | string;
    classNames?: Partial<Record<ScrollListPart, string>>;
    styles?: Partial<Record<ScrollListPart, JSX.CSSProperties | string>>;
}

/** Set by TimePicker to name the slots after its own props */
interface InternalProps extends ScrollListProps {
    'x-semi-header-alias'?: string;
    'x-semi-footer-alias'?: string;
}

const prefix = cssClasses.PREFIX;

function ScrollList(rawProps: ScrollListProps) {
    const props = useDefaultProps('ScrollList', rawProps as InternalProps, {});
    const [local, rest] = splitProps(props, ['children', 'header', 'footer', 'bodyHeight', 'class', 'classNames', 'styles', 'x-semi-header-alias', 'x-semi-footer-alias']);

    const header = children(() => local.header);
    const footer = children(() => local.footer);

    return (
        <div {...rest} role={namedRole(rest)} class={clsx(local.class, prefix)}>
            <Show when={hasContent(header())}>
                <div class={clsx(`${prefix}-header`, local.classNames?.header)} style={local.styles?.header}>
                    <div class={clsx(`${prefix}-header-title`, local.classNames?.title)} style={local.styles?.title} x-semi-prop={local['x-semi-header-alias'] || 'header'}>
                        {header()}
                    </div>
                    <div class={`${prefix}-line`} />
                </div>
            </Show>
            {/* a style object does not add px to numbers; 0 leaves the stylesheet height, as in React */}
            <div class={clsx(`${prefix}-body`, local.classNames?.body)} style={mergeStyles({ height: typeof local.bodyHeight === 'number' ? (local.bodyHeight ? `${local.bodyHeight}px` : undefined) : local.bodyHeight || undefined }, local.styles?.body)} x-semi-prop="children">
                {local.children}
            </div>
            <Show when={hasContent(footer())}>
                <div class={clsx(`${prefix}-footer`, local.classNames?.footer)} style={local.styles?.footer} x-semi-prop={local['x-semi-footer-alias'] || 'footer'}>
                    {footer()}
                </div>
            </Show>
        </div>
    );
}

export default Object.assign(ScrollList, { Item: ScrollItem });
