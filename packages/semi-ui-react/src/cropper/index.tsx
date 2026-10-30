import type React from 'react';
import { useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/cropper/constants';
import CropperFoundation, { type CropperAdapter, type CropperFoundationProps, type CropperState } from '@fibrae/semi-foundation/cropper/foundation';
import { getCropperGeometry } from '@fibrae/semi-foundation/cropper/utils';
import '@fibrae/semi-foundation/cropper/cropper.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import useLocale from '../locale/use-locale';

export interface CropperHandle {
    /** Draws the area inside the cropper box, at the image's own resolution, onto a new canvas */
    getCropperCanvas: () => HTMLCanvasElement;
}

export interface CropperProps extends ElementProps<'div'> {
    className?: string;
    style?: React.CSSProperties;
    src?: string;
    imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
    shape?: 'rect' | 'round' | 'roundRect';
    aspectRatio?: number;
    defaultAspectRatio?: number;
    /* Applied on top of the initial scaling that fits the loaded image into the cropper */
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    rotate?: number;
    showResizeBox?: boolean;
    cropperBoxStyle?: React.CSSProperties;
    cropperBoxCls?: string;
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    preview?: () => HTMLElement | null;
    ref?: React.Ref<CropperHandle>;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    shape: 'rect',
    defaultAspectRatio: 1,
    showResizeBox: true,
    fill: 'rgba(0, 0, 0, 0)',
    maxZoom: 3,
    minZoom: 0.1,
    zoomStep: 0.1,
} satisfies Partial<CropperProps>;

export default function Cropper(rawProps: CropperProps) {
    const props = useDefaultProps('Cropper', rawProps, defaultProps);
    const { ref, className, style, src, imgProps, shape, aspectRatio, defaultAspectRatio, zoom, onZoomChange, rotate: rotateProp, showResizeBox, cropperBoxStyle, cropperBoxCls, fill, maxZoom, minZoom, zoomStep, preview, ...rest } = props;

    const { locale } = useLocale('Cropper');

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const helpId = useId();

    const [foundation, state] = useFoundation<CropperFoundation, CropperAdapter<CropperFoundationProps>, CropperFoundationProps, CropperState>(
        CropperFoundation,
        props,
        () => ({
            imgData: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            cropperBox: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            zoom: 1,
            rotate: 0,
            loaded: false,
        }),
        (base) => ({
            getContainer: () => containerRef.current,
            notifyZoomChange: (zoom) => base.getProps().onZoomChange?.(zoom),
            getImg: () => imgRef.current,
        })
    );

    const { imgData, cropperBox, rotate, loaded } = state;
    const { imgX, imgY, boxX, boxY, viewX, viewY } = getCropperGeometry(imgData, cropperBox);

    // a React onWheel listener is passive and cannot stop a pinch from zooming the page
    useEventListener(containerRef, 'wheel', foundation.handleWheel, { passive: false });
    useResizeObserver(containerRef, foundation.handleResize);

    // every commit: wheel zoom and image load change the state too; an extra render lands before paint
    useLayoutEffect(() => {
        foundation.syncRotateAndZoom();
    });

    useDidUpdate(props.aspectRatio, foundation.applyAspectRatio);

    useDidUpdate(props.zoom, (zoom) => {
        if (zoom === undefined) foundation.syncRotateAndZoom({ zoom: 1 });
    });

    useDidUpdate(props.rotate, (rotate) => {
        if (rotate === undefined) foundation.syncRotateAndZoom({ rotate: 0 });
    });

    useLayoutEffect(() => {
        foundation.updatePreview();
    });

    useImperativeHandle(ref, () => ({ getCropperCanvas: foundation.getCropperCanvas }), [foundation]);

    return (
        <div role={namedRole(rest)} {...rest} ref={containerRef} className={clsx(prefixCls, className)} style={style}>
            <div className={cssClasses.IMG_WRAPPER}>
                {/* the cropping surface, not content: there is no description to give */}
                <img
                    alt=""
                    crossOrigin="anonymous"
                    {...imgProps}
                    ref={imgRef}
                    className={clsx(cssClasses.IMG, imgProps?.className)}
                    style={{
                        ...imgProps?.style,
                        width: imgData.width,
                        height: imgData.height,
                        transformOrigin: 'center',
                        transform: `translate(${imgX}px, ${imgY}px) rotate(${rotate}deg)`,
                    }}
                    src={src}
                    onLoad={(e) => {
                        foundation.handleImageLoad(e);
                        imgProps?.onLoad?.(e);
                    }}
                />
            </div>
            <div className={cssClasses.MASK} onLostPointerCapture={foundation.handleMaskLostPointerCapture} onPointerDown={foundation.handleMaskPointerDown} onPointerMove={foundation.handleMaskPointerMove} />
            <div
                className={clsx(cssClasses.CROPPER_BOX, cropperBoxCls, {
                    [cssClasses.CROPPER_VIEW_BOX_ROUND]: shape === 'round',
                })}
                style={{
                    ...cropperBoxStyle,
                    width: cropperBox.width,
                    height: cropperBox.height,
                    transform: `translate(${boxX}px, ${boxY}px)`,
                }}
                aria-describedby={helpId}
                aria-label={locale.cropArea}
                aria-roledescription={locale.cropAreaRole}
                // not a widget role: the box has no single value
                role="group"
                tabIndex={loaded ? 0 : undefined}
                onKeyDown={foundation.handleCropperBoxKeyDown}
                onLostPointerCapture={foundation.handleCropperBoxLostPointerCapture}
                onPointerDown={foundation.handleCropperBoxPointerDown}
                onPointerMove={foundation.handleCropperBoxPointerMove}
            >
                <span id={helpId} hidden>
                    {locale.cropAreaHelp}
                </span>
                <div
                    className={clsx(cssClasses.CROPPER_VIEW_BOX, {
                        [cssClasses.CROPPER_VIEW_BOX_ROUND]: shape.includes('round'),
                    })}
                >
                    <img
                        className={cssClasses.CROPPER_IMG}
                        style={{
                            width: imgData.width,
                            height: imgData.height,
                            transformOrigin: 'center',
                            transform: `translate(${viewX}px, ${viewY}px) rotate(${rotate}deg)`,
                        }}
                        alt=""
                        // a native image drag would cancel the pointer that moves the box
                        draggable={false}
                        src={src}
                    />
                </div>
                {loaded &&
                    showResizeBox &&
                    (shape === 'round' ? strings.roundCorner : strings.corner).map((corner) => (
                        <div key={corner} className={clsx(cssClasses.CORNER, `${cssClasses.CORNER}-${corner}`)} data-dir={corner} onLostPointerCapture={foundation.handleCornerLostPointerCapture} onPointerDown={foundation.handleCornerPointerDown} onPointerMove={foundation.handleCornerPointerMove} />
                    ))}
            </div>
        </div>
    );
}
