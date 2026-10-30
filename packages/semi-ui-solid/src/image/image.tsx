import { type JSX, Match, Show, Switch, children, createEffect, createMemo, createSignal, mergeProps, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import ImageFoundation, { type ImageAdapter, type ImageLoadStatus } from '@fibrae/semi-foundation/image/image-foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/image/image.scss';
import { IconUploadError } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import mergeStyles from '../_base/merge-styles';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useLocale from '../locale/use-locale';
import Skeleton from '../skeleton';
import { usePreviewContext } from './context';
import type { ImageProps } from './interface';
import PreviewInner from './preview-inner';

type Foundation = ImageFoundation<ImageProps, Record<string, never>>;
type Adapter = ImageAdapter<ImageProps, Record<string, never>>;

const prefixCls = cssClasses.PREFIX;
const statusCls = `${prefixCls}-status`;

const defaultProps = {
    preview: true,
} satisfies Partial<ImageProps>;

export default function Image(rawProps: ImageProps) {
    const props = useDefaultProps('Image', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['alt', 'children', 'class', 'crossOrigin', 'fallback', 'height', 'imgCls', 'imgStyle', 'onError', 'onLoad', 'placeholder', 'preview', 'setDownloadName', 'src', 'style', 'width']);

    const group = usePreviewContext();
    const locale = useLocale('Image');

    // keyed by src: a new src is loading until its own load or error event
    const [load, setLoad] = createSignal<{ src?: string; status: ImageLoadStatus }>({ status: 'loading' });
    const [previewVisibleState, setPreviewVisible] = createSignal(false);
    let thumb: HTMLDivElement | undefined;

    // read once per change: the getter of an inline object creates its JSX values on every read, and a read in an
    // event handler would create components outside any owner
    const preview = createMemo(() => local.preview);

    const foundationProps = mergeProps(props, {
        get preview() {
            return preview();
        },
    });

    const { foundation } = useFoundation<Foundation, Adapter, ImageProps, Record<string, never>>(
        ImageFoundation,
        foundationProps,
        () => ({}),
        () => ({
            getIsInGroup: () => Boolean(group),
            openGroupPreview: () => group?.openImage(thumb as HTMLDivElement),
            setLoadStatus: (status) => setLoad({ src: local.src, status }),
            setPreviewVisible: (visible) => setPreviewVisible(visible),
            notifyLoad: (e) => callHandler(local.onLoad, e),
            notifyError: (e) => callHandler(local.onError, e),
            notifyPreviewVisibleChange: (visible) => {
                const value = preview();
                if (typeof value === 'object' && value !== null) {
                    value.onVisibleChange?.(visible);
                }
            },
        })
    );

    const previewObject = createMemo(() => {
        const value = preview();
        return typeof value === 'object' && value !== null ? value : null;
    });

    const placeholder = children(() => local.placeholder);
    const controlledVisible = createMemo(() => previewObject()?.visible);

    const loadStatus = () => (load().src === local.src ? load().status : 'loading');

    // created once it shows: the server renders the loading state, and JSX created during hydration needs markup to claim
    const fallback = children(() => (loadStatus() === 'error' ? local.fallback : undefined));

    const previewVisible = () => (controlledVisible() === undefined ? previewVisibleState() : Boolean(controlledVisible()));

    const canPreview = () => ImageFoundation.canPreview(preview(), Boolean(group));

    const canOpen = () => ImageFoundation.canOpen(preview(), loadStatus(), Boolean(group));

    const previewSrc = () => previewObject()?.src ?? local.src;

    const sizeStyle = (): JSX.CSSProperties => ({ width: toCssLength(local.width), height: toCssLength(local.height) });

    const rootStyle = () => mergeStyles(sizeStyle(), local.style);

    const previewInnerProps = () => {
        const object = previewObject();
        if (!object) {
            return {};
        }
        const { previewCls, previewStyle, ...others } = object;
        return { ...others, class: previewCls, style: previewStyle };
    };

    const fallbackContent = () => {
        const value = fallback();
        if (typeof value === 'string' && value) {
            return <img style={{ width: '100%', height: '100%' }} alt={locale().locale.fallback} src={value} />;
        }
        return hasContent(value) ? value : <IconUploadError size="extra-large" />;
    };

    const handleClick = (e: MouseEvent) => {
        if (canOpen()) {
            foundation.handleClick(e);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (canOpen()) {
            foundation.handleKeyDown(e);
        }
    };

    // a preview that becomes uncontrolled continues from the last controlled visible, as in React
    createEffect(() => {
        const visible = controlledVisible();
        if (visible !== undefined) {
            setPreviewVisible(Boolean(visible));
        }
    });

    // every Image registers, even without a preview: the group lazy-loads them all
    createEffect(() => {
        if (!group) {
            return;
        }
        const node = thumb as HTMLDivElement;
        group.registerImage({ node, src: local.src as string, previewSrc: preview() ? previewSrc() : undefined, title: previewObject()?.previewTitle, alt: local.alt });
        onCleanup(() => group.unregisterImage(node));
    });

    return (
        <>
            <div
                ref={(node) => (thumb = node)}
                class={clsx(prefixCls, local.class)}
                style={rootStyle()}
                aria-haspopup={canOpen() ? 'dialog' : undefined}
                aria-label={canOpen() && !local.alt ? locale().locale.preview : undefined}
                role={canOpen() ? 'button' : undefined}
                tabIndex={canOpen() ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                <img
                    {...rest}
                    class={clsx(
                        `${prefixCls}-img`,
                        {
                            [`${prefixCls}-img-preview`]: canOpen(),
                            [`${prefixCls}-img-error`]: loadStatus() === 'error',
                        },
                        local.imgCls
                    )}
                    style={local.imgStyle}
                    data-src={local.src}
                    alt={local.alt}
                    crossOrigin={local.crossOrigin}
                    height={local.height}
                    src={group?.view().lazyLoad ? undefined : local.src}
                    width={local.width}
                    onError={foundation.handleError}
                    onLoad={foundation.handleLoaded}
                />
                <Show when={loadStatus() !== 'success'}>
                    <div class={`${prefixCls}-overlay`}>
                        <Switch fallback={<Skeleton.Image style={sizeStyle()} />}>
                            <Match when={loadStatus() === 'error'}>
                                <div class={statusCls}>{fallbackContent()}</div>
                            </Match>
                            <Match when={hasContent(placeholder())}>
                                <div class={statusCls}>{placeholder()}</div>
                            </Match>
                        </Switch>
                    </div>
                </Show>
            </div>
            {/* a sibling: clicks inside the portal bubble through the component tree and would reopen the thumbnail */}
            <Show when={canPreview()}>
                <PreviewInner {...previewInnerProps()} alt={local.alt} crossOrigin={local.crossOrigin ?? previewObject()?.crossOrigin} setDownloadName={local.setDownloadName} src={previewSrc()} visible={previewVisible()} onVisibleChange={foundation.handlePreviewVisibleChange} />
            </Show>
        </>
    );
}
