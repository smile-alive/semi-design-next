import type React from 'react';
import { useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { type strings, cssClasses } from '@fibrae/semi-foundation/empty/constants';
import '@fibrae/semi-foundation/empty/empty.scss';
import type { ArrayElement, ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import { hasContent } from '../_utils';
import Typography from '../typography';

const prefixCls = cssClasses.PREFIX;

/** The id of an SVG sprite symbol on the page, drawn with `<use>` */
interface SVGNode {
    id: string;
}

export interface EmptyProps extends ElementProps<'div', 'title'> {
    layout?: ArrayElement<typeof strings.LAYOUT>;
    imageStyle?: React.CSSProperties;
    title?: React.ReactNode;
    description?: React.ReactNode;
    image?: React.ReactNode | SVGNode;
    darkModeImage?: React.ReactNode | SVGNode;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

// a React element keeps its props under props, so only the sprite object has an own id
function isSVGNode(image: EmptyProps['image']): image is SVGNode {
    return typeof image === 'object' && image !== null && 'id' in image;
}

function subscribeThemeMode(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.body, { attributeFilter: ['theme-mode'] });
    return () => observer.disconnect();
}

function getThemeMode() {
    return document.body.getAttribute('theme-mode');
}

function subscribeNone() {
    return () => {};
}

function getNoThemeMode() {
    return null;
}

const defaultProps = { layout: 'vertical' } satisfies Partial<EmptyProps>;

export default function Empty(rawProps: EmptyProps) {
    const { ref, className, image, description, style, title, imageStyle, children, layout, darkModeImage, ...rest } = useDefaultProps('Empty', rawProps, defaultProps);

    const mode = useSyncExternalStore(darkModeImage ? subscribeThemeMode : subscribeNone, darkModeImage ? getThemeMode : getNoThemeMode, getNoThemeMode);
    let imageNode: React.ReactNode;

    const imgSrc = mode === 'dark' && darkModeImage ? darkModeImage : image;

    if (typeof imgSrc === 'string' && imgSrc) {
        // decorative: the title and description carry the meaning
        imageNode = <img alt="" src={imgSrc} />;
    } else if (isSVGNode(imgSrc)) {
        imageNode = (
            <svg aria-hidden="true">
                <use xlinkHref={`#${imgSrc.id}`} />
            </svg>
        );
    } else {
        imageNode = imgSrc;
    }

    return (
        <div {...rest} ref={ref} className={clsx(className, prefixCls, { [`${prefixCls}-${layout}`]: layout })} style={style}>
            <div className={`${prefixCls}-image`} style={imageStyle} x-semi-prop="image,darkModeImage">
                {imageNode}
            </div>
            <div className={`${prefixCls}-content`}>
                {hasContent(title) && (
                    <Typography.Title
                        // a fixed heading level would break the page outline
                        component="div"
                        className={`${prefixCls}-title`}
                        style={imageNode ? undefined : { fontWeight: 400 }}
                        heading={imageNode ? 4 : 6}
                        x-semi-prop="title"
                    >
                        {title}
                    </Typography.Title>
                )}
                {hasContent(description) && (
                    <div className={`${prefixCls}-description`} x-semi-prop="description">
                        {description}
                    </div>
                )}
                {hasContent(children) && (
                    <div className={`${prefixCls}-footer`} x-semi-prop="children">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
