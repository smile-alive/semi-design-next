import type React from 'react';
import { useRef } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageState } from '@fibrae/semi-foundation/components/image/preview-image-foundation';
import useFoundation from '../../base/use-foundation';
import useEventListener, { getWindow } from '../../hooks/use-event-listener';
import Spin from '../spin';
import type { PreviewImageProps } from './interface';

type Foundation = PreviewImageFoundation<PreviewImageProps>;
type Adapter = PreviewImageAdapter<PreviewImageProps>;

const prefixCls = cssClasses.PREFIX;
const preViewImgPrefixCls = `${prefixCls}-preview-image`;

function preventDefault(e: React.DragEvent) {
    e.preventDefault();
}

export default function PreviewImage(props: PreviewImageProps & { zoomEvent?: WheelEvent }) {
    const { src, alt = '', rotation, crossOrigin } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, PreviewImageProps, PreviewImageState>(
        PreviewImageFoundation,
        props,
        () => PreviewImageFoundation.getInitialState(),
        (base) => ({
            getContainer: () => containerRef.current,
            getImage: () => imageRef.current,
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
