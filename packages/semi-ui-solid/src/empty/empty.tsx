import { children, createSignal, Match, Show, splitProps, Switch, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type strings } from '@fibrae/semi-foundation/empty/constants';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/empty/empty.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import isMarkup from '../_base/is-markup';
import useDefaultProps from '../_base/use-default-props';
import useMutationObserver from '../_base/use-mutation-observer';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
export interface SVGNode {
    id: string;
}

export interface EmptyProps extends ElementProps<'div', 'title'> {
    layout?: ArrayElement<typeof strings.LAYOUT>;
    imageStyle?: JSX.CSSProperties | string;
    title?: JSX.Element;
    description?: JSX.Element;
    /** A URL, a DOM node (an illustration) or the id of an SVG sprite symbol */
    image?: JSX.Element | SVGNode;
    /** Replaces `image` while `theme-mode="dark"` is set on `document.body` */
    darkModeImage?: JSX.Element | SVGNode;
}

// a DOM element has an `id` property too, so only a plain object is the sprite form
function isSVGNode(image: unknown): image is SVGNode {
    return typeof image === 'object' && image !== null && !isMarkup(image) && 'id' in image;
}

const defaultProps = { layout: 'vertical' } satisfies Partial<EmptyProps>;

const readThemeMode = () => document.body.getAttribute('theme-mode');

export default function Empty(rawProps: EmptyProps) {
    const props = useDefaultProps('Empty', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'darkModeImage', 'description', 'image', 'imageStyle', 'layout', 'style', 'title']);

    // the server has no body to read; the observer reads the mode once it starts, after mount
    const [mode, setMode] = createSignal<string | null>(null);

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

    // Every instance observes: a darkModeImage that appears later cannot be told apart without building it first
    useMutationObserver(
        () => document.body,
        () => setMode(readThemeMode()),
        { attributeFilter: ['theme-mode'] }
    );

    return (
        <div {...rest} class={clsx(local.class, prefixCls, { [`${prefixCls}-${local.layout}`]: local.layout })} style={local.style}>
            <div class={`${prefixCls}-image`} style={local.imageStyle} x-semi-prop="image,darkModeImage">
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
                        class={`${prefixCls}-title`}
                        style={hasContent(image()) ? undefined : { 'font-weight': '400' }}
                        heading={hasContent(image()) ? 4 : 6}
                        x-semi-prop="title"
                    >
                        {title()}
                    </Typography.Title>
                </Show>
                <Show when={hasContent(description())}>
                    <div class={`${prefixCls}-description`} x-semi-prop="description">
                        {description()}
                    </div>
                </Show>
                <Show when={hasContent(footer())}>
                    <div class={`${prefixCls}-footer`} x-semi-prop="children">
                        {footer()}
                    </div>
                </Show>
            </div>
        </div>
    );
}
