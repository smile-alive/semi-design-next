import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageBaseState } from '@fibrae/semi-foundation/image/preview-image-foundation';
import useEventListener, { getWindow } from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import Spin from '../spin';
import type { PreviewImageProps } from './interface';

const prefixCls = cssClasses.PREFIX;
const preViewImgPrefixCls = `${prefixCls}-preview-image`;

function preventDefault(e: React.DragEvent) {
    e.preventDefault();
}

export default function PreviewImage(props: PreviewImageProps & { zoomEvent?: WheelEvent }) {
    const { src, alt = '', rotation, ratio, zoom, zoomEvent, crossOrigin } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const committed = useRef({ src, ratio, rotation, zoom });

    const [foundation, state] = useFoundation<PreviewImageFoundation<PreviewImageProps>, PreviewImageAdapter<PreviewImageProps>, PreviewImageProps, PreviewImageBaseState>(
        PreviewImageFoundation,
        props,
        () => ({ width: 0, height: 0, loading: true, translate: { x: 0, y: 0 } }),
        (base) => ({
            getContainer: () => containerRef.current,
            getImage: () => imageRef.current,
            setLoading: (loading) => base.setState({ loading }),
            setImageCursor: (canDrag) => {
                imageRef.current.style.cursor = canDrag ? 'grab' : 'default';
                // a touch drag pans only a draggable image; otherwise the page keeps scrolling and pinch-zooming
                imageRef.current.style.touchAction = canDrag ? 'none' : '';
            },
            capturePointer: (pointerId) => imageRef.current.setPointerCapture(pointerId),
            requestZoom: (zoom, reportToUser) => base.getProps().onZoom?.(zoom, reportToUser),
            notifyLoad: (src) => base.getProps().onLoad?.(src),
            notifyError: (src) => base.getProps().onError?.(src),
        })
    );

    const { loading, width, height, translate } = state;

    const imgStyle: React.CSSProperties = {
        position: 'absolute',
        visibility: loading ? 'hidden' : 'visible',
        transform: `translate(${translate.x}px, ${translate.y}px) rotate(${rotation}deg)`,
        width,
        height,
    };

    useEventListener(getWindow, 'resize', foundation.handleWindowResize);

    useLayoutEffect(() => {
        const prevProps = committed.current;
        committed.current = { src, ratio, rotation, zoom };
        foundation.handlePropsUpdate(prevProps, zoomEvent);
    });

    return (
        <div ref={containerRef} className={`${preViewImgPrefixCls}`}>
            <img
                key={src}
                ref={imageRef}
                className={`${preViewImgPrefixCls}-img`}
                style={imgStyle}
                alt={alt}
                crossOrigin={crossOrigin}
                src={src}
                onContextMenu={foundation.handleRightClickImage}
                onDragStart={preventDefault}
                onError={foundation.handleError}
                onLoad={foundation.handleLoad}
                onPointerDown={foundation.handleImagePointerDown}
                onPointerMove={foundation.handleImageMove}
            />
            {loading && <Spin wrapperClassName={`${preViewImgPrefixCls}-spin`} size="large" />}
        </div>
    );
}
