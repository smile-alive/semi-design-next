import { children, Match, Show, splitProps, Switch, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type EmptyPart, type strings } from '@fibrae/semi-foundation/components/empty/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/empty/empty.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { useThemeMode } from '../../primitives/index';
import { hasContent, isMarkup, mergeStyles } from '../../utils/index';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
export interface SVGNode {
    id: string;
}

export interface EmptyProps extends ElementProps<'div', 'title'> {
    layout?: ArrayElement<typeof strings.LAYOUT>;
    styles?: Partial<Record<EmptyPart, JSX.CSSProperties | string>>;
    classNames?: Partial<Record<EmptyPart, string>>;
    title?: JSX.Element;
    description?: JSX.Element;
    image?: JSX.Element | SVGNode;
    /** Replaces `image` while `theme-mode="dark"` is set on `<html>` */
    darkModeImage?: JSX.Element | SVGNode;
}

// a DOM element has an `id` property too, so only a plain object is the sprite form
function isSVGNode(image: unknown): image is SVGNode {
    return typeof image === 'object' && image !== null && !isMarkup(image) && 'id' in image;
}

const defaultProps = { layout: 'vertical' } satisfies Partial<EmptyProps>;

export default function Empty(rawProps: EmptyProps) {
    const props = useDefaultProps('Empty', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'classNames', 'darkModeImage', 'description', 'image', 'layout', 'style', 'styles', 'title']);

    // every instance observes: a darkModeImage that appears later cannot be told apart without building it first
    const { mode } = useThemeMode();

    // each prop is read once: reading a JSX prop builds its nodes again
    const image = children(() => {
        if (mode() === 'dark') {
            const dark = local.darkModeImage;
            if (dark) {
                return dark as JSX.Element;
            }
        }
        return local.image as JSX.Element;
    });

    const title = children(() => local.title);
    const description = children(() => local.description);
    const footer = children(() => local.children);

    const url = () => {
        const value = image();
        return typeof value === 'string' && value ? value : undefined;
    };

    const spriteId = () => {
        const value: unknown = image();
        return isSVGNode(value) ? value.id : undefined;
    };

    return (
        <div {...rest} class={clsx(local.class, prefixCls, { [`${prefixCls}-${local.layout}`]: local.layout })} style={local.style}>
            <div class={clsx(`${prefixCls}-image`, local.classNames?.image)} style={local.styles?.image} x-semi-prop="image,darkModeImage">
                <Switch fallback={image() as JSX.Element}>
                    <Match when={url()}>
                        {/* decorative: the title and description carry the meaning */}
                        {(src) => <img alt="" src={src()} />}
                    </Match>
                    <Match when={spriteId()}>
                        {(id) => (
                            <svg aria-hidden="true">
                                <use href={`#${id()}`} />
                            </svg>
                        )}
                    </Match>
                </Switch>
            </div>
            <div class={`${prefixCls}-content`}>
                <Show when={hasContent(title())}>
                    <Typography.Title
                        // a fixed heading level would break the page outline
                        component="div"
                        class={clsx(`${prefixCls}-title`, local.classNames?.title)}
                        style={mergeStyles(hasContent(image()) ? undefined : { 'font-weight': '400' }, local.styles?.title)}
                        heading={hasContent(image()) ? 4 : 6}
                        x-semi-prop="title"
                    >
                        {title()}
                    </Typography.Title>
                </Show>
                <Show when={hasContent(description())}>
                    <div class={clsx(`${prefixCls}-description`, local.classNames?.description)} style={local.styles?.description} x-semi-prop="description">
                        {description()}
                    </div>
                </Show>
                <Show when={hasContent(footer())}>
                    <div class={clsx(`${prefixCls}-footer`, local.classNames?.footer)} style={local.styles?.footer} x-semi-prop="children">
                        {footer()}
                    </div>
                </Show>
            </div>
        </div>
    );
}
