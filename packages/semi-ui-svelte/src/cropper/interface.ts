import type { HTMLAttributes, HTMLImgAttributes } from 'svelte/elements';

export type CropperShape = 'rect' | 'round' | 'roundRect';

export interface CropperProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    /** Passed to the image; `src`, the layout style and the order of `onload` are owned by the cropper */
    imgProps?: HTMLImgAttributes;
    shape?: CropperShape;
    aspectRatio?: number;
    /** The initial width-to-height ratio of the cropping box, default is 1 */
    defaultAspectRatio?: number;
    /** Zoom, applied on top of the initial scaling that fits the loaded image into the cropper; bindable */
    zoom?: number;
    /** Image rotation angle; one-way, the cropper never changes it */
    rotate?: number;
    showResizeBox?: boolean;
    cropperBoxStyle?: string;
    cropperBoxCls?: string;
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    /** The element the cropped area is mirrored into; it is a host DOM handle, so it stays a function */
    preview?: () => HTMLElement | null | undefined;
    onZoomChange?: (zoom: number) => void;
}
