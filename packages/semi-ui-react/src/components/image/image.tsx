import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import ImageFoundation, { type ImageAdapter, type ImageState } from '@fibrae/semi-foundation/components/image/image-foundation';
import '@fibrae/semi-foundation/components/image/image.scss';
import { IconUploadError } from '@fibrae/semi-icons-react';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import HydratedImage from '../../internal/hydrated-image';
import useLocale from '../locale/use-locale';
import Skeleton from '../skeleton';
import { usePreviewContext } from './context';
import type { ImageProps } from './interface';
import PreviewInner from './preview-inner';

type Foundation = ImageFoundation<ImageProps>;
type Adapter = ImageAdapter<ImageProps>;

const prefixCls = cssClasses.PREFIX;
const statusCls = `${prefixCls}-status`;

const defaultProps = {
    preview: true,
} satisfies Partial<ImageProps>;

export default function Image(rawProps: ImageProps) {
    const props = useDefaultProps('Image', rawProps, defaultProps);
    const { ref, src, width, height, alt, style, className, crossOrigin, preview, fallback, placeholder, setDownloadName, imgCls, imgStyle, children, onLoad, onError, ...restProps } = props;

    const context = usePreviewContext();
    const { locale } = useLocale('Image');

    let extra = null;
    const thumbRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, ImageProps, ImageState>(
        ImageFoundation,
        props,
        () => ImageFoundation.getInitialState(props),
        (base) => ({
            getIsInGroup: () => Boolean(base.getContexts()?.isGroup),
            openGroupPreview: () => base.getContexts().openImage(thumbRef.current),
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

    const { loadStatus } = state;
    const previewObject = typeof preview === 'object' && preview !== null ? preview : null;
    const previewVisible = ImageFoundation.getPreviewVisible(preview, state);
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
                <HydratedImage
                    ref={ref}
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
            {canPreview && (
                <PreviewInner {...previewProps} alt={alt} crossOrigin={crossOrigin !== undefined ? crossOrigin : previewObject?.crossOrigin} setDownloadName={setDownloadName ?? previewObject?.setDownloadName} src={previewSrc} visible={previewVisible} onVisibleChange={foundation.handlePreviewVisibleChange} />
            )}
        </>
    );
}
