import type { HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';

export type CropperShape = 'rect' | 'round' | 'roundRect';

export interface CropperProps extends HTMLAttributes<HTMLDivElement> {
    /** The address of the image that needs to be cropped */
    src?: string;
    /** Passed to the image; `src`, the layout style and the order of `onload` are owned by the cropper */
    imgProps?: HTMLImgAttributes;
    /** The shape to crop, defaults to rectangle */
    shape?: CropperShape;
    /** Controlled crop ratio */
    aspectRatio?: number;
    /** The initial width-to-height ratio of the cropping box, default is 1 */
    defaultAspectRatio?: number;
    /** Zoom, applied on top of the initial scaling that fits the loaded image into the cropper; bindable */
    zoom?: number;
    /** Image rotation angle; one-way, the cropper never changes it */
    rotate?: number;
    /** Show crop box resizing handles */
    showResizeBox?: boolean;
    cropperBoxStyle?: string;
    cropperBoxCls?: string;
    /** The fill color of the non-picture parts in the cut result */
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    /** The element the cropped area is mirrored into; it is a host DOM handle, so it stays a function */
    preview?: () => HTMLElement | null | undefined;
    /** Called by wheel zooming */
    onZoomChange?: (zoom: number) => void;
}
