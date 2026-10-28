import { useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import ImageFoundation, { type ImageAdapter, type ImageLoadStatus } from '@fibrae/semi-foundation/image/image-foundation';
import '@fibrae/semi-foundation/image/image.scss';
import { IconUploadError } from '@fibrae/semi-icons-react';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import useReplayImageEvents from '../_base/use-replay-image-events';
import useLocale from '../locale/use-locale';
import Skeleton from '../skeleton';
import type { ImageProps } from './interface';
import { usePreviewContext } from './preview-context';
import PreviewInner from './preview-inner';

const prefixCls = cssClasses.PREFIX;
const statusCls = `${prefixCls}-status`;

const defaultProps = {
    preview: true,
} satisfies Partial<ImageProps>;

function Image(rawProps: ImageProps) {
    const props = useDefaultProps('Image', rawProps, defaultProps);
    const { ref, src, width, height, alt, style, className, crossOrigin, preview, fallback, placeholder, setDownloadName, imgCls, imgStyle, children, onLoad, onError, ...restProps } = props;

    const context = usePreviewContext();
    const { locale } = useLocale('Image');

    const [load, setLoad] = useState<{ src: string; status: ImageLoadStatus }>(() => ({
        src: props.src,
        status: 'loading',
    }));

    const [previewVisibleState, setPreviewVisible] = useState(false);
    const thumbRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [foundation] = useFoundation<ImageFoundation<ImageProps, Record<string, never>>, ImageAdapter<ImageProps, Record<string, never>>, ImageProps, Record<string, never>>(
        ImageFoundation,
        props,
        () => ({}),
        (base) => ({
            getIsInGroup: () => Boolean(base.getContexts()?.isGroup),
            openGroupPreview: () => base.getContexts().openImage(thumbRef.current),
            setLoadStatus: (status) => setLoad((prev) => ({ ...prev, status })),
            setPreviewVisible,
            notifyLoad: (e) => base.getProps().onLoad?.(e),
            notifyError: (e) => base.getProps().onError?.(e),
            notifyPreviewVisibleChange: (visible) => {
                const { preview } = base.getProps();
                if (typeof preview === 'object') {
                    preview.onVisibleChange?.(visible);
                }
            },
        }),
        context
    );

    const mergedImgRef = useMergedRef(ref, imgRef);

    useReplayImageEvents(imgRef);

    if (load.src !== src) {
        setLoad({ src, status: 'loading' });
    }

    const loadStatus = load.src === src ? load.status : 'loading';
    const previewObject = typeof preview === 'object' && preview !== null ? preview : null;
    const isVisibleControlled = previewObject?.visible !== undefined;
    const controlledVisible = Boolean(previewObject?.visible);

    if (isVisibleControlled && controlledVisible !== previewVisibleState) {
        setPreviewVisible(controlledVisible);
    }

    let extra = null;

    const previewVisible = isVisibleControlled ? controlledVisible : previewVisibleState;
    const isInGroup = Boolean(context?.isGroup);
    const outerStyle = { width, height, ...style };
    const canPreview = ImageFoundation.canPreview(preview, isInGroup);
    const canOpen = ImageFoundation.canOpen(preview, loadStatus, isInGroup);
    const previewSrc = previewObject ? (previewObject.src ?? src) : src;

    // every Image registers, even without a preview: the group lazy-loads them all
    const registerImage = context?.registerImage;
    const unregisterImage = context?.unregisterImage;
    const groupPreviewSrc = preview ? previewSrc : undefined;
    const previewTitle = previewObject?.previewTitle;

    const previewProps =
        previewObject && canPreview
            ? {
                  ...omit(previewObject, ['previewCls', 'previewStyle']),
                  className: previewObject.previewCls,
                  style: previewObject.previewStyle,
              }
            : {};

    useLayoutEffect(() => {
        if (!isInGroup) {
            return undefined;
        }
        const node = thumbRef.current;
        registerImage({ node, src, previewSrc: groupPreviewSrc, title: previewTitle, alt });
        return () => unregisterImage(node);
    }, [isInGroup, registerImage, unregisterImage, src, groupPreviewSrc, previewTitle, alt]);

    if (loadStatus === 'error') {
        const fallbackNode = typeof fallback === 'string' ? <img style={{ width: '100%', height: '100%' }} alt={locale.fallback} src={fallback} /> : fallback;
        extra = fallback ? (
            <div className={statusCls}>{fallbackNode}</div>
        ) : (
            <div className={statusCls}>
                <IconUploadError size="extra-large" />
            </div>
        );
    } else if (loadStatus === 'loading') {
        extra = placeholder ? <div className={statusCls}>{placeholder}</div> : <Skeleton.Image style={{ width, height }} />;
    }

    return (
        <>
            <div
                ref={thumbRef}
                className={clsx(prefixCls, className)}
                style={outerStyle}
                aria-haspopup={canOpen ? 'dialog' : undefined}
                aria-label={canOpen && !alt ? locale.preview : undefined}
                role={canOpen ? 'button' : undefined}
                tabIndex={canOpen ? 0 : undefined}
                onClick={canOpen ? foundation.handleClick : undefined}
                onKeyDown={canOpen ? foundation.handleKeyDown : undefined}
            >
                <img
                    ref={mergedImgRef}
                    {...restProps}
                    className={clsx(`${prefixCls}-img`, {
                        [`${prefixCls}-img-preview`]: canOpen,
                        [`${prefixCls}-img-error`]: loadStatus === 'error',
                        [imgCls]: Boolean(imgCls),
                    })}
                    style={imgStyle}
                    data-src={src}
                    alt={alt}
                    crossOrigin={crossOrigin}
                    height={height}
                    src={isInGroup && context.lazyLoad ? undefined : src}
                    width={width}
                    onError={foundation.handleError}
                    onLoad={foundation.handleLoaded}
                />
                {extra && <div className={`${prefixCls}-overlay`}>{extra}</div>}
            </div>
            {/* a sibling: clicks inside the portal bubble through the React tree and would reopen the thumbnail */}
            {canPreview && <PreviewInner {...previewProps} alt={alt} crossOrigin={crossOrigin !== undefined ? crossOrigin : previewObject?.crossOrigin} setDownloadName={setDownloadName} src={previewSrc} visible={previewVisible} onVisibleChange={foundation.handlePreviewVisibleChange} />}
        </>
    );
}

export default Image;
